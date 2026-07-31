import React from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/actions/Button';
import Tooltip from '@/components/overlays/Tooltip';
import './OptionChip.scss';

/** Hover delay matching Figma Multi-Select annotation (≥2s). */
export const OPTION_CHIP_TOOLTIP_DELAY_MS = 2000;

/**
 * Selectable option chip used in post-session multi-select question banks
 * (Figma Elements · Option Chip `10661:10292`). Composes DS Button + Tooltip.
 *
 * @param {object} props
 * @param {string} props.label - Chip label text
 * @param {boolean} [props.selected=false] - Whether the chip is selected
 * @param {boolean} [props.disabled=false] - Disables interaction
 * @param {() => void} [props.onClick] - Selection toggle handler
 * @param {string} [props.tooltip] - Content annotation tooltip (hover ≥2s)
 * @param {string} [props.className] - Optional className
 */
const OptionChip = ({
    label,
    selected = false,
    disabled = false,
    onClick,
    tooltip,
    className = '',
}) => {
    const chip = (
        <Button
            type="button"
            text={label}
            style="primary"
            fill={selected ? 'filled' : 'tonal'}
            size="medium"
            disabled={disabled}
            active={selected}
            aria-pressed={selected}
            onClick={disabled ? undefined : onClick}
            className={`post-session-option-chip ${className}`.trim()}
        />
    );

    if (!tooltip) return chip;

    return (
        <Tooltip text={tooltip} delayShow={OPTION_CHIP_TOOLTIP_DELAY_MS} delayHide={200} placement="top">
            <span style={{ display: 'inline-flex' }}>{chip}</span>
        </Tooltip>
    );
};

OptionChip.propTypes = {
    label: PropTypes.string.isRequired,
    selected: PropTypes.bool,
    disabled: PropTypes.bool,
    onClick: PropTypes.func,
    tooltip: PropTypes.string,
    className: PropTypes.string,
};

/**
 * Wrap layout for a bank of option chips.
 *
 * @param {object} props
 * @param {{ id: string, label: string, tooltip?: string }[]} props.options - Chip options
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
                tooltip={option.tooltip}
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
            tooltip: PropTypes.string,
        }),
    ),
    selectedIds: PropTypes.arrayOf(PropTypes.string),
    onToggle: PropTypes.func,
    disabled: PropTypes.bool,
};

export default OptionChip;
