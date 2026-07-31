import React, { useState } from 'react';
import FreeResponseQuestion from './FreeResponseQuestion';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Post-Session/Sections/Free Response Question',
    parameters: { layout: 'padded' },
    args: {
        showEscalate: true,
        escalate: false,
    },
    argTypes: {
        showEscalate: { control: 'boolean' },
        escalate: { control: 'boolean' },
    },
};

/**
 * Default empty state with caption + controllable escalate Switch.
 *
 * @param {object} args
 */
export const Overview = {
    render: function FreeResponseOverview(args) {
        const [value, setValue] = useState('');
        const [escalate, setEscalate] = useState(args.escalate);
        return (
            <FreeResponseQuestion
                label="Is there anything we can do to best support your development?"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                showEscalate={args.showEscalate}
                escalate={escalate}
                onEscalateChange={setEscalate}
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
