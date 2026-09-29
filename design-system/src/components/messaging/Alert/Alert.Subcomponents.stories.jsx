import React from 'react';
import Alert from './Alert'; // We import the main component to extract/mock subcomponents styling for demo

/**
 * Subcomponent documentation for Alert.
 * Demonstrates the internal building blocks of the Alert component as per Figma specifications.
 * 
 * Figma Reference: https://www.figma.com/design/zAecJNRdvJzAUOcjV32tRX/Design-System---BS4?node-id=4215-23104&m=dev
 */
export default {
    title: 'Components/Messaging/Alert',
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: 'Documentation for the internal subcomponents of the Alert (Dismiss Button, Content Layout).',
            },
        },
    },
};

/**
 * Content Structure
 * The internal layout of title and message text.
 */
export const ContentStructure = () => (
    <div className="plus-alert" style={{ border: '1px dashed var(--color-outline-variant)' }}>
        <div className="plus-alert-content">
            <div className="plus-alert-title h4">Alert Title</div>
            <div className="plus-alert-text body1-txt">This is the message body text within the content area.</div>
        </div>
    </div>
);

/**
 * Dismiss Button
 * The shared CloseButton, placed on the first line of text: the title line
 * with a title, the first body line without.
 */
export const DismissButton = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Alert style="primary" title="With a title">The × centers on the title line.</Alert>
        <Alert style="primary">Without a title the × centers on the first body line.</Alert>
    </div>
);
