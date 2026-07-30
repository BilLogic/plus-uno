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
        const [files, setFiles] = useState([
            { name: 'zoom_0.mp4', size: '160 mb' },
            { name: 'audio_only.m4a', size: '18 mb' },
            { name: 'chat.txt', size: '1 mb' },
        ]);
        const [reason, setReason] = useState('');
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <UploadFiles state="empty" files={[]} />
                <UploadFiles
                    state="filled"
                    files={files}
                    onRemoveFile={(name) => setFiles((prev) => prev.filter((file) => file.name !== name))}
                />
                <UploadFiles
                    state="no-recording"
                    noRecording
                    noRecordingReason={reason}
                    onNoRecordingReasonChange={setReason}
                    onNoRecordingChange={() => {}}
                />
            </div>
        );
    },
};
