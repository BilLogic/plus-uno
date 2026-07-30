import React, { useState } from 'react';
import OtherTextInput from './OtherTextInput';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Post-Session/Sections/Other Text Input',
    parameters: { layout: 'padded' },
};

/** Default empty follow-up field. */
export const Overview = {
    render: function OtherTextInputStory() {
        const [value, setValue] = useState('');
        return (
            <OtherTextInput
                value={value}
                onChange={(event) => setValue(event.target.value)}
            />
        );
    },
};
