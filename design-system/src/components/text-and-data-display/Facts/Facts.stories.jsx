import React from 'react';
import { expect, within } from 'storybook/test';

import { inEveryColorModeOf } from '@/storybook-docs/lib/color-modes.js';
import Facts from './Facts';

/**
 * `Facts` -- a description list for read-only facts.
 *
 * THE TEST SEAM IS THIS FILE. Story `play:` functions run by `check:storybook`
 * in a real browser. The list is asserted as what a person sees and what the
 * accessibility tree reports: terms paired with their definitions, labels in
 * the subtle ink and values in the default ink in every color mode, and one
 * shared label column so the values line up. Never a class name.
 */

export default {
    title: 'Components/Text and data display/Facts',
    component: Facts,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'A description list for read-only facts: subtle labels beside default values in two aligned columns.',
            },
        },
    },
    argTypes: {
        items: { control: 'object' },
        className: { control: false },
    },
};

const school = [
    { label: 'School', value: 'Lincoln Middle School' },
    { label: 'Created', value: 'Sep 3, 2026' },
];

/* ------------------------------------------------------------------ default */

export const Overview = () => <Facts items={school} />;

/** Each label is a term with its value as the definition, in the right inks, in every color mode. */
Overview.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = canvasElement.querySelector('dl');
    await expect(list, 'it is a description list').not.toBeNull();
    for (const { label, value } of school) {
        const term = canvas.getByText(label);
        const definition = canvas.getByText(value);
        await expect(term.tagName, `${label} is a term`).toBe('DT');
        await expect(definition.tagName, `${value} is a definition`).toBe('DD');
        await expect(term.nextElementSibling, `${label} is followed by its value`).toBe(definition);
    }
    await inEveryColorModeOf(canvasElement, async (mode, token) => {
        await expect(getComputedStyle(canvas.getByText('School')).color, `label ink, ${mode}`).toBe(token('--ds-text-subtle'));
        await expect(getComputedStyle(canvas.getByText('Lincoln Middle School')).color, `value ink, ${mode}`).toBe(token('--ds-text'));
    });
};

/* ---------------------------------------------------------------- alignment */

export const AlignsValues = () => (
    <Facts items={[
        { label: 'School', value: 'Lincoln Middle School' },
        { label: 'Next session', value: 'Thursday at 4:00 PM' },
    ]}
    />
);

/** The longest label sets the label column, so every value starts at the same edge. */
AlignsValues.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const first = canvas.getByText('Lincoln Middle School').getBoundingClientRect().left;
    const second = canvas.getByText('Thursday at 4:00 PM').getBoundingClientRect().left;
    await expect(first, 'values share a left edge').toBeCloseTo(second, 1);
    await expect(first, 'values sit right of the widest label').toBeGreaterThanOrEqual(
        canvas.getByText('Next session').getBoundingClientRect().right,
    );
};

/* ---------------------------------------------------------------- long values */

const LONG_VALUE = 'https://tutors.example/sessions/lincoln-middle-school/2026/thursday-afternoon-group';

export const LongValueWraps = () => (
    <div style={{ inlineSize: '240px' /* demo frame */ }}>
        <Facts items={[{ label: 'Link', value: LONG_VALUE }]} />
    </div>
);

/** A long unbroken value wraps inside the list instead of widening it. */
LongValueWraps.play = async ({ canvasElement }) => {
    const list = canvasElement.querySelector('dl');
    const value = within(canvasElement).getByText(LONG_VALUE);
    await expect(list.getBoundingClientRect().width, 'the list keeps its container width').toBeLessThanOrEqual(240);
    await expect(value.getBoundingClientRect().right, 'the value stays inside the list').toBeLessThanOrEqual(list.getBoundingClientRect().right + 0.5);
    await expect(value.scrollWidth, 'nothing overflows the value').toBeLessThanOrEqual(value.clientWidth);
};

/* ------------------------------------------------------------------ not a field */

export const NotAControl = () => <Facts items={school} />;

/** Facts is text: Tab skips it, and nothing in it is focusable. */
NotAControl.play = async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('dl [tabindex], dl button, dl input').length, 'nothing to focus').toBe(0);
};

/* ---------------------------------------------------------------- playground */

export const Interactive = (args) => <Facts {...args} />;
Interactive.args = { items: school };
