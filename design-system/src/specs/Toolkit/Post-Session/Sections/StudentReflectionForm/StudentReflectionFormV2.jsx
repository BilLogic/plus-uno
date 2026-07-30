import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { OptionChipGroup } from '@/specs/Toolkit/Post-Session/Elements/OptionChip/OptionChip';
import AiPromptedQuestionBox from '@/specs/Toolkit/Post-Session/Sections/AiPromptedQuestionBox/AiPromptedQuestionBox';
import NavigationButtons from '@/specs/Toolkit/Post-Session/Elements/NavigationButtons/NavigationButtons';
import SessionNotes from '@/specs/Toolkit/Post-Session/Sections/SessionNotes/SessionNotes';
import LastUpdated from '@/specs/Toolkit/Post-Session/Elements/LastUpdated/LastUpdated';
import {
    EFFORT_OPTIONS,
    ENGAGEMENT_OPTIONS,
    GOAL_PROGRESS_OPTIONS,
} from '@/specs/Toolkit/Post-Session/reflectionCopy';

/**
 * Student Reflection section body for one student.
 *
 * @param {object} props
 * @param {string} [props.studentName='Student']
 * @param {object} [props.initialData]
 * @param {'idle'|'generating'|'ready'} [props.aiState]
 * @param {() => void} [props.onCancel]
 * @param {() => void} [props.onSaveAndExit]
 * @param {(data: object) => void} [props.onNext]
 * @param {string} [props.lastUpdated]
 */
const StudentReflectionFormV2 = ({
    studentName = 'Student',
    initialData = {},
    aiState = 'idle',
    onCancel,
    onSaveAndExit,
    onNext,
    lastUpdated,
}) => {
    const [goalProgress, setGoalProgress] = useState(initialData.goalProgress || []);
    const [effort, setEffort] = useState(initialData.effort || []);
    const [engagement, setEngagement] = useState(initialData.engagement || []);
    /**
     * @param {string[]} list
     * @param {string} id
     * @param {(next: string[]) => void} setter
     */
    const toggle = (list, id, setter) => {
        setter(list.includes(id) ? list.filter((value) => value !== id) : [...list, id]);
    };

    const canSave = goalProgress.length > 0 || effort.length > 0 || engagement.length > 0;
    const canNext = goalProgress.length > 0 && effort.length > 0 && engagement.length > 0;

    /**
     * @returns {object}
     */
    const snapshot = () => ({ goalProgress, effort, engagement });

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

                {[
                    ['How did the student progress toward their goal this week?', GOAL_PROGRESS_OPTIONS, goalProgress, setGoalProgress],
                    ['How was the student’s effort?', EFFORT_OPTIONS, effort, setEffort],
                    ['How was the student’s engagement?', ENGAGEMENT_OPTIONS, engagement, setEngagement],
                ].map(([question, options, selectedIds, setter]) => (
                    <div key={question} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-sm)' }}>
                        <p className="body1-txt font-weight-semibold m-0">
                            {question} <span style={{ color: 'var(--color-danger)' }}>*</span>
                        </p>
                        <p className="body2-txt m-0" style={{ color: 'var(--color-on-surface-variant)' }}>Select all that apply.</p>
                        <OptionChipGroup options={options} selectedIds={selectedIds} onToggle={(id) => toggle(selectedIds, id, setter)} />
                    </div>
                ))}

                {aiState === 'generating' && <AiPromptedQuestionBox state="loading" />}
                {aiState === 'ready' && <AiPromptedQuestionBox state="default" />}
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

StudentReflectionFormV2.propTypes = {
    studentName: PropTypes.string,
    initialData: PropTypes.object,
    aiState: PropTypes.oneOf(['idle', 'generating', 'ready']),
    onCancel: PropTypes.func,
    onSaveAndExit: PropTypes.func,
    onNext: PropTypes.func,
    lastUpdated: PropTypes.string,
};

export default StudentReflectionFormV2;
