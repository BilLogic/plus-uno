import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Rating from '@/components/forms-and-inputs/Rating';
import Textarea from '@/components/forms-and-inputs/Textarea';
import { OptionChipGroup } from '@/specs/Toolkit/Post-Session/Elements/OptionChip/OptionChip';
import AiPromptedQuestionBox from '@/specs/Toolkit/Post-Session/Sections/AiPromptedQuestionBox/AiPromptedQuestionBox';
import NavigationButtons from '@/specs/Toolkit/Post-Session/Elements/NavigationButtons/NavigationButtons';
import LastUpdated from '@/specs/Toolkit/Post-Session/Elements/LastUpdated/LastUpdated';
import {
    SESSION_RATING_COMMENTS,
    WHAT_WORKED_OPTIONS,
    WHAT_COULD_IMPROVE_OPTIONS,
    SUPERVISOR_FOLLOWUP_OPTIONS,
} from '@/specs/Toolkit/Post-Session/reflectionCopy';

/**
 * Session Reflection section body (no page shell).
 * Supports empty / AI-generating / filled / worst-case interaction states.
 *
 * @param {object} props
 * @param {object} [props.initialData] - Seeded form values
 * @param {'idle'|'generating'|'ready'} [props.aiState='idle'] - AI follow-up state
 * @param {boolean} [props.simulateAi=true] - Auto-transition idle→generating→ready after rating
 * @param {() => void} [props.onCancel]
 * @param {() => void} [props.onSaveAndExit]
 * @param {(data: object) => void} [props.onNext]
 * @param {string} [props.lastUpdated]
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
    const [followUp, setFollowUp] = useState(initialData.followUp || []);
    const [otherWorked, setOtherWorked] = useState(initialData.otherWorked || '');
    const [otherImprove, setOtherImprove] = useState(initialData.otherImprove || '');
    const [aiState, setAiState] = useState(aiStateProp || initialData.aiState || 'idle');
    const [aiPrompt, setAiPrompt] = useState(initialData.aiPrompt || '');
    const [aiAnswer, setAiAnswer] = useState(initialData.aiAnswer || '');

    useEffect(() => {
        if (aiStateProp) setAiState(aiStateProp);
    }, [aiStateProp]);

    useEffect(() => {
        if (!simulateAi || aiStateProp) return undefined;
        if (rating < 1 || aiState === 'ready') return undefined;

        setAiState('generating');
        const timer = setTimeout(() => {
            setAiState('ready');
            setAiPrompt(
                initialData.aiPrompt
                || 'Based on what you selected, what would you try differently next time to protect pacing?',
            );
        }, 1400);
        return () => clearTimeout(timer);
    }, [rating, simulateAi, aiStateProp, aiState, initialData.aiPrompt]);

    /**
     * @param {string[]} list
     * @param {string} id
     * @param {(next: string[]) => void} setter
     */
    const toggle = (list, id, setter) => {
        setter(list.includes(id) ? list.filter((value) => value !== id) : [...list, id]);
    };

    const canSave = rating > 0;
    const canNext = rating > 0 && whatWorked.length > 0 && followUp.length > 0;

    /**
     * @returns {object}
     */
    const snapshot = () => ({
        rating,
        whatWorked,
        whatImprove,
        followUp,
        otherWorked,
        otherImprove,
        aiState,
        aiPrompt,
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
                <h4 className="h4 m-0" style={{ color: 'var(--color-on-surface)' }}>
                    Session Reflection
                </h4>
                <LastUpdated text={typeof lastUpdated === 'string' ? lastUpdated : undefined} value={lastUpdated instanceof Date ? lastUpdated : undefined} />
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

                {rating > 0 && (
                    <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-sm)' }}>
                            <p className="body1-txt font-weight-semibold m-0" style={{ color: 'var(--color-on-surface)' }}>
                                What worked?
                                <span style={{ color: 'var(--color-danger)' }}> *</span>
                                <span className="body2-txt font-weight-light" style={{ color: 'var(--color-on-surface-variant)' }}>
                                    {' '}(Select all that apply)
                                </span>
                            </p>
                            <OptionChipGroup
                                options={WHAT_WORKED_OPTIONS}
                                selectedIds={whatWorked}
                                onToggle={(id) => toggle(whatWorked, id, setWhatWorked)}
                            />
                            {whatWorked.includes('other') && (
                                <Textarea
                                    id="session-what-worked-other"
                                    value={otherWorked}
                                    onChange={(event) => setOtherWorked(event.target.value)}
                                    placeholder="Describe what else worked…"
                                    rows={2}
                                />
                            )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-sm)' }}>
                            <p className="body1-txt font-weight-semibold m-0" style={{ color: 'var(--color-on-surface)' }}>
                                What could be improved?
                                <span className="body2-txt font-weight-light" style={{ color: 'var(--color-on-surface-variant)' }}>
                                    {' '}(Select all that apply)
                                </span>
                            </p>
                            <OptionChipGroup
                                options={WHAT_COULD_IMPROVE_OPTIONS}
                                selectedIds={whatImprove}
                                onToggle={(id) => toggle(whatImprove, id, setWhatImprove)}
                            />
                            {whatImprove.includes('other') && (
                                <Textarea
                                    id="session-what-improve-other"
                                    value={otherImprove}
                                    onChange={(event) => setOtherImprove(event.target.value)}
                                    placeholder="Describe what else could improve…"
                                    rows={2}
                                />
                            )}
                        </div>

                        {aiState === 'generating' && <AiPromptedQuestionBox state="loading" />}
                        {aiState === 'ready' && aiPrompt && (
                            <AiPromptedQuestionBox
                                state="default"
                                question={aiPrompt}
                                helper="Optional — share a short note"
                                value={aiAnswer}
                                onChange={(event) => setAiAnswer(event.target.value)}
                            />
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-sm)' }}>
                            <p className="body1-txt font-weight-semibold m-0" style={{ color: 'var(--color-on-surface)' }}>
                                Does anything from this session need supervisor follow-up?
                                <span style={{ color: 'var(--color-danger)' }}> *</span>
                                <span className="body2-txt font-weight-light" style={{ color: 'var(--color-on-surface-variant)' }}>
                                    {' '}(Select all that apply)
                                </span>
                            </p>
                            <OptionChipGroup
                                options={SUPERVISOR_FOLLOWUP_OPTIONS}
                                selectedIds={followUp}
                                onToggle={(id) => toggle(followUp, id, setFollowUp)}
                            />
                        </div>
                    </>
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
    aiState: PropTypes.oneOf(['idle', 'generating', 'ready']),
    simulateAi: PropTypes.bool,
    onCancel: PropTypes.func,
    onSaveAndExit: PropTypes.func,
    onNext: PropTypes.func,
    lastUpdated: PropTypes.string,
};

export default SessionReflectionFormV2;
