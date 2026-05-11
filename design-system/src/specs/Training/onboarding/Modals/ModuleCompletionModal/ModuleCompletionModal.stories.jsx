/**
 * ModuleCompletionModal - Training Onboarding Modal
 * 
 * Modal showing module completion popup with title, message, and action button.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=74-122005
 */

import React, { useState } from 'react';
import ModuleCompletionModal from './ModuleCompletionModal';
import './ModuleCompletionModal.scss';

export default {
    title: 'Specs/Training/Onboarding/Modals/ModuleCompletionModal',
    component: ModuleCompletionModal,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Modal component showing module completion message. Displays congratulations title, explanation text, and a button to return to onboarding overview.',
            },
        },
    },
    argTypes: {
        title: {
            control: 'text',
            description: 'Modal title',
            table: { category: 'Content' },
        },
        message: {
            control: 'text',
            description: 'Message text',
            table: { category: 'Content' },
        },
        buttonText: {
            control: 'text',
            description: 'Button text',
            table: { category: 'Content' },
        },
        show: {
            control: 'boolean',
            description: 'Whether modal is visible',
            table: { category: 'State' },
        },
        onClose: {
            action: 'closed',
            table: { category: 'Events' },
        },
        onContinue: {
            action: 'continue',
            table: { category: 'Events' },
        },
    },
};

/**
 * Overview
 * Shows modal matching Figma design
 */
export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-lg, 32px)' }}>
            <section>
                <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>Module Completion Modal</h6>
                <ModuleCompletionModal 
                    show={true}
                    title="Module Completed!"
                    message="You've completed this onboarding module. You can revisit it anytime, or continue with the rest of your onboarding."
                    buttonText="Back to Onboarding Overview"
                />
            </section>
        </div>
    ),
};

/**
 * Interactive
 * Interactive playground with controls
 */
export const Interactive = {
    args: {
        title: 'Module Completed!',
        message: "You've completed this onboarding module. You can revisit it anytime, or continue with the rest of your onboarding.",
        buttonText: 'Back to Onboarding Overview',
        show: true,
    },
    render: (args) => {
        const [show, setShow] = useState(args.show);

        return (
            <div style={{ padding: 'var(--size-section-pad-y-lg)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {!show && (
                    <button 
                        onClick={() => setShow(true)}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: 'var(--color-primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            width: 'fit-content'
                        }}
                    >
                        Show Modal
                    </button>
                )}
                <ModuleCompletionModal 
                    {...args}
                    show={show}
                    onClose={() => {
                        setShow(false);
                        args.onClose && args.onClose();
                    }}
                    onContinue={() => {
                        setShow(false);
                        args.onContinue && args.onContinue();
                    }}
                />
            </div>
        );
    },
};
