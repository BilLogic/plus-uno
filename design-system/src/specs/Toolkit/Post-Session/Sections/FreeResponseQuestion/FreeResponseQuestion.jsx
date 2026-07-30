import React from 'react';
import PropTypes from 'prop-types';
import Textarea from '@/components/forms-and-inputs/Textarea';
import Switch from '@/components/forms-and-inputs/Switch';

/**
 * Free-text question block (Figma Sections · Free Response Question `791:137860`).
 * Separate caption (neutral) and warning (danger) slots — they cannot share one text property.
 *
 * @param {object} props
 * @param {string} props.label - Question text
 * @param {boolean} [props.required=false]
 * @param {string} [props.caption] - Neutral helper (on-surface-variant)
 * @param {string} [props.warning] - Privacy / danger helper (danger-text)
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
    required = false,
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
}) => (
    <div
        className={className}
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-section-gap-sm)',
            width: '100%',
            maxWidth: '445px',
        }}
    >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-xs)', width: '100%' }}>
            <p className="body1-txt font-weight-semibold m-0" style={{ color: 'var(--color-on-surface)' }}>
                {label}
                {required && <span style={{ color: 'var(--color-danger)' }}> *</span>}
            </p>
            {caption ? (
                <p className="body3-txt m-0" style={{ color: 'var(--color-on-surface-variant)' }}>
                    {caption}
                </p>
            ) : null}
            {warning ? (
                <p className="body3-txt m-0" style={{ color: 'var(--color-danger-text, var(--color-danger))' }}>
                    {warning}
                </p>
            ) : null}
            {example ? (
                <p className="body3-txt m-0" style={{ color: 'var(--color-on-surface-variant)' }}>
                    {example}
                </p>
            ) : null}
        </div>

        <Textarea
            id={id}
            name={id}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
        />

        {showEscalate ? (
            <Switch
                id={`${id}-escalate`}
                label={escalateLabel}
                checked={escalate}
                onChange={(event) => onEscalateChange?.(event.target.checked)}
            />
        ) : null}
    </div>
);

FreeResponseQuestion.propTypes = {
    label: PropTypes.string.isRequired,
    required: PropTypes.bool,
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
