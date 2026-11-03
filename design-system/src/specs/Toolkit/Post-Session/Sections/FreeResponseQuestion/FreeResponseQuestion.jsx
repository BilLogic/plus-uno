import React from 'react';
import PropTypes from 'prop-types';
import { TextArea, Toggle } from '@/components';
import { QuestionCaption } from '@/specs/Toolkit/Post-Session/QuestionText';

/**
 * Free-text question block (Figma Sections · Free Response Question `791:137860`).
 * The question is the text area's label; the neutral caption, the example and
 * the danger warning (the privacy note) sit under it in the field's caption.
 *
 * @param {object} props
 * @param {string} props.label - Question text
 * @param {boolean} [props.isRequired=false]
 * @param {string} [props.caption] - Neutral helper
 * @param {string} [props.warning] - Privacy helper, in the danger text color
 * @param {string} [props.example] - Optional “E.g. …” line
 * @param {string} [props.value='']
 * @param {(event: React.ChangeEvent) => void} [props.onChange]
 * @param {string} [props.placeholder='Type your answer here…']
 * @param {string} [props.id='free-response-question']
 * @param {number} [props.rows=3]
 * @param {boolean} [props.showEscalate=false]
 * @param {boolean} [props.escalate=false]
 * @param {(checked: boolean) => void} [props.onEscalateChange]
 * @param {string} [props.escalateLabel='Escalate this request to tutor supervisors for immediate attention.']
 * @param {string} [props.className]
 */
const FreeResponseQuestion = ({
    label,
    isRequired = false,
    caption,
    warning,
    example,
    value = '',
    onChange,
    placeholder = 'Type your answer here…',
    id = 'free-response-question',
    rows = 3,
    showEscalate = false,
    escalate = false,
    onEscalateChange,
    escalateLabel = 'Escalate this request to tutor supervisors for immediate attention.',
    className = '',
}) => {
    const hasNotes = Boolean(caption || warning || example);
    return (
        <div
            className={className}
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--section-stack-sm)',
                width: '100%',
                maxWidth: 'var(--col-8)',
            }}
        >
            <TextArea
                id={id}
                name={id}
                label={label}
                isRequired={isRequired}
                caption={hasNotes ? (
                    <>
                        {caption ? <QuestionCaption>{caption}</QuestionCaption> : null}
                        {warning ? <QuestionCaption tone="danger">{warning}</QuestionCaption> : null}
                        {example ? <QuestionCaption>{example}</QuestionCaption> : null}
                    </>
                ) : undefined}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                rows={rows}
            />

            {showEscalate ? (
                <Toggle
                    id={`${id}-escalate`}
                    label={escalateLabel}
                    isChecked={escalate}
                    onChange={(event) => onEscalateChange?.(event.target.checked)}
                />
            ) : null}
        </div>
    );
};

FreeResponseQuestion.propTypes = {
    label: PropTypes.string.isRequired,
    isRequired: PropTypes.bool,
    caption: PropTypes.string,
    warning: PropTypes.string,
    example: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func,
    placeholder: PropTypes.string,
    id: PropTypes.string,
    rows: PropTypes.number,
    showEscalate: PropTypes.bool,
    escalate: PropTypes.bool,
    onEscalateChange: PropTypes.func,
    escalateLabel: PropTypes.string,
    className: PropTypes.string,
};

export default FreeResponseQuestion;
