import React, { useState } from 'react';
import Button from '@/components/actions/Button/Button';
import { RequestTutorOffCanvas } from './RequestTutorOffCanvas.jsx';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/In-Session/Elements/Request Tutor',
    component: RequestTutorOffCanvas,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component:
                    'Request tutor(s) / lead tutor off-canvas side sheet (Figma `Request / Off-Canvas Sidebar` 6065:66287). Lead runs a 3-step flow (form → Slack preview → sent); a regular tutor runs a 2-step flow (Slack preview → sent).',
            },
        },
    },
    argTypes: {
        role: { control: 'radio', options: ['lead', 'tutor'], name: 'Role', table: { category: 'Config' } },
        channel: { control: 'text', name: 'Slack channel', table: { category: 'Config' } },
    },
    args: { role: 'lead', channel: '#tutors-spring-2026' },
};

/** A relatively-positioned stage so the absolutely-positioned side sheet has something to pin to. */
const Stage = ({ children, open, onOpen }) => (
    <div
        style={{
            position: 'relative',
            minHeight: '520px',
            height: '100%',
            background: 'var(--color-surface-container-lowest)',
            borderRadius: 'var(--size-card-radius-sm)',
            overflow: 'hidden',
        }}
    >
        <div style={{ padding: 'var(--size-card-pad-y-lg) var(--size-card-pad-x-lg)' }}>
            {!open && <Button text="Open request panel" style="primary" fill="filled" size="medium" leadingVisual="user-plus" onClick={onOpen} />}
        </div>
        {children}
    </div>
);

const Render = (args) => {
    const [open, setOpen] = useState(true);
    return (
        <Stage open={open} onOpen={() => setOpen(true)}>
            <RequestTutorOffCanvas
                key={args.role /* reset step state when role changes */}
                role={args.role}
                channel={args.channel}
                open={open}
                onClose={() => setOpen(false)}
            />
        </Stage>
    );
};

export const Playground = { render: Render };

export const LeadRequest = {
    render: Render,
    args: { role: 'lead' },
};

export const TutorRequest = {
    render: Render,
    args: { role: 'tutor' },
};
