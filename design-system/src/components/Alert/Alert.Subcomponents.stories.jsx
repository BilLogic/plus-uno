import React from 'react';
import Alert from './Alert'; // We import the main component to extract/mock subcomponents styling for demo

/**
 * Subcomponent documentation for Alert.
 * Demonstrates the internal building blocks of the Alert component as per Figma specifications.
 * 
 * Figma Reference: https://www.figma.com/design/zAecJNRdvJzAUOcjV32tRX/Design-System---BS4?node-id=4215-23104&m=dev
 */
export default {
    title: 'Components/Alert/Subcomponents',
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
 * The standard dismiss action button used within the alert.
 */
export const DismissButton = () => (
    <div style={{ display: 'inline-block' }}>
        <button
            type="button"
            className="plus-alert-dismiss-btn h4"
            aria-label="Close alert"
        >
            <i className="fa-solid fa-xmark"></i>
        </button>
    </div>
);
