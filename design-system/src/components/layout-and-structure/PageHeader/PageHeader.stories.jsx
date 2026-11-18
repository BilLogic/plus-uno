import React from 'react';
import { expectNoStateChange, expectNotAControl } from '@/storybook-docs/lib/label-states.js';
import { expect } from 'storybook/test';
import { Button, PageHeader } from '@/components';

export default {
    title: 'Components/Layout and structure/Page header',
    component: PageHeader,
    tags: ['!dev', '!autodocs'],
};

export const Basic = () => <PageHeader title="Session plans" id="page-header-basic" />;

Basic.play = async ({ canvas }) => {
    const heading = canvas.getByRole('heading', { level: 1, name: 'Session plans' });
    await expect(heading).toHaveAttribute('data-size', 'large');
};

export const SecondaryLevel = () => (
    <PageHeader id="page-header-h2" title="Section overview" titleAs="h2" />
);

SecondaryLevel.play = async ({ canvas }) => {
    const heading = canvas.getByRole('heading', { level: 2, name: 'Section overview' });
    await expect(heading).toHaveAttribute('data-size', 'large');
};

export const WithBreadcrumbsActionsAndBottomBar = () => (
    <PageHeader
        id="page-header-full"
        breadcrumbs={<span>Students / Ari</span>}
        title="Ari Patel"
        actions={<Button appearance="primary" text="Schedule" />}
        bottomBar={<span>Next session: Thursday</span>}
    />
);

WithBreadcrumbsActionsAndBottomBar.play = async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole('heading', { level: 1, name: 'Ari Patel' })).toBeInTheDocument();
    const node = canvasElement.querySelector('#page-header-full');
    await expect(node.querySelector('.plus-page-header-breadcrumbs')).toHaveTextContent('Students / Ari');
    await expect(node.querySelector('.plus-page-header-actions')).toHaveTextContent('Schedule');
    await expect(node.querySelector('.plus-page-header-bottom-bar')).toHaveTextContent('Next session: Thursday');
};

export const DisableTitleStyles = () => (
    <PageHeader id="page-header-disabled" title="Custom-styled title" disableTitleStyles />
);

DisableTitleStyles.play = async ({ canvas }) => {
    await expect(canvas.queryByRole('heading')).toBeNull();
    await expect(canvas.getByText('Custom-styled title')).toBeInTheDocument();
};

export const Interactive = {
    args: { title: 'Session plans' },
    render: (args) => <PageHeader {...args} />,
};

/* ------------------------------------------------------------------- states */


const Subject = (props) => <PageHeader title="Session plans" actions={<Button appearance="primary" text="Schedule" />} {...props} />;
const root = (canvasElement) => canvasElement.firstElementChild;

/** Rest: page header. */
export const Rest = {
    render: () => <Subject />,
    play: async ({ canvas, canvasElement }) => {
        await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('Session plans');
        await expect(root(canvasElement).tagName).toBe('HEADER');
    },
};

/** Hovered: a display component has no hover layer, so nothing moves. */
export const Hovered = {
    render: () => <Subject />,
    play: async ({ canvasElement }) => {
        await expectNoStateChange(root(canvasElement), ':hover', 'page header');
    },
};

/** Pressed: no pressed layer either. */
export const Pressed = {
    render: () => <Subject />,
    play: async ({ canvasElement }) => {
        await expectNoStateChange(root(canvasElement), ':active', 'page header');
    },
};

/** Focused: not a control, so Tab skips it. */
export const Focused = {
    render: () => <Subject />,
    play: async ({ canvasElement }) => {
        await expectNotAControl(root(canvasElement), 'page header');
    },
};
