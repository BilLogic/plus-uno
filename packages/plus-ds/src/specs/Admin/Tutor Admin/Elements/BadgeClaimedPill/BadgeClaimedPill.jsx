import React from 'react';
import PropTypes from 'prop-types';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import './BadgeClaimedPill.scss';

/**
 * BadgeClaimedPill Component
 * 
 * Displays a status pill indicating if a badge has been claimed.
 * Figma: node-id=3163:151304
 */
const BadgeClaimedPill = ({ state }) => {
    // Normalize state input to handle various formats
    const normalizeState = (input) => {
        if (input === true || input === 'true' || input === 'Yes' || input === 'yes') return 'yes';
        if (input === false || input === 'false' || input === 'No' || input === 'no') return 'no';
        return 'na'; // Default for n/a, N/A, null, undefined
    };

    const variant = normalizeState(state);

    // Configuration for each state
    const configs = {
        yes: {
            icon: 'fa-check',
            label: 'Yes',
            tooltip: 'Badge claimed by tutor',
            className: 'plus-badge-claimed-pill--yes'
        },
        no: {
            icon: 'fa-exclamation',
            label: 'No',
            tooltip: 'Badge available but not yet claimed by tutor',
            className: 'plus-badge-claimed-pill--no'
        },
        na: {
            icon: 'fa-xmark',
            label: 'N/A',
            tooltip: 'Tutor ineligible for badge (incomplete required lessons)',
            className: 'plus-badge-claimed-pill--na'
        }
    };

    const config = configs[variant];

    const renderTooltip = (props) => (
        <Tooltip id={`badge-claimed-tooltip-${variant}`} {...props}>
            {config.tooltip}
        </Tooltip>
    );

    return (
        <OverlayTrigger
            placement="top"
            delay={{ show: 250, hide: 400 }}
            overlay={renderTooltip}
        >
            <div className={`plus-badge-claimed-pill ${config.className}`}>
                <div className="plus-badge-claimed-pill__content">
                    <div className="plus-badge-claimed-pill__icon-wrapper">
                        <i className={`fas ${config.icon} plus-badge-claimed-pill__icon`} />
                    </div>
                    <span className="plus-badge-claimed-pill__label">
                        {config.label}
                    </span>
                </div>
            </div>
        </OverlayTrigger>
    );
};

BadgeClaimedPill.propTypes = {
    /** 
     * State of the badge claim
     * Accepts: boolean, 'true'/'false', 'Yes'/'No', 'n/a'/'N/A'
     */
    state: PropTypes.oneOfType([
        PropTypes.bool,
        PropTypes.string
    ])
};

BadgeClaimedPill.defaultProps = {
    state: 'n/a'
};

export default BadgeClaimedPill;
