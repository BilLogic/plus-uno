import React, { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import { withForcedPseudo } from '@/storybook-docs/lib/force-pseudo.js';
import { px, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import Radio from './Radio';

export default {
    title: 'Components/Forms and inputs/Radio',
    component: Radio,
    tags: ['!dev', '!autodocs'],
    parameters: {
        changelog: [
            { date: '2026-10-24', kind: 'changed', summary: 'Keyboard focus is the 2px focus-ring role 2px off the radio, replacing the inverse-primary halo. A checked radio keeps its fill and dot on hover.' },
            { date: '2026-10-23', kind: 'changed', summary: 'A labeled radio is a 24 row at every size, its label 14/20.' },
            { date: '2026-10-23', kind: 'deprecated', summary: '`size="large"` was deprecated: it draws like `medium` and warns in development.' },
        ],
        docs: {
            description: {
                component:
                    'Radio component for single selection from mutually exclusive options. Must be used in groups with the same name attribute.',
            },
        },
    },
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        label: {
            control: 'text',
            description: 'Label text for the radio',
            table: { category: 'Content' },
        },
        secondLabel: {
            control: 'text',
            description: 'Label text for the second option',
            table: { category: 'Content' },
        },
        thirdLabel: {
            control: 'text',
            description: 'Label text for the third option',
            table: { category: 'Content' },
        },
        size: {
            control: 'select',
            options: ['small', 'medium', 'large'],
            description: 'Size variant',
            table: { category: 'Design' },
        },
        disabled: {
            control: 'boolean',
            description: 'Disable the radio',
            table: { category: 'Behavior' },
        },
        id: {
            control: false,
            table: { disable: true, category: 'Development' },
        },
        name: {
            table: { disable: true, category: 'Development' },
        },
        value: {
            table: { disable: true, category: 'Development' },
        },
        defaultChecked: {
            table: { disable: true, category: 'Development' },
        },
        checked: {
            table: { disable: true, category: 'Development' },
        },
        onChange: {
            table: { disable: true, category: 'Development' },
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' },
        },
    },
};

export const Overview = () => {
    const [value, setValue] = useState('option1');

    return (
        <div style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Radio
                id="radio-overview-1"
                name="radio-overview"
                label="Option 1"
                value="option1"
                checked={value === 'option1'}
                onChange={(e) => setValue(e.target.value)}
            />
            <Radio
                id="radio-overview-2"
                name="radio-overview"
                label="Option 2"
                value="option2"
                checked={value === 'option2'}
                onChange={(e) => setValue(e.target.value)}
            />
        </div>
    );
};
Overview.parameters = {
    docs: {
        source: { language: 'jsx', code: webAppSourceSnippets.formRadio }
    }
};

export const Content = () => {
    const [value, setValue] = useState('option1');

    return (
        <div style={{ maxWidth: '600px' }}>
            <p className="body2-txt mb-3" style={{ color: 'var(--color-on-surface-variant)' }}>
                Option labels and a selected value in a named group.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Radio
                    id="radio-c1"
                    name="radio-content"
                    label="Option 1"
                    value="option1"
                    checked={value === 'option1'}
                    onChange={(e) => setValue(e.target.value)}
                />
                <Radio
                    id="radio-c2"
                    name="radio-content"
                    label="Option 2"
                    value="option2"
                    checked={value === 'option2'}
                    onChange={(e) => setValue(e.target.value)}
                />
                <Radio
                    id="radio-c3"
                    name="radio-content"
                    label="Option 3"
                    value="option3"
                    checked={value === 'option3'}
                    onChange={(e) => setValue(e.target.value)}
                />
            </div>
        </div>
    );
};

export const Layout = () => {
    const [value, setValue] = useState('a');

    return (
        <div style={{ maxWidth: '600px' }}>
            <p className="body2-txt mb-3" style={{ color: 'var(--color-on-surface-variant)' }}>
                Vertical stack is the default layout for a radio group.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Radio
                    id="radio-l1"
                    name="radio-layout"
                    label="First choice"
                    value="a"
                    checked={value === 'a'}
                    onChange={(e) => setValue(e.target.value)}
                />
                <Radio
                    id="radio-l2"
                    name="radio-layout"
                    label="Second choice"
                    value="b"
                    checked={value === 'b'}
                    onChange={(e) => setValue(e.target.value)}
                />
                <Radio
                    id="radio-l3"
                    name="radio-layout"
                    label="Third choice"
                    value="c"
                    checked={value === 'c'}
                    onChange={(e) => setValue(e.target.value)}
                />
            </div>
        </div>
    );
};

export const Sizes = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px' }}>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">SMALL</span>
            <Radio id="radio-small" name="radio-size" label="Option" size="small" defaultChecked />
        </div>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">MEDIUM (DEFAULT)</span>
            <Radio id="radio-medium" name="radio-size-m" label="Option" size="medium" defaultChecked />
        </div>
        <div>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">LARGE</span>
            <Radio id="radio-large" name="radio-size-l" label="Option" size="large" defaultChecked />
        </div>
    </div>
);

export const InteractionStates = () => {
    const [value, setValue] = useState('option1');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px' }}>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">SELECTED</span>
                <Radio
                    id="radio-s1"
                    name="radio-states"
                    label="Option"
                    value="option1"
                    checked={value === 'option1'}
                    onChange={(e) => setValue(e.target.value)}
                />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">UNSELECTED</span>
                <Radio
                    id="radio-s2"
                    name="radio-states"
                    label="Option"
                    value="option2"
                    checked={value === 'option2'}
                    onChange={(e) => setValue(e.target.value)}
                />
            </div>
            <div>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">DISABLED</span>
                <Radio id="radio-disabled" name="radio-states-dis" label="Option" value="disabled" disabled />
            </div>
        </div>
    );
};

export const Interactive = (args) => {
    const [value, setValue] = useState('option1');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Radio
                id="radio-int-1"
                name="radio-interactive"
                label={args.label}
                value="option1"
                checked={value === 'option1'}
                size={args.size}
                disabled={args.disabled}
                onChange={(e) => setValue(e.target.value)}
            />
            <Radio
                id="radio-int-2"
                name="radio-interactive"
                label={args.secondLabel}
                value="option2"
                checked={value === 'option2'}
                size={args.size}
                disabled={args.disabled}
                onChange={(e) => setValue(e.target.value)}
            />
            <Radio
                id="radio-int-3"
                name="radio-interactive"
                label={args.thirdLabel}
                value="option3"
                checked={value === 'option3'}
                size={args.size}
                disabled={args.disabled}
                onChange={(e) => setValue(e.target.value)}
            />
        </div>
    );
};

Interactive.args = {
    label: 'Option 1',
    secondLabel: 'Option 2',
    thirdLabel: 'Option 3',
    size: 'medium',
    disabled: false,
};

/**
 * Read-only: the answer is shown at full contrast and stays in the tab order,
 * and clicking does not change it. ARIA has no `aria-readonly` for a lone
 * radio, so a read-only question goes in a ChoiceGroup, which announces it.
 */
export const ReadOnly = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-sm)' }}>
        <Radio id="radio-readonly-1" name="radio-readonly" label="In person" value="in-person" defaultChecked readOnly />
        <Radio id="radio-readonly-2" name="radio-readonly" label="Online" value="online" readOnly />
    </div>
);
ReadOnly.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const online = canvas.getByRole('radio', { name: 'Online' });
    await expect(online.disabled).toBe(false);
    await userEvent.click(online);
    await expect(online.checked).toBe(false);
    await expect(canvas.getByRole('radio', { name: 'In person' }).checked).toBe(true);
};

/** A description under the label, and the card appearance. */
export const DescriptionAndCard = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-sm)', maxWidth: '360px' }}>
        <Radio id="radio-desc" name="radio-desc" label="Weekly" value="weekly" description="Every week at the same time." />
        <Radio id="radio-card" name="radio-card" label="Just once" value="once" description="A single session." appearance="card" defaultChecked />
    </div>
);
DescriptionAndCard.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const weekly = canvas.getByRole('radio', { name: 'Weekly' });
    const desc = canvasElement.ownerDocument.getElementById(weekly.getAttribute('aria-describedby'));
    await expect(desc.textContent).toBe('Every week at the same time.');
};

/**
 * Keyboard focus on a checked radio: the focus-ring role, 2px wide and 2px off
 * the radio's edge, the gap Checkbox and Button keep. A ring touching the
 * checked primary border merged into it and stopped reading as focus.
 */
export const KeyboardFocus = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-sm)' }}>
        <Radio id="radio-focus-1" name="radio-focus" label="Morning" value="morning" defaultChecked />
        <Radio id="radio-focus-2" name="radio-focus" label="Evening" value="evening" />
    </div>
);
KeyboardFocus.parameters = { docs: { disable: true } };
KeyboardFocus.play = async ({ canvasElement }) => {
    const radio = within(canvasElement).getByRole('radio', { name: 'Morning' });
    radio.style.transition = 'none';
    await userEvent.tab();
    await expect(document.activeElement).toBe(radio);
    const style = getComputedStyle(radio);
    await waitFor(() => expect(style.outlineStyle).toBe('solid'));
    await expect(px(style.outlineWidth), 'ring width').toBe(2);
    await expect(px(style.outlineOffset), 'ring gap').toBe(2);
    await expect(style.outlineColor, 'ring color').toBe(tokenColor(canvasElement, '--color-focus-ring'));
    await expect(style.backgroundColor, 'the checked fill stays').toBe(tokenColor(canvasElement, '--color-primary'));
};

/** Hover lays the 08 layer: over the page when unchecked, over the fill when checked. */
export const HoverStep = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-sm)' }}>
        <Radio id="radio-hover-1" name="radio-hover" label="Checked" value="checked" defaultChecked />
        <Radio id="radio-hover-2" name="radio-hover" label="Unchecked" value="unchecked" />
    </div>
);
HoverStep.parameters = { docs: { disable: true } };
HoverStep.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const hovered = (name) => {
        const radio = canvas.getByRole('radio', { name });
        radio.style.transition = 'none';
        return withForcedPseudo(radio, ':hover', () => {
            const { backgroundColor, backgroundImage } = getComputedStyle(radio);
            return { backgroundColor, backgroundImage };
        });
    };
    const checked = hovered('Checked');
    await expect(checked.backgroundColor, 'the checked fill stays').toBe(tokenColor(canvasElement, '--color-primary'));
    await expect(checked.backgroundImage).toContain(tokenColor(canvasElement, '--color-shadow-state-08'));
    await expect(hovered('Unchecked').backgroundColor).toBe(tokenColor(canvasElement, '--color-primary-state-08'));
};
