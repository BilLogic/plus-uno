import React from 'react';
import PropTypes from 'prop-types';
import { SMART_CONSTANTS } from '@/components/constants';

const CompetencyBadge = ({ competencyArea, size = 'h2', id, className = '' }) => {
    const normalizedArea = competencyArea.replace(/\s+/g, '-').toLowerCase();

    const textMap = {
        'socio-emotional': SMART_CONSTANTS.CA_SE_FULL,
        'mastering-content': SMART_CONSTANTS.CA_MC,
        'advocacy': SMART_CONSTANTS.CA_ADV,
        'relationships': SMART_CONSTANTS.CA_RELN,
        'technology-tools': SMART_CONSTANTS.CA_TT
    };

    const displayText = textMap[normalizedArea] || SMART_CONSTANTS.CA_SE_FULL;

    return (
        <div
            id={id}
            className={`plus-competency-badge plus-competency-badge-${normalizedArea} plus-competency-badge-${size} ${className}`}
        >
            <div className="plus-competency-badge-container">
                <div className="plus-competency-badge-content">
                    <div className="plus-competency-badge-icon">
                        <i className="fas fa-circle-dot"></i>
                    </div>
                    <div className="plus-competency-badge-text">
                        <p>{displayText}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

CompetencyBadge.propTypes = {
    competencyArea: PropTypes.string.isRequired,
    size: PropTypes.string,
    id: PropTypes.string,
    className: PropTypes.string,
};

export default CompetencyBadge;
