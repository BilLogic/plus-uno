import React from 'react';
import Select from '@/forms/Select';
import TextareaVer2 from '@/forms/TextareaVer2';
import Switch from '@/forms/Switch';
import Alert from '@/components/Alert';
import Badge from '@/components/Badge';

const StudentDeepDive = ({ students, lowScoringStudents, data, onChange }) => {
    const studentOptions = students.map((s) => ({
        value: String(s.id),
        label: s.name,
    }));

    const selectedStudent = students.find((s) => String(s.id) === String(data.selectedStudent));

    return (
        <div className="reflection-form__section-card">
            <h5 className="h5 reflection-form__section-title">
                <i className="fa-solid fa-magnifying-glass" style={{ marginRight: '8px', color: 'var(--color-primary)' }} />
                Student Deep-Dive
            </h5>
            <p className="body2-txt reflection-form__section-description">
                Select one student to reflect on in detail. Your insights here help other tutors
                and feed into AI-powered student profiles.
            </p>

            {lowScoringStudents.length > 0 && (
                <Alert style="warning" dismissable={false}>
                    <span className="body2-txt">
                        <strong>Suggested for deep-dive:</strong> The following student(s) scored low on engagement
                        or understanding:{' '}
                        {lowScoringStudents.map((s, i) => (
                            <span key={s.id}>
                                {i > 0 && ', '}
                                <strong
                                    style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                    onClick={() => onChange({ selectedStudent: String(s.id) })}
                                >
                                    {s.name}
                                </strong>
                            </span>
                        ))}
                    </span>
                </Alert>
            )}

            <div className="reflection-form__field-group">
                <label className="body2-txt font-weight-semibold reflection-form__label">
                    Which student would you like to reflect on? *
                </label>
                <Select
                    name="deep-dive-student"
                    options={studentOptions}
                    value={data.selectedStudent}
                    placeholder="Select a student..."
                    onChange={(val) => onChange({ selectedStudent: val })}
                />
            </div>

            {selectedStudent && (
                <>
                    <div style={{
                        padding: 'var(--size-element-pad-y-md, 12px) var(--size-element-pad-x-md, 16px)',
                        backgroundColor: 'var(--color-primary-state-08)',
                        borderRadius: 'var(--size-element-radius-md, 8px)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--size-element-gap-sm, 8px)',
                    }}>
                        <i className="fa-solid fa-user" style={{ color: 'var(--color-primary)' }} />
                        <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-primary-text)' }}>
                            Reflecting on: {selectedStudent.name}
                        </span>
                    </div>

                    <div className="reflection-form__field-group">
                        <TextareaVer2
                            name="key-insight"
                            label="What's one thing another tutor should know about this student? *"
                            placeholder="Share context that would help a fellow tutor work effectively with this student — learning style, interests, challenges, breakthroughs..."
                            variant="long"
                            rows={5}
                            value={data.keyInsight}
                            onChange={(e) => onChange({ keyInsight: e.target.value })}
                        />
                    </div>

                    <div style={{
                        padding: 'var(--size-element-pad-y-md, 12px) var(--size-element-pad-x-md, 16px)',
                        backgroundColor: data.escalate
                            ? 'var(--color-danger-container, #fce4ec)'
                            : 'var(--color-surface-container, #f0f0f0)',
                        borderRadius: 'var(--size-element-radius-md, 8px)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--size-element-gap-sm, 8px)',
                        transition: 'background-color 0.2s ease',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--size-element-gap-sm, 8px)' }}>
                                <i className="fa-solid fa-flag" style={{
                                    color: data.escalate ? 'var(--color-danger)' : 'var(--color-on-surface-variant)'
                                }} />
                                <span className="body2-txt font-weight-semibold">
                                    Flag for supervisor review
                                </span>
                            </div>
                            <Switch
                                name="escalate"
                                checked={data.escalate}
                                onChange={(e) => onChange({ escalate: e.target.checked })}
                            />
                        </div>
                        {data.escalate && (
                            <div className="reflection-form__field-group">
                                <TextareaVer2
                                    name="escalate-note"
                                    placeholder="Briefly describe the concern..."
                                    variant="short"
                                    value={data.escalateNote}
                                    onChange={(e) => onChange({ escalateNote: e.target.value })}
                                />
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default StudentDeepDive;
