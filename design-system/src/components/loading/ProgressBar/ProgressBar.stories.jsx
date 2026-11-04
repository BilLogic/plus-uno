import React from 'react';
import { expect, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import ProgressBar, { PROGRESS_BAR_APPEARANCES } from './ProgressBar';

export default {
    title: 'Components/Loading/Progress bar',
    component: ProgressBar,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        value: { control: { type: 'range', min: 0, max: 100 }, description: 'A percent, 0 to 100', table: { category: 'Content' } },
        appearance: {
            control: 'select',
            options: PROGRESS_BAR_APPEARANCES,
            description: 'success marks completion; inverse reads on a bold background',
            table: { category: 'Design' },
        },
        isIndeterminate: { control: 'boolean', description: 'The duration is unknown', table: { category: 'Behavior' } },
        ariaLabel: { table: { disable: true, category: 'Development' } },
        className: { control: false, table: { disable: true, category: 'Development' } },
    },
};

const col = { display: 'flex', flexDirection: 'column', gap: '16px' };

export const Overview = () => (
    <div style={{ width: '100%', minWidth: '200px', maxWidth: '100%' }}>
        <ProgressBar value={50} />
    </div>
);
Overview.parameters = {
    docs: { source: { language: 'jsx', code: webAppSourceSnippets.progressBar } },
};

export const Appearances = () => (
    <div style={col}>
        <ProgressBar value={60} appearance="default" />
        <ProgressBar value={100} appearance="success" />
        <div style={{ padding: '16px', background: 'var(--ds-background-brand-bold)', borderRadius: 'var(--radius-md)' }}>
            <ProgressBar value={60} appearance="inverse" />
        </div>
    </div>
);

/** For a visible percent or description, put the text beside the bar — the bar's own 8px height has no room for it. */
export const WithACaption = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '240px' }}>
        <ProgressBar value={68} ariaLabel="68% of goals met" />
        <span className="body3-txt">68% of goals met</span>
    </div>
);

export const Indeterminate = () => <ProgressBar isIndeterminate ariaLabel="Loading" />;
Indeterminate.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bar = canvas.getByRole('progressbar', { name: 'Loading' });
    await expect(bar.getAttribute('aria-valuenow')).toBeNull();
    await expect(bar.getAttribute('aria-valuemax')).toBeNull();
};

export const Interactive = {
    args: {
        value: 50,
        appearance: 'default',
        isIndeterminate: false,
    },
    render: (args) => (
        <div style={{ width: '100%', minWidth: '200px', maxWidth: '480px' }}>
            <ProgressBar {...args} />
        </div>
    ),
};
