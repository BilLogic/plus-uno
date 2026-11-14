import React from 'react';
import { expectNoStateChange, expectNotAControl } from '@/storybook-docs/lib/label-states.js';
import { probe, px, tokenLength } from '@/storybook-docs/lib/style-probes.js';
import { emulateReducedMotion } from '@/storybook-docs/lib/test-viewport.js';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import { expect, within } from 'storybook/test';
import ProgressRing, { PROGRESS_RING_APPEARANCES, PROGRESS_RING_SIZES } from './ProgressRing';

export default {
    title: 'Components/Loading/Progress ring',
    component: ProgressRing,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        value: {
            control: { type: 'range', min: 0, max: 100 },
            description: 'Percent complete, from 0 to 100',
            table: { category: 'Content' },
        },
        size: {
            control: 'select',
            options: PROGRESS_RING_SIZES,
            description: 'Diameter in pixels: 16, 20 or 24',
            table: { category: 'Design' },
        },
        appearance: {
            control: 'select',
            options: PROGRESS_RING_APPEARANCES,
            description: 'default draws a brand fill on a neutral track; inverse reads on a bold background',
            table: { category: 'Design' },
        },
        label: {
            control: 'text',
            description: 'Accessible name describing what the ring measures',
            table: { category: 'Content' },
        },
        className: { control: false, table: { disable: true, category: 'Development' } },
        id: { control: false, table: { disable: true, category: 'Development' } },
    },
};

const row = { display: 'flex', gap: 'var(--inline-lg)', alignItems: 'center' };

export const Overview = () => (
    <ProgressRing value={64} label="Uploading session recording" />
);
Overview.parameters = {
    docs: { source: { language: 'jsx', code: webAppSourceSnippets.progressRing } },
};

export const Default = {
    render: () => <ProgressRing value={64} appearance="default" label="Uploading session recording" />,
    play: async ({ canvasElement }) => {
        const ring = within(canvasElement).getByRole('progressbar', { name: 'Uploading session recording' });
        const svg = ring.querySelector('.plus-progress-ring__svg');
        const track = ring.querySelector('.plus-progress-ring__track');
        const fill = ring.querySelector('.plus-progress-ring__fill');

        await expect(getComputedStyle(svg).transform).toBe(probe(canvasElement, 'transform', 'rotate(-90deg)'));
        await expect(getComputedStyle(track).stroke).toBe(probe(canvasElement, 'stroke', 'var(--ds-background-neutral)'));
        await expect(getComputedStyle(fill).stroke).toBe(probe(canvasElement, 'stroke', 'var(--ds-background-brand-bold)'));
        await expect(px(getComputedStyle(fill).strokeWidth)).toBe(tokenLength(canvasElement, '--progress-ring-stroke'));
        await expect(px(getComputedStyle(fill).strokeWidth)).toBe(2);
        await expect(getComputedStyle(fill).strokeLinecap).toBe('round');
    },
};

export const Inverse = {
    render: () => (
        <div style={{ display: 'inline-flex', padding: 'var(--pad-y-lg) var(--pad-x-md)', background: 'var(--ds-background-brand-bold)', borderRadius: 'var(--radius-md)' }}>
            <ProgressRing value={64} appearance="inverse" label="Uploading session recording" />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const ring = within(canvasElement).getByRole('progressbar', { name: 'Uploading session recording' });
        const track = ring.querySelector('.plus-progress-ring__track');
        const fill = ring.querySelector('.plus-progress-ring__fill');

        await expect(getComputedStyle(track).stroke).toBe(probe(canvasElement, 'stroke', 'var(--ds-background-inverse-subtle)'));
        await expect(getComputedStyle(fill).stroke).toBe(probe(canvasElement, 'stroke', 'var(--ds-icon-inverse)'));
    },
};

export const Zero = {
    render: () => <ProgressRing value={0} label="0% uploaded" />,
    play: async ({ canvasElement }) => {
        const ring = within(canvasElement).getByRole('progressbar', { name: '0% uploaded' });
        const fill = ring.querySelector('.plus-progress-ring__fill');
        await expect(ring).toHaveAttribute('aria-valuenow', '0');
        await expect(ring).toHaveAttribute('aria-valuemin', '0');
        await expect(ring).toHaveAttribute('aria-valuemax', '100');
        await expect(fill).toHaveAttribute('stroke-dashoffset', '100');
        await expect(getComputedStyle(fill).opacity).toBe('0');
    },
};

export const Partial = {
    render: () => <ProgressRing value={64} label="64% uploaded" />,
    play: async ({ canvasElement }) => {
        const ring = within(canvasElement).getByRole('progressbar', { name: '64% uploaded' });
        const fill = ring.querySelector('.plus-progress-ring__fill');
        await expect(ring).toHaveAttribute('aria-valuenow', '64');
        await expect(fill).toHaveAttribute('stroke-dashoffset', '36');
        await expect(getComputedStyle(fill).opacity).toBe('1');
    },
};

export const Complete = {
    render: () => <ProgressRing value={100} label="100% uploaded" />,
    play: async ({ canvasElement }) => {
        const ring = within(canvasElement).getByRole('progressbar', { name: '100% uploaded' });
        const fill = ring.querySelector('.plus-progress-ring__fill');
        await expect(ring).toHaveAttribute('aria-valuenow', '100');
        await expect(fill).toHaveAttribute('stroke-dashoffset', '0');
    },
};

export const Values = {
    render: () => (
        <div style={row}>
            <ProgressRing value={0} label="0% uploaded" />
            <ProgressRing value={40} label="40% uploaded" />
            <ProgressRing value={100} label="100% uploaded" />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('progressbar', { name: '0% uploaded' })).toHaveAttribute('aria-valuenow', '0');
        await expect(canvas.getByRole('progressbar', { name: '40% uploaded' })).toHaveAttribute('aria-valuenow', '40');
        await expect(canvas.getByRole('progressbar', { name: '100% uploaded' })).toHaveAttribute('aria-valuenow', '100');
    },
};

export const Sizes = {
    render: () => (
        <div style={row}>
            {PROGRESS_RING_SIZES.map((size) => (
                <ProgressRing key={size} value={64} size={size} label={`Size ${size}`} />
            ))}
        </div>
    ),
    play: async ({ canvasElement }) => {
        const scale = { 16: '--icon-md', 20: '--image-xs', 24: '--icon-lg' };
        for (const el of canvasElement.querySelectorAll('.plus-progress-ring')) {
            const size = Number(el.dataset.size);
            const rect = el.getBoundingClientRect();
            await expect(rect.width, `size ${size} width`).toBe(size);
            await expect(rect.height, `size ${size} height`).toBe(size);
            await expect(tokenLength(canvasElement, scale[size]), `size ${size} token`).toBe(size);
            const fill = el.querySelector('.plus-progress-ring__fill');
            await expect(px(getComputedStyle(fill).strokeWidth), `size ${size} stroke`).toBe(2);
        }
    },
};

export const Size16 = () => <ProgressRing value={64} size={16} label="Uploading session recording" />;

export const Size20 = () => <ProgressRing value={64} size={20} label="Uploading session recording" />;

export const Size24 = () => <ProgressRing value={64} size={24} label="Uploading session recording" />;

export const WithInlineText = () => (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--inline-md)' }}>
        <ProgressRing value={64} label="Uploading session recording, 64%" />
        <span className="body-small">Uploading · 64%</span>
    </div>
);

export const OutOfRangeValuesAreClamped = {
    render: () => (
        <div style={row}>
            <ProgressRing value={-20} label="Under" />
            <ProgressRing value={40} label="Within" />
            <ProgressRing value={140} label="Over" />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        const under = canvas.getByRole('progressbar', { name: 'Under' });
        await expect(under).toHaveAttribute('aria-valuenow', '0');
        await expect(under.querySelector('.plus-progress-ring__fill')).toHaveAttribute('stroke-dashoffset', '100');

        const within40 = canvas.getByRole('progressbar', { name: 'Within' });
        await expect(within40).toHaveAttribute('aria-valuenow', '40');
        await expect(within40.querySelector('.plus-progress-ring__fill')).toHaveAttribute('stroke-dashoffset', '60');

        const over = canvas.getByRole('progressbar', { name: 'Over' });
        await expect(over).toHaveAttribute('aria-valuenow', '100');
        await expect(over.querySelector('.plus-progress-ring__fill')).toHaveAttribute('stroke-dashoffset', '0');
    },
};

export const Interactive = {
    args: {
        value: 64,
        size: 20,
        appearance: 'default',
        label: 'Uploading session recording',
    },
    render: (args) => <ProgressRing {...args} />,
    play: async ({ canvasElement }) => {
        const ring = within(canvasElement).getByRole('progressbar', { name: 'Uploading session recording' });
        await expect(ring).toHaveAttribute('aria-valuenow', '64');
        await expect(ring).toHaveAttribute('data-size', '20');
    },
};

/* ------------------------------------------------------------------- states */

const Subject = (props) => <ProgressRing value={64} label="Uploading session recording" {...props} />;
const root = (canvasElement) => canvasElement.firstElementChild;

/** Rest: determinate ring at 64%. */
export const Rest = {
    render: () => <Subject />,
    play: async ({ canvasElement }) => {
        const ring = within(canvasElement).getByRole('progressbar', { name: 'Uploading session recording' });
        await expect(ring).toHaveAttribute('aria-valuenow', '64');
        await expect(ring).toHaveAttribute('data-size', '20');
    },
};

/** Hovered: a display component has no hover layer, so nothing moves. */
export const Hovered = {
    render: () => <Subject />,
    play: async ({ canvasElement }) => {
        await expectNoStateChange(root(canvasElement), ':hover', 'progress ring');
    },
};

/** Pressed: no pressed layer either. */
export const Pressed = {
    render: () => <Subject />,
    play: async ({ canvasElement }) => {
        await expectNoStateChange(root(canvasElement), ':active', 'progress ring');
    },
};

/** Focused: not a control, so Tab skips it. */
export const Focused = {
    render: () => <Subject />,
    play: async ({ canvasElement }) => {
        await expectNotAControl(root(canvasElement), 'progress ring');
    },
};

/** Reduced motion: value changes step immediately with no stroke transition. */
export const ReducedMotion = () => <Subject />;
ReducedMotion.beforeEach = async () => async () => {
    await emulateReducedMotion(null);
};
ReducedMotion.play = async ({ canvasElement }) => {
    const ring = within(canvasElement).getByRole('progressbar', { name: 'Uploading session recording' });
    const fill = ring.querySelector('.plus-progress-ring__fill');
    if (!(await emulateReducedMotion('reduce'))) return;
    await expect(getComputedStyle(fill).transitionProperty, 'no transition under reduced motion').toBe('none');
    await expect(ring).toHaveAttribute('aria-valuenow', '64');
};
