import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/actions/Button';
import Rating from '@/components/forms-and-inputs/Rating';
import Textarea from '@/components/forms-and-inputs/Textarea';
import { OptionChipGroup } from '@/specs/Toolkit/Post-Session/Elements/OptionChip/OptionChip';
import AiGeneratingPlaceholder from '@/specs/Toolkit/Post-Session/Elements/AiGeneratingPlaceholder/AiGeneratingPlaceholder';
import FormReflection from '@/specs/Toolkit/Post-Session/Sections/FormReflection/FormReflection';
import {
    STUDENT_RATING_COMMENTS,
    WHAT_WORKED_OPTIONS,
    WHAT_COULD_IMPROVE_OPTIONS,
    formatLastUpdated,
} from '@/specs/Toolkit/Post-Session/reflectionCopy';

/**
 * Student Reflection section body for one student.
 *
 * @param {object} props
 * @param {string} [props.studentName='Student']
 * @param {object} [props.initialData]
 * @param {'idle'|'generating'|'ready'} [props.aiState]
 * @param {() => void} [props.onPrevious]
 * @param {() => void} [props.onCancel]
 * @param {() => void} [props.onSaveAndExit]
 * @param {(data: object) => void} [props.onNext]
 * @param {boolean} [props.isLastStudent=false]
 * @param {string} [props.lastUpdated]
 */
const StudentReflectionFormV2 = ({
    studentName = 'Student',
    initialData = {},
    aiState = 'idle',
    onPrevious,
    onCancel,
    onSaveAndExit,
    onNext,
    isLastStudent = false,
    lastUpdated,
}) => {
    const [rating, setRating] = useState(initialData.rating || 0);
    const [whatWorked, setWhatWorked] = useState(initialData.whatWorked || []);
    const [whatImprove, setWhatImprove] = useState(initialData.whatImprove || []);
    /**
     * @param {string[]} list
     * @param {string} id
     * @param {(next: string[]) => void} setter
     */
    const toggle = (list, id, setter) => {
        setter(list.includes(id) ? list.filter((value) => value !== id) : [...list, id]);
    };

    const canSave = rating > 0;
    const canNext = rating > 0;

    /**
     * @returns {object}
     */
    const snapshot = () => ({ rating, whatWorked, whatImprove });

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
                    Student Reflection: {studentName}
                </h4>
                <p className="body2-txt m-0" style={{ color: 'var(--color-on-surface-variant)' }}>
                    {lastUpdated || formatLastUpdated()}
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-sm)' }}>
                    <p className="body1-txt font-weight-semibold m-0" style={{ color: 'var(--color-on-surface)' }}>
                        How did {studentName.split(' ')[0]} do in this session?
                        <span style={{ color: 'var(--color-danger)' }}> *</span>
                    </p>
                    <Rating
                        id={`student-rating-${studentName}`}
                        value={rating}
                        onChange={setRating}
                        variant="comments"
                        showCommentsLabel={rating > 0}
                        commentsLabel={STUDENT_RATING_COMMENTS[rating]}
                    />
                </div>

                {rating > 0 && (
                    <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-sm)' }}>
                            <p className="body1-txt font-weight-semibold m-0" style={{ color: 'var(--color-on-surface)' }}>
                                What worked with this student?
                                <span className="body2-txt font-weight-light" style={{ color: 'var(--color-on-surface-variant)' }}>
                                    {' '}(Select all that apply)
                                </span>
                            </p>
                            <OptionChipGroup
                                options={WHAT_WORKED_OPTIONS}
                                selectedIds={whatWorked}
                                onToggle={(id) => toggle(whatWorked, id, setWhatWorked)}
                            />
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
                                    id={`student-improve-other-${studentName}`}
                                    defaultValue={initialData.otherImprove || ''}
                                    placeholder="Describe what else could improve…"
                                    rows={2}
                                />
                            )}
                        </div>

                        {aiState === 'generating' && <AiGeneratingPlaceholder />}
                        {aiState === 'ready' && (
                            <FormReflection
                                prompts={[
                                    {
                                        id: 'student-followup',
                                        question: `What should we watch for with ${studentName.split(' ')[0]} next session?`,
                                        warning: "Please do not include students’ name in the response.",
                                        example: 'e.g. Check-in on participation in the first 5 minutes.',
                                        switchLabel: 'Escalate to lead tutor',
                                    },
                                ]}
                            />
                        )}
                    </>
                )}
            </div>

            <div style={{ display: 'flex', gap: 'var(--size-element-gap-sm)', marginTop: 'auto' }}>
                {onPrevious && (
                    <Button text="Previous" style="default" fill="tonal" onClick={onPrevious} />
                )}
                <Button text="Cancel" style="default" fill="tonal" onClick={onCancel} />
                <Button
                    text="Save & Exit"
                    style="primary"
                    fill="tonal"
                    disabled={!canSave}
                    onClick={() => onSaveAndExit?.(snapshot())}
                />
                <Button
                    text={isLastStudent ? 'Next' : 'Next Student'}
                    style="primary"
                    fill="filled"
                    disabled={!canNext}
                    onClick={() => onNext?.(snapshot())}
                />
            </div>
        </div>
    );
};

StudentReflectionFormV2.propTypes = {
    studentName: PropTypes.string,
    initialData: PropTypes.object,
    aiState: PropTypes.oneOf(['idle', 'generating', 'ready']),
    onPrevious: PropTypes.func,
    onCancel: PropTypes.func,
    onSaveAndExit: PropTypes.func,
    onNext: PropTypes.func,
    isLastStudent: PropTypes.bool,
    lastUpdated: PropTypes.string,
};

export default StudentReflectionFormV2;
