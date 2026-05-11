/**
 * OnboardingAlertCard - Training Onboarding Card
 * 
 * Alert card component with title, description, and close icon.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=542-50027
 */

import React, { useState } from 'react';
import OnboardingAlertCard from './OnboardingAlertCard';
import './OnboardingAlertCard.scss';

export default {
    title: 'Specs/Training/Onboarding/Cards/OnboardingAlertCard',
    component: OnboardingAlertCard,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Alert card component for displaying important reminders during onboarding. Shows title, description text, and an optional dismiss button.',
            },
        },
    },
    argTypes: {
        title: {
            control: 'text',
            description: 'Alert title',
            table: { category: 'Content' },
        },
        description: {
            control: 'text',
            description: 'Alert description text',
            table: { category: 'Content' },
        },
        dismissible: {
            control: 'boolean',
            description: 'Whether the alert can be dismissed',
            table: { category: 'Behavior' },
        },
        onDismiss: {
            action: 'dismissed',
            table: { category: 'Events' },
        },
    },
};

/**
 * Overview
 * Shows alert card variants matching Figma design
 */
export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-lg, 32px)' }}>
            <section>
                <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>Default Alert</h6>
                <OnboardingAlertCard 
                    title="Don't forget to complete this module"
                    description="Make sure to finish the quiz on the Google Site and answer the reflection question at the bottom of this page to complete this onboarding module."
                />
            </section>

            <section>
                <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>Non-Dismissible</h6>
                <OnboardingAlertCard 
                    title="Important Notice"
                    description="This alert cannot be dismissed and will remain visible."
                    dismissible={false}
                />
            </section>

            <section>
                <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>Custom Content</h6>
                <OnboardingAlertCard 
                    title="Welcome to Onboarding!"
                    description="Complete all modules to unlock your full tutoring capabilities. Each module takes approximately 10-15 minutes."
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
        title: "Don't forget to complete this module",
        description: "Make sure to finish the quiz on the Google Site and answer the reflection question at the bottom of this page to complete this onboarding module.",
        dismissible: true,
    },
    render: (args) => {
        const [visible, setVisible] = useState(true);

        if (!visible) {
            return (
                <div style={{ padding: 'var(--size-section-pad-y-lg)' }}>
                    <button 
                        onClick={() => setVisible(true)}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: 'var(--color-primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Show Alert Again
                    </button>
                </div>
            );
        }

        return (
            <div style={{ padding: 'var(--size-section-pad-y-lg)' }}>
                <OnboardingAlertCard 
                    {...args}
                    onDismiss={() => {
                        setVisible(false);
                        args.onDismiss && args.onDismiss();
                    }}
                />
            </div>
        );
    },
};
