import React from 'react';
import { expectNoStateChange, expectNotAControl } from '@/storybook-docs/lib/label-states.js';
import { expect, within } from 'storybook/test';
import Button from '@/components/forms-and-inputs/Button';
import PanelContainer, {
    PanelActionGroup, PanelBackAction, PanelBody, PanelCloseAction, PanelDisclaimer,
    PanelFooter, PanelHeader, PanelMoreAction, PanelProvider, PanelSubheader,
} from '@/components/layout-and-structure/Panel';

export default {
    title: 'Components/Layout and structure/Panel',
    component: PanelContainer,
    tags: ['!dev', '!autodocs'],
};

export const FullComposition = () => (
    <PanelContainer width="360px" id="panel-full">
        <PanelHeader
            backAction={<PanelBackAction />}
            title="Session details"
            actions={<PanelActionGroup><PanelMoreAction /><PanelCloseAction /></PanelActionGroup>}
        />
        <PanelSubheader>Thursday, 4:00 PM</PanelSubheader>
        <PanelBody>Panel body content goes here.</PanelBody>
        <PanelFooter>
            <PanelDisclaimer>Changes save automatically.</PanelDisclaimer>
            <Button appearance="primary" text="Done" />
        </PanelFooter>
    </PanelContainer>
);

FullComposition.play = async ({ canvasElement }) => {
    const panel = canvasElement.querySelector('#panel-full');
    await expect(panel.style.width).toBe('360px');
    await expect(panel.querySelector('.plus-panel-header-title')).toHaveTextContent('Session details');
    await expect(panel.querySelector('.plus-panel-footer')).toHaveTextContent('Done');
};

export const MinimalHeaderAndBody = () => (
    <PanelContainer id="panel-minimal">
        <PanelHeader title="Quick notes" />
        <PanelBody>Nothing else here.</PanelBody>
    </PanelContainer>
);

export const WidthFromProvider = () => (
    <PanelProvider defaultWidth="480px">
        <PanelContainer id="panel-provider-width">
            <PanelHeader title="Wide panel" />
            <PanelBody>Takes its width from PanelProvider.</PanelBody>
        </PanelContainer>
    </PanelProvider>
);

WidthFromProvider.play = async ({ canvasElement }) => {
    const panel = canvasElement.querySelector('#panel-provider-width');
    await expect(panel.style.width).toBe('480px');
};

/** Interactive playground: change the width, title and body from the table. */
export const Interactive = {
    args: {
        width: 'var(--panel-width-default)',
        title: 'Session details',
        body: 'Panel body content goes here.',
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
    <PanelContainer width="360px" {...props}>
        <PanelHeader title="Session details" actions={<PanelActionGroup><PanelCloseAction /></PanelActionGroup>} />
        <PanelBody>Panel body content goes here.</PanelBody>
    </PanelContainer>
);
const root = (canvasElement) => canvasElement.firstElementChild;

/** Rest: panel. */
export const Rest = {
    render: () => <Subject />,
    play: async ({ canvasElement }) => {
        await expect(root(canvasElement).style.width).toBe('360px');
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
