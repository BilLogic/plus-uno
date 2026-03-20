import React from 'react';
import Card from '@/components/Card';
import Select from '@/forms/Select';
import Switch from '@/forms/Switch';
import FileUpload from '@/forms/FileUpload';
import Badge from '@/components/Badge';
import Divider from '@/components/Divider';
import { SESSIONS, STUDENTS, ATTENDANCE_OPTIONS, CANCELLATION_REASONS } from '../data/mockData';

export default function SessionInfo({ formState, dispatch }) {
    const { selectedSession, recordingFile, sessionDidNotHappen, cancellationReason, attendance } =
        formState;

    return (
        <div className="section-container">
            <div className="section-header">
                <h2 className="h5-txt" style={{ color: 'var(--color-on-surface)' }}>
                    Session Information
                </h2>
                <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                    Select the session you are reflecting on and upload your recording.
                </p>
            </div>

            <Card paddingSize="lg" gapSize="md" radiusSize="sm">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-lg)' }}>
                    <Select
                        name="session"
                        placeholder="Select a session..."
                        options={SESSIONS}
                        value={selectedSession}
                        onChange={(val) => dispatch({ type: 'SET_FIELD', field: 'selectedSession', value: val })}
                    />

                    <FileUpload
                        name="recording"
                        label="Session Recording"
                        description="Upload the audio or video recording of this session."
                        acceptedFormats={['.mp3', '.mp4', '.m4a', '.wav', '.webm']}
                        buttonText="Choose recording"
                        onChange={(e) => {
                            const file = e.target?.files?.[0];
                            dispatch({ type: 'SET_FIELD', field: 'recordingFile', value: file?.name || null });
                        }}
                        validation={recordingFile ? 'success' : 'none'}
                        validationMessage={recordingFile ? `Uploaded: ${recordingFile}` : undefined}
                    />

                    <Divider />

                    <Switch
                        name="sessionDidNotHappen"
                        label="This session did not happen"
                        checked={sessionDidNotHappen}
                        onChange={() =>
                            dispatch({
                                type: 'SET_FIELD',
                                field: 'sessionDidNotHappen',
                                value: !sessionDidNotHappen,
                            })
                        }
                    />

                    {sessionDidNotHappen && (
                        <Select
                            name="cancellationReason"
                            placeholder="Select a reason..."
                            options={CANCELLATION_REASONS}
                            value={cancellationReason}
                            onChange={(val) =>
                                dispatch({ type: 'SET_FIELD', field: 'cancellationReason', value: val })
                            }
                        />
                    )}

                    {!sessionDidNotHappen && (
                        <>
                            <Divider />
                            <div>
                                <span
                                    className="body2-txt"
                                    style={{
                                        fontWeight: 'var(--font-weight-body2-semibold)',
                                        color: 'var(--color-on-surface)',
                                        marginBottom: 'var(--size-element-gap-sm)',
                                        display: 'block',
                                    }}
                                >
                                    Student Attendance
                                </span>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-md)' }}>
                                    {STUDENTS.map((student) => {
                                        const current = attendance[student.id] || '';
                                        return (
                                            <div
                                                key={student.id}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: 'var(--size-element-gap-md)',
                                                }}
                                            >
                                                <span className="body2-txt" style={{ flex: 1 }}>
                                                    {student.name}
                                                </span>
                                                <div style={{ display: 'flex', gap: 'var(--size-element-gap-xs)' }}>
                                                    {ATTENDANCE_OPTIONS.map((opt) => (
                                                        <Badge
                                                            key={opt.value}
                                                            text={opt.label}
                                                            style={
                                                                current === opt.value
                                                                    ? opt.value === 'present'
                                                                        ? 'success'
                                                                        : opt.value === 'absent'
                                                                          ? 'danger'
                                                                          : 'warning'
                                                                    : 'secondary'
                                                            }
                                                            size="b3"
                                                            className={current === opt.value ? '' : ''}
                                                            onClick={() =>
                                                                dispatch({
                                                                    type: 'SET_ATTENDANCE',
                                                                    studentId: student.id,
                                                                    value: opt.value,
                                                                })
                                                            }
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </Card>
        </div>
    );
}
