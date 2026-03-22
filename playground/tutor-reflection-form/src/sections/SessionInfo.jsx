import React from 'react';
import Select from '@/forms/Select';
import Switch from '@/forms/Switch';
import FileUpload from '@/forms/FileUpload';
import TextareaVer2 from '@/forms/TextareaVer2';
import MultipleChoice from '@/forms/MultipleChoice';
import Badge from '@/components/Badge';

const CANCEL_REASONS = [
    { value: 'student-absent', label: 'Student(s) absent' },
    { value: 'tutor-unavailable', label: 'Tutor unavailable' },
    { value: 'technical-issues', label: 'Technical issues' },
    { value: 'scheduling-conflict', label: 'Scheduling conflict' },
    { value: 'holiday', label: 'Holiday / break' },
    { value: 'other', label: 'Other' },
];

const ATTENDANCE_OPTIONS = [
    { value: 'present', label: 'Present' },
    { value: 'late', label: 'Late' },
    { value: 'absent', label: 'Absent' },
];

const SessionInfo = ({ data, sessions, students, onChange }) => {
    const handleAttendanceChange = (studentId, value) => {
        onChange({
            attendance: { ...data.attendance, [studentId]: value },
        });
    };

    return (
        <div className="reflection-form__section-card">
            <h5 className="h5 reflection-form__section-title">
                <i className="fa-solid fa-clipboard-list" style={{ marginRight: '8px', color: 'var(--color-primary)' }} />
                Session Information
            </h5>
            <p className="body2-txt reflection-form__section-description">
                Confirm the session details and student attendance.
            </p>

            <div className="reflection-form__field-group">
                <label className="body2-txt font-weight-semibold reflection-form__label">Session *</label>
                <Select
                    name="session"
                    options={sessions}
                    value={data.session}
                    placeholder="Select your session..."
                    onChange={(val) => onChange({ session: val })}
                />
            </div>

            <div className="reflection-form__field-group">
                <label className="body2-txt font-weight-semibold reflection-form__label">Session Recording</label>
                <FileUpload
                    name="recording"
                    description="Upload your session recording (MP4, WebM, or audio)"
                    acceptedFormats=".mp4,.webm,.mp3,.m4a"
                    buttonText="Upload Recording"
                    onChange={(e) => onChange({ recordingFile: e.target.files?.[0] || null })}
                />
            </div>

            <div style={{
                padding: 'var(--size-element-pad-y-md, 12px) var(--size-element-pad-x-md, 16px)',
                backgroundColor: 'var(--color-surface-container, #f0f0f0)',
                borderRadius: 'var(--size-element-radius-md, 8px)',
            }}>
                <Switch
                    name="session-did-not-happen"
                    label="This session did not happen"
                    checked={data.sessionDidNotHappen}
                    onChange={(e) => onChange({ sessionDidNotHappen: e.target.checked })}
                />
            </div>

            {data.sessionDidNotHappen ? (
                <>
                    <div className="reflection-form__field-group">
                        <label className="body2-txt font-weight-semibold reflection-form__label">
                            Reason for cancellation *
                        </label>
                        <MultipleChoice
                            name="cancel-reasons"
                            type="checkbox"
                            options={CANCEL_REASONS}
                            value={data.cancelReasons}
                            onChange={(val) => onChange({ cancelReasons: val })}
                        />
                    </div>
                    <div className="reflection-form__field-group">
                        <TextareaVer2
                            name="cancel-notes"
                            label="Additional notes"
                            placeholder="Any additional context about the cancellation..."
                            variant="short"
                            value={data.cancelNotes}
                            onChange={(e) => onChange({ cancelNotes: e.target.value })}
                        />
                    </div>
                </>
            ) : (
                <div className="reflection-form__field-group">
                    <label className="body2-txt font-weight-semibold reflection-form__label">
                        Student Attendance
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-sm, 8px)' }}>
                        {students.map((student) => {
                            const status = data.attendance[student.id];
                            return (
                                <div
                                    key={student.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: 'var(--size-element-pad-y-sm, 8px) var(--size-element-pad-x-md, 16px)',
                                        backgroundColor: 'var(--color-surface-container, #f0f0f0)',
                                        borderRadius: 'var(--size-element-radius-md, 8px)',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--size-element-gap-sm, 8px)' }}>
                                        <div style={{
                                            width: 32, height: 32, borderRadius: '50%',
                                            backgroundColor: 'var(--color-primary-state-16)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'var(--color-primary)', fontWeight: 600, fontSize: 12,
                                        }}>
                                            {student.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <span className="body2-txt font-weight-semibold">{student.name}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        {ATTENDANCE_OPTIONS.map((opt) => (
                                            <span
                                                key={opt.value}
                                                onClick={() => handleAttendanceChange(student.id, opt.value)}
                                                style={{ cursor: 'pointer', opacity: status === opt.value ? 1 : 0.4 }}
                                            >
                                                <Badge
                                                    text={opt.label}
                                                    style={status === opt.value
                                                        ? (opt.value === 'absent' ? 'danger' : opt.value === 'late' ? 'warning' : 'success')
                                                        : 'secondary'}
                                                    size="b3"
                                                />
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SessionInfo;
