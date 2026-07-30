import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Checkbox from '@/components/forms-and-inputs/Checkbox';
import NavigationButtons from '@/specs/Toolkit/Post-Session/Elements/NavigationButtons/NavigationButtons';
import LastUpdated from '@/specs/Toolkit/Post-Session/Elements/LastUpdated/LastUpdated';
import SessionDate from '@/specs/Toolkit/Post-Session/Elements/SessionDate/SessionDate';
import SessionSelection from '@/specs/Toolkit/Post-Session/Elements/SessionSelection/SessionSelection';
import UploadFiles from '@/specs/Toolkit/Post-Session/Elements/UploadFiles/UploadFiles';
import StudentsDropdown from '@/specs/Toolkit/Post-Session/Elements/StudentsDropdown/StudentsDropdown';
import FreeResponseQuestion from '@/specs/Toolkit/Post-Session/Sections/FreeResponseQuestion/FreeResponseQuestion';
import { CANCELLATION_REASON_OPTIONS } from '@/specs/Toolkit/Post-Session/reflectionCopy';

/**
 * Session Information — page composition from Figma Session Info (`563:300236`).
 * Supports the cancellation branch when “Session did not happen” is on.
 *
 * @param {object} props
 */
const SessionInfo = ({
    initialData,
    availableStudents = [],
    selectedStudentIds = [],
    onStudentSelectionChange,
    onSave,
    onCancel,
    onSaveAndExit,
    lastUpdated,
}) => {
    const [formData, setFormData] = useState({
        date: initialData?.date || '',
        sessionOption: initialData?.sessionOption || '',
        didNotHappen: initialData?.didNotHappen || false,
        noRecording: initialData?.noRecording || false,
        noRecordingReason: initialData?.noRecordingReason || '',
        cancellationReasons: initialData?.cancellationReasons || [],
        cancellationDescription: initialData?.cancellationDescription || '',
        files: initialData?.files || [
            { name: 'zoom_0.mp4', size: '160 mb' },
            { name: 'audio_only.m4a', size: '18 mb' },
            { name: 'chat.txt', size: '1 mb' },
        ],
    });

    /**
     * @param {Partial<typeof formData>} patch
     */
    const patchForm = (patch) => {
        setFormData((prev) => ({ ...prev, ...patch }));
    };

    /**
     * Prototype file pick — appends a sample Zoom file.
     */
    const handleChooseFile = () => {
        patchForm({
            files: [
                ...formData.files,
                { name: `recording_${formData.files.length + 1}.mp4`, size: '12 mb' },
            ],
            noRecording: false,
        });
    };

    /**
     * @param {string} id
     */
    const toggleCancellationReason = (id) => {
        const selected = formData.cancellationReasons.includes(id);
        patchForm({
            cancellationReasons: selected
                ? formData.cancellationReasons.filter((value) => value !== id)
                : [...formData.cancellationReasons, id],
        });
    };

    /**
     * @returns {object}
     */
    const snapshot = () => ({
        ...formData,
        selectedStudentIds,
    });

    const sessionOptions = [
        { value: 'session-el-capitan', label: 'El Capitan (Thompson) · 12:25–13:25' },
        { value: 'session-1', label: 'Life STEAM Academy · 16:00' },
        { value: 'session-life-steam-am', label: 'Life STEAM (Thompson) · 10:00' },
    ];

    const hasDateAndSession = Boolean(formData.date && formData.sessionOption);
    const recordingOk = formData.noRecording
        ? Boolean(formData.noRecordingReason)
        : formData.files.length > 0;

    const cancellationOk = formData.cancellationReasons.length > 0
        && Boolean(String(formData.cancellationDescription).trim());

    const canNext = formData.didNotHappen
        ? hasDateAndSession && cancellationOk
        : hasDateAndSession && selectedStudentIds.length > 0 && recordingOk;
    const canSave = hasDateAndSession;

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-section-gap-md)',
                flex: '1 0 0',
                minWidth: 0,
                width: '100%',
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-xs)' }}>
                <h4 className="h4 m-0" style={{ color: 'var(--color-on-surface)' }}>
                    Session Information
                </h4>
                <LastUpdated
                    text={typeof lastUpdated === 'string' ? lastUpdated : undefined}
                    value={lastUpdated instanceof Date ? lastUpdated : undefined}
                />
            </div>

            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'flex-start',
                    gap: 'var(--size-section-gap-md)',
                }}
            >
                <SessionDate
                    value={formData.date}
                    onChange={(value) => patchForm({ date: value })}
                />

                <SessionSelection
                    value={formData.sessionOption}
                    onChange={(sessionOption) => patchForm({ sessionOption })}
                    options={sessionOptions}
                    didNotHappen={formData.didNotHappen}
                    onDidNotHappenChange={(checked) => patchForm({ didNotHappen: checked })}
                />
            </div>

            {hasDateAndSession && formData.didNotHappen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md)', maxWidth: '445px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-sm)' }}>
                        <p className="body1-txt font-weight-semibold m-0" style={{ color: 'var(--color-on-surface)' }}>
                            Select one or more reasons why the session did not happen.
                            <span style={{ color: 'var(--color-danger)' }}> *</span>
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-sm)' }}>
                            {CANCELLATION_REASON_OPTIONS.map((reason) => (
                                <Checkbox
                                    key={reason.id}
                                    id={`cancel-reason-${reason.id}`}
                                    label={reason.example
                                        ? `${reason.label} (${reason.example})`
                                        : reason.label}
                                    checked={formData.cancellationReasons.includes(reason.id)}
                                    onChange={() => toggleCancellationReason(reason.id)}
                                />
                            ))}
                        </div>
                    </div>

                    <FreeResponseQuestion
                        id="cancellation-description"
                        label="Please briefly describe the situation."
                        required
                        value={formData.cancellationDescription}
                        onChange={(event) => patchForm({ cancellationDescription: event.target.value })}
                    />
                </div>
            )}

            {hasDateAndSession && !formData.didNotHappen && (
                <>
                    <StudentsDropdown
                        students={availableStudents}
                        selectedIds={selectedStudentIds}
                        onChange={(ids) => onStudentSelectionChange?.(ids)}
                    />

                    <UploadFiles
                        files={formData.files}
                        noRecording={formData.noRecording}
                        noRecordingReason={formData.noRecordingReason}
                        onUploadFolder={handleChooseFile}
                        onChooseFile={handleChooseFile}
                        onRemoveFile={(fileName) => {
                            patchForm({ files: formData.files.filter((file) => file.name !== fileName) });
                        }}
                        onNoRecordingChange={(checked) => patchForm({
                            noRecording: checked,
                            files: checked ? [] : formData.files,
                        })}
                        onNoRecordingReasonChange={(reason) => patchForm({ noRecordingReason: reason })}
                    />
                </>
            )}

            <NavigationButtons
                canSave={canSave}
                canNext={canNext}
                showSubmit={formData.didNotHappen}
                onCancel={onCancel}
                onSaveAndExit={() => onSaveAndExit?.(snapshot())}
                onNext={() => onSave?.(snapshot())}
                onSubmit={() => onSave?.(snapshot())}
            />
        </div>
    );
};

SessionInfo.propTypes = {
    initialData: PropTypes.object,
    availableStudents: PropTypes.array,
    selectedStudentIds: PropTypes.array,
    onStudentSelectionChange: PropTypes.func,
    onSave: PropTypes.func,
    onCancel: PropTypes.func,
    onSaveAndExit: PropTypes.func,
    lastUpdated: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
};

SessionInfo.defaultProps = {
    initialData: {},
    availableStudents: [],
    selectedStudentIds: [],
    onStudentSelectionChange: () => {},
    onSave: () => {},
};

export default SessionInfo;
