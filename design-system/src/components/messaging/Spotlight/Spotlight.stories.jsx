import React, { useState } from 'react';
import { expect } from 'storybook/test';
import Button from '@/components/forms-and-inputs/Button';
import Spotlight, { SpotlightAction, SpotlightProvider, SpotlightTarget } from '@/components/messaging/Spotlight';

export default {
    title: 'Components/Messaging/Spotlight',
    component: Spotlight,
    tags: ['!dev', '!autodocs'],
};

export const Basic = () => (
    <SpotlightProvider>
        <div style={{ padding: '64px' }}>
            <SpotlightTarget>
                <Button id="spotlight-target-basic" text="Create" />
            </SpotlightTarget>
            <Spotlight
                headline="Create a new board"
                stepCount="1 of 3"
                primaryAction={<SpotlightAction appearance="primary">Next</SpotlightAction>}
                secondaryAction={<SpotlightAction appearance="secondary">Skip</SpotlightAction>}
            >
                Click here whenever you want to start something new.
            </Spotlight>
        </div>
    </SpotlightProvider>
);

Basic.play = async () => {
    // Base UI's Popover.Portal renders into document.body, outside canvasElement.
    const headline = document.querySelector('.plus-spotlight-headline');
    await expect(headline).toHaveTextContent('Create a new board');
    const dismiss = document.querySelector('.plus-spotlight-dismiss-button');
    await expect(dismiss).toBeTruthy();
};

export const WithMedia = () => (
    <SpotlightProvider>
        <div style={{ padding: '64px' }}>
            <SpotlightTarget><Button text="Target" /></SpotlightTarget>
            <Spotlight
                headline="See it in action"
                media={<img src="https://placehold.co/295x135" alt="" />}
                primaryAction={<SpotlightAction appearance="primary">Got it</SpotlightAction>}
            >
                A short preview of the feature.
            </Spotlight>
        </div>
    </SpotlightProvider>
);

export const LinkAction = () => (
    <SpotlightProvider>
        <div style={{ padding: '64px' }}>
            <SpotlightTarget><Button text="Target" /></SpotlightTarget>
            <Spotlight
                headline="Read more"
                primaryAction={<SpotlightAction appearance="primary" href="https://example.com">Learn more</SpotlightAction>}
                id="spotlight-link-action"
            >
                This action links out instead of calling a handler.
            </Spotlight>
        </div>
    </SpotlightProvider>
);

LinkAction.play = async () => {
    const action = document.querySelector('.plus-spotlight-action--primary');
    await expect(action.tagName).toBe('A');
};

export function Dismissible() {
    const [isOpen, setIsOpen] = useState(true);
    return (
        <SpotlightProvider>
            <div style={{ padding: '64px' }}>
                <SpotlightTarget><Button text="Target" /></SpotlightTarget>
                {isOpen && (
                    <Spotlight headline="Dismiss me" onDismiss={() => setIsOpen(false)}>
                        Click the X to close this.
                    </Spotlight>
                )}
            </div>
        </SpotlightProvider>
    );
}
