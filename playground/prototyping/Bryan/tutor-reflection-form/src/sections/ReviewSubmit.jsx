import React from 'react';
import Card from '@/components/Card';
import Alert from '@/components/Alert';
import Button from '@/components/Button';
import Badge from '@/components/Badge';
import Textarea from '@/forms/Textarea';
import Select from '@/forms/Select';
import Divider from '@/components/Divider';
import {
    STUDENTS,
    STRATEGIES,
    SEVERITY_OPTIONS,
    RECOMMENDED_ACTIONS,
} from '../data/mockData';

export default function ReviewSubmit({ formState, dispatch, onSubmit }) {
    const {
        selectedSession,
        sessionDidNotHappen,
        sessionRating,
        whatWentWell,
        whatWasChallenging,
        studentCheckIn,
        studentDeepDive,
        selectedStrategies,
        strategyDetails,
        escalationDescription,
        recommendedAction,
        attendance,
    } = formState;

    const escalatedStudents = STUDENTS.filter(
        (s) => studentDeepDive[s.id]?.flagForSupervisor
    );
    const hasEscalations = escalatedStudents.length > 0;

    const highSeverityEscalations = escalatedStudents.filter(
        (s) => studentDeepDive[s.id]?.severity === 'high' || studentDeepDive[s.id]?.severity === 'urgent'
    );

    return (
        <div className="section-container">
            <div className="section-header">
                <h2 className="h5-txt" style={{ color: 'var(--color-on-surface)' }}>
                    Review & Submit
                </h2>
                <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                    Review your reflection and submit when ready.
                </p>
            </div>

            {hasEscalations && (
                <Alert
                    style={highSeverityEscalations.length > 0 ? 'danger' : 'warning'}
                    dismissable={false}
                >
                    <strong>{escalatedStudents.length} student{escalatedStudents.length > 1 ? 's' : ''}</strong>{' '}
                    flagged for supervisor review. Please provide escalation details below.
                </Alert>
            )}

            {hasEscalations && (
                <Card paddingSize="lg" gapSize="md" radiusSize="sm" title="Escalation Details">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-lg)' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--size-element-gap-xs)' }}>
                            {escalatedStudents.map((s) => {
                                const sev = studentDeepDive[s.id]?.severity || 'low';
                                const sevStyle =
                                    sev === 'urgent'
                                        ? 'danger'
                                        : sev === 'high'
                                          ? 'warning'
                                          : sev === 'medium'
                                            ? 'info'
                                            : 'secondary';
                                return (
                                    <Badge
                                        key={s.id}
                                        text={`${s.name} (${sev})`}
                                        style={sevStyle}
                                        size="b2"
                                    />
                                );
                            })}
                        </div>

                        <Textarea
                            name="escalationDescription"
                            label="Describe the situation"
                            placeholder="Provide context that would help a supervisor understand the situation..."
                            rows={4}
                            value={escalationDescription}
                            onChange={(e) =>
                                dispatch({
                                    type: 'SET_FIELD',
                                    field: 'escalationDescription',
                                    value: e.target.value,
                                })
                            }
                        />

                        <Select
                            name="recommendedAction"
                            placeholder="Recommended action..."
                            options={RECOMMENDED_ACTIONS}
                            value={recommendedAction}
                            onChange={(val) =>
                                dispatch({ type: 'SET_FIELD', field: 'recommendedAction', value: val })
                            }
                        />
                    </div>
                </Card>
            )}

            <Card paddingSize="lg" gapSize="md" radiusSize="sm" title="Summary">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-lg)' }}>
                    {/* Session Info Summary */}
                    <div className="summary-section">
                        <span
                            className="body2-txt"
                            style={{ fontWeight: 'var(--font-weight-body2-semibold)', color: 'var(--color-primary)' }}
                        >
                            Session Information
                        </span>
                        <div className="summary-row">
                            <span className="summary-label body3-txt">Session</span>
                            <span className="summary-value body2-txt">
                                {selectedSession || 'Not selected'}
                            </span>
                        </div>
                        {sessionDidNotHappen && (
                            <Badge text="Session Cancelled" style="danger" size="b2" />
                        )}
                    </div>

                    <Divider />

                    {/* Session Overview Summary */}
                    {!sessionDidNotHappen && (
                        <>
                            <div className="summary-section">
                                <span
                                    className="body2-txt"
                                    style={{ fontWeight: 'var(--font-weight-body2-semibold)', color: 'var(--color-primary)' }}
                                >
                                    Session Overview
                                </span>
                                <div className="summary-row">
                                    <span className="summary-label body3-txt">Rating</span>
                                    <span className="summary-value body2-txt">
                                        {sessionRating ? `${sessionRating}/5` : 'Not rated'}
                                    </span>
                                </div>
                                {whatWentWell && (
                                    <div className="summary-row">
                                        <span className="summary-label body3-txt">Went well</span>
                                        <span className="summary-value body3-txt">{whatWentWell}</span>
                                    </div>
                                )}
                                {whatWasChallenging && (
                                    <div className="summary-row">
                                        <span className="summary-label body3-txt">Challenging</span>
                                        <span className="summary-value body3-txt">{whatWasChallenging}</span>
                                    </div>
                                )}
                            </div>

                            <Divider />

                            {/* Student Check-In Summary */}
                            <div className="summary-section">
                                <span
                                    className="body2-txt"
                                    style={{ fontWeight: 'var(--font-weight-body2-semibold)', color: 'var(--color-primary)' }}
                                >
                                    Student Check-In
                                </span>
                                {STUDENTS.filter(
                                    (s) => attendance[s.id] === 'present' || attendance[s.id] === 'late'
                                ).map((student) => {
                                    const data = studentCheckIn[student.id] || {};
                                    return (
                                        <div key={student.id} className="summary-row">
                                            <span className="summary-label body3-txt">{student.name}</span>
                                            <span className="summary-value body3-txt">
                                                {data.engagement || '—'} / {data.understanding || '—'}
                                                {data.flagForDeepDive && (
                                                    <Badge text="Flagged" style="warning" size="b3" className="ms-2" />
                                                )}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            <Divider />

                            {/* Strategies Summary */}
                            <div className="summary-section">
                                <span
                                    className="body2-txt"
                                    style={{ fontWeight: 'var(--font-weight-body2-semibold)', color: 'var(--color-primary)' }}
                                >
                                    Teaching Strategies
                                </span>
                                {selectedStrategies.length === 0 ? (
                                    <span className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                                        No strategies selected
                                    </span>
                                ) : (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--size-element-gap-xs)' }}>
                                        {selectedStrategies.map((sv) => {
                                            const s = STRATEGIES.find((x) => x.value === sv);
                                            const d = strategyDetails[sv] || {};
                                            return (
                                                <Badge
                                                    key={sv}
                                                    text={`${s?.label || sv} (${d.effectiveness || '?'}/5)`}
                                                    style="primary"
                                                    size="b3"
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </Card>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
}
