import React, { useId, useState } from 'react';
import PropTypes from 'prop-types';
import { AiIcon, Spinner, TextArea } from '@/components';
import { PRIVACY_WARNING } from '@/specs/Toolkit/Post-Session/reflectionCopy';

/**
 * Dynamic AI-prompted question card
 * (Figma: Dynamic AI Prompted Question Box — Default | Loading | Empty).
 *
 * @param {object} props
 * @param {'default'|'loading'|'empty'} [props.state='default']
 * @param {string} [props.question]
 * @param {string} [props.helper] - E.g. caption (Body/B3) from model `placeholder`
 * @param {string} [props.value]
 * @param {(event: React.ChangeEvent) => void} [props.onChange]
 * @param {boolean} [props.showPrivacyWarning=false]
 * @param {string} [props.id]
 * @param {string} [props.className]
 */
const AiPromptedQuestionBox = ({
    state = 'default',
    question = 'Great to hear! What was the clearest sign that the student was deeply immersed in the tasks this session?',
    helper = 'E.g. She solved the last two problems on her own and asked for a harder one.',
    value = '',
    onChange,
    showPrivacyWarning = false,
    id: idProp,
    className = '',
}) => {
    const reactId = useId();
    const fieldId = idProp || `ai-prompted-answer-${reactId}`;
    const shellStyle = {
        display: 'flex',
        gap: 'var(--size-section-gap-md)',
        alignItems: 'flex-start',
        padding: 'var(--size-section-pad-y-sm) var(--size-section-pad-x-sm)',
        borderRadius: 'var(--size-section-radius-md, 12px)',
        backgroundColor: 'var(--ds-background-smart-mastering-content)',
        width: '100%',
        maxWidth: 'var(--col-9)',
    };

    if (state === 'loading') {
        const skeletonBar = {
            height: 'var(--font-size-body3)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--ds-background-smart-mastering-content)',
        };
        return (
            <div className={className} role="status" aria-live="polite" style={shellStyle}>
                <Spinner size={16} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-0625)', flex: 1, minWidth: 0 }}>
                    <div data-testid="skeleton-bar" style={{ ...skeletonBar, width: '84%' }} />
                    <div data-testid="skeleton-bar" style={{ ...skeletonBar, width: '60%' }} />
                    <div data-testid="skeleton-bar" style={{ ...skeletonBar, width: '36%' }} />
                    <span className="body3-txt" style={{ color: 'var(--ds-text-subtle)' }}>
                        Preparing your question…
                    </span>
                </div>
            </div>
        );
    }

    if (state === 'empty') {
        return (
            <div className={className} style={shellStyle}>
                <AiIcon name="generate" size={24} />
                <p className="body3-txt m-0" style={{ color: 'var(--ds-text-subtle)', flex: 1 }}>
                    No more questions for now — you’ve got it covered. Let’s move on to the next section!
                </p>
            </div>
        );
    }

    return (
        <div className={className} style={shellStyle}>
            <AiIcon name="generate" size={24} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-card-gap-sm, 10px)', flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
                    <p className="h6 m-0" style={{ color: 'var(--ds-text)' }}>{question}</p>
                    {helper ? (
                        <p className="body3-txt m-0" style={{ color: 'var(--ds-text-subtle)' }}>{helper}</p>
                    ) : null}
                </div>
                <TextArea
                    id={fieldId}
                    value={value}
                    onChange={onChange}
                    placeholder="Type your answer here…"
                    rows={3}
                />
                {showPrivacyWarning ? (
                    <p className="body3-txt m-0" style={{ color: 'var(--ds-text-danger)' }}>
                        {PRIVACY_WARNING}
                    </p>
                ) : null}
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
    showPrivacyWarning: PropTypes.bool,
    id: PropTypes.string,
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
