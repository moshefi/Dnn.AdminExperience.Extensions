import React, {Component, PropTypes } from "react";
import {debounce} from "throttle-debounce";
import { connect } from "react-redux";
import resx from "../../../resources";
import SearchBox from "dnn-search-box";
import Combobox from "react-widgets/lib/Combobox";
import UserRow from "./UserRow";
import GridCell from "dnn-grid-cell";
import CheckBox from "dnn-checkbox";
import "./style.less";
import Pager from "dnn-pager";
import IconButton from "../../common/IconButton";
import {
    roleUsers as RoleUsersActions
} from "../../../actions";
import util from "../../../utils";

class UsersInRole extends Component {
    constructor(props) {
        super(props);

        this.state = {
            userSelectState: { userId: -1, keyword: "" },
            currentPage: 0,
            totalPages: 0,
            pageSize: 10,
            usersKeyword: "",
            editIndex: -1,
            editCommand: "",
            sendEmail: true,
            isOwner: false
        };

        this.debounceGetSuggestUsers = debounce(500, this.debounceGetSuggestUsers);
    }
    componentWillReceiveProps(newProps) {
        this.setState(newProps);
    }

    componentWillMount() {
        this.getUsers();
    }

    getUsers() {
        const {props, state} = this;

        let parameter = {
            roleId: props.roleDetails.id,
            keyword: state.usersKeyword,
            pageIndex: state.currentPage,
            pageSize: state.pageSize
        };
        props.dispatch(RoleUsersActions.getRoleUsers(parameter));
    }

    getSuggestUsers() {
        const {props, state} = this;
        let keyword = state.userSelectState.userId > 0 ? "" : state.userSelectState.keyword;
        props.dispatch(RoleUsersActions.getSuggestUsers({ keyword: keyword, roleId: -1, count: 10 }));
    }
    debounceGetSuggestUsers() {
        this.getSuggestUsers();
    }

    onUserSelectorChanged(item) {
        if (item.userId || item.displayName || typeof item === "object") {
            return;
        }
        this.setState({ userSelectState: { userId: -1, keyword: item } });
        this.debounceGetSuggestUsers();
    }

    onUserSelectorSelected(item) {
        if (!item.userId || !item.displayName) {
            return;
        }
        this.setState({ userSelectState: { userId: item.userId, keyword: item.displayName } }, function () {
            this.getSuggestUsers();
        });
    }

    onUserSelectorToggle() {
    }

    onAddUser() {
        const {state} = this;
        let userId = state.userSelectState.userId;
        if (userId === -1) {
            return;
        }
        this.saveUser(true, userId);
        this.setState({ userSelectState: { userId: -1, keyword: "" } });
    }
    saveUser(isAdd, userId, startTime, expiresTime) {
        const {props} = this;

        let parameter = { userId: userId, roleId: props.roleDetails.id, startTime: startTime, expiresTime: expiresTime, isAdd: isAdd };
        props.dispatch(RoleUsersActions.addUserToRole(parameter, this.state.sendEmail, this.state.isOwner));
        this.setState({ sendEmail: true, isOwner: false });
    }

    onUsersKeywordChanged(keyword) {
        let newState = { usersKeyword: keyword, currentPage: 0 };

        this.setState(newState, () => {
            this.getUsers();
        });
    }

    onPageChanged(currentPage, pageSize) {
        let {state} = this;
        if (pageSize !== undefined && state.pageSize !== pageSize) {
            state.pageSize = pageSize;
        }
        state.currentPage = currentPage;
        this.setState({
            state
        });
        this.getUsers();
    }
    getUserRows() {
        let roleUsers = this.props.roleUsers;
        let userRows = roleUsers.map((user, index) => {
            return <UserRow
                userDetails={user}
                index={index}
                saveUser={this.saveUser.bind(this, false) }
                >
            </UserRow>;
        });
        return <div className="role-user-body">{(roleUsers.length > 0) ?
            userRows :
            <div className="no-roles-row">{resx.get("NoUsers") }</div> }
        </div>;
    }
    onSendEmailClick(sendEmail) {
        this.setState({ sendEmail });
    }
    onIsOwnerClick(isOwner) {
        this.setState({ isOwner });
    }
    renderHeader() {
        const tableFields = [
            { name: "Members", width: 25 },
            { name: "Start", width: 20 },
            { name: "Expires", width: 20 },
            { name: "", width: 35 }
        ];
        let tableHeaders = tableFields.map((field) => {
            return <GridCell columnSize={field.width} style={{ fontWeight: "bolder" }}>
                {
                    field.name !== "" ?
                        <span>{resx.get(field.name + ".Header") }</span>
                        : <div className="search-container">
                            <SearchBox placeholder={resx.get("Search") } onSearch={this.onUsersKeywordChanged.bind(this) } maxLength={50} />
                            <div className="clear" />
                        </div>
                }
            </GridCell>;
        });
        return <div className="role-user-header-row">{tableHeaders}</div>;
    }
    renderPaging() {
        if (this.props.totalRecords > 0)
            return <Pager
                showStartEndButtons={false}
                showPageSizeOptions={false}
                numericCounters={0}
                pageSize={this.state.pageSize}
                totalRecords={this.props.totalRecords}
                onPageChanged={this.onPageChanged.bind(this) }
                culture={util.utilities.getCulture()}
                />;
    }
    render() {
        const {state} = this;
        return <div className="roleusers-form">
            <div className="header">
                <div className="header-title">{resx.get("PermissionsByRole") }</div>
                <div className="add-box">
                    <GridCell columnSize={50}>
                        <div className="send-email-box">
                            <CheckBox value={this.state.sendEmail} onChange={this.onSendEmailClick.bind(this) }
                                label={  resx.get("SendEmail") } labelPlace="right"    />
                            {this.props.roleDetails.allowOwner && <CheckBox value={this.state.isOwner} onChange={this.onIsOwnerClick.bind(this) }
                                label={  resx.get("isOwner") } labelPlace="right"   />}
                        </div>
                    </GridCell>
                    <GridCell columnSize={50}>
                        <span>
                            <Combobox suggest={false}
                                placeholder={resx.get("AddUserPlaceHolder") }
                                open={this.props.matchedUsers.length > 0 }
                                onToggle={this.onUserSelectorToggle.bind(this) }
                                onChange={this.onUserSelectorChanged.bind(this) }
                                onSelect={this.onUserSelectorSelected.bind(this) }
                                data={this.props.matchedUsers }
                                value={state.userSelectState.keyword}
                                valueField="userId"
                                textField="displayName"/>
                            <div className="add-user-button" onClick={this.onAddUser.bind(this) }>
                                <IconButton type="add" width={17} height={15} /> {resx.get("Add") }
                            </div>
                        </span>
                    </GridCell>
                </div>
            </div>
            <div className="role-users-list">
                {this.renderHeader() }
                {this.getUserRows() }
            </div>
            <div className="role-users-list-paging">
                {this.renderPaging() }
            </div>
        </div>;
    }
}
UsersInRole.propTypes = {
    dispatch: PropTypes.func.isRequired,
    roleDetails: PropTypes.object.isRequired,
    title: PropTypes.string,
    group: PropTypes.object,
    beforeSave: PropTypes.func,
    onSaved: PropTypes.func,
    onCancel: PropTypes.func,
    roleUsers: PropTypes.array,
    totalRecords: PropTypes.number,
    matchedUsers: PropTypes.array
};
UserRow.defaultProps = {
    matchedUsers: []
};

function mapStateToProps(state) {
    return {
        matchedUsers: state.roleUsers.matchedUsers,
        roleUsers: state.roleUsers.roleUsers,
        totalRecords: state.roleUsers.totalRecords,
        roleList: state.roles.rolesList
    };
}

export default connect(mapStateToProps)(UsersInRole);