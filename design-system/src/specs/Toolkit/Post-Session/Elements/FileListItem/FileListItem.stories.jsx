import React from 'react';
import FileListItem from './FileListItem';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Post-Session/Elements/File List Item',
    parameters: { layout: 'padded' },
};

/** Default file row. */
export const Overview = {
    render: () => (
        <FileListItem name="zoom_0.mp4" size="160 mb" onRemove={() => {}} />
    ),
};
