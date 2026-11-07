import React, { useEffect, useState } from 'react';
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import { withForcedPseudo } from '@/storybook-docs/lib/force-pseudo.js';
import { px, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import Range from './Range';

export default {
    title: 'Components/Forms and inputs/Range',
    component: Range,
    tags: ['!dev', '!autodocs'],
    parameters: {
        changelog: [
            { date: '2026-11-03', kind: 'changed', summary: 'Props: `isDisabled`, and `onChange` receives the new value as a number, then the event. One size, a 32 control with a 4 track and a 20 thumb. The fill, thumb and disabled state use the named tokens; focus is the 2px ring on `border.focused`.' },
        ],
        docs: {
            description: {
                component:
                    'A range lets a person choose an approximate value on a slider, between a minimum and a maximum. The track fills from the start to the thumb.',
            },
        },
    },
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        value: {
            control: { type: 'range', min: 0, max: 100, step: 1 },
            table: { category: 'Content' },
        },
        min: {
            control: 'number',
            table: { category: 'Behavior' },
        },
        max: {
            control: 'number',
            table: { category: 'Behavior' },
        },
        step: {
            control: 'number',
            table: { category: 'Behavior' },
        },
        isDisabled: {
            control: 'boolean',
            table: { category: 'Behavior' },
        },
        size: {
            control: 'select',
            options: [8, 12, 16],
            table: { category: 'Design' },
        },
        id: { control: false, table: { disable: true, category: 'Development' } },
        name: { control: false, table: { disable: true, category: 'Development' } },
        defaultValue: { control: false, table: { disable: true, category: 'Development' } },
        onChange: { control: false, table: { disable: true, category: 'Development' } },
        className: { control: false, table: { disable: true, category: 'Development' } },
    },
};

export const Overview = () => {
    const [value, setValue] = useState(50);

    return (
        <div style={{ maxWidth: 'var(--size-4000)' }}>
            <Range
                id="range-overview"
                label="Volume"
                min={0}
                max={100}
                value={value}
                onChange={setValue}/>
        </div>
    );
};
Overview.parameters = {
    docs: {
        source: { language: 'jsx', code: webAppSourceSnippets.formRange }
    }
};

/** The label sits directly above the slider, aligned left. A hidden label still names it. */
export const Labels = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-lg)', maxWidth: 'var(--size-4000)' }}>
        <Range id="range-visible" label="Zoom" defaultValue={30}/>
        <Range id="range-hidden" label="Brightness" showLabel={false} defaultValue={70}/>
    </div>
);

/** The thumb at the start, the middle and the end of the span. */
export const Positions = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-lg)', maxWidth: 'var(--size-4000)' }}>
        <Range id="range-start" label="At the start" defaultValue={0}/>
        <Range id="range-middle" label="In the middle" defaultValue={50}/>
        <Range id="range-end" label="At the end" defaultValue={100}/>
    </div>
);

/** Disabled takes the disabled fill on the track and the thumb. */
export const Disabled = () => (
    <div style={{ maxWidth: 'var(--size-4000)' }}>
        <Range id="range-disabled" label="Zoom" defaultValue={40} isDisabled/>
    </div>
);
Disabled.play = async ({ canvasElement }) => {
    const slider = within(canvasElement).getByRole('slider', { name: 'Zoom' });
    await expect(slider.disabled).toBe(true);
};

export const Interactive = (args) => {
    const [value, setValue] = useState(args.value);

    useEffect(() => {
        setValue(args.value);
    }, [args.value]);

    return (
        <div style={{ maxWidth: 'var(--size-4000)' }}>
            <Range
                id="range-interactive"
                label="Range value"
                value={value}
                onChange={setValue}
                min={args.min}
                max={args.max}
                step={args.step}
                isDisabled={args.isDisabled}/>
        </div>
    );
};

Interactive.args = {
    value: 50,
    min: 0,
    max: 100,
    step: 1,
    isDisabled: false,
};

/** `size` scales the dot and the bar in px; the track between them follows a step behind. */
export const Size = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-075)', maxWidth: 'var(--size-4000)' }}>
        <Range id="range-size-8" label="8" defaultValue={50} size={8}/>
        <Range id="range-size-12" label="12" defaultValue={50} size={12}/>
        <Range id="range-size-16" label="16" defaultValue={50} size={16}/>
    </div>
);
Size.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const wrapper = (name) => canvas.getByRole('slider', { name }).closest('.plus-form-range-wrapper');
    await expect(wrapper('8')).toHaveAttribute('data-size', '8');
    await expect(wrapper('12')).toHaveAttribute('data-size', '12');
    await expect(wrapper('16')).toHaveAttribute('data-size', '16');
};

/** `onChange` receives the value as a number, then the event. */
export const ReportsNumber = () => {
    const [value, setValue] = useState(50);
    const [seen, setSeen] = useState('none');

    return (
        <div style={{ maxWidth: 'var(--size-4000)' }}>
            <Range
                id="range-number"
                label="Reported"
                value={value}
                onChange={(next, event) => {
                    setSeen(`${typeof next}:${next}:${event.type}`);
                    setValue(next);
                }}/>
            <p data-testid="range-seen">{seen}</p>
        </div>
    );
};
ReportsNumber.parameters = { docs: { disable: true } };
ReportsNumber.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    fireEvent.change(canvas.getByRole('slider', { name: 'Reported' }), { target: { value: '72' } });
    await waitFor(() => expect(canvas.getByTestId('range-seen').textContent).toBe('number:72:change'));
};

/** The thumb reports its span and its value through ARIA, independent of what is on screen. */
export const Aria = () => (
    <div style={{ maxWidth: 'var(--size-4000)' }}>
        <Range id="range-aria" label="Volume" min={10} max={90} defaultValue={40} />
    </div>
);
Aria.parameters = { docs: { disable: true } };
Aria.play = async ({ canvasElement }) => {
    const slider = within(canvasElement).getByRole('slider', { name: 'Volume' });
    // The native `min`/`max` on the real input give the browser's accessibility
    // tree `aria-valuemin`/`aria-valuemax` on their own; `aria-valuenow` is the
    // one value Base UI sets explicitly, since it changes as the thumb moves.
    await expect(slider).toHaveAttribute('min', '10');
    await expect(slider).toHaveAttribute('max', '90');
    await expect(slider).toHaveAttribute('aria-valuenow', '40');
};

/** Arrow keys step the value; Home and End jump to the span's ends. */
export const Keyboard = () => {
    const [value, setValue] = useState(50);
    return (
        <div style={{ maxWidth: 'var(--size-4000)' }}>
            <Range id="range-keyboard" label="Keyboard" value={value} onChange={setValue} />
        </div>
    );
};
Keyboard.parameters = { docs: { disable: true } };
Keyboard.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slider = canvas.getByRole('slider', { name: 'Keyboard' });

    slider.focus();
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(slider).toHaveAttribute('aria-valuenow', '51'));

    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    await waitFor(() => expect(slider).toHaveAttribute('aria-valuenow', '49'));

    await userEvent.keyboard('{End}');
    await waitFor(() => expect(slider).toHaveAttribute('aria-valuenow', '100'));

    await userEvent.keyboard('{Home}');
    await waitFor(() => expect(slider).toHaveAttribute('aria-valuenow', '0'));
};

/** One story per state, for the Examples tab. */
const frame = { maxWidth: 'var(--size-4000)' };
const thumbOf = (canvasElement) => canvasElement.querySelector('.plus-form-range-thumb');

export const Rest = {
    render: () => (
        <div style={frame}>
            <Range id="range-ex-rest" label="Zoom" defaultValue={40} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const thumb = thumbOf(canvasElement);
        await expect(getComputedStyle(thumb).backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-selected-bold'));
        await expect(within(canvasElement).getByRole('slider', { name: 'Zoom' }).value).toBe('40');
    },
};

export const Hovered = {
    render: () => (
        <div style={frame}>
            <Range id="range-ex-hover" label="Zoom" defaultValue={40} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const thumb = thumbOf(canvasElement);
        thumb.style.transition = 'none';
        const fill = withForcedPseudo(thumb, ':hover', () => getComputedStyle(thumb).backgroundColor);
        await expect(fill).toBe(tokenColor(canvasElement, '--ds-background-selected-bold-hovered'));
    },
};

/** Dragging reads the same as hover: the thumb is being held. */
export const Pressed = {
    render: () => (
        <div style={frame}>
            <Range id="range-ex-pressed" label="Zoom" defaultValue={40} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const thumb = thumbOf(canvasElement);
        thumb.style.transition = 'none';
        thumb.setAttribute('data-dragging', '');
        await expect(getComputedStyle(thumb).backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-selected-bold-hovered'));
        thumb.removeAttribute('data-dragging');
    },
};

export const Focused = {
    render: () => (
        <div style={frame}>
            <Range id="range-ex-focus" label="Zoom" defaultValue={40} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const thumb = thumbOf(canvasElement);
        thumb.style.transition = 'none';
        within(canvasElement).getByRole('slider', { name: 'Zoom' }).focus({ focusVisible: true });
        const style = getComputedStyle(thumb);
        await waitFor(() => expect(style.outlineStyle).toBe('solid'));
        await expect(px(style.outlineWidth)).toBe(2);
        await expect(style.outlineColor).toBe(tokenColor(canvasElement, '--ds-border-focused'));
        document.activeElement.blur();
    },
};

export const DisabledState = {
    render: () => (
        <div style={frame}>
            <Range id="range-ex-disabled" label="Zoom" defaultValue={40} isDisabled />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const thumb = thumbOf(canvasElement);
        await expect(within(canvasElement).getByRole('slider', { name: 'Zoom' }).disabled).toBe(true);
        await expect(getComputedStyle(thumb).backgroundColor).toBe(tokenColor(canvasElement, '--ds-icon-disabled'));
    },
};
