import React from 'react';
import { expectNoStateChange, expectNotAControl } from '@/storybook-docs/lib/label-states.js';
import { expect, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import { tokenLength } from '@/storybook-docs/lib/style-probes.js';
import { emulateReducedMotion } from '@/storybook-docs/lib/test-viewport.js';
import Spinner, { SPINNER_APPEARANCES, SPINNER_SIZES } from './Spinner';

export default {
    title: 'Components/Loading/Spinner',
    component: Spinner,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        size: { control: 'select', options: SPINNER_SIZES, description: 'A pixel diameter', table: { category: 'Design' } },
        appearance: {
            control: 'select',
            options: SPINNER_APPEARANCES,
            description: 'inherit takes the surrounding text color; invert is for a bold background',
            table: { category: 'Design' },
        },
        label: { table: { disable: true, category: 'Development' } },
        className: { control: false, table: { disable: true, category: 'Development' } },
    },
};

const row = { display: 'flex', gap: '24px', alignItems: 'center' };

export const Overview = () => <Spinner />;
Overview.parameters = {
    docs: { source: { language: 'jsx', code: webAppSourceSnippets.spinner } },
};

export const Sizes = {
    render: () => (
        <div style={row}>
            {SPINNER_SIZES.map((size) => <Spinner key={size} size={size} />)}
        </div>
    ),
    play: async ({ canvasElement }) => {
        // Each size reads a size-scale token and keeps its pixel value.
        const scale = { 16: '--size-100', 24: '--size-150', 48: '--size-300' };
        for (const el of canvasElement.querySelectorAll('.plus-spinner')) {
            const size = Number(el.dataset.size);
            await expect(el.getBoundingClientRect().width, `size ${size}`).toBe(size);
            await expect(tokenLength(canvasElement, scale[size]), `size ${size} token`).toBe(size);
        }
    },
};

/** One story per `size` value. */
export const Size16 = () => <Spinner size={16} />;

export const Size24 = () => <Spinner size={24} />;

export const Size48 = () => <Spinner size={48} />;

export const Invert = () => (
    <div style={{ padding: '16px', background: 'var(--ds-background-brand-bold)', borderRadius: 'var(--radius-md)' }}>
        <Spinner appearance="invert" />
    </div>
);

export const Interactive = {
    args: { size: 24, appearance: 'inherit', label: 'Loading' },
    render: (args) => <Spinner {...args} />,
};

Interactive.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const spinner = canvas.getByRole('status');
    await expect(spinner).toHaveTextContent('Loading');
};

/* ------------------------------------------------------------------- states */


const Subject = (props) => <Spinner {...props} />;
const root = (canvasElement) => canvasElement.firstElementChild;

/** Rest: spinner. */
export const Rest = {
    render: () => <Subject />,
    play: async ({ canvasElement }) => {
        const el = root(canvasElement);
        await expect(el).toHaveAttribute('role', 'status');
        await expect(el).toHaveAttribute('data-size', '24');
        await expect(within(canvasElement).getByText('Loading')).toBeInTheDocument();
    },
};

/** Hovered: a display component has no hover layer, so nothing moves. */
export const Hovered = {
    render: () => <Subject />,
    play: async ({ canvasElement }) => {
        await expectNoStateChange(root(canvasElement), ':hover', 'spinner');
    },
};

/** Pressed: no pressed layer either. */
export const Pressed = {
    render: () => <Subject />,
    play: async ({ canvasElement }) => {
        await expectNoStateChange(root(canvasElement), ':active', 'spinner');
    },
};

/** Focused: not a control, so Tab skips it. */
export const Focused = {
    render: () => <Subject />,
    play: async ({ canvasElement }) => {
        await expectNotAControl(root(canvasElement), 'spinner');
    },
};

/** Reduced motion: the ring holds still and the label still names the wait. */
export const ReducedMotion = () => <Spinner />;
// Only this story touches the motion preference; the cleanup restores it even when the play fails.
ReducedMotion.beforeEach = async () => async () => {
    await emulateReducedMotion(null);
};
ReducedMotion.play = async ({ canvasElement }) => {
    const spinner = within(canvasElement).getByRole('status');
    await expect(getComputedStyle(spinner).animationName, 'turns at rest').toBe('plus-spinner-rotate');
    if (!(await emulateReducedMotion('reduce'))) return;
    await expect(getComputedStyle(spinner).animationName, 'still under reduced motion').toBe('none');
    await expect(spinner).toHaveTextContent('Loading');
};
