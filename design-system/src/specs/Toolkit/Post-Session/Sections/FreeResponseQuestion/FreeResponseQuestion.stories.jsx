import React, { useState } from 'react';
import FreeResponseQuestion from './FreeResponseQuestion';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Post-Session/Sections/Free Response Question',
    parameters: { layout: 'padded' },
};

/**
 * Default empty state with caption.
 */
export const Overview = {
    render: function FreeResponseOverview() {
        const [value, setValue] = useState('');
        return (
            <FreeResponseQuestion
                label="Is there anything we can do to best support your development?"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                showEscalate
            />
        );
    },
};

/**
 * Caption vs danger warning slots (Form Feedback pattern).
 */
export const CaptionAndWarning = {
    render: function FreeResponseCaptionWarning() {
        const [experience, setExperience] = useState('');
        const [comments, setComments] = useState('');
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md)' }}>
                <FreeResponseQuestion
                    id="form-feedback-experience"
                    label="How was your reflection experience?"
                    caption="Were there any questions within the form that you found unclear or unnecessary?"
                    value={experience}
                    onChange={(event) => setExperience(event.target.value)}
                />
                <FreeResponseQuestion
                    id="form-feedback-comments"
                    label="Any additional comments or concerns?"
                    warning="Please do not include students' names in your response."
                    value={comments}
                    onChange={(event) => setComments(event.target.value)}
                />
            </div>
        );
    },
};
