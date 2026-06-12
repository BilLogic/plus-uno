import React from 'react';
import Textarea from '@/forms/Textarea';
import Badge from '@/components/Badge';
import StudentCard from '../components/StudentCard';

const ENGAGEMENT_OPTIONS = [
    { value: '1', label: '1 — Disengaged' },
    { value: '2', label: '2 — Mostly disengaged' },
    { value: '3', label: '3 — Somewhat engaged' },
    { value: '4', label: '4 — Engaged' },
    { value: '5', label: '5 — Highly engaged' },
];

const UNDERSTANDING_OPTIONS = [
    { value: '1', label: '1 — Did not understand' },
    { value: '2', label: '2 — Struggled significantly' },
    { value: '3', label: '3 — Partial understanding' },
    { value: '4', label: '4 — Good understanding' },
    { value: '5', label: '5 — Strong understanding' },
];

const StudentCheckIn = ({ students, data, onChange }) => {
    if (students.length === 0) {
        return (
            <div className="reflection-form__section-card">
                <h5 className="h5 reflection-form__section-title">
                    <i className="fa-solid fa-users" style={{ marginRight: '8px', color: 'var(--color-primary)' }} />
                    Student Quick Check-In
                </h5>
                <p className="body1-txt" style={{ color: 'var(--color-on-surface-variant)', textAlign: 'center', padding: '24px 0' }}>
                    No students marked as present or late. Go back to Session Information to update attendance.
                </p>
            </div>
        );
    }

    return (
        <div className="reflection-form__section-card">
            <h5 className="h5 reflection-form__section-title">
                <i className="fa-solid fa-users" style={{ marginRight: '8px', color: 'var(--color-primary)' }} />
                Student Quick Check-In
            </h5>
            <p className="body2-txt reflection-form__section-description">
                Rate each student's engagement and understanding. This replaces the old per-student forms — quick and focused.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-md, 16px)' }}>
                {students.map((student) => {
                    const studentData = data[student.id] || {};
                    return (
                        <StudentCard key={student.id} student={student}>
                            <div className="student-card__fields">
                                <div className="reflection-form__field-group">
                                    <label className="body3-txt font-weight-semibold reflection-form__label">
                                        Engagement
                                    </label>
                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                        {ENGAGEMENT_OPTIONS.map((opt) => (
                                            <span
                                                key={opt.value}
                                                onClick={() => onChange(student.id, { engagement: opt.value })}
                                                style={{ cursor: 'pointer', opacity: studentData.engagement === opt.value ? 1 : 0.4 }}
                                            >
                                                <Badge
                                                    text={opt.label}
                                                    style={studentData.engagement === opt.value ? 'primary' : 'secondary'}
                                                    size="b3"
                                                />
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="reflection-form__field-group">
                                    <label className="body3-txt font-weight-semibold reflection-form__label">
                                        Understanding
                                    </label>
                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                        {UNDERSTANDING_OPTIONS.map((opt) => (
                                            <span
                                                key={opt.value}
                                                onClick={() => onChange(student.id, { understanding: opt.value })}
                                                style={{ cursor: 'pointer', opacity: studentData.understanding === opt.value ? 1 : 0.4 }}
                                            >
                                                <Badge
                                                    text={opt.label}
                                                    style={studentData.understanding === opt.value ? 'primary' : 'secondary'}
                                                    size="b3"
                                                />
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <Textarea
                                name={`comment-${student.id}`}
                                placeholder="Optional quick note about this student..."
                                variant="short"
                                value={studentData.comment}
                                onChange={(e) => onChange(student.id, { comment: e.target.value })}
                            />
                        </StudentCard>
                    );
                })}
            </div>
        </div>
    );
};

export default StudentCheckIn;
