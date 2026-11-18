import React from 'react';
import { expect } from 'storybook/test';
import SectionMessage from './SectionMessage';

/**
 * Subcomponent documentation for SectionMessage.
 * Demonstrates the internal building blocks of the SectionMessage component as per Figma specifications.
 */
export default {
    title: 'Components/Messaging/Section message',
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: 'Documentation for the internal subcomponents of SectionMessage (Leading Icon, Dismiss Button, Content Layout).',
            },
        },
    },
};

/**
 * Content Structure
 * The internal layout of title, message text, and link actions inside a live SectionMessage.
 */
export const ContentStructure = {
    render: () => (
        <SectionMessage
            appearance="primary"
            title="Session schedule updated"
            dismissible={false}
            actions={[
                { text: 'View schedule', href: '#schedule' },
                { text: 'Notify student', onClick: () => {} },
            ]}
        >
            Your Tuesday Algebra B session with Maya K. moved to 4:30 PM.
        </SectionMessage>
    ),
    play: async ({ canvas }) => {
        await expect(canvas.getByRole('heading', { name: 'Session schedule updated' })).toBeInTheDocument();
        await expect(canvas.getByRole('link', { name: 'View schedule' })).toBeInTheDocument();
        await expect(canvas.getByRole('button', { name: 'Notify student' })).toBeInTheDocument();
    },
};

/**
 * Dismiss Button
 * The shared CloseButton, placed on the first line of text: the title line
 * with a title, the first body line without.
 */
export const DismissButton = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-xl)' }}>
        <SectionMessage appearance="primary" title="With a title">The × centers on the title line.</SectionMessage>
        <SectionMessage appearance="primary">Without a title the × centers on the first body line.</SectionMessage>
    </div>
);
