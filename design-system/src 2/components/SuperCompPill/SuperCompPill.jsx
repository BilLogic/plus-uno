import React from 'react';
import PropTypes from 'prop-types';
import { SMART_CONSTANTS } from '@/components/constants';

const SuperCompPill = ({
    competencyArea,
    abbreviate = false,
    className = ''
}) => {
    const abbreviateCA = (ca) => {
        switch (ca) {
            case SMART_CONSTANTS.CA_SE:
                return SMART_CONSTANTS.CA_SE_ABBR;
            case SMART_CONSTANTS.CA_MC:
                return SMART_CONSTANTS.CA_MC_ABBR;
            case SMART_CONSTANTS.CA_ADV:
                return SMART_CONSTANTS.CA_ADV_ABBR;
            case SMART_CONSTANTS.CA_RELN:
                return SMART_CONSTANTS.CA_RELN_ABBR;
            case SMART_CONSTANTS.CA_TT:
                return SMART_CONSTANTS.CA_TT_ABBR;
            default:
                return null;
        }
    };

    const getColorClassForCompetencyArea = (ca) => {
        const abbr = abbreviateCA(ca);
        if (!abbr) return "";
        return "color-smartClr" + abbr.charAt(0).toUpperCase() + abbr.slice(1);
    };

    const abbr = abbreviateCA(competencyArea);
    const colorClass = getColorClassForCompetencyArea(competencyArea);
    // Note: In React we'll use inline styles or utility classes if these specific bg classes aren't available globally.
    // Assuming the legacy CSS is still loaded or we need to map these to design tokens.
    // The legacy code constructs classes like "bg-smartClrSe-alt" or "bg-smartClrSe-08-hex".
    // For now, we will keep the class construction to maintain compatibility with existing CSS.
    const bgClass = "bg-" + colorClass.replace("color-", "") + (abbreviate ? "-08-hex" : "-alt");

    const classes = [
        'supercomp-pill',
        bgClass,
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={classes}>
            <span className="supercomp-pill-text">
                {abbreviate ? abbr?.toUpperCase() : competencyArea}
            </span>
        </div>
    );
};

SuperCompPill.propTypes = {
    competencyArea: PropTypes.string.isRequired,
    abbreviate: PropTypes.bool,
    className: PropTypes.string
};

export default SuperCompPill;
