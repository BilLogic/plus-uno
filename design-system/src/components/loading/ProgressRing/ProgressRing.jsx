import React from 'react';
import PropTypes from 'prop-types';
import './ProgressRing.scss';

export const PROGRESS_RING_SIZES = [16, 20, 24];
export const PROGRESS_RING_APPEARANCES = ['default', 'inverse'];

const STROKE_WIDTH = 2;

/**
 * `ProgressRing` — a determinate ring for a known amount of progress in a
 * small slot. `value` is a percent (0 to 100); the drawn arc and the announced
 * `aria-valuenow` clamp together to 0 to 100. A ring is never indeterminate;
 * unknown time is `Spinner`'s job.
 */
const ProgressRing = ({
    value,
    size = 20,
    label,
    appearance = 'default',
    className = '',
    id,
}) => {
    const numeric = Number(value);
    const percentage = Number.isFinite(numeric) ? Math.min(Math.max(numeric, 0), 100) : 0;
    const numericSize = Number(size);
    const resolvedSize = PROGRESS_RING_SIZES.includes(numericSize) ? numericSize : 20;
    const resolvedAppearance = PROGRESS_RING_APPEARANCES.includes(appearance) ? appearance : 'default';
    const center = resolvedSize / 2;
    const radius = (resolvedSize - STROKE_WIDTH) / 2;

    const classes = [
        'plus-progress-ring',
        `plus-progress-ring--${resolvedAppearance}`,
        percentage === 0 ? 'plus-progress-ring--empty' : '',
        className,
    ].filter(Boolean).join(' ');

    return (
        <span
            id={id}
            className={classes}
            data-size={resolvedSize}
            role="progressbar"
            aria-label={label}
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
        >
            <svg
                className="plus-progress-ring__svg"
                viewBox={`0 0 ${resolvedSize} ${resolvedSize}`}
                aria-hidden="true"
                focusable="false"
            >
                <circle
                    className="plus-progress-ring__track"
                    cx={center}
                    cy={center}
                    r={radius}
                />
                <circle
                    className="plus-progress-ring__fill"
                    cx={center}
                    cy={center}
                    r={radius}
                    pathLength={100}
                    strokeDasharray={100}
                    strokeDashoffset={100 - percentage}
                />
            </svg>
        </span>
    );
};

ProgressRing.propTypes = {
    /** Percent complete, from 0 to 100. Values outside 0 to 100 clamp on both the drawn arc and `aria-valuenow`. */
    value: PropTypes.number.isRequired,
    /** Diameter in pixels: 16, 20 or 24. */
    size: PropTypes.oneOf(PROGRESS_RING_SIZES),
    /** Accessible name describing what the ring measures, such as "Uploading session recording". */
    label: PropTypes.string.isRequired,
    /** `default` draws a brand fill on a neutral track; `inverse` reads on a bold or colored background. */
    appearance: PropTypes.oneOf(PROGRESS_RING_APPEARANCES),
    /** Extra class names on the root element. */
    className: PropTypes.string,
    /** Element id on the root progressbar. */
    id: PropTypes.string,
};

export default ProgressRing;
