import { withReducedMotion } from '@/storybook-docs/lib/overlay-motion-plays';
import { FigureRow } from '@/storybook-docs/ds-docs-layout.jsx';
import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { expectFocusRing } from '@/storybook-docs/lib/button-states.js';
import { expectNoStateChange } from '@/storybook-docs/lib/label-states.js';
import { tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import { Tooltip, Button, Popup, Link } from '@/components';
import { Do, Dont, DoDont } from '@/storybook-docs/foundation-blocks.jsx';
import { DemoLabel } from '@/storybook-docs/lib/template-demo';
import { DocsOverlayBoundary } from '@/storybook-docs/lib/docs-overlay-boundary.jsx';

export default {
    title: 'Components/Overlays and layering/Tooltip',
    component: Tooltip,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        children: { table: { disable: true } },
        onClick: {
            storyOnly: true,
            table: { disable: true },
        },
        style: {
            storyOnly: true,
            table: { disable: true },
        },
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
        delayShow: {
            table: { disable: true, category: 'Development' }
        }
    },
};

const containerStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    padding: '40px 20px' /* token gap: 40px vertical / 20px horizontal pad */,
    backgroundColor: 'var(--ds-surface)',
    borderRadius: 'var(--radius-xl)',
    border: 'var(--border-width-default) solid var(--ds-border)',
};

const blockStyle = {
    margin: 'var(--page-stack-lg) calc(var(--inline-xl) * 4)',
};

function TooltipVariantsDemos() {
    return (
        <div style={containerStyle}>
            <div style={blockStyle}>
                <DemoLabel>TOP</DemoLabel>
                <Tooltip text="Opens the session notes" placement="top" show={true}>
                    <Button appearance="primary" text="Session notes" />
                </Tooltip>
            </div>
            <div style={blockStyle}>
                <DemoLabel>BOTTOM</DemoLabel>
                <Tooltip text="Shares your availability" placement="bottom" show={true}>
                    <Button appearance="primary" text="Availability" />
                </Tooltip>
            </div>
            <div style={blockStyle}>
                <DemoLabel>LEFT</DemoLabel>
                <Tooltip text="Copies the invite link" placement="left" show={true}>
                    <Button appearance="primary" text="Invite link" />
                </Tooltip>
            </div>
            <div style={blockStyle}>
                <DemoLabel>RIGHT</DemoLabel>
                <Tooltip text="Shows student goals" placement="right" show={true}>
                    <Button appearance="primary" text="Student goals" />
                </Tooltip>
            </div>
        </div>
    );
}

export const Placements = () => (
    <div style={{ marginBottom: 'calc(var(--stack-xl) * 4)' /* 64px fixed demo clearance */ }}>
        <TooltipVariantsDemos />
    </div>
);

const tooltipPlaygroundPadding = {
    padding: 'var(--section-stack-lg)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 'var(--example-size-120)',
};

export const Interactive = {
    args: {
        text: 'Opens the session notes',
        placement: 'top',
    },
    parameters: {
        controls: { exclude: ['show'] },
    },
    render: (args) => (
        <div style={tooltipPlaygroundPadding}>
            <Tooltip {...args}>
                <Button appearance="primary" text="Session notes" />
            </Tooltip>
        </div>
    ),
};

export const Overview = {
    args: {
        text: 'Opens the session notes',
        placement: 'top',
        show: true,
    },
    render: (args) => (
        <div style={tooltipPlaygroundPadding}>
            <Tooltip {...args}>
                <Button appearance="primary" text="Session notes" />
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

// Open and close at the component seam, including retained exit and OS reduction.
const MotionTooltip = () => <Tooltip text="Session details" delayShow={0} delayHide={0}><Button text="Details" /></Tooltip>;
const tooltipMotionPlay = async ({ canvasElement }, reduced = false) => {
    const trigger = within(canvasElement).getByRole('button', { name: 'Details' });
    await userEvent.hover(trigger);
    const tooltip = await within(canvasElement.ownerDocument.body).findByRole('tooltip');
    if (!reduced) await expect(getComputedStyle(tooltip).animationName).toContain('plus-overlay-fade');
    if (reduced) await expect(getComputedStyle(tooltip).animationName).not.toContain('scale');
    await userEvent.unhover(trigger);
    if (!reduced) {
        await waitFor(() => expect(tooltip).toHaveAttribute('data-ending-style'));
        await expect(tooltip.isConnected).toBe(true);
    }
    await waitFor(() => expect(tooltip.isConnected).toBe(false));
};
export const MotionOpenClose = { render: MotionTooltip, play: tooltipMotionPlay };
export const MotionReduced = {
    render: MotionTooltip,
    decorators: [withReducedMotion],
    play: (context) => tooltipMotionPlay(context, true),
};

/** Say what the control does rather than repeating its visible label. */
export const SayWhatControlDoes = {
    render: () => (
        <DoDont>
            <Do caption="A few words on what the control does.">
                <DocsOverlayBoundary fit={false} containHeight>
                    <FigureRow>
                        <Tooltip text="Opens the session notes" placement="bottom" show>
                            <Button appearance="default" text="Notes" />
                        </Tooltip>
                    </FigureRow>
                </DocsOverlayBoundary>
            </Do>
            <Dont caption="Repeats the label the control already shows.">
                <DocsOverlayBoundary fit={false} containHeight>
                    <FigureRow>
                        <Tooltip text="Notes" placement="bottom" show>
                            <Button appearance="default" text="Notes" />
                        </Tooltip>
                    </FigureRow>
                </DocsOverlayBoundary>
            </Dont>
        </DoDont>
    ),
    play: async ({ canvas, canvasElement }) => {
        const doc = canvasElement.ownerDocument;
        await waitFor(() => expect(doc.querySelectorAll('[role="tooltip"]')).toHaveLength(2));
        await expect(canvas.getAllByRole('button', { name: 'Notes' })).toHaveLength(2);
    },
};

/** Keep tooltip copy to one short line in sentence case with no closing period. */
export const KeepToOneLine = {
    render: () => (
        <DoDont>
            <Do caption="One line, sentence case, no closing period.">
                <DocsOverlayBoundary fit={false} containHeight>
                    <FigureRow>
                        <Tooltip text="Moves this session out of the active list" placement="bottom" show>
                            <Button appearance="default" text="Archive" />
                        </Tooltip>
                    </FigureRow>
                </DocsOverlayBoundary>
            </Do>
            <Dont caption="Two sentences that wrap, with a closing period.">
                <DocsOverlayBoundary fit={false} containHeight>
                    <FigureRow>
                        <Tooltip
                            text="Moves this session out of the active list. You can bring it back later from the archive, and its notes stay with it."
                            placement="bottom"
                            show
                        >
                            <Button appearance="default" text="Archive" />
                        </Tooltip>
                    </FigureRow>
                </DocsOverlayBoundary>
            </Dont>
        </DoDont>
    ),
    play: async ({ canvas, canvasElement }) => {
        const doc = canvasElement.ownerDocument;
        await waitFor(() => expect(doc.querySelectorAll('[role="tooltip"]')).toHaveLength(2));
        await expect(canvas.getAllByRole('button', { name: 'Archive' })).toHaveLength(2);
    },
};

/** Put anything the user can click inside a Popup rather than a Tooltip. */
export const InteractiveContentInPopup = {
    render: () => (
        <DoDont>
            <Do caption="A popup holds content the user can reach.">
                <DocsOverlayBoundary fit={false} containHeight>
                    <FigureRow>
                        <Popup
                            trigger={<Button appearance="default" text="Scheduling" />}
                            title="Scheduling"
                            placement="bottom"
                            defaultShow
                            rootClose={false}
                        >
                            <Link href="#help">Read the guide</Link>
                        </Popup>
                    </FigureRow>
                </DocsOverlayBoundary>
            </Do>
            <Dont caption="A link in a tooltip: moving toward it leaves the trigger, and the tooltip hides.">
                <DocsOverlayBoundary fit={false} containHeight>
                    <FigureRow>
                        <Tooltip text={<TooltipLinkFigure />} placement="bottom" show>
                            <Button appearance="default" text="Scheduling" />
                        </Tooltip>
                    </FigureRow>
                </DocsOverlayBoundary>
            </Dont>
        </DoDont>
    ),
    play: async ({ canvas, canvasElement }) => {
        const doc = canvasElement.ownerDocument;
        await waitFor(() => expect(doc.querySelectorAll('[role="tooltip"]')).toHaveLength(1));
        await waitFor(() => expect(doc.querySelector('.plus-popup')).not.toBeNull());
        await expect(canvas.getAllByRole('button', { name: 'Scheduling' })).toHaveLength(2);
    },
};

/** The link a tooltip must not hold, on the tooltip's dark ground. */
const TooltipLinkFigure = () => <Link href="#help" appearance="inverse">Read the guide</Link>;
