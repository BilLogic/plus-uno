import React, { useId } from 'react';
import PropTypes from 'prop-types';
import { Button, Toggle } from '@/components';
import { QuestionCaption, QuestionLabel } from '@/specs/Toolkit/Post-Session/QuestionText';
import FileListItem from '@/specs/Toolkit/Post-Session/Elements/FileListItem/FileListItem';
import NoRecordingReason from '@/specs/Toolkit/Post-Session/Elements/NoRecordingReason/NoRecordingReason';

/**
 * Upload session recording block
 * (Figma Elements · Upload Files `7486:93070` — empty | filled | no recording).
 *
 * @param {object} props
 */
const UploadFiles = ({
    state = 'empty',
    files = [],
    onUploadFolder,
    onChooseFile,
    onRemoveFile,
    noRecording = false,
    onNoRecordingChange,
    noRecordingReason = '',
    onNoRecordingReasonChange,
    noRecordingOtherDetail = '',
    onNoRecordingOtherDetailChange,
    id: idProp,
}) => {
    const reactId = useId();
    const switchId = idProp ? `${idProp}-no-recording` : `no-recording-switch-${reactId}`;
    const reasonId = idProp ? `${idProp}-reason` : `no-recording-reason-${reactId}`;
    const effectiveState = noRecording ? 'no-recording' : (files.length ? 'filled' : state);
    const showFiles = effectiveState === 'filled' && files.length > 0;
    const showReason = noRecording || effectiveState === 'no-recording';

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--stack-sm)',
                width: '100%',
                maxWidth: 'var(--col-9)',
            }}
        >
            <QuestionLabel isRequired>Upload session recording</QuestionLabel>

            <QuestionCaption>
                Upload this session’s Zoom recording folder — video, audio, and student chat come in together. Single files and .zip work too.
            </QuestionCaption>

            <div style={{ display: 'flex', gap: 'var(--stack-md)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <Button
                    text="Upload Folder"
                    appearance="primary"
                    spacing="compact"
                    onClick={onUploadFolder}
                />
                <Button
                    text="Choose a file"
                    spacing="compact"
                    onClick={onChooseFile}
                />
            </div>

            {showFiles && (
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    {files.map((file) => (
                        <FileListItem
                            key={file.name}
                            name={file.name}
                            size={file.size}
                            onRemove={() => onRemoveFile?.(file.name)}
                        />
                    ))}
                </div>
            )}

            {!showFiles && (
                <Toggle
                    id={switchId}
                    label="I don’t have a session recording"
                    isChecked={showReason}
                    onChange={(event) => onNoRecordingChange?.(event.target.checked)}/>
            )}

            {showReason && (
                <div style={{ width: '100%', paddingTop: 'var(--pad-y-lg, 8px)' }}>
                    <NoRecordingReason
                        id={reasonId}
                        value={noRecordingReason}
                        onChange={onNoRecordingReasonChange}
                        otherDetail={noRecordingOtherDetail}
                        onOtherDetailChange={onNoRecordingOtherDetailChange}
                    />
                </div>
            )}
        </div>
    );
};

UploadFiles.propTypes = {
    state: PropTypes.oneOf(['empty', 'filled', 'no-recording']),
    files: PropTypes.array,
    onUploadFolder: PropTypes.func,
    onChooseFile: PropTypes.func,
    onRemoveFile: PropTypes.func,
    noRecording: PropTypes.bool,
    onNoRecordingChange: PropTypes.func,
    noRecordingReason: PropTypes.string,
    onNoRecordingReasonChange: PropTypes.func,
    noRecordingOtherDetail: PropTypes.string,
    onNoRecordingOtherDetailChange: PropTypes.func,
    id: PropTypes.string,
};

export default UploadFiles;
