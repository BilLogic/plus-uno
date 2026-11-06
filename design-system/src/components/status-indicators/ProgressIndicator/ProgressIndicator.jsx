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
 * the only state a screen reader gets.
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
}) => {
    const interactive = typeof onSelect === 'function';
    const Tag = interactive ? 'button' : 'span';

    return (
        <div
            className={[
                'plus-progress-indicator',
                `plus-progress-indicator--${appearance}`,
                `plus-progress-indicator--${spacing}`,
                `plus-progress-indicator--size-${size}`,
            ].join(' ')}
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
                    />
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
};

export default ProgressIndicator;
