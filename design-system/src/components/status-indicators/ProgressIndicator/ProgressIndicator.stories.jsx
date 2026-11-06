import React, { useState } from 'react';
import { expect, fireEvent, userEvent, within } from 'storybook/test';
import { expectGroundUnder } from '@/storybook-docs/lib/label-states.js';
import { tokenColor } from '@/storybook-docs/lib/style-probes.js';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-100)' }}>
        <ProgressIndicator values={VALUES} selectedIndex={1} appearance="default" />
        <ProgressIndicator values={VALUES} selectedIndex={1} appearance="primary" />
        <ProgressIndicator values={VALUES} selectedIndex={1} appearance="help" />
        <div style={{ background: 'var(--ds-background-inverse-subtle)', padding: 'var(--space-100)', borderRadius: 'var(--radius-050)' }}>
            <ProgressIndicator values={VALUES} selectedIndex={1} appearance="inverted" />
        </div>
    </div>
);

export const Sizes = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-100)' }}>
        <ProgressIndicator values={VALUES} selectedIndex={1} size={8} />
        <ProgressIndicator values={VALUES} selectedIndex={1} size={12} />
    </div>
);

export const Spacing = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-100)' }}>
        <ProgressIndicator values={VALUES} selectedIndex={1} spacing="comfortable" />
        <ProgressIndicator values={VALUES} selectedIndex={1} spacing="cozy" />
        <ProgressIndicator values={VALUES} selectedIndex={1} spacing="compact" />
    </div>
);

const dots = (canvasElement) => [...canvasElement.querySelectorAll('.plus-progress-indicator__dot')];

/** Rest: a dot is the subtlest icon ground; the current dot is the brand ground. */
export const Rest = () => <ProgressIndicator values={VALUES} selectedIndex={1} onSelect={() => {}} />;
Rest.play = async ({ canvasElement }) => {
    const all = dots(canvasElement);
    await expect(getComputedStyle(all[0]).backgroundColor).toBe(tokenColor(canvasElement, '--ds-icon-subtlest'));
    await expect(getComputedStyle(all[1]).backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-brand-bold'));
};

/** Hovered: an unselected dot steps to the subtle icon ground; the current dot keeps its ground. */
export const Hovered = () => <ProgressIndicator values={VALUES} selectedIndex={1} onSelect={() => {}} />;
Hovered.play = async ({ canvasElement }) => {
    const all = dots(canvasElement);
    await expectGroundUnder(canvasElement, all[0], ':hover', '--ds-icon-subtle', 'dot');
    await expectGroundUnder(canvasElement, all[1], ':hover', '--ds-background-brand-bold', 'current dot');
};

/** Pressed: an unselected dot steps to the default icon ground. */
export const Pressed = () => <ProgressIndicator values={VALUES} selectedIndex={1} onSelect={() => {}} />;
Pressed.play = async ({ canvasElement }) => {
    await expectGroundUnder(canvasElement, dots(canvasElement)[0], ':active', '--ds-icon', 'dot');
};

/** Focused: Tab reaches each dot and draws the 2px ring. */
export const Focused = () => <ProgressIndicator values={VALUES} selectedIndex={1} onSelect={() => {}} />;
Focused.play = async ({ canvasElement }) => {
    const first = dots(canvasElement)[0];
    first.focus({ focusVisible: true });
    await expect(first.matches(':focus-visible')).toBe(true);
    const style = getComputedStyle(first);
    await expect(style.outlineStyle).toBe('solid');
    await expect(style.outlineColor).toBe(tokenColor(canvasElement, '--ds-border-focused'));
    first.blur();
};

/** Decorative: without `onSelect` the dots are decorative: not buttons, not in the tab order. */
export const Decorative = () => <ProgressIndicator values={VALUES} selectedIndex={1} />;
Decorative.play = async ({ canvasElement }) => {
    await expect(within(canvasElement).queryAllByRole('button')).toHaveLength(0);
    await userEvent.tab();
    await expect(dots(canvasElement).some((dot) => dot === canvasElement.ownerDocument.activeElement)).toBe(false);
};

/** Size 12 reads `--progress-indicator-dot-size-12`, size 8 reads `--progress-indicator-dot-size-8`; no pixel value is set inline. */
export const SizeTokens = () => (
    <>
        <ProgressIndicator values={VALUES} selectedIndex={1} size={8} label="Small" />
        <ProgressIndicator values={VALUES} selectedIndex={1} size={12} label="Large" />
    </>
);
SizeTokens.play = async ({ canvasElement }) => {
    const small = canvasElement.querySelector('[aria-label="Small"] .plus-progress-indicator__dot');
    const large = canvasElement.querySelector('[aria-label="Large"] .plus-progress-indicator__dot');
    await expect(parseFloat(getComputedStyle(large).width)).toBeGreaterThan(parseFloat(getComputedStyle(small).width));
    await expect(canvasElement.querySelector('.plus-progress-indicator').getAttribute('style')).toBeNull();
};
