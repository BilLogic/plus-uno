import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import AiPromptedQuestionBox from '@/specs/Toolkit/Post-Session/Sections/AiPromptedQuestionBox/AiPromptedQuestionBox';
import FreeResponseQuestion from '@/specs/Toolkit/Post-Session/Sections/FreeResponseQuestion/FreeResponseQuestion';
import MultiSelectQuestion from '@/specs/Toolkit/Post-Session/Sections/MultiSelectQuestion/MultiSelectQuestion';
import NavigationButtons from '@/specs/Toolkit/Post-Session/Elements/NavigationButtons/NavigationButtons';
import SessionNotes from '@/specs/Toolkit/Post-Session/Sections/SessionNotes/SessionNotes';
import LastUpdated from '@/specs/Toolkit/Post-Session/Elements/LastUpdated/LastUpdated';
import {
    EFFORT_OPTIONS,
    ENGAGEMENT_OPTIONS,
    GOAL_PROGRESS_OPTIONS,
    STUDENT_FOLLOWUP_OPTIONS,
    escalationNeedsDescription,
    isReflectionDraftDirty,
    multiSelectComplete,
    toggleExclusiveNo,
} from '@/specs/Toolkit/Post-Session/reflectionCopy';

/**
 * Student Reflection section body for one student.
 *
 * @param {object} props
 */
const StudentReflectionForm = ({
    studentName = 'Student',
    initialData = {},
    aiState: aiStateProp,
    simulateAi = true,
    onCancel,
    onSaveAndExit,
    onNext,
    lastUpdated,
}) => {
    const [goalProgress, setGoalProgress] = useState(initialData.goalProgress || []);
    const [effort, setEffort] = useState(initialData.effort || []);
    const [engagement, setEngagement] = useState(initialData.engagement || []);
    const [otherGoal, setOtherGoal] = useState(initialData.otherGoal || '');
    const [otherEffort, setOtherEffort] = useState(initialData.otherEffort || '');
    const [otherEngagement, setOtherEngagement] = useState(initialData.otherEngagement || '');
    const [followUp, setFollowUp] = useState(initialData.followUp?.length ? initialData.followUp : ['no']);
    const [followUpDescription, setFollowUpDescription] = useState(initialData.followUpDescription || '');
    const [escalate, setEscalate] = useState(Boolean(initialData.escalate));
    const [aiState, setAiState] = useState(aiStateProp || initialData.aiState || 'idle');
    const [aiPrompt, setAiPrompt] = useState(initialData.aiPrompt || '');
    const [aiHelper, setAiHelper] = useState(initialData.aiHelper || '');
    const [aiAnswer, setAiAnswer] = useState(initialData.aiAnswer || '');

    const cancelBaseline = useMemo(() => ({
        goalProgress: initialData.goalProgress || [],
        effort: initialData.effort || [],
        engagement: initialData.engagement || [],
        otherGoal: initialData.otherGoal || '',
        otherEffort: initialData.otherEffort || '',
        otherEngagement: initialData.otherEngagement || '',
        followUp: initialData.followUp?.length ? initialData.followUp : ['no'],
        followUpDescription: initialData.followUpDescription || '',
        escalate: Boolean(initialData.escalate),
        aiState: initialData.aiState || 'idle',
        aiPrompt: initialData.aiPrompt || '',
        aiHelper: initialData.aiHelper || '',
        aiAnswer: initialData.aiAnswer || '',
        notes: initialData.notes,
        // eslint-disable-next-line react-hooks/exhaustive-deps -- mount baseline for dirty Cancel
    }), []);

    const chipsComplete = multiSelectComplete(goalProgress, otherGoal)
        && multiSelectComplete(effort, otherEffort)
        && multiSelectComplete(engagement, otherEngagement);

    useEffect(() => {
        if (aiStateProp) setAiState(aiStateProp);
    }, [aiStateProp]);

    useEffect(() => {
        if (!simulateAi || aiStateProp) return undefined;
        if (!chipsComplete || aiState === 'ready' || aiState === 'empty' || aiState === 'failed') return undefined;

        setAiState('generating');
        const timer = setTimeout(() => {
            // Prototype: Empty = null question success (distinct from failure)
            if (initialData.forceAiEmpty) {
                setAiState('empty');
                return;
            }
            setAiState('ready');
            setAiPrompt(
                initialData.aiPrompt
                || `Sounds like a useful read on ${studentName.split(' ')[0]}. What’s one moment from this session you’d want the next tutor to know?`,
            );
            setAiHelper(
                initialData.aiHelper
                || 'E.g. She solved the last two problems on her own and asked for a harder one.',
            );
        }, 1400);
        return () => clearTimeout(timer);
    }, [chipsComplete, simulateAi, aiStateProp, aiState, initialData.aiPrompt, initialData.aiHelper, initialData.forceAiEmpty, studentName]);

    /**
     * @returns {object}
     */
    const snapshot = () => ({
        goalProgress,
        effort,
        engagement,
        otherGoal,
        otherEffort,
        otherEngagement,
        followUp,
        followUpDescription,
        escalate,
        aiState,
        aiPrompt,
        aiHelper,
        aiAnswer,
        notes: initialData.notes,
    });

    const needsDescribe = escalationNeedsDescription(followUp);
    const escalationOk = followUp.length > 0
        && (!needsDescribe || Boolean(String(followUpDescription).trim()));
    const canNext = chipsComplete && escalationOk;
    const canSave = goalProgress.length > 0 || effort.length > 0 || engagement.length > 0;

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
                    Student Reflection
                </h4>
                <LastUpdated text={lastUpdated} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-sm)' }}>
                    <h6 className="h6 m-0">{studentName}</h6>
                    <SessionNotes state={initialData.notes ? 'filled' : 'empty'} notes={initialData.notes} />
                </div>

                <MultiSelectQuestion
                    question="How did the student progress toward their goal this week?"
                    options={GOAL_PROGRESS_OPTIONS}
                    selectedIds={goalProgress}
                    onToggle={(id) => setGoalProgress((prev) => (
                        prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
                    ))}
                    otherValue={otherGoal}
                    onOtherChange={(event) => setOtherGoal(event.target.value)}
                />
                <MultiSelectQuestion
                    question="How was the student’s effort?"
                    options={EFFORT_OPTIONS}
                    selectedIds={effort}
                    onToggle={(id) => setEffort((prev) => (
                        prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
                    ))}
                    otherValue={otherEffort}
                    onOtherChange={(event) => setOtherEffort(event.target.value)}
                />
                <MultiSelectQuestion
                    question="How was the student’s engagement?"
                    options={ENGAGEMENT_OPTIONS}
                    selectedIds={engagement}
                    onToggle={(id) => setEngagement((prev) => (
                        prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
                    ))}
                    otherValue={otherEngagement}
                    onOtherChange={(event) => setOtherEngagement(event.target.value)}
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
                    question="Does anything about this student need supervisor follow-up?"
                    options={STUDENT_FOLLOWUP_OPTIONS}
                    selectedIds={followUp}
                    otherId=""
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
                        id="student-followup-description"
                        label="Please describe the concern."
                        required
                        value={followUpDescription}
                        onChange={(event) => setFollowUpDescription(event.target.value)}
                        showEscalate
                        escalate={escalate}
                        onEscalateChange={setEscalate}
                    />
                )}
            </div>

            <NavigationButtons
                canSave={canSave}
                canNext={canNext}
                onCancel={() => {
                    const data = snapshot();
                    onCancel?.(data, isReflectionDraftDirty(data, cancelBaseline));
                }}
                onSaveAndExit={() => onSaveAndExit?.(snapshot())}
                onNext={() => onNext?.(snapshot())}
            />
        </div>
    );
};

StudentReflectionForm.propTypes = {
    studentName: PropTypes.string,
    initialData: PropTypes.object,
    aiState: PropTypes.oneOf(['idle', 'generating', 'ready', 'empty', 'failed']),
    simulateAi: PropTypes.bool,
    onCancel: PropTypes.func,
    onSaveAndExit: PropTypes.func,
    onNext: PropTypes.func,
    lastUpdated: PropTypes.string,
};

export default StudentReflectionForm;
