import React from 'react';
import PropTypes from 'prop-types';
import Badge from '@/components/status-and-loading/Badge/Badge';

/**
 * StudentTag — a "PLUS Tag": a tonal pill labelling a student on one dimension
 * (goal, engagement, content…). All tags share the warning-tonal surface; the
 * `signal` sets the leading status icon:
 *   - positive → green circle-check (favourable)
 *   - negative → red triangle-exclamation (needs attention)
 *   - neutral  → no icon (e.g. the overflow "…")
 *
 * Consolidates what used to be repeated inline <Badge> markup across the specs so
 * every student tag renders from one place.
 */
const SIGNAL_ICON = {
    positive: <i className="fa-solid fa-circle-check" style={{ color: 'var(--color-success)', fontSize: '10px' }} aria-hidden="true"></i>,
    negative: <i className="fa-solid fa-triangle-exclamation" style={{ color: 'var(--color-danger)', fontSize: '10px' }} aria-hidden="true"></i>,
    neutral: null,
};

export const StudentTag = ({ label, signal = 'neutral', className = '' }) => (
    <Badge
        text={label}
        style="warning"
        size="b3"
        leadingVisual={SIGNAL_ICON[signal] || null}
        className={`fw-normal ${className}`.trim()}
    />
);

StudentTag.propTypes = {
    label: PropTypes.string.isRequired,
    signal: PropTypes.oneOf(['positive', 'negative', 'neutral']),
    className: PropTypes.string,
};

export default StudentTag;
