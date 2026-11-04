import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Fieldset, Checkbox } from '@/components';
import NavigationButtons from '@/specs/Toolkit/Post-Session/Elements/NavigationButtons/NavigationButtons';
import ReflectionStep from '@/specs/Toolkit/Post-Session/Sections/ReflectionStep/ReflectionStep';
import SessionDate from '@/specs/Toolkit/Post-Session/Elements/SessionDate/SessionDate';
import SessionSelection from '@/specs/Toolkit/Post-Session/Elements/SessionSelection/SessionSelection';
import UploadFiles from '@/specs/Toolkit/Post-Session/Elements/UploadFiles/UploadFiles';
import StudentsDropdown from '@/specs/Toolkit/Post-Session/Elements/StudentsDropdown/StudentsDropdown';
import FreeResponseQuestion from '@/specs/Toolkit/Post-Session/Sections/FreeResponseQuestion/FreeResponseQuestion';
import {
    CANCELLATION_REASON_OPTIONS,
    isReflectionDraftDirty,
} from '@/specs/Toolkit/Post-Session/reflectionCopy';

/**
 * Session Information form composer (Figma Session Info `563:300236`).
 * Supports the cancellation branch when “Session did not happen” is on.
 * Used by Pages / Session Info and Reflection Flow.
 *
 * @param {object} props
 */
const SessionInfoForm = ({
    initialData,
    availableStudents = [],
    selectedStudentIds = [],
    onStudentSelectionChange,
    onSave,
    onCancel,
    onSaveAndExit,
    lastUpdated,
}) => {
    const defaultFiles = [
        { name: 'zoom_0.mp4', size: '160 mb' },
        { name: 'audio_only.m4a', size: '18 mb' },
        { name: 'chat.txt', size: '1 mb' },
    ];
    const [formData, setFormData] = useState({
        date: initialData?.date || '',
        sessionOption: initialData?.sessionOption || '',
        didNotHappen: initialData?.didNotHappen || false,
        noRecording: initialData?.noRecording || false,
        noRecordingReason: initialData?.noRecordingReason || '',
        noRecordingOtherDetail: initialData?.noRecordingOtherDetail || '',
        cancellationReasons: initialData?.cancellationReasons || [],
        cancellationDescription: initialData?.cancellationDescription || '',
        files: initialData?.files || defaultFiles,
    });

    const cancelBaseline = useMemo(() => ({
        date: initialData?.date || '',
        sessionOption: initialData?.sessionOption || '',
        didNotHappen: initialData?.didNotHappen || false,
        noRecording: initialData?.noRecording || false,
        noRecordingReason: initialData?.noRecordingReason || '',
        noRecordingOtherDetail: initialData?.noRecordingOtherDetail || '',
        cancellationReasons: initialData?.cancellationReasons || [],
        cancellationDescription: initialData?.cancellationDescription || '',
        files: initialData?.files || defaultFiles,
        selectedStudentIds: initialData?.selectedStudentIds || selectedStudentIds,
        // eslint-disable-next-line react-hooks/exhaustive-deps -- mount baseline for dirty Cancel
    }), []);

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
            && (formData.noRecordingReason !== 'Other'
                || Boolean(String(formData.noRecordingOtherDetail).trim()))
        : formData.files.length > 0;

    const cancellationOk = formData.cancellationReasons.length > 0
        && Boolean(String(formData.cancellationDescription).trim());

    const canNext = formData.didNotHappen
        ? hasDateAndSession && cancellationOk
        : hasDateAndSession && selectedStudentIds.length > 0 && recordingOk;
    const canSave = hasDateAndSession;

    return (
        <ReflectionStep title="Session Information" lastUpdated={lastUpdated}>

            {/* Figma Session Info Questions: stacked column (Date → Session), not a side-by-side row */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 'var(--size-section-gap-md)',
                    width: '100%',
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md)', maxWidth: 'var(--col-8)' }}>
                    <Fieldset
                        id="cancel-reason"
                        isRequired
                        legend={(
                            <span className="body1-txt font-weight-semibold" style={{ color: 'var(--ds-text)' }}>
                                Select one or more reasons why the session did not happen.
                            </span>
                        )}
                        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}
                    >
                        {CANCELLATION_REASON_OPTIONS.map((reason) => {
                            const label = reason.example ? `${reason.label} (${reason.example})` : reason.label;
                            const checked = formData.cancellationReasons.includes(reason.id);
                            return (
                                <Checkbox
                                    key={reason.id}
                                    name="cancel-reason"
                                    value={reason.id}
                                    label={label}
                                    isChecked={checked}
                                    onChange={(event) => {
                                        const without = formData.cancellationReasons.filter((v) => v !== reason.id);
                                        patchForm({
                                            cancellationReasons: event.target.checked ? [...without, reason.id] : without,
                                        });
                                    }}
                                />
                            );
                        })}
                    </Fieldset>

                    <FreeResponseQuestion
                        id="cancellation-description"
                        label="Please briefly describe the situation."
                        isRequired
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
                        onNoRecordingReasonChange={(reason) => patchForm({
                            noRecordingReason: reason,
                            noRecordingOtherDetail: reason === 'Other' ? formData.noRecordingOtherDetail : '',
                        })}
                        noRecordingOtherDetail={formData.noRecordingOtherDetail}
                        onNoRecordingOtherDetailChange={(event) => patchForm({
                            noRecordingOtherDetail: event.target.value,
                        })}
                    />
                </>
            )}

            <NavigationButtons
                canSave={canSave}
                canNext={canNext}
                showSubmit={formData.didNotHappen}
                onCancel={() => {
                    const data = snapshot();
                    onCancel?.(data, isReflectionDraftDirty(data, cancelBaseline));
                }}
                onSaveAndExit={() => onSaveAndExit?.(snapshot())}
                onNext={() => onSave?.(snapshot())}
                onSubmit={() => onSave?.(snapshot())}
            />
        </ReflectionStep>
    );
};

SessionInfoForm.propTypes = {
    initialData: PropTypes.object,
    availableStudents: PropTypes.array,
    selectedStudentIds: PropTypes.array,
    onStudentSelectionChange: PropTypes.func,
    onSave: PropTypes.func,
    onCancel: PropTypes.func,
    onSaveAndExit: PropTypes.func,
    lastUpdated: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
};

SessionInfoForm.defaultProps = {
    initialData: {},
    availableStudents: [],
    selectedStudentIds: [],
    onStudentSelectionChange: () => {},
    onSave: () => {},
};

export default SessionInfoForm;
