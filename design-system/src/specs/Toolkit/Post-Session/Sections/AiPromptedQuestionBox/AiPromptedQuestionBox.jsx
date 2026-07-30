import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Textarea from '@/components/forms-and-inputs/Textarea';
import Spinner from '@/components/status-and-loading/Spinner';

/**
 * Dynamic AI-prompted question card
 * (Figma: Dynamic AI Prompted Question Box — Default | Loading | Empty).
 *
 * Spec note from Figma: one LLM call when required fields above are complete;
 * on failure/timeout hide the card (no generic fallback).
 *
 * @param {object} props
 * @param {'default'|'loading'|'empty'} [props.state='default']
 * @param {string} [props.question]
 * @param {string} [props.helper]
 * @param {string} [props.value]
 * @param {(event: React.ChangeEvent) => void} [props.onChange]
 * @param {string} [props.className]
 */
const AiPromptedQuestionBox = ({
    state = 'default',
    question = 'Great to hear! What was the clearest sign that the student was deeply immersed in the tasks this session?',
    helper = 'E.g. She solved the last two problems on her own and asked for a harder one.',
    value = '',
    onChange,
    className = '',
}) => {
    const shellStyle = {
        display: 'flex',
        gap: 'var(--size-section-gap-md)',
        alignItems: 'flex-start',
        padding: 'var(--size-section-pad-y-sm) var(--size-section-pad-x-sm)',
        borderRadius: 'var(--size-section-radius-md, 12px)',
        backgroundColor: 'var(--color-mastering-content-state-16, rgba(134, 89, 169, 0.16))',
        width: '100%',
        maxWidth: '502px',
    };

    if (state === 'loading') {
        return (
            <div className={className} role="status" aria-live="polite" style={shellStyle}>
                <Spinner size="sm" variant="border" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-md)', flex: 1, minWidth: 0 }}>
                    <div style={{ height: '12px', width: '84%', borderRadius: '6px', backgroundColor: 'var(--color-mastering-content-state-16, rgba(134, 89, 169, 0.28))' }} />
                    <div style={{ height: '12px', width: '60%', borderRadius: '6px', backgroundColor: 'var(--color-mastering-content-state-16, rgba(134, 89, 169, 0.28))' }} />
                    <div style={{ height: '12px', width: '36%', borderRadius: '6px', backgroundColor: 'var(--color-mastering-content-state-16, rgba(134, 89, 169, 0.28))' }} />
                    <span className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Preparing your question…
                    </span>
                </div>
            </div>
        );
    }

    if (state === 'empty') {
        return (
            <div className={className} style={shellStyle}>
                <i className="fa-solid fa-sparkles" style={{ color: 'var(--color-mastering-content-text)', fontSize: '24px', marginTop: '2px' }} aria-hidden="true" />
                <p className="body3-txt m-0" style={{ color: 'var(--color-on-surface-variant)', flex: 1 }}>
                    No more questions for now — you’ve got it covered. Let’s move on to the next section!
                </p>
            </div>
        );
    }

    return (
        <div className={className} style={shellStyle}>
            <i className="fa-solid fa-sparkles" style={{ color: 'var(--color-mastering-content-text)', fontSize: '24px', marginTop: '2px' }} aria-hidden="true" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-card-gap-sm, 10px)', flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-sm)' }}>
                    <p className="h6 m-0" style={{ color: 'var(--color-on-surface)' }}>{question}</p>
                    <p className="body3-txt m-0" style={{ color: 'var(--color-on-surface-variant)' }}>{helper}</p>
                </div>
                <Textarea
                    id="ai-prompted-answer"
                    value={value}
                    onChange={onChange}
                    placeholder="Type your answer here…"
                    rows={3}
                />
            </div>
        </div>
    );
};

AiPromptedQuestionBox.propTypes = {
    state: PropTypes.oneOf(['default', 'loading', 'empty']),
    question: PropTypes.string,
    helper: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func,
    className: PropTypes.string,
};

export default AiPromptedQuestionBox;

/**
 * Interactive playground wrapper with local answer state.
 *
 * @param {object} props
 */
export function AiPromptedQuestionBoxInteractive(props) {
    const [value, setValue] = useState('');
    return (
        <AiPromptedQuestionBox
            {...props}
            value={value}
            onChange={(event) => setValue(event.target.value)}
        />
    );
}
