import React from 'react';
import PropTypes from 'prop-types';
import HintTooltip from '../HintTooltip';
import './GoalMeter.css';

const pct = (v, min, max) => `${Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100))}%`;

/**
 * GoalMeter: one value on a track, with its goal drawn as marks on the track
 * rather than written beside it.
 *
 * - **Value**: the brand fill.
 * - **Target**: a green tick at `target`.
 * - **Range**: a green outline from `range[0]` to `range[1]` (a recommended band).
 * - **Hint**: the words for those marks, in a HintTooltip on hover and focus.
 *   With a hint the meter is a tab stop; without one it is not.
 *
 * It is a `role="meter"` named by `label`; inside a link or a button pass
 * `interactive={false}` so it adds no tab stop or tooltip of its own.
 */
const GoalMeter = ({
    value,
    min = 0,
    max = 100,
    target,
    range,
    label,
    hint,
    pinned = false,
    tone = 'brand',
    size = 'md',
    interactive = true,
    className = '',
}) => {
    const meter = (
        <span
            className={['tr-goal-meter', `tr-goal-meter--${size}`, `tr-goal-meter--${tone}`, className].filter(Boolean).join(' ')}
            role="meter"
            aria-valuenow={value}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-label={label}
            tabIndex={interactive && hint ? 0 : undefined}
        >
            {range ? (
                <span
                    className="tr-goal-meter__range"
                    data-part="range"
                    style={{ '--lo': pct(range[0], min, max), '--hi': pct(range[1], min, max) }}
                />
            ) : null}
            <span className="tr-goal-meter__fill" data-part="fill" style={{ width: pct(value, min, max) }} />
            {target != null ? (
                <i className="tr-goal-meter__target" data-part="target" style={{ left: pct(target, min, max) }} />
            ) : null}
        </span>
    );

    if (!interactive || !hint) return meter;
    const at = target != null ? pct(target, min, max) : range ? pct((range[0] + range[1]) / 2, min, max) : pct(value, min, max);
    return (
        <HintTooltip hint={hint} pinned={pinned} at={at} className="tr-goal-meter__hint">
            {meter}
        </HintTooltip>
    );
};

GoalMeter.propTypes = {
    /** The current value */
    value: PropTypes.number.isRequired,
    min: PropTypes.number,
    max: PropTypes.number,
    /** Draws the green target tick */
    target: PropTypes.number,
    /** `[low, high]`: draws the green range outline */
    range: PropTypes.arrayOf(PropTypes.number),
    /** Accessible name, with the numbers: "Arlene McCoy goal progress, 92% of a 95% target" */
    label: PropTypes.string.isRequired,
    /** The tooltip words for the marks */
    hint: PropTypes.node,
    /** Keep the tooltip open */
    pinned: PropTypes.bool,
    /** `warning` paints the fill in warning, for a value outside its range */
    tone: PropTypes.oneOf(['brand', 'success', 'warning']),
    /** `sm` 6 high (in a stat tile) · `md` 8 high */
    size: PropTypes.oneOf(['sm', 'md']),
    /** False inside a link: no tab stop, no tooltip */
    interactive: PropTypes.bool,
    className: PropTypes.string,
};

export default GoalMeter;
