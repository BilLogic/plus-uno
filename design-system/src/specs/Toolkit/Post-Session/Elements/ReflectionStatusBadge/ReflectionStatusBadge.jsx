import React from 'react';
import PropTypes from 'prop-types';
import Badge from '@/components/status-and-loading/Badge';

const STATUS_CONFIG = {
    'not-started': {
        text: 'Not started',
        style: 'primary',
        iconClass: 'fa-regular fa-circle',
        title: 'Start your reflection after the session',
    },
    'in-progress': {
        text: 'In Progress',
        style: 'warning',
        iconClass: 'fa-solid fa-circle-half-stroke',
        title: 'Finish and submit your reflection',
    },
    complete: {
        text: 'Complete',
        style: 'success',
        iconClass: 'fa-solid fa-circle-check',
        title: 'Review or edit your submitted reflection',
    },
};

/**
 * Reflection status badge (Figma: Badges / Reflection Status).
 *
 * @param {object} props
 * @param {'not-started'|'in-progress'|'complete'} [props.status='not-started']
 * @param {string} [props.className]
 */
const ReflectionStatusBadge = ({ status = 'not-started', className = '' }) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG['not-started'];
    return (
        <span title={config.title} className={className}>
            <Badge
                text={config.text}
                style={config.style}
                size="b3"
                leadingVisual={<i className={config.iconClass} aria-hidden="true" />}
            />
        </span>
    );
};

ReflectionStatusBadge.propTypes = {
    status: PropTypes.oneOf(['not-started', 'in-progress', 'complete']),
    className: PropTypes.string,
};

export default ReflectionStatusBadge;
