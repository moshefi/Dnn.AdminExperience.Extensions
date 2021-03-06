import React, { Component, PropTypes } from "react";
import { connect } from "react-redux";
import {
    languages as LanguagesActions
} from "../../../actions";
import LanguageVerifierGrid from "./languageVerifierGrid";
import "./style.less";
import resx from "../../../resources";
import styles from "./style.less";

class LanguageVerifierPanelBody extends Component {
    constructor() {
        super();
    }

    componentWillMount() {

    }

    componentWillReceiveProps(props) {
        if (props.selectedPage === 2) {
            if (props.verificationResults) {
                this.setState({
                    verificationResults: props.verificationResults
                });
                return;
            }
            props.dispatch(LanguagesActions.verifyLanguageResourceFiles((data) => {
                this.setState({
                    verificationResults: Object.assign({}, data.Results)
                });
            }));
        }
    }

    renderedResults() {
        if (this.props.verificationResults) {
            return this.props.verificationResults.map((item) => {
                return (
                    <LanguageVerifierGrid
                        language={item.Language}
                        isDefault={item.IsSystemDefault}
                        icon={item.Icon}
                        missingFiles={item.MissingFiles}
                        filesWithDuplicateEntries={item.FilesWithDuplicateEntries}
                        filesWithMissingEntries={item.FilesWithMissingEntries}
                        filesWithObsoleteEntries={item.FilesWithObsoleteEntries}
                        oldFiles={item.OldFiles}
                        malformedFiles={item.MalformedFiles}>
                    </LanguageVerifierGrid>
                );
            });
        }
    }

    /* eslint-disable react/no-danger */
    render() {
        return (
            <div className={styles.languageVerifier}>
                <div className="languageVerifier-back" onClick={this.props.closeLanguageVerifier.bind(this)}>{resx.get("BackToLanguages")}</div>
                <div className="languageVerifier-wrapper">{this.renderedResults()}</div>
            </div>
        );
    }
}

LanguageVerifierPanelBody.propTypes = {
    dispatch: PropTypes.func.isRequired,
    tabIndex: PropTypes.number,
    portalId: PropTypes.number,
    closeLanguageVerifier: PropTypes.func,
    verificationResults: PropTypes.array,
    selectedPage: PropTypes.number
};

function mapStateToProps(state) {
    return {
        tabIndex: state.pagination.tabIndex,
        selectedPage: state.visiblePanel.selectedPage,
        verificationResults: state.languages.verificationResults
    };
}

export default connect(mapStateToProps)(LanguageVerifierPanelBody);