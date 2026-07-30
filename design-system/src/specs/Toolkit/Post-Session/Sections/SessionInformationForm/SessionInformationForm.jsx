import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/actions/Button';
import Dropdown from '@/components/forms-and-inputs/Dropdown';
import Switch from '@/components/forms-and-inputs/Switch';
import DatePicker from '@/components/forms-and-inputs/DatePicker';
import NavigationButtons from '@/specs/Toolkit/Post-Session/Elements/NavigationButtons/NavigationButtons';
import LastUpdated from '@/specs/Toolkit/Post-Session/Elements/LastUpdated/LastUpdated';
import StudentsDropdown from '@/specs/Toolkit/Post-Session/Tables/StudentsDropdown/StudentsDropdown';

const NO_RECORDING_REASONS = [
    'Forgot to record',
    'Recording failed / tech issue',
    'Other',
];

/**
 * Field label with optional required asterisk (Figma Session Information).
 *
 * @param {object} props
 * @param {string} [props.htmlFor]
 * @param {React.ReactNode} props.children
 * @param {boolean} [props.required]
 */
function FieldLabel({ htmlFor, children, required = false }) {
    return (
        <label
            htmlFor={htmlFor}
            className="body2-txt font-weight-semibold m-0"
            style={{ color: 'var(--color-on-surface)' }}
        >
            {children}
            {required && <span style={{ color: 'var(--color-danger)' }}> *</span>}
        </label>
    );
}

FieldLabel.propTypes = {
    htmlFor: PropTypes.string,
    children: PropTypes.node.isRequired,
    required: PropTypes.bool,
};

/**
 * Full-width wrapper so DS Dropdown toggles stretch to the form column.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 */
function FullWidthDropdown({ children }) {
    return (
        <div className="session-info-full-width-dropdown" style={{ width: '100%' }}>
            <style>
                {`
                  .session-info-full-width-dropdown .pdropdown {
                    display: flex;
                    width: 100%;
                  }
                  .session-info-full-width-dropdown .pdropdown-default-toggle {
                    width: 100%;
                    justify-content: space-between;
                  }
                  .session-info-full-width-dropdown .dropdown-menu {
                    width: 100%;
                    max-width: none;
                  }
                `}
            </style>
            {children}
        </div>
    );
}

FullWidthDropdown.propTypes = {
    children: PropTypes.node.isRequired,
};

/**
 * Session Information — page composition from Figma Session Info (`563:300236`).
 * Composes Elements: Session date, Session selection, Students Dropdown, Upload Files.
 *
 * @param {object} props
 */
const SessionInformationForm = ({
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
     * @param {string} studentId
     */
    const handleStudentToggle = (studentId) => {
        if (!onStudentSelectionChange) return;
        const next = selectedStudentIds.includes(studentId)
            ? selectedStudentIds.filter((id) => id !== studentId)
            : [...selectedStudentIds, studentId];
        onStudentSelectionChange(next);
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
     * @param {string} fileName
     */
    const handleRemoveFile = (fileName) => {
        patchForm({ files: formData.files.filter((file) => file.name !== fileName) });
    };

    /**
     * @returns {object}
     */
    const snapshot = () => ({
        ...formData,
        selectedStudentIds,
    });

    const sessionItems = [
        {
            text: 'Life STEAM Academy · 16:00',
            value: 'session-1',
            selected: formData.sessionOption === 'session-1',
            onClick: () => patchForm({ sessionOption: 'session-1' }),
        },
        {
            text: 'Lincoln High · 10:00 AM',
            value: 'session-2',
            selected: formData.sessionOption === 'session-2',
            onClick: () => patchForm({ sessionOption: 'session-2' }),
        },
        {
            text: 'Math Tutoring · 2:00 PM',
            value: 'math_tutoring',
            selected: formData.sessionOption === 'math_tutoring',
            onClick: () => patchForm({ sessionOption: 'math_tutoring' }),
        },
    ];

    const sessionLabel =
        sessionItems.find((item) => item.value === formData.sessionOption)?.text || 'Select a session';

    const hasDateAndSession = Boolean(formData.date && formData.sessionOption);
    const recordingOk = formData.noRecording
        ? Boolean(formData.noRecordingReason)
        : formData.files.length > 0;
    const canNext = hasDateAndSession && selectedStudentIds.length > 0 && recordingOk;
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
                    flexDirection: 'column',
                    gap: 'var(--size-section-gap-md)',
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-sm)' }}>
                    <FieldLabel htmlFor="session-date" required>
                        Select Date
                    </FieldLabel>
                    <DatePicker
                        id="session-date"
                        name="date"
                        placeholder="Select date"
                        value={formData.date}
                        onChange={(value) => patchForm({ date: value })}
                        style={{ width: '100%' }}
                        className="w-100"
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-sm)' }}>
                    <FieldLabel htmlFor="session-select-dropdown" required>
                        Select Session
                    </FieldLabel>
                    <FullWidthDropdown>
                        <Dropdown
                            id="session-select-dropdown"
                            buttonText={sessionLabel}
                            items={sessionItems}
                            style="default"
                            fill="outline"
                        />
                    </FullWidthDropdown>
                </div>

                <Switch
                    id="did-not-happen-switch"
                    label="Session did not happen"
                    checked={formData.didNotHappen}
                    onChange={(event) => patchForm({ didNotHappen: event.target.checked })}
                />
            </div>

            {hasDateAndSession && (
                <>
                    <StudentsDropdown
                        students={availableStudents}
                        selectedIds={selectedStudentIds}
                        onChange={(ids) => onStudentSelectionChange?.(ids)}
                    />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-sm)', maxWidth: '480px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-xs)' }}>
                            <FieldLabel required>Upload session recording</FieldLabel>
                            <p className="body3-txt m-0" style={{ color: 'var(--color-on-surface-variant)' }}>
                                Upload this session’s Zoom recording folder — video, audio, and student chat come in together. Single files and .zip work too.
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: 'var(--size-element-gap-sm)', flexWrap: 'wrap' }}>
                            <Button
                                text="Upload Folder"
                                style="primary"
                                fill="filled"
                                size="small"
                                onClick={handleChooseFile}
                            />
                            <Button
                                text="Choose a file"
                                style="primary"
                                fill="tonal"
                                size="small"
                                onClick={handleChooseFile}
                            />
                        </div>

                        {!formData.noRecording && formData.files.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {formData.files.map((file) => (
                                    <div
                                        key={file.name}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--size-element-gap-md)',
                                            padding: 'var(--size-element-pad-y-md) var(--size-element-pad-x-md)',
                                        }}
                                    >
                                        <i
                                            className="fa-solid fa-file-circle-check"
                                            style={{ color: 'var(--color-on-surface-variant)', fontSize: '12px' }}
                                            aria-hidden="true"
                                        />
                                        <span className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                                            {file.name}
                                        </span>
                                        <span className="body2-txt" style={{ color: 'var(--color-outline-variant)' }}>
                                            {file.size}
                                        </span>
                                        <button
                                            type="button"
                                            aria-label={`Remove ${file.name}`}
                                            onClick={() => handleRemoveFile(file.name)}
                                            style={{
                                                border: 'none',
                                                background: 'transparent',
                                                cursor: 'pointer',
                                                color: 'var(--color-on-surface-variant)',
                                                padding: 0,
                                                marginLeft: 'auto',
                                            }}
                                        >
                                            <i className="fa-solid fa-xmark" aria-hidden="true" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <Switch
                            id="no-recording-switch"
                            label="I don’t have a session recording"
                            checked={formData.noRecording}
                            onChange={(event) => patchForm({
                                noRecording: event.target.checked,
                                files: event.target.checked ? [] : formData.files,
                            })}
                        />

                        {formData.noRecording && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-xs)' }}>
                                <FieldLabel htmlFor="no-recording-reason" required>
                                    Why is there no recording?
                                </FieldLabel>
                                <FullWidthDropdown>
                                    <Dropdown
                                        id="no-recording-reason"
                                        buttonText={formData.noRecordingReason || 'Select a reason'}
                                        items={NO_RECORDING_REASONS.map((text) => ({
                                            text,
                                            selected: formData.noRecordingReason === text,
                                            onClick: () => patchForm({ noRecordingReason: text }),
                                        }))}
                                        style="default"
                                        fill="outline"
                                    />
                                </FullWidthDropdown>
                            </div>
                        )}
                    </div>
                </>
            )}

            <NavigationButtons
                canSave={canSave}
                canNext={canNext}
                onCancel={onCancel}
                onSaveAndExit={() => onSaveAndExit?.(snapshot())}
                onNext={() => onSave?.(snapshot())}
            />
        </div>
    );
};

SessionInformationForm.propTypes = {
    initialData: PropTypes.object,
    availableStudents: PropTypes.array,
    selectedStudentIds: PropTypes.array,
    onStudentSelectionChange: PropTypes.func,
    onSave: PropTypes.func,
    onCancel: PropTypes.func,
    onSaveAndExit: PropTypes.func,
    lastUpdated: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
};

SessionInformationForm.defaultProps = {
    initialData: {},
    availableStudents: [],
    selectedStudentIds: [],
    onStudentSelectionChange: () => {},
    onSave: () => {},
};

export default SessionInformationForm;
