import React, { useEffect, useState } from 'react';
import { expect, fireEvent, waitFor, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import Range from './Range';

export default {
    title: 'Components/Forms and inputs/Range',
    component: Range,
    tags: ['!dev', '!autodocs'],
    parameters: {
        changelog: [
            { date: '2026-11-03', kind: 'changed', summary: 'Props follow Atlassian: `isDisabled`, and `onChange` receives the new value as a number, then the event. One size, a 32 control with a 4 track and a 20 thumb. The fill, thumb and disabled state use the named tokens; focus is the 2px ring on `border.focused`.' },
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
            description: 'Current slider value',
            table: { category: 'Content' },
        },
        min: {
            control: 'number',
            description: 'Minimum slider value',
            table: { category: 'Behavior' },
        },
        max: {
            control: 'number',
            description: 'Maximum slider value',
            table: { category: 'Behavior' },
        },
        step: {
            control: 'number',
            description: 'Slider increment',
            table: { category: 'Behavior' },
        },
        isDisabled: {
            control: 'boolean',
            description: 'Disable the slider',
            table: { category: 'Behavior' },
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
        <div style={{ maxWidth: '600px' }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-lg)', maxWidth: '600px' }}>
        <Range id="range-visible" label="Zoom" defaultValue={30}/>
        <Range id="range-hidden" label="Brightness" showLabel={false} defaultValue={70}/>
    </div>
);

/** The thumb at the start, the middle and the end of the span. */
export const Positions = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-lg)', maxWidth: '600px' }}>
        <Range id="range-start" label="At the start" defaultValue={0}/>
        <Range id="range-middle" label="In the middle" defaultValue={50}/>
        <Range id="range-end" label="At the end" defaultValue={100}/>
    </div>
);

/** Disabled takes the disabled fill on the track and the thumb. */
export const Disabled = () => (
    <div style={{ maxWidth: '600px' }}>
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
        <div style={{ maxWidth: '600px' }}>
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

/** `onChange` receives the value as a number, then the event. */
export const ReportsNumber = () => {
    const [value, setValue] = useState(50);
    const [seen, setSeen] = useState('none');

    return (
        <div style={{ maxWidth: '600px' }}>
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
