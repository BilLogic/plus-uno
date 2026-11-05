import React from 'react';
import { expect } from 'storybook/test';
import Button from '@/components/forms-and-inputs/Button';
import PanelContainer, {
    PanelActionGroup, PanelBackAction, PanelBody, PanelCloseAction, PanelDisclaimer,
    PanelFooter, PanelHeader, PanelMoreAction, PanelProvider, PanelSubheader,
} from '@/components/layout-and-structure/Panel';

export default {
    title: 'Foundations/Patterns/Panel',
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
