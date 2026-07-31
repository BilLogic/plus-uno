import React, { useState } from 'react';
import UploadFiles from './UploadFiles';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Post-Session/Elements/Upload Files',
    parameters: { layout: 'padded' },
};

/** All three Figma states on one canvas — no subpages. */
export const Overview = {
    render: function UploadFilesOverview() {
        const [emptyFiles, setEmptyFiles] = useState([]);
        const [files, setFiles] = useState([
            { name: 'zoom_0.mp4', size: '160 mb' },
            { name: 'audio_only.m4a', size: '18 mb' },
            { name: 'chat.txt', size: '1 mb' },
        ]);
        const [noRecording, setNoRecording] = useState(true);
        const [reason, setReason] = useState('');
        const [otherDetail, setOtherDetail] = useState('');

        /**
         * @param {Function} setter
         */
        const appendSample = (setter) => {
            setter((prev) => [
                ...prev,
                { name: `recording_${prev.length + 1}.mp4`, size: '12 mb' },
            ]);
        };

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <UploadFiles
                    state="empty"
                    files={emptyFiles}
                    onUploadFolder={() => appendSample(setEmptyFiles)}
                    onChooseFile={() => appendSample(setEmptyFiles)}
                    onRemoveFile={(name) => setEmptyFiles((prev) => prev.filter((file) => file.name !== name))}
                />
                <UploadFiles
                    state="filled"
                    files={files}
                    onUploadFolder={() => appendSample(setFiles)}
                    onChooseFile={() => appendSample(setFiles)}
                    onRemoveFile={(name) => setFiles((prev) => prev.filter((file) => file.name !== name))}
                />
                <UploadFiles
                    state="no-recording"
                    noRecording={noRecording}
                    noRecordingReason={reason}
                    noRecordingOtherDetail={otherDetail}
                    onNoRecordingReasonChange={setReason}
                    onNoRecordingOtherDetailChange={(event) => setOtherDetail(event.target.value)}
                    onNoRecordingChange={(checked) => {
                        setNoRecording(checked);
                        if (!checked) {
                            setReason('');
                            setOtherDetail('');
                        }
                    }}
                    onUploadFolder={() => {
                        setNoRecording(false);
                        appendSample(setFiles);
                    }}
                    onChooseFile={() => {
                        setNoRecording(false);
                        appendSample(setFiles);
                    }}
                />
            </div>
        );
    },
};
