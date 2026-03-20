import React from 'react';
import Card from '@/components/Card';
import Alert from '@/components/Alert';
import Textarea from '@/forms/Textarea';
import MultipleChoice from '@/forms/MultipleChoice';
import Switch from '@/forms/Switch';
import Select from '@/forms/Select';
import StudentCard from '../components/StudentCard';
import { STUDENTS, CONCERN_AREAS, SEVERITY_OPTIONS } from '../data/mockData';

export default function StudentDeepDive({ formState, dispatch }) {
    const { studentCheckIn, studentDeepDive } = formState;

    const flaggedStudents = STUDENTS.filter(
        (s) => studentCheckIn[s.id]?.flagForDeepDive
    );

    if (flaggedStudents.length === 0) {
        return (
            <div className="section-container">
                <div className="section-header">
                    <h2 className="h5-txt" style={{ color: 'var(--color-on-surface)' }}>
                        Student Deep Dive
                    </h2>
                </div>
                <Alert style="info" dismissable={false}>
                    No students were flagged for deep dive. You can continue to the next section,
                    or go back to Student Check-In to flag a student.
                </Alert>
            </div>
        );
    }

    return (
        <div className="section-container">
            <div className="section-header">
                <h2 className="h5-txt" style={{ color: 'var(--color-on-surface)' }}>
                    Student Deep Dive
                </h2>
                <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                    Provide detailed observations for each flagged student.
                </p>
            </div>

            <div className="student-grid">
                {flaggedStudents.map((student) => {
                    const data = studentDeepDive[student.id] || {};
                    return (
                        <StudentCard key={student.id} student={student} highlighted>
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 'var(--size-element-gap-lg)',
                                    marginTop: 'var(--size-element-gap-md)',
                                }}
                            >
                                <Textarea
                                    name={`observation-${student.id}`}
                                    label="Key observation"
                                    placeholder="What specifically stood out about this student today?"
                                    rows={3}
                                    value={data.observation || ''}
                                    onChange={(e) =>
                                        dispatch({
                                            type: 'SET_STUDENT_DEEP_DIVE',
                                            studentId: student.id,
                                            field: 'observation',
                                            value: e.target.value,
                                        })
                                    }
                                />

                                <MultipleChoice
                                    name={`concerns-${student.id}`}
                                    type="checkbox"
                                    options={CONCERN_AREAS}
                                    value={data.concerns || []}
                                    onChange={(val) =>
                                        dispatch({
                                            type: 'SET_STUDENT_DEEP_DIVE',
                                            studentId: student.id,
                                            field: 'concerns',
                                            value: val,
                                        })
                                    }
                                />

                                <Switch
                                    name={`supervisor-flag-${student.id}`}
                                    label="Flag for supervisor review"
                                    checked={data.flagForSupervisor || false}
                                    onChange={() =>
                                        dispatch({
                                            type: 'SET_STUDENT_DEEP_DIVE',
                                            studentId: student.id,
                                            field: 'flagForSupervisor',
                                            value: !data.flagForSupervisor,
                                        })
                                    }
                                />

                                {data.flagForSupervisor && (
                                    <Select
                                        name={`severity-${student.id}`}
                                        placeholder="Select severity level..."
                                        options={SEVERITY_OPTIONS}
                                        value={data.severity || ''}
                                        onChange={(val) =>
                                            dispatch({
                                                type: 'SET_STUDENT_DEEP_DIVE',
                                                studentId: student.id,
                                                field: 'severity',
                                                value: val,
                                            })
                                        }
                                    />
                                )}
                            </div>
                        </StudentCard>
                    );
                })}
            </div>
        </div>
    );
}
