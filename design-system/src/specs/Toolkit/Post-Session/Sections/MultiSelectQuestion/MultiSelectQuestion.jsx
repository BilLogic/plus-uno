import React from 'react';
import PropTypes from 'prop-types';
import { OptionChipGroup } from '@/specs/Toolkit/Post-Session/Elements/OptionChip/OptionChip';
import OtherTextInput from '@/specs/Toolkit/Post-Session/Sections/OtherTextInput/OtherTextInput';

/**
 * Multi-select question block
 * (Figma Sections · Multi-Select Question `10791:8694`).
 * Selected chips = filled · unselected = tonal. Tooltips on hover ≥2s via OptionChip.
 * Pair with Other Text Input when Other is selected.
 *
 * @param {object} props
 * @param {string} [props.question='{Question}']
 * @param {string} [props.caption='Select all that apply.']
 * @param {{ id: string, label: string, tooltip?: string }[]} [props.options]
 * @param {string[]} [props.selectedIds]
 * @param {(id: string) => void} [props.onToggle]
 * @param {string} [props.otherId='other']
 * @param {string} [props.otherValue]
 * @param {(event: React.ChangeEvent) => void} [props.onOtherChange]
 * @param {boolean} [props.required=true]
 */
const MultiSelectQuestion = ({
    question = '{Question}',
    caption = 'Select all that apply.',
    options = [
        { id: 'option-1', label: 'Option 1' },
        { id: 'option-2', label: 'Option 2' },
        { id: 'other', label: 'Other', tooltip: 'Anything not covered by the options — a short text field asks for details.' },
    ],
    selectedIds = [],
    onToggle,
    otherId = 'other',
    otherValue = '',
    onOtherChange,
    required = true,
}) => {
    const showOther = selectedIds.includes(otherId);

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-section-gap-sm)',
                width: '100%',
                maxWidth: '445px',
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-xs)' }}>
                <p className="body1-txt font-weight-semibold m-0" style={{ color: 'var(--color-on-surface)' }}>
                    {question}
                    {required && <span style={{ color: 'var(--color-danger)' }}> *</span>}
                </p>
                {caption && (
                    <p className="body3-txt m-0" style={{ color: 'var(--color-on-surface-variant)' }}>
                        {caption}
                    </p>
                )}
            </div>

            <OptionChipGroup options={options} selectedIds={selectedIds} onToggle={onToggle} />

            {showOther && (
                <OtherTextInput value={otherValue} onChange={onOtherChange} />
            )}
        </div>
    );
};

MultiSelectQuestion.propTypes = {
    question: PropTypes.string,
    caption: PropTypes.string,
    options: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        tooltip: PropTypes.string,
    })),
    selectedIds: PropTypes.arrayOf(PropTypes.string),
    onToggle: PropTypes.func,
    otherId: PropTypes.string,
    otherValue: PropTypes.string,
    onOtherChange: PropTypes.func,
    required: PropTypes.bool,
};

export default MultiSelectQuestion;
