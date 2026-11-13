import React from 'react';
import { expect, waitFor, within } from 'storybook/test';
import { expectFocusRing } from '@/storybook-docs/lib/button-states.js';
import { expectNoStateChange } from '@/storybook-docs/lib/label-states.js';
import { tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import { Tooltip, Button } from '@/components';
import { DemoLabel } from '@/storybook-docs/lib/pattern-demo';

export default {
    title: 'Components/Overlays and layering/Tooltip',
    component: Tooltip,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        text: { control: 'text', description: 'Tooltip text', table: { category: 'Content' } },
        placement: {
            control: 'select',
            options: ['top', 'bottom', 'left', 'right'],
            description: 'Tooltip placement',
            table: { category: 'Design' },
        },
        id: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        delay: {
            table: { disable: true, category: 'Development' }
        },
        delayShow: {
            table: { disable: true, category: 'Development' }
        },
        flip: {
            table: { disable: true, category: 'Development' }
        }
    },
};

const containerStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    padding: 'var(--space-250) var(--space-125)',
    backgroundColor: 'var(--ds-surface)',
    borderRadius: 'var(--radius-075)',
    border: '1px solid var(--ds-border)',
};

const blockStyle = {
    margin: 'var(--space-250) var(--space-400)',
};

function TooltipVariantsDemos() {
    return (
        <div style={containerStyle}>
            <div style={blockStyle}>
                <DemoLabel>TOP</DemoLabel>
                <Tooltip text="Tooltip on top" placement="top" show={true}>
                    <Button appearance="primary" text="Top" />
                </Tooltip>
            </div>
            <div style={blockStyle}>
                <DemoLabel>BOTTOM</DemoLabel>
                <Tooltip text="Tooltip on bottom" placement="bottom" show={true}>
                    <Button appearance="primary" text="Bottom" />
                </Tooltip>
            </div>
            <div style={blockStyle}>
                <DemoLabel>LEFT</DemoLabel>
                <Tooltip text="Tooltip on left" placement="left" show={true}>
                    <Button appearance="primary" text="Left" />
                </Tooltip>
            </div>
            <div style={blockStyle}>
                <DemoLabel>RIGHT</DemoLabel>
                <Tooltip text="Tooltip on right" placement="right" show={true}>
                    <Button appearance="primary" text="Right" />
                </Tooltip>
            </div>
        </div>
    );
}

export const Placements = () => (
    <div style={{ marginBottom: 'var(--space-400)' }}>
        <TooltipVariantsDemos />
    </div>
);

const tooltipPlaygroundPadding = {
    padding: 'var(--space-150)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 'calc(var(--space-100) * 7.5)',
};

export const Interactive = {
    args: {
        text: 'Tooltip text',
        placement: 'top',
    },
    parameters: {
        controls: { exclude: ['show'] },
    },
    render: (args) => (
        <div style={tooltipPlaygroundPadding}>
            <Tooltip {...args}>
                <Button appearance="primary" text="Hover or focus me" />
            </Tooltip>
        </div>
    ),
};

export const Overview = {
    args: {
        text: 'Tooltip text',
        placement: 'top',
        show: true,
    },
    render: (args) => (
        <div style={tooltipPlaygroundPadding}>
            <Tooltip {...args}>
                <Button appearance="primary" text="Hover me" />
            </Tooltip>
        </div>
    ),
    parameters: {
        docs: {
            source: { language: 'jsx', code: webAppSourceSnippets.tooltip }
        }
    }
};

/** The tooltip portals out of the canvas, so the state stories read it from the document. */
const openTooltip = async (canvasElement) => {
    const doc = canvasElement.ownerDocument;
    await waitFor(() => expect(doc.querySelector('[role="tooltip"]')).not.toBeNull());
    return doc.querySelector('[role="tooltip"]');
};

const StateTooltip = () => (
    <div style={tooltipPlaygroundPadding}>
        <Tooltip text="Opens the session notes" show>
            <Button appearance="default" text="Notes" />
        </Tooltip>
    </div>
);

/** Rest: the inverse neutral fill with inverse text, no shadow. */
export const Rest = {
    render: () => <StateTooltip />,
    play: async ({ canvasElement }) => {
        const tip = await openTooltip(canvasElement);
        const style = getComputedStyle(tip);
        await expect(style.backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-neutral-bold'));
        await expect(style.color).toBe(tokenColor(canvasElement, '--ds-text-inverse'));
        await expect(style.boxShadow).toBe('none');
    },
};

/** Hovered: the tooltip itself does not react to a pointer. */
export const Hovered = {
    render: () => <StateTooltip />,
    play: async ({ canvasElement }) => {
        await expectNoStateChange(await openTooltip(canvasElement), ':hover', 'tooltip');
    },
};

/** Pressed: nothing changes under a press. */
export const Pressed = {
    render: () => <StateTooltip />,
    play: async ({ canvasElement }) => {
        await expectNoStateChange(await openTooltip(canvasElement), ':active', 'tooltip');
    },
};

/** Focused: the trigger shows the 2px ring; the tooltip is never a focus stop. */
export const Focused = {
    render: () => <StateTooltip />,
    play: async ({ canvasElement }) => {
        const tip = await openTooltip(canvasElement);
        await expectFocusRing(canvasElement, within(canvasElement).getByRole('button', { name: 'Notes' }), 'tooltip trigger');
        await expect(tip.getAttribute('tabindex')).not.toBe('0');
    },
};

/** Disabled: an empty `trigger` list turns the tooltip off, so nothing opens. */
export const Disabled = {
    render: () => (
        <div style={tooltipPlaygroundPadding}>
            <Tooltip text="Never shown" trigger={[]}>
                <Button appearance="default" text="Notes" />
            </Tooltip>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const button = within(canvasElement).getByRole('button', { name: 'Notes' });
        button.focus();
        await new Promise((resolve) => setTimeout(resolve, 500));
        await expect(canvasElement.ownerDocument.querySelector('[role="tooltip"]')).toBeNull();
    },
};

/** Where the tooltip opens, one story per side. It stays open so the page can show it. */
const PlacedTooltip = ({ placement }) => (
    <div style={tooltipPlaygroundPadding}>
        <Tooltip text="Opens the session notes" placement={placement} show>
            <Button appearance="default" text="Notes" />
        </Tooltip>
    </div>
);

export const PlacementTop = { render: () => <PlacedTooltip placement="top" /> };
export const PlacementBottom = { render: () => <PlacedTooltip placement="bottom" /> };
export const PlacementLeft = { render: () => <PlacedTooltip placement="left" /> };
export const PlacementRight = { render: () => <PlacedTooltip placement="right" /> };

/** A long line wraps past the maximum width. */
export const Wrapping = {
    render: () => (
        <div style={tooltipPlaygroundPadding}>
            <Tooltip text="Opens the session notes, with the goals, the topics covered and what to practice before the next lesson" show>
                <Button appearance="default" text="Notes" />
            </Tooltip>
        </div>
    ),
};
