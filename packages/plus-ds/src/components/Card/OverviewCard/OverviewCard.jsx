import React from 'react';
import PropTypes from 'prop-types';
import './OverviewCard.scss';

/**
 * OverviewCard Component
 * 
 * Displays SMART competency metrics or student needs.
 * Figma Spec: node-id=83-125838
 */
const OverviewCard = ({
    type = 'relationships', // 'socio-emotional', 'mastering', etc.
    title = 'Student Need',
    subtitle,
    icon,
    value,
    trend,
    className = '',
    style,
    ...props
}) => {
    return (
        <div
            className={`plus-overview-card plus-overview-card--${type} ${className}`}
            style={style}
            {...props}
        >
            <div className="plus-overview-card__header">
                <h5 className="plus-overview-card__title">{title}</h5>
                {icon && <div className="plus-overview-card__icon">{icon}</div>}
            </div>

            {value && (
                <div className="plus-overview-card__content">
                    <span className="h4">{value}</span>
                    {trend && <span className="body3-txt text-muted">{trend}</span>}
                </div>
            )}

            {subtitle && (
                <div className="plus-overview-card__footer">
                    <p className="body3-txt m-0">{subtitle}</p>
                </div>
            )}
        </div>
    );
};

OverviewCard.propTypes = {
    type: PropTypes.oneOf([
        'socio-emotional', 'mastering-content', 'advocacy', 'relationships', 'technology-tools',
        'undefined', 'status', 'completion', 'accuracy', 'time-spent', 'effort', 'progress'
    ]),
    title: PropTypes.string,
    subtitle: PropTypes.string,
    icon: PropTypes.node,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    trend: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object
};

export default OverviewCard;
