import React, { useState } from 'react';
import LinearScale from './LinearScale';

export default {
    title: 'Specs/Toolkit/Post-Session/Sections/Linear Scale',
    component: LinearScale,
    parameters: { layout: 'padded' },
};

/** Interactive Linear Scale section from Self Reflection. */
export const Default = {
    render: function LinearScaleStory() {
        const [value, setValue] = useState(0);
        return <LinearScale value={value} onChange={setValue} />;
    },
};
