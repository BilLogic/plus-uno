import React from 'react';
import PropTypes from 'prop-types';
import { StatusTag } from '@/components';
import { iconClass } from '../../../../../lib/icon';

const STATUS_CONFIG = {
    'not-started': {
        text: 'Not started',
        style: 'info',
        iconClass: 'fa-regular fa-circle',
        title: 'Start your reflection after the session',
    },
    'in-progress': {
        text: 'In Progress',
        style: 'warning',
        iconClass: iconClass('circle-half-stroke'),
        title: 'Finish and submit your reflection',
    },
    complete: {
        text: 'Complete',
        style: 'success',
        iconClass: iconClass('circle-check'),
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
            <StatusTag appearance={config.style} leadingVisual={<i className={config.iconClass} aria-hidden="true" />}>{config.text}</StatusTag>
        </span>
    );
};

ReflectionStatusBadge.propTypes = {
    status: PropTypes.oneOf(['not-started', 'in-progress', 'complete']),
    className: PropTypes.string,
};

export default ReflectionStatusBadge;
