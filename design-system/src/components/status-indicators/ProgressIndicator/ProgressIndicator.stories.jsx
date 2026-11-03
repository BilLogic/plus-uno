import React, { useState } from 'react';
import { expect, fireEvent, within } from 'storybook/test';

import ProgressIndicator, {
    PROGRESS_INDICATOR_APPEARANCES,
    PROGRESS_INDICATOR_SIZES,
    PROGRESS_INDICATOR_SPACINGS,
} from './ProgressIndicator';

/**
 * `ProgressIndicator` — dots showing where you are along the steps of a
 * journey. The test seam is this file: `play:` runs in a real browser.
 */

export default {
    title: 'Components/Status indicators/Progress indicator',
    component: ProgressIndicator,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Shows the user where they are along the steps of a journey.',
            },
        },
    },
    argTypes: {
        appearance: { control: 'select', options: PROGRESS_INDICATOR_APPEARANCES },
        size: { control: 'select', options: PROGRESS_INDICATOR_SIZES },
        spacing: { control: 'select', options: PROGRESS_INDICATOR_SPACINGS },
        onSelect: { table: { disable: true } },
    },
};

const VALUES = ['first', 'second', 'third', 'fourth'];

export const Default = () => <ProgressIndicator values={VALUES} selectedIndex={1} />;
Default.play = async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('.plus-progress-indicator__dot')).toHaveLength(4);
    await expect(
        canvasElement.querySelector('.plus-progress-indicator__dot--selected'),
    ).toBe(canvasElement.querySelectorAll('.plus-progress-indicator__dot')[1]);
};

export const Interactive = () => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    return (
        <>
            <ProgressIndicator
                values={VALUES}
                selectedIndex={selectedIndex}
                onSelect={({ index }) => setSelectedIndex(index)}
                ariaControls="progress-indicator-panel"
            />
            <div id="progress-indicator-panel" role="tabpanel">{VALUES[selectedIndex]}</div>
        </>
    );
};
Interactive.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const buttons = canvas.getAllByRole('button');
    await expect(buttons).toHaveLength(4);
    await expect(buttons[0]).toHaveAttribute('aria-current', 'step');

    await fireEvent.click(buttons[2]);
    await expect(buttons[2]).toHaveAttribute('aria-current', 'step');
    await expect(buttons[0]).not.toHaveAttribute('aria-current');
};

export const Appearances = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <ProgressIndicator values={VALUES} selectedIndex={1} appearance="default" />
        <ProgressIndicator values={VALUES} selectedIndex={1} appearance="primary" />
        <ProgressIndicator values={VALUES} selectedIndex={1} appearance="help" />
        <div style={{ background: 'var(--ds-background-inverse-subtle)', padding: '16px', borderRadius: 'var(--radius-050)' }}>
            <ProgressIndicator values={VALUES} selectedIndex={1} appearance="inverted" />
        </div>
    </div>
);

export const Sizes = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <ProgressIndicator values={VALUES} selectedIndex={1} size={8} />
        <ProgressIndicator values={VALUES} selectedIndex={1} size={12} />
    </div>
);

export const Spacing = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <ProgressIndicator values={VALUES} selectedIndex={1} spacing="comfortable" />
        <ProgressIndicator values={VALUES} selectedIndex={1} spacing="cozy" />
        <ProgressIndicator values={VALUES} selectedIndex={1} spacing="compact" />
    </div>
);
