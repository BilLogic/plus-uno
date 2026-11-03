import React from 'react';
import { expect, fireEvent, within } from 'storybook/test';

import ProgressTracker, {
    PROGRESS_TRACKER_ORIENTATIONS,
    PROGRESS_TRACKER_SPACINGS,
} from './ProgressTracker';

/**
 * `ProgressTracker` — the steps of a journey, each done, current or upcoming.
 * The test seam is this file: `play:` runs in a real browser.
 */

export default {
    title: 'Components/Status indicators/Progress tracker',
    component: ProgressTracker,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Displays steps and journey progress, each done, current or upcoming.',
            },
        },
    },
    argTypes: {
        orientation: { control: 'select', options: PROGRESS_TRACKER_ORIENTATIONS },
        spacing: { control: 'select', options: PROGRESS_TRACKER_SPACINGS },
    },
};

const ITEMS = [
    { id: 'one', label: 'Session information', status: 'visited', onClick: () => {} },
    { id: 'two', label: 'Student reflection', status: 'current' },
    { id: 'three', label: 'Session reflection', status: 'unvisited' },
    { id: 'four', label: 'Form feedback', status: 'disabled' },
];

export const Default = () => <ProgressTracker items={ITEMS} />;
Default.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Session information')).toBeInTheDocument();
    const current = canvasElement.querySelector('.plus-progress-tracker__item--current');
    await expect(current).toHaveAttribute('aria-current', 'step');
    await expect(canvas.getByRole('button', { name: /Session information/ })).toBeInTheDocument();
};

export const Vertical = () => <ProgressTracker items={ITEMS} orientation="vertical" />;
Vertical.play = async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.plus-progress-tracker--vertical')).toBeInTheDocument();
};

export const Spacing = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <ProgressTracker items={ITEMS} spacing="comfortable" label="Progress tracker, comfortable" />
        <ProgressTracker items={ITEMS} spacing="cozy" label="Progress tracker, cozy" />
        <ProgressTracker items={ITEMS} spacing="compact" label="Progress tracker, compact" />
    </div>
);

export const Clickable = () => {
    const items = ITEMS.map((item) => ({
        ...item,
        onClick: item.status !== 'disabled' ? () => {} : undefined,
    }));
    return <ProgressTracker items={items} />;
};
Clickable.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const unvisitedButton = canvas.getByRole('button', { name: /Session reflection/ });
    await fireEvent.click(unvisitedButton);
    await expect(canvas.queryByRole('button', { name: /Form feedback/ })).not.toBeInTheDocument();
};

export const Completed = () => (
    <ProgressTracker
        items={[
            { id: 'one', label: 'Session information', status: 'visited' },
            { id: 'two', label: 'Student reflection', status: 'visited' },
            { id: 'three', label: 'Session reflection', status: 'visited' },
            { id: 'four', label: 'Form feedback', status: 'current' },
        ]}
    />
);
