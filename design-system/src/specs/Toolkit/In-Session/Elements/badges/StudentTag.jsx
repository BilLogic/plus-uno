import React from 'react';
import PropTypes from 'prop-types';
import StatusTag from '@/components/labels/StatusTag';
import { iconClass } from '../../../../../lib/icon';

/**
 * StudentTag — a "PLUS Tag": a tonal pill labeling a student on one dimension
 * (goal, engagement, content…). All tags share the warning-tonal surface; the
 * `signal` sets the leading status icon:
 *   - positive → green circle-check (favorable)
 *   - negative → red triangle-exclamation (needs attention)
 *   - neutral  → no icon (e.g. the overflow "…")
 *
 * Consolidates what used to be repeated inline label markup across the specs so
 * every student tag renders from one place.
 */
const SIGNAL_ICON = {
    positive: <i className={iconClass('circle-check')} style={{ color: 'var(--color-success)', fontSize: '10px' }} aria-hidden="true"></i>,
    negative: <i className={iconClass('triangle-exclamation')} style={{ color: 'var(--color-danger)', fontSize: '10px' }} aria-hidden="true"></i>,
    neutral: null,
};

export const StudentTag = ({ label, signal = 'neutral', className = '' }) => (
    <StatusTag
        appearance="warning"
        leadingVisual={SIGNAL_ICON[signal] || undefined}
        className={className}
    >
        {label}
    </StatusTag>
);

StudentTag.propTypes = {
    label: PropTypes.string.isRequired,
    signal: PropTypes.oneOf(['positive', 'negative', 'neutral']),
    className: PropTypes.string,
};

export default StudentTag;
