import React from 'react';
import PropTypes from 'prop-types';
import './ProgressIndicator.scss';

export const PROGRESS_INDICATOR_APPEARANCES = ['default', 'primary', 'help', 'inverted'];
export const PROGRESS_INDICATOR_SIZES = [8, 12];
export const PROGRESS_INDICATOR_SPACINGS = ['comfortable', 'cozy', 'compact'];

/**
 * A row of dots showing where you are along the steps of a journey. Unlike
 * `ProgressTracker`, the steps carry no label of their own — only a position.
 *
 * `onSelect` makes every dot a button and lets a person jump to any step;
 * without it the dots are decorative and `aria-current` on the active one is
 * the only state a screen reader gets. A dot that is a button keeps a 24px
 * target, so the gap between buttons widens to fit it.
 *
 * `progress` times the current step: its dot stretches into a bar whose fill
 * tracks `progress`, from 0 to 1, as in a carousel that moves on its own. A
 * step with no clock passes `1`, and the bar shows full; under reduced motion
 * the bar always shows full.
 *
 * @param {object} props
 * @param {string[]} props.values - One entry per step. Only `.length` and index are used to render dots; each entry becomes a dot's accessible name when `onSelect` is set.
 * @param {number} props.selectedIndex - The current step, zero-based.
 * @param {'default'|'primary'|'help'|'inverted'} [props.appearance='default']
 * @param {8|12} [props.size=8] - The dot diameter, in pixels.
 * @param {'comfortable'|'cozy'|'compact'} [props.spacing='comfortable']
 * @param {(selection: { index: number }) => void} [props.onSelect] - Present → dots become buttons.
 * @param {string} [props.ariaControls] - Id of the panel the dots control.
 * @param {string} [props.label='Progress'] - Accessible name for the dot group.
 * @param {number} [props.progress] - Present → the current dot is a bar filled to this fraction, 0 to 1.
 */
const ProgressIndicator = ({
    values,
    selectedIndex,
    appearance = 'default',
    size = 8,
    spacing = 'comfortable',
    onSelect,
    ariaControls,
    label = 'Progress',
    progress,
}) => {
    const interactive = typeof onSelect === 'function';
    const Tag = interactive ? 'button' : 'span';
    const timed = typeof progress === 'number' && !Number.isNaN(progress);
    const fraction = timed ? Math.min(Math.max(progress, 0), 1) : 0;

    return (
        <div
            className={[
                'plus-progress-indicator',
                `plus-progress-indicator--${appearance}`,
                `plus-progress-indicator--${spacing}`,
                `plus-progress-indicator--size-${size}`,
                interactive && 'plus-progress-indicator--interactive',
                timed && 'plus-progress-indicator--timed',
            ].filter(Boolean).join(' ')}
            role="group"
            aria-label={label}
        >
            {values.map((value, index) => {
                const isSelected = index === selectedIndex;
                return (
                    <Tag
                        key={value ?? index}
                        type={interactive ? 'button' : undefined}
                        className={[
                            'plus-progress-indicator__dot',
                            isSelected ? 'plus-progress-indicator__dot--selected' : '',
                        ].filter(Boolean).join(' ')}
                        aria-current={isSelected ? 'step' : undefined}
                        aria-controls={interactive ? ariaControls : undefined}
                        aria-label={interactive ? String(value) : undefined}
                        onClick={interactive ? () => onSelect({ index }) : undefined}
                    >
                        {timed && isSelected && (
                            <span className="plus-progress-indicator__bar" aria-hidden="true">
                                <span
                                    className="plus-progress-indicator__fill"
                                    style={{ '--progress-indicator-progress': String(fraction) }}
                                />
                            </span>
                        )}
                    </Tag>
                );
            })}
        </div>
    );
};

ProgressIndicator.propTypes = {
    values: PropTypes.array.isRequired,
    selectedIndex: PropTypes.number.isRequired,
    appearance: PropTypes.oneOf(PROGRESS_INDICATOR_APPEARANCES),
    size: PropTypes.oneOf(PROGRESS_INDICATOR_SIZES),
    spacing: PropTypes.oneOf(PROGRESS_INDICATOR_SPACINGS),
    onSelect: PropTypes.func,
    ariaControls: PropTypes.string,
    label: PropTypes.string,
    /** Times the current step: its dot stretches into a bar filled to this fraction, 0 to 1. Pass `1` for a step with no clock. */
    progress: PropTypes.number,
};

export default ProgressIndicator;
