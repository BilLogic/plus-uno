import React, { useState } from 'react';
import MultiSelectQuestion from './MultiSelectQuestion';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Post-Session/Sections/Multi-Select Question',
    parameters: { layout: 'padded' },
};

/** Default with Other chip (shows Other Text Input when selected). */
export const Overview = {
    render: function MultiSelectQuestionStory() {
        const [selectedIds, setSelectedIds] = useState([]);
        const [otherValue, setOtherValue] = useState('');
        return (
            <MultiSelectQuestion
                question="How did the student progress toward their goal this week?"
                selectedIds={selectedIds}
                onToggle={(id) => {
                    setSelectedIds((prev) => (
                        prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
                    ));
                }}
                otherValue={otherValue}
                onOtherChange={(event) => setOtherValue(event.target.value)}
            />
        );
    },
};
