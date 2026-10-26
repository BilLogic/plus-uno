import React from 'react';
import PropTypes from 'prop-types';
import './ProgressSteps.css';

/**
 * ProgressSteps: a row of equal segments, one per step. Done steps fill in the
 * brand chart color; the current step, when there is one, fills at half
 * strength. It is one image to a screen reader, named "Step 3 of 4" (with
 * `current`) or "4 of 9 steps" (without).
 */
const ProgressSteps = ({ total, done, current, label, className = '' }) => {
    const name = label ?? (current ? `Step ${current} of ${total}` : `${done} of ${total} steps`);
    return (
        <span className={['tr-progress-steps', className].filter(Boolean).join(' ')} role="img" aria-label={name}>
            {Array.from({ length: total }, (_, i) => {
                const n = i + 1;
                const state = n <= done ? 'done' : n === current ? 'current' : 'upcoming';
                return <i key={n} className={`tr-progress-steps__seg tr-progress-steps__seg--${state}`} data-state={state} />;
            })}
        </span>
    );
};

ProgressSteps.propTypes = {
    /** How many steps there are */
    total: PropTypes.number.isRequired,
    /** How many are done */
    done: PropTypes.number.isRequired,
    /** The step in progress, 1-based */
    current: PropTypes.number,
    /** Overrides the accessible name */
    label: PropTypes.string,
    className: PropTypes.string,
};

export default ProgressSteps;
