import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Rating from '@/components/forms-and-inputs/Rating';
import AiPromptedQuestionBox from '@/specs/Toolkit/Post-Session/Sections/AiPromptedQuestionBox/AiPromptedQuestionBox';
import FreeResponseQuestion from '@/specs/Toolkit/Post-Session/Sections/FreeResponseQuestion/FreeResponseQuestion';
import MultiSelectQuestion from '@/specs/Toolkit/Post-Session/Sections/MultiSelectQuestion/MultiSelectQuestion';
import NavigationButtons from '@/specs/Toolkit/Post-Session/Elements/NavigationButtons/NavigationButtons';
import LastUpdated from '@/specs/Toolkit/Post-Session/Elements/LastUpdated/LastUpdated';
import {
    SESSION_RATING_COMMENTS,
    WHAT_WORKED_OPTIONS,
    WHAT_COULD_IMPROVE_OPTIONS,
    SUPERVISOR_FOLLOWUP_OPTIONS,
    escalationNeedsDescription,
    multiSelectComplete,
    ratingGatedRequiredness,
    toggleExclusiveNo,
} from '@/specs/Toolkit/Post-Session/reflectionCopy';

/**
 * Session Reflection section body (no page shell).
 *
 * @param {object} props
 */
const SessionReflectionFormV2 = ({
    initialData = {},
    aiState: aiStateProp,
    simulateAi = true,
    onCancel,
    onSaveAndExit,
    onNext,
    lastUpdated,
}) => {
    const [rating, setRating] = useState(initialData.rating || 0);
    const [whatWorked, setWhatWorked] = useState(initialData.whatWorked || []);
    const [whatImprove, setWhatImprove] = useState(initialData.whatImprove || []);
    const [otherWorked, setOtherWorked] = useState(initialData.otherWorked || '');
    const [otherImprove, setOtherImprove] = useState(initialData.otherImprove || '');
    const [followUp, setFollowUp] = useState(initialData.followUp?.length ? initialData.followUp : ['no']);
    const [followUpDescription, setFollowUpDescription] = useState(initialData.followUpDescription || '');
    const [aiState, setAiState] = useState(aiStateProp || initialData.aiState || 'idle');
    const [aiPrompt, setAiPrompt] = useState(initialData.aiPrompt || '');
    const [aiHelper, setAiHelper] = useState(initialData.aiHelper || '');
    const [aiAnswer, setAiAnswer] = useState(initialData.aiAnswer || '');

    const { positiveRequired, improveRequired } = ratingGatedRequiredness(rating);
    const workedOk = !positiveRequired || multiSelectComplete(whatWorked, otherWorked);
    const improveOk = !improveRequired || multiSelectComplete(whatImprove, otherImprove);
    const gatedComplete = rating >= 1 && workedOk && improveOk;

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
                || 'Based on what you selected, what would you try differently next time to protect pacing?',
            );
            setAiHelper(
                initialData.aiHelper
                || 'E.g. I would open with a 2-minute tech check before the warm-up.',
            );
        }, 1400);
        return () => clearTimeout(timer);
    }, [gatedComplete, simulateAi, aiStateProp, aiState, initialData.aiPrompt, initialData.aiHelper, initialData.forceAiEmpty]);

    /**
     * @returns {object}
     */
    const snapshot = () => ({
        rating,
        whatWorked,
        whatImprove,
        otherWorked,
        otherImprove,
        followUp,
        followUpDescription,
        aiState,
        aiPrompt,
        aiHelper,
        aiAnswer,
    });

    const needsDescribe = escalationNeedsDescription(followUp);
    const escalationOk = followUp.length > 0
        && (!needsDescribe || Boolean(String(followUpDescription).trim()));
    const canSave = rating > 0;
    const canNext = gatedComplete && escalationOk;

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
                <h4 className="h4 m-0" style={{ color: 'var(--color-on-surface)' }}>
                    Session Reflection
                </h4>
                <LastUpdated
                    text={typeof lastUpdated === 'string' ? lastUpdated : undefined}
                    value={lastUpdated instanceof Date ? lastUpdated : undefined}
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-sm)' }}>
                    <p className="body1-txt font-weight-semibold m-0" style={{ color: 'var(--color-on-surface)' }}>
                        How was the overall session?
                        <span style={{ color: 'var(--color-danger)' }}> *</span>
                    </p>
                    <Rating
                        id="session-reflection-rating"
                        value={rating}
                        onChange={setRating}
                        icon="thumbs-up"
                        variant="comments"
                        showCommentsLabel={rating > 0}
                        commentsLabel={SESSION_RATING_COMMENTS[rating]}
                    />
                </div>

                <MultiSelectQuestion
                    question="What worked?"
                    options={WHAT_WORKED_OPTIONS}
                    selectedIds={whatWorked}
                    onToggle={(id) => setWhatWorked((prev) => (
                        prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
                    ))}
                    otherValue={otherWorked}
                    onOtherChange={(event) => setOtherWorked(event.target.value)}
                    required={positiveRequired}
                />

                <MultiSelectQuestion
                    question="What could be improved?"
                    options={WHAT_COULD_IMPROVE_OPTIONS}
                    selectedIds={whatImprove}
                    onToggle={(id) => setWhatImprove((prev) => (
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

                <MultiSelectQuestion
                    question="Does anything from this session need supervisor follow-up?"
                    options={SUPERVISOR_FOLLOWUP_OPTIONS}
                    selectedIds={followUp}
                    onToggle={(id) => {
                        setFollowUp((prev) => {
                            const next = toggleExclusiveNo(prev, id);
                            if (!escalationNeedsDescription(next)) setFollowUpDescription('');
                            return next;
                        });
                    }}
                />
                {needsDescribe && (
                    <FreeResponseQuestion
                        id="session-followup-description"
                        label="Please describe the concern."
                        required
                        value={followUpDescription}
                        onChange={(event) => setFollowUpDescription(event.target.value)}
                    />
                )}
            </div>

            <NavigationButtons
                canSave={canSave}
                canNext={canNext}
                onCancel={onCancel}
                onSaveAndExit={() => onSaveAndExit?.(snapshot())}
                onNext={() => onNext?.(snapshot())}
            />
        </div>
    );
};

SessionReflectionFormV2.propTypes = {
    initialData: PropTypes.object,
    aiState: PropTypes.oneOf(['idle', 'generating', 'ready', 'empty']),
    simulateAi: PropTypes.bool,
    onCancel: PropTypes.func,
    onSaveAndExit: PropTypes.func,
    onNext: PropTypes.func,
    lastUpdated: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
};

export default SessionReflectionFormV2;
