import React from 'react';
import { expectNoStateChange, expectNotAControl } from '@/storybook-docs/lib/label-states.js';
import { expect, within } from 'storybook/test';
import { tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { Button, Panel as PanelContainer, PanelActionGroup, PanelBackAction, PanelBody, PanelCloseAction, PanelDisclaimer, PanelFooter, PanelHeader, PanelMoreAction, PanelProvider, PanelSubheader } from '@/components';

export default {
    title: 'Components/Layout and structure/Panel',
    component: PanelContainer,
    tags: ['!dev', '!autodocs'],
};

export const FullComposition = () => (
    <PanelContainer width={'360px' /* token gap: 360px */} id="panel-full">
        <PanelHeader
            backAction={<PanelBackAction />}
            title="Session details"
            actions={<PanelActionGroup><PanelMoreAction /><PanelCloseAction /></PanelActionGroup>}
        />
        <PanelSubheader>Thursday, 4:00 PM</PanelSubheader>
        <PanelBody>Review warm-up problems and practice goals before Thursday's math session.</PanelBody>
        <PanelFooter>
            <PanelDisclaimer>Changes save automatically.</PanelDisclaimer>
            <Button appearance="primary" text="Done" />
        </PanelFooter>
    </PanelContainer>
);

FullComposition.play = async ({ canvasElement }) => {
    const panel = canvasElement.querySelector('#panel-full');
    await expect(getComputedStyle(panel).width).toBe('360px');
    await expect(panel.querySelector('.plus-panel-header-title')).toHaveTextContent('Session details');
    await expect(panel.querySelector('.plus-panel-footer')).toHaveTextContent('Done');
};

export const MinimalHeaderAndBody = () => (
    <PanelContainer id="panel-minimal">
        <PanelHeader title="Quick notes" />
        <PanelBody>Worked through two-step equations and checked three exit-ticket problems.</PanelBody>
    </PanelContainer>
);

export const WidthFromProvider = () => (
    <PanelProvider defaultWidth="var(--width-3000)">
        <PanelContainer id="panel-provider-width">
            <PanelHeader title="Wide panel" />
            <PanelBody>Session notes and lesson materials adapt to the PanelProvider width.</PanelBody>
        </PanelContainer>
    </PanelProvider>
);

WidthFromProvider.play = async ({ canvasElement }) => {
    const panel = canvasElement.querySelector('#panel-provider-width');
    await expect(getComputedStyle(panel).width).toBe('480px');
};

/** Interactive playground: change the width, title and body from the table. */
export const Interactive = {
    args: {
        width: '360px',
        title: 'Session details',
        body: "Review warm-up problems and practice goals before Thursday's math session.",
    },
    argTypes: {
        width: { control: 'text' },
        title: { control: 'text', table: { disable: true } },
        body: { control: 'text', table: { disable: true } },
        className: { table: { disable: true } },
        children: { table: { disable: true } },
    },
    render: ({ width, title, body }) => (
        <PanelContainer width={width}>
            <PanelHeader title={title} actions={<PanelActionGroup><PanelCloseAction /></PanelActionGroup>} />
            <PanelBody>{body}</PanelBody>
        </PanelContainer>
    ),
};

/* ------------------------------------------------------------------- states */


const Subject = (props) => (
    <PanelContainer width={'360px' /* token gap: 360px */} {...props}>
        <PanelHeader title="Session details" actions={<PanelActionGroup><PanelCloseAction /></PanelActionGroup>} />
        <PanelBody>Review warm-up problems and practice goals before Thursday's math session.</PanelBody>
    </PanelContainer>
);
const root = (canvasElement) => canvasElement.firstElementChild;

/** Rest: panel. */
export const Rest = {
    render: () => <Subject />,
    play: async ({ canvasElement }) => {
        await expect(getComputedStyle(root(canvasElement)).width).toBe('360px');
        await expect(getComputedStyle(root(canvasElement)).backgroundColor, 'a standalone Panel sits on the page ground').toBe(tokenColor(canvasElement, '--ds-surface'));
        await expect(within(canvasElement).getByText('Session details')).toBeVisible();
    },
};

/** Hovered: a display component has no hover layer, so nothing moves. */
export const Hovered = {
    render: () => <Subject />,
    play: async ({ canvasElement }) => {
        await expectNoStateChange(root(canvasElement), ':hover', 'panel');
    },
};

/** Pressed: no pressed layer either. */
export const Pressed = {
    render: () => <Subject />,
    play: async ({ canvasElement }) => {
        await expectNoStateChange(root(canvasElement), ':active', 'panel');
    },
};

/** Focused: not a control, so Tab skips it. */
export const Focused = {
    render: () => <Subject />,
    play: async ({ canvasElement }) => {
        await expectNotAControl(root(canvasElement), 'panel');
    },
};
