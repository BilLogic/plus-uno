import React from 'react';
import Select from '@/forms/Select';
import TextareaVer2 from '@/forms/TextareaVer2';
import Button from '@/components/Button';
import Badge from '@/components/Badge';

const SEVERITY_OPTIONS = [
    { value: 'low', label: 'Low — Minor concern, no urgency' },
    { value: 'medium', label: 'Medium — Should be reviewed this week' },
    { value: 'high', label: 'High — Needs attention within 48 hours' },
    { value: 'urgent', label: 'Urgent — Immediate supervisor action needed' },
];

const RATING_LABELS = {
    0: 'Not rated',
    1: 'Very challenging',
    2: 'Below expectations',
    3: 'Met expectations',
    4: 'Good session',
    5: 'Excellent!',
};

const ReviewSubmit = ({ state, students, presentStudents, hasEscalations, escalation, onEscalationChange, onSubmit }) => {
    const selectedDeepDiveStudent = students.find(
        (s) => String(s.id) === String(state.studentDeepDive.selectedStudent)
    );

    return (
        <div className="reflection-form__section-card">
            <h5 className="h5 reflection-form__section-title">
                <i className="fa-solid fa-paper-plane" style={{ marginRight: '8px', color: 'var(--color-primary)' }} />
                Review & Submit
            </h5>
            <p className="body2-txt reflection-form__section-description">
                Review your responses before submitting. You can go back to any section to make changes.
            </p>

            {hasEscalations && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-md, 16px)' }}>
                    <div className="escalation-banner">
                        <i className="fa-solid fa-triangle-exclamation" />
                        <span className="body2-txt font-weight-semibold">
                            You flagged a concern for supervisor review
                        </span>
                    </div>

                    <div className="reflection-form__field-group">
                        <label className="body2-txt font-weight-semibold reflection-form__label">
                            Escalation Severity *
                        </label>
                        <Select
                            name="severity"
                            options={SEVERITY_OPTIONS}
                            value={escalation.severity}
                            placeholder="Select severity level..."
                            onChange={(val) => onEscalationChange({ severity: val })}
                        />
                    </div>

                    <div className="reflection-form__field-group">
                        <TextareaVer2
                            name="escalation-description"
                            label="Provide additional context for the supervisor"
                            placeholder="What should the supervisor know? What action might be needed?"
                            variant="long"
                            rows={3}
                            value={escalation.description}
                            onChange={(e) => onEscalationChange({ description: e.target.value })}
                        />
                    </div>
                </div>
            )}

            {/* Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md, 16px)' }}>
                {/* Session Info Summary */}
                <div className="review-section__group">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <i className="fa-solid fa-clipboard-list" style={{ color: 'var(--color-on-surface-variant)' }} />
                        <span className="body1-txt font-weight-semibold">Session Information</span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <div className="review-section__item">
                            <span className="body3-txt review-section__label">Session</span>
                            <span className="body2-txt review-section__value">
                                {state.sessionInfo.session || <em style={{ opacity: 0.5 }}>Not selected</em>}
                            </span>
                        </div>
                        <div className="review-section__item">
                            <span className="body3-txt review-section__label">Status</span>
                            <Badge
                                text={state.sessionInfo.sessionDidNotHappen ? 'Cancelled' : 'Completed'}
                                style={state.sessionInfo.sessionDidNotHappen ? 'danger' : 'success'}
                                size="b3"
                            />
                        </div>
                        <div className="review-section__item">
                            <span className="body3-txt review-section__label">Recording</span>
                            <Badge
                                text={state.sessionInfo.recordingFile ? 'Uploaded' : 'Not uploaded'}
                                style={state.sessionInfo.recordingFile ? 'success' : 'default'}
                                size="b3"
                            />
                        </div>
                    </div>
                </div>

                {/* Session Overview Summary */}
                <div className="review-section__group">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <i className="fa-solid fa-star" style={{ color: 'var(--color-on-surface-variant)' }} />
                        <span className="body1-txt font-weight-semibold">Session Overview</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div className="review-section__item">
                            <span className="body3-txt review-section__label">Rating</span>
                            <span className="body2-txt review-section__value">
                                {state.sessionOverview.rating > 0
                                    ? `${state.sessionOverview.rating}/5 — ${RATING_LABELS[state.sessionOverview.rating]}`
                                    : <em style={{ opacity: 0.5 }}>Not rated</em>
                                }
                            </span>
                        </div>
                        <div className="review-section__item">
                            <span className="body3-txt review-section__label">What went well</span>
                            <span className="body2-txt review-section__value">
                                {state.sessionOverview.wentWell || <em style={{ opacity: 0.5 }}>Not provided</em>}
                            </span>
                        </div>
                        {state.sessionOverview.challenges && (
                            <div className="review-section__item">
                                <span className="body3-txt review-section__label">Challenges</span>
                                <span className="body2-txt review-section__value">{state.sessionOverview.challenges}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Student Check-In Summary */}
                <div className="review-section__group">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <i className="fa-solid fa-users" style={{ color: 'var(--color-on-surface-variant)' }} />
                        <span className="body1-txt font-weight-semibold">Student Check-In</span>
                        <Badge text={`${presentStudents.length} students`} style="secondary" size="b3" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {presentStudents.map((student) => {
                            const check = state.studentCheckIn[student.id] || {};
                            return (
                                <div key={student.id} style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    padding: '6px 0',
                                }}>
                                    <span className="body2-txt" style={{ minWidth: '140px' }}>{student.name}</span>
                                    {check.engagement && (
                                        <Badge text={`Eng: ${check.engagement}`} style="secondary" size="b3" />
                                    )}
                                    {check.understanding && (
                                        <Badge text={`Und: ${check.understanding}`} style="secondary" size="b3" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Deep-Dive Summary */}
                {selectedDeepDiveStudent && (
                    <div className="review-section__group">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <i className="fa-solid fa-magnifying-glass" style={{ color: 'var(--color-on-surface-variant)' }} />
                            <span className="body1-txt font-weight-semibold">Student Deep-Dive</span>
                            <Badge text={selectedDeepDiveStudent.name} style="primary" size="b3" />
                        </div>
                        <div className="review-section__item">
                            <span className="body3-txt review-section__label">Key insight</span>
                            <span className="body2-txt review-section__value">
                                {state.studentDeepDive.keyInsight || <em style={{ opacity: 0.5 }}>Not provided</em>}
                            </span>
                        </div>
                    </div>
                )}

                {/* Strategies Summary */}
                {state.strategies.selected.length > 0 && (
                    <div className="review-section__group">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <i className="fa-solid fa-lightbulb" style={{ color: 'var(--color-on-surface-variant)' }} />
                            <span className="body1-txt font-weight-semibold">Teaching Strategies</span>
                            <Badge text={`${state.strategies.selected.length} used`} style="secondary" size="b3" />
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {state.strategies.selected.map((strategy) => (
                                <Badge
                                    key={strategy}
                                    text={`${strategy}${state.strategies.ratings[strategy] ? ` (${state.strategies.ratings[strategy]}/5)` : ''}`}
                                    style={parseInt(state.strategies.ratings[strategy]) >= 4 ? 'success' : 'default'}
                                    size="b3"
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Submit */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                paddingTop: 'var(--size-section-gap-md, 16px)',
                borderTop: '1px solid var(--color-outline-variant, #ddd)',
            }}>
                <Button
                    text="Submit Reflection"
                    style="primary"
                    fill="filled"
                    size="large"
                    leadingVisual="paper-plane"
                    onClick={onSubmit}
                />
            </div>
        </div>
    );
};

export default ReviewSubmit;
