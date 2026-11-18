import React from 'react';
import SectionMessage from './SectionMessage'; // We import the main component to extract/mock subcomponents styling for demo

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
 * The internal layout of title and message text.
 */
export const ContentStructure = () => (
    <div className="plus-section-message" style={{ border: 'var(--border-width-default) dashed var(--ds-border)' }}>
        <div className="plus-section-message-content">
            <div className="plus-section-message-title heading-lg">Session notes saved</div>
            <div className="plus-section-message-text body-lg">Your notes for Maya K. are ready to share with her family.</div>
        </div>
    </div>
);

/**
 * Dismiss Button
 * The shared CloseButton, placed on the first line of text: the title line
 * with a title, the first body line without.
 */
export const DismissButton = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-stack-md)' }}>
        <SectionMessage appearance="primary" title="With a title">The × centers on the title line.</SectionMessage>
        <SectionMessage appearance="primary">Without a title the × centers on the first body line.</SectionMessage>
    </div>
);
