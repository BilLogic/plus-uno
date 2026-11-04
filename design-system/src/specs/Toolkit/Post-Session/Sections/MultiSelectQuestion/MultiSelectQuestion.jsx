import React, { useId } from 'react';
import PropTypes from 'prop-types';
import { Tag, Tooltip } from '@/components';
import { QuestionCaption, QuestionLabel } from '@/specs/Toolkit/Post-Session/QuestionText';
import OtherTextInput from '@/specs/Toolkit/Post-Session/Sections/OtherTextInput/OtherTextInput';

/** Hover delay matching the Figma Multi-Select annotation (2 seconds or more). */
export const ANSWER_TOOLTIP_DELAY_MS = 2000;

/**
 * Multi-select question block
 * (Figma Sections · Multi-Select Question `10791:8694`).
 * The answers are selectable Tags: pressed means picked. A tag with a `tooltip`
 * explains itself on hover after 2 seconds. Pair with Other Text Input when
 * Other is selected.
 *
 * @param {object} props
 * @param {string} [props.id] - Stable prefix for the Other field id
 * @param {string} [props.question='{Question}']
 * @param {string} [props.caption='Select all that apply.']
 * @param {{ id: string, label: string, tooltip?: string }[]} [props.options]
 * @param {string[]} [props.selectedIds]
 * @param {(id: string) => void} [props.onToggle]
 * @param {string} [props.otherId='other']
 * @param {string} [props.otherValue]
 * @param {(event: React.ChangeEvent) => void} [props.onOtherChange]
 * @param {boolean} [props.isRequired=true]
 */
const MultiSelectQuestion = ({
    id,
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
    isRequired = true,
}) => {
    const autoId = useId();
    const labelId = `${id || autoId}-question`;
    const showOther = Boolean(otherId) && selectedIds.includes(otherId);
    const otherFieldId = `${id || autoId}-${otherId || 'other'}`;

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--section-stack-sm)',
                width: '100%',
                maxWidth: 'var(--col-8)',
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                <div id={labelId}>
                    <QuestionLabel rank="question" isRequired={isRequired}>{question}</QuestionLabel>
                </div>
                {caption && <QuestionCaption>{caption}</QuestionCaption>}
            </div>

            <div
                role="group"
                aria-labelledby={labelId}
                style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--inline-md)' }}
            >
                {options.map((option) => {
                    const tag = (
                        <Tag
                            color="blue"
                            maxWidth="100%"
                            isSelected={selectedIds.includes(option.id)}
                            onClick={() => onToggle?.(option.id)}
                        >
                            {option.label}
                        </Tag>
                    );
                    return option.tooltip ? (
                        <Tooltip
                            key={option.id}
                            text={option.tooltip}
                            delayShow={ANSWER_TOOLTIP_DELAY_MS}
                            delayHide={200}
                            placement="top"
                        >
                            <span style={{ display: 'inline-flex', maxWidth: '100%' }}>{tag}</span>
                        </Tooltip>
                    ) : React.cloneElement(tag, { key: option.id });
                })}
            </div>

            {showOther && (
                <OtherTextInput id={otherFieldId} value={otherValue} onChange={onOtherChange} />
            )}
        </div>
    );
};

MultiSelectQuestion.propTypes = {
    id: PropTypes.string,
    question: PropTypes.string,
    caption: PropTypes.string,
    options: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        tooltip: PropTypes.string,
    })),
    selectedIds: PropTypes.arrayOf(PropTypes.string),
    onToggle: PropTypes.func,
    otherId: PropTypes.string, // empty string suppresses OtherTextInput pairing
    otherValue: PropTypes.string,
    onOtherChange: PropTypes.func,
    isRequired: PropTypes.bool,
};

export default MultiSelectQuestion;
