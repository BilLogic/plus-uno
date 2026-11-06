import React from 'react';
import { expectNoStateChange, expectNotAControl } from '@/storybook-docs/lib/label-states.js';
import { expect, within } from 'storybook/test';
import Button from '@/components/forms-and-inputs/Button';
import PageHeader from '@/components/layout-and-structure/PageHeader';

export default {
    title: 'Components/Layout and structure/Page header',
    component: PageHeader,
    tags: ['!dev', '!autodocs'],
};

export const Basic = () => <PageHeader title="Session plans" id="page-header-basic" />;

Basic.play = async ({ canvasElement }) => {
    const node = canvasElement.querySelector('#page-header-basic');
    await expect(node.querySelector('h2')).toHaveTextContent('Session plans');
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

WithBreadcrumbsActionsAndBottomBar.play = async ({ canvasElement }) => {
    const node = canvasElement.querySelector('#page-header-full');
    await expect(node.querySelector('.plus-page-header-breadcrumbs')).toHaveTextContent('Students / Ari');
    await expect(node.querySelector('.plus-page-header-actions')).toHaveTextContent('Schedule');
    await expect(node.querySelector('.plus-page-header-bottom-bar')).toHaveTextContent('Next session: Thursday');
};

export const DisableTitleStyles = () => (
    <PageHeader id="page-header-disabled" title="Custom-styled title" disableTitleStyles />
);

DisableTitleStyles.play = async ({ canvasElement }) => {
    const node = canvasElement.querySelector('#page-header-disabled');
    await expect(node.querySelector('h2')).toBeNull();
};

export const Interactive = {
    args: { title: 'Page title' },
    render: (args) => <PageHeader {...args} />,
};

/* ------------------------------------------------------------------- states */


const Subject = (props) => <PageHeader title="Session plans" actions={<Button appearance="primary" text="Schedule" />} {...props} />;
const root = (canvasElement) => canvasElement.firstElementChild;

/** Rest: page header. */
export const Rest = {
    render: () => <Subject />,
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByRole('heading', { level: 2 })).toHaveTextContent('Session plans');
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
