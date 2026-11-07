import React, { useState } from 'react';
import { expect, fireEvent, within } from 'storybook/test';
import { expectGroundUnder } from '@/storybook-docs/lib/label-states.js';
import { tokenColor } from '@/storybook-docs/lib/style-probes.js';

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

const STEPS = [
    { id: 'one', label: 'Session information' },
    { id: 'two', label: 'Student reflection' },
    { id: 'three', label: 'Session reflection' },
    { id: 'four', label: 'Form feedback' },
];

/** Interactive: pick a step to make it current; earlier steps become visited, later ones unvisited. */
export const Interactive = () => {
    const [current, setCurrent] = useState(1);
    const items = STEPS.map((step, index) => ({
        ...step,
        status: index < current ? 'visited' : index === current ? 'current' : 'unvisited',
        onClick: index === current ? undefined : () => setCurrent(index),
    }));
    return <ProgressTracker items={items} />;
};
Interactive.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await fireEvent.click(canvas.getByRole('button', { name: /Session reflection/ }));
    await expect(canvasElement.querySelector('.plus-progress-tracker__item--current')).toHaveTextContent('Session reflection');
};

export const Vertical = () => <ProgressTracker items={ITEMS} orientation="vertical" />;
Vertical.play = async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.plus-progress-tracker--vertical')).toBeInTheDocument();
};

export const Spacing = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-150)' }}>
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

const itemOf = (canvasElement, name) => within(canvasElement).getByText(name).closest('.plus-progress-tracker__item');

/** Rest: the current step is on the selected ground, a visited step carries the success check. */
export const Rest = () => <ProgressTracker items={ITEMS} />;
Rest.play = async ({ canvasElement }) => {
    await expect(getComputedStyle(itemOf(canvasElement, 'Student reflection')).backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-selected'));
    await expect(canvasElement.querySelector('.plus-progress-tracker__icon--visited')).not.toBeNull();
};

/** Hovered: a step that can be opened takes the subtle hovered step. */
export const Hovered = () => <ProgressTracker items={ITEMS} />;
Hovered.play = async ({ canvasElement }) => {
    await expectGroundUnder(canvasElement, itemOf(canvasElement, 'Session information'), ':hover', '--ds-background-neutral-subtle-hovered', 'visited step');
};

/** Pressed: the same step takes the subtle pressed step. */
export const Pressed = () => <ProgressTracker items={ITEMS} />;
Pressed.play = async ({ canvasElement }) => {
    await expectGroundUnder(canvasElement, itemOf(canvasElement, 'Session information'), ':active', '--ds-background-neutral-subtle-pressed', 'visited step');
};

/** Focused: a step that can be opened shows the 2px ring, inset in the step. */
export const Focused = () => <ProgressTracker items={ITEMS} />;
Focused.play = async ({ canvasElement }) => {
    const step = itemOf(canvasElement, 'Session information');
    step.focus({ focusVisible: true });
    await expect(step.matches(':focus-visible')).toBe(true);
    const style = getComputedStyle(step);
    await expect(style.outlineStyle).toBe('solid');
    await expect(style.outlineColor).toBe(tokenColor(canvasElement, '--ds-border-focused'));
    step.blur();
};

/** Disabled: the step takes the disabled ink, is no link or button and says so. */
export const Disabled = () => <ProgressTracker items={ITEMS} />;
Disabled.play = async ({ canvasElement }) => {
    const step = itemOf(canvasElement, 'Form feedback');
    await expect(step).toHaveAttribute('aria-disabled', 'true');
    await expect(step.tagName).toBe('SPAN');
    await expect(getComputedStyle(step).color).toBe(tokenColor(canvasElement, '--ds-text-disabled'));
};
