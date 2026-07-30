import React from 'react';
import PropTypes from 'prop-types';

/**
 * Selectable option chip used in post-session multi-select question banks
 * (What worked / What could be improved / Supervisor follow-up).
 *
 * @param {object} props
 * @param {string} props.label - Chip label text
 * @param {boolean} [props.selected=false] - Whether the chip is selected
 * @param {boolean} [props.disabled=false] - Disables interaction
 * @param {() => void} [props.onClick] - Selection toggle handler
 * @param {string} [props.className] - Optional className
 */
const OptionChip = ({
    label,
    selected = false,
    disabled = false,
    onClick,
    className = '',
}) => (
    <button
        type="button"
        className={`body2-txt ${className}`.trim()}
        disabled={disabled}
        aria-pressed={selected}
        onClick={disabled ? undefined : onClick}
        style={{
            padding: 'var(--size-element-pad-y-sm) var(--size-element-pad-x-md)',
            borderRadius: 'var(--size-element-radius-full, 999px)',
            border: `var(--size-element-stroke-sm) solid ${selected ? 'var(--color-primary)' : 'var(--color-outline-variant)'}`,
            background: selected ? 'var(--color-primary)' : 'var(--color-secondary-state-08)',
            color: selected ? 'var(--color-on-primary)' : 'var(--color-on-surface)',
            cursor: disabled ? 'default' : 'pointer',
            opacity: disabled ? 0.38 : 1,
            whiteSpace: 'nowrap',
        }}
    >
        {label}
    </button>
);

OptionChip.propTypes = {
    label: PropTypes.string.isRequired,
    selected: PropTypes.bool,
    disabled: PropTypes.bool,
    onClick: PropTypes.func,
    className: PropTypes.string,
};

/**
 * Wrap layout for a bank of option chips.
 *
 * @param {object} props
 * @param {{ id: string, label: string }[]} props.options - Chip options
 * @param {string[]} [props.selectedIds=[]] - Selected option ids
 * @param {(id: string) => void} [props.onToggle] - Toggle handler for an option id
 * @param {boolean} [props.disabled=false] - Disables all chips
 */
export const OptionChipGroup = ({
    options = [],
    selectedIds = [],
    onToggle,
    disabled = false,
}) => (
    <div
        style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--size-element-gap-sm)',
        }}
    >
        {options.map((option) => (
            <OptionChip
                key={option.id}
                label={option.label}
                selected={selectedIds.includes(option.id)}
                disabled={disabled}
                onClick={() => onToggle?.(option.id)}
            />
        ))}
    </div>
);

OptionChipGroup.propTypes = {
    options: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
        }),
    ),
    selectedIds: PropTypes.arrayOf(PropTypes.string),
    onToggle: PropTypes.func,
    disabled: PropTypes.bool,
};

export default OptionChip;
