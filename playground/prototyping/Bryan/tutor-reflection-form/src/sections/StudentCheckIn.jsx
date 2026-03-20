import React from 'react';
import Scale from '@/forms/RadioButtonGroup';
import Switch from '@/forms/Switch';
import Textarea from '@/forms/Textarea';
import StudentCard from '../components/StudentCard';
import { STUDENTS, ENGAGEMENT_LEVELS, UNDERSTANDING_LEVELS } from '../data/mockData';

export default function StudentCheckIn({ formState, dispatch }) {
    const { studentCheckIn, attendance } = formState;

    const presentStudents = STUDENTS.filter(
        (s) => attendance[s.id] === 'present' || attendance[s.id] === 'late'
    );

    return (
        <div className="section-container">
            <div className="section-header">
                <h2 className="h5-txt" style={{ color: 'var(--color-on-surface)' }}>
                    Student Check-In
                </h2>
                <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                    Quick assessment for each student who attended. Flag any student you want to
                    reflect on more deeply.
                </p>
            </div>

            <div className="student-grid">
                {presentStudents.length === 0 && (
                    <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        No students marked as present or late. Go back to Session Information to
                        update attendance.
                    </p>
                )}

                {presentStudents.map((student) => {
                    const data = studentCheckIn[student.id] || {};
                    return (
                        <StudentCard key={student.id} student={student} highlighted={data.flagForDeepDive}>
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 'var(--size-element-gap-md)',
                                    marginTop: 'var(--size-element-gap-md)',
                                }}
                            >
                                <Scale
                                    name={`engagement-${student.id}`}
                                    label="Engagement"
                                    options={ENGAGEMENT_LEVELS}
                                    lowestLabel="Low"
                                    highestLabel="High"
                                    value={data.engagement || ''}
                                    onChange={(val) =>
                                        dispatch({
                                            type: 'SET_STUDENT_CHECKIN',
                                            studentId: student.id,
                                            field: 'engagement',
                                            value: val,
                                        })
                                    }
                                />

                                <Scale
                                    name={`understanding-${student.id}`}
                                    label="Understanding"
                                    options={UNDERSTANDING_LEVELS}
                                    lowestLabel="Struggling"
                                    highestLabel="Proficient"
                                    value={data.understanding || ''}
                                    onChange={(val) =>
                                        dispatch({
                                            type: 'SET_STUDENT_CHECKIN',
                                            studentId: student.id,
                                            field: 'understanding',
                                            value: val,
                                        })
                                    }
                                />

                                <Textarea
                                    name={`note-${student.id}`}
                                    label="Quick note (optional)"
                                    placeholder="Any brief observation..."
                                    rows={2}
                                    size="small"
                                    value={data.note || ''}
                                    onChange={(e) =>
                                        dispatch({
                                            type: 'SET_STUDENT_CHECKIN',
                                            studentId: student.id,
                                            field: 'note',
                                            value: e.target.value,
                                        })
                                    }
                                />

                                <Switch
                                    name={`flag-${student.id}`}
                                    label="Flag for deep dive"
                                    checked={data.flagForDeepDive || false}
                                    onChange={() =>
                                        dispatch({
                                            type: 'SET_STUDENT_CHECKIN',
                                            studentId: student.id,
                                            field: 'flagForDeepDive',
                                            value: !data.flagForDeepDive,
                                        })
                                    }
                                />
                            </div>
                        </StudentCard>
                    );
                })}
            </div>
        </div>
    );
}
