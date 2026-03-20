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
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-element-gap-lg)',
            }}
        >
            <p className="body2-txt m-0" style={{ color: 'var(--color-on-surface-variant)' }}>
                Review your reflection and submit when ready.
            </p>

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
                                    sev === 'urgent' ? 'danger'
                                        : sev === 'high' ? 'warning'
                                            : sev === 'medium' ? 'info'
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

            {/* Summary */}
            <Card paddingSize="lg" gapSize="md" radiusSize="sm" title="Summary">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-lg)' }}>
                    {/* Session Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-sm)' }}>
                        <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-primary)' }}>
                            Session Information
                        </span>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>Session</span>
                            <span className="body2-txt">{selectedSession || 'Not selected'}</span>
                        </div>
                        {sessionDidNotHappen && <Badge text="Session Cancelled" style="danger" size="b2" />}
                    </div>

                    {!sessionDidNotHappen && (
                        <>
                            <Divider />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-sm)' }}>
                                <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-primary)' }}>
                                    Session Overview
                                </span>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>Rating</span>
                                    <span className="body2-txt">{sessionRating ? `${sessionRating}/5` : 'Not rated'}</span>
                                </div>
                                {whatWentWell && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--size-element-gap-md)' }}>
                                        <span className="body3-txt" style={{ color: 'var(--color-on-surface-variant)', minWidth: 100 }}>Went well</span>
                                        <span className="body3-txt" style={{ textAlign: 'right' }}>{whatWentWell}</span>
                                    </div>
                                )}
                            </div>

                            <Divider />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-sm)' }}>
                                <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-primary)' }}>
                                    Students
                                </span>
                                {STUDENTS.filter(
                                    (s) => attendance[s.id] === 'present' || attendance[s.id] === 'late'
                                ).map((student) => {
                                    const data = studentCheckIn[student.id] || {};
                                    return (
                                        <div key={student.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span className="body3-txt">{student.name}</span>
                                            <span className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
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
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-sm)' }}>
                                <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-primary)' }}>
                                    Strategies
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
        </div>
    );
}
