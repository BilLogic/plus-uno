import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import AiPromptedQuestionBox from '@/specs/Toolkit/Post-Session/Sections/AiPromptedQuestionBox/AiPromptedQuestionBox';
import FreeResponseQuestion from '@/specs/Toolkit/Post-Session/Sections/FreeResponseQuestion/FreeResponseQuestion';
import LinearScale from '@/specs/Toolkit/Post-Session/Sections/LinearScale/LinearScale';
import MultiSelectQuestion from '@/specs/Toolkit/Post-Session/Sections/MultiSelectQuestion/MultiSelectQuestion';
import NavigationButtons from '@/specs/Toolkit/Post-Session/Elements/NavigationButtons/NavigationButtons';
import LastUpdated from '@/specs/Toolkit/Post-Session/Elements/LastUpdated/LastUpdated';
import {
    SELF_EFFECTIVE_OPTIONS,
    SELF_IMPROVE_OPTIONS,
    multiSelectComplete,
    ratingGatedRequiredness,
} from '@/specs/Toolkit/Post-Session/reflectionCopy';

/**
 * Self Reflection section body (Form Design §4).
 *
 * @param {object} props
 */
const SelfReflectionForm = ({
    initialData = {},
    aiState: aiStateProp,
    simulateAi = true,
    onCancel,
    onSaveAndExit,
    onNext,
    onPrevious,
    lastUpdated,
}) => {
    const [rating, setRating] = useState(initialData.rating || 0);
    const [effective, setEffective] = useState(initialData.effective || []);
    const [improve, setImprove] = useState(initialData.improve || []);
    const [otherEffective, setOtherEffective] = useState(initialData.otherEffective || '');
    const [otherImprove, setOtherImprove] = useState(initialData.otherImprove || '');
    const [support, setSupport] = useState(initialData.support || '');
    const [escalateSupport, setEscalateSupport] = useState(Boolean(initialData.escalateSupport));
    const [aiState, setAiState] = useState(aiStateProp || initialData.aiState || 'idle');
    const [aiPrompt, setAiPrompt] = useState(initialData.aiPrompt || '');
    const [aiHelper, setAiHelper] = useState(initialData.aiHelper || '');
    const [aiAnswer, setAiAnswer] = useState(initialData.aiAnswer || '');

    const { positiveRequired, improveRequired } = ratingGatedRequiredness(rating);
    const effectiveOk = !positiveRequired || multiSelectComplete(effective, otherEffective);
    const improveOk = !improveRequired || multiSelectComplete(improve, otherImprove);
    const gatedComplete = rating >= 1 && effectiveOk && improveOk;

    useEffect(() => {
        if (aiStateProp) setAiState(aiStateProp);
    }, [aiStateProp]);

    useEffect(() => {
        if (!simulateAi || aiStateProp) return undefined;
        if (!gatedComplete || aiState === 'ready' || aiState === 'empty') return undefined;

        setAiState('generating');
        const timer = setTimeout(() => {
            if (initialData.forceAiEmpty) {
                setAiState('empty');
                return;
            }
            setAiState('ready');
            setAiPrompt(
                initialData.aiPrompt
                || 'Sounds like you were finding your groove this session. Which of your moves is most worth repeating next time?',
            );
            setAiHelper(
                initialData.aiHelper
                || 'E.g. I would keep the “you try first” pause before I jump in to hint.',
            );
        }, 1400);
        return () => clearTimeout(timer);
    }, [gatedComplete, simulateAi, aiStateProp, aiState, initialData.aiPrompt, initialData.aiHelper, initialData.forceAiEmpty]);

    /**
     * @returns {object}
     */
    const snapshot = () => ({
        rating,
        effective,
        improve,
        otherEffective,
        otherImprove,
        support,
        escalateSupport,
        aiState,
        aiPrompt,
        aiHelper,
        aiAnswer,
    });

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-section-gap-md)',
                flex: '1 0 0',
                minWidth: 0,
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-xs)' }}>
                <h4 className="h4 m-0" style={{ color: 'var(--color-on-surface)' }}>Self Reflection</h4>
                <LastUpdated text={typeof lastUpdated === 'string' ? lastUpdated : undefined} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-sm)' }}>
                    <p className="body1-txt font-weight-semibold m-0" style={{ color: 'var(--color-on-surface)' }}>
                        How did this session go for you?
                        <span style={{ color: 'var(--color-danger)' }}> *</span>
                    </p>
                    <LinearScale
                        name="self-reflection-rating"
                        value={rating}
                        onChange={setRating}
                    />
                </div>

                <MultiSelectQuestion
                    question="Which area of teaching felt most effective?"
                    options={SELF_EFFECTIVE_OPTIONS}
                    selectedIds={effective}
                    onToggle={(id) => setEffective((prev) => (
                        prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
                    ))}
                    otherValue={otherEffective}
                    onOtherChange={(event) => setOtherEffective(event.target.value)}
                    required={positiveRequired}
                />

                <MultiSelectQuestion
                    question="In what ways would you like to improve as a tutor?"
                    options={SELF_IMPROVE_OPTIONS}
                    selectedIds={improve}
                    onToggle={(id) => setImprove((prev) => (
                        prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
                    ))}
                    otherValue={otherImprove}
                    onOtherChange={(event) => setOtherImprove(event.target.value)}
                    required={improveRequired}
                />

                {aiState === 'generating' && <AiPromptedQuestionBox state="loading" />}
                {aiState === 'empty' && <AiPromptedQuestionBox state="empty" />}
                {aiState === 'ready' && (
                    <AiPromptedQuestionBox
                        state="default"
                        question={aiPrompt}
                        helper={aiHelper}
                        value={aiAnswer}
                        onChange={(event) => setAiAnswer(event.target.value)}
                    />
                )}

                <FreeResponseQuestion
                    id="self-support-request"
                    label="Is there anything we can do to best support your development?"
                    value={support}
                    onChange={(event) => setSupport(event.target.value)}
                    showEscalate
                    escalate={escalateSupport}
                    onEscalateChange={setEscalateSupport}
                />
            </div>

            <NavigationButtons
                showPrevious
                canSave={rating >= 1}
                canNext={gatedComplete}
                onPrevious={onPrevious}
                onCancel={onCancel}
                onSaveAndExit={() => onSaveAndExit?.(snapshot())}
                onNext={() => onNext?.(snapshot())}
            />
        </div>
    );
};

SelfReflectionForm.propTypes = {
    initialData: PropTypes.object,
    aiState: PropTypes.oneOf(['idle', 'generating', 'ready', 'empty']),
    simulateAi: PropTypes.bool,
    onCancel: PropTypes.func,
    onSaveAndExit: PropTypes.func,
    onNext: PropTypes.func,
    onPrevious: PropTypes.func,
    lastUpdated: PropTypes.string,
};

export default SelfReflectionForm;
