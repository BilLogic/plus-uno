import React from 'react';
import { expect, waitFor, within } from 'storybook/test';

import { probe, px } from '@/storybook-docs/lib/style-probes.js';
import { Flag, FlagGroup, Button } from '@/components';
import Popup from './Popup/Popup';
import Tooltip from './Tooltip/Tooltip';

/**
 * The Popups pattern: Popup, Flag and Tooltip. Menu's own behavior and size
 * cover lives on `DropdownMenu`'s own stories
 * (`Components/Forms and inputs/Dropdown menu`), since it draws from the
 * Menu family's own tokens rather than this page's older Popover numbers.
 *
 * Floating layers behave the same everywhere, and these stories hold them to
 * the Popups pattern page: popups auto 160 to 320 or a column step, padded 16,
 * tooltips 4 · 8 up to 240, flags 400 wide stacking 16 apart bottom-left, and
 * every one of them at least 8 from the screen edge, 4 from its trigger.
 *
 * Popups and tooltips portal out of the story canvas, so those queries run
 * against the document. Their triggers are plain `button`s: Popper measures
 * the trigger through a ref, and a host element is the one that is sure to
 * take one.
 */

export default {
    title: 'Components/Overlays and layering/Popups behavior',
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Behavior cover for the Popups pattern: menu rows and scrolling, popup '
                    + 'and tooltip sizes, flag stacking, and the 8 kept from the screen edge.',
            },
        },
    },
};

/** The document a portal renders into. */
const documentOf = (canvasElement) => canvasElement.ownerDocument;

/**
 * Open once the story has mounted. Popper measures the trigger through its
 * ref, which is only attached after the first render; a popover asked to show
 * on that first render has nothing to measure yet, so these stories open it
 * a beat later, the way a click would.
 */
function useOpenAfterMount() {
    const [open, setOpen] = React.useState(false);
    React.useEffect(() => { setOpen(true); }, []);
    return open;
}

// ---------------------------------------------------------------------------
// Popup
// ---------------------------------------------------------------------------

const popupIds = { auto: 'pf-popup-auto', '3-col': 'pf-popup-3-col', '4-col': 'pf-popup-4-col' };

export const PopupWidths = () => {
    const open = useOpenAfterMount();
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '200px', padding: '24px 600px 240px 24px' }}>
            {Object.entries(popupIds).map(([width, id]) => (
                <Popup
                    key={width}
                    id={id}
                    width={width}
                    triggerType="manual"
                    show={open}
                    placement="bottom-start"
                    title="Session notes"
                    trigger={<Button>{`Popup ${width}`}</Button>}
                >
                    Notes stay with the session.
                </Popup>
            ))}
        </div>
    );
};

PopupWidths.play = async ({ canvasElement }) => {
    const doc = documentOf(canvasElement);
    const widths = {};
    for (const [width, id] of Object.entries(popupIds)) {
        const popup = await waitFor(() => {
            const node = doc.getElementById(id);
            if (!node) throw new Error(`${id} not open`);
            return node;
        });
        widths[width] = popup.getBoundingClientRect().width;
        const style = getComputedStyle(popup);
        await expect(px(style.paddingTop)).toBe(16);
        await expect(px(style.paddingLeft)).toBe(16);
        await expect(px(style.borderTopLeftRadius)).toBe(12);
    }

    // Auto hugs one list inside 160 to 320; a column step is wider by a column.
    await expect(widths.auto).toBeGreaterThanOrEqual(160);
    await expect(widths.auto).toBeLessThanOrEqual(320);
    await expect(widths['4-col']).toBeGreaterThan(widths['3-col']);

    // One surface: the title is heading.xsmall 14/20 on the popup's own fill,
    // not a dark header bar.
    const popup = doc.getElementById(popupIds.auto);
    const title = within(popup).getByText('Session notes');
    await expect(getComputedStyle(title).fontSize).toBe('14px');
    await expect(getComputedStyle(title).lineHeight).toBe('20px');
    await expect(getComputedStyle(title).backgroundColor).toBe('rgba(0, 0, 0, 0)');

    // 4 from its trigger.
    const trigger = within(canvasElement).getByRole('button', { name: 'Popup auto' });
    await waitFor(() => expect(
        Math.round(popup.getBoundingClientRect().top - trigger.getBoundingClientRect().bottom),
    ).toBe(4));
};

export const PopupLayers = () => {
    const open = useOpenAfterMount();
    return (
        <div style={{ minHeight: '200px', padding: '24px' }}>
            <Popup
                id="pf-popup-page"
                triggerType="manual"
                show={open}
                placement="bottom-start"
                title="On the page"
                trigger={<Button>Page popup</Button>}
            >
                Notes stay with the session.
            </Popup>
            <div className="plus-pattern-blanket" style={{ position: 'relative', display: 'block', zIndex: 'var(--layer-modal)' }}>
                <Popup
                    id="pf-popup-modal"
                    triggerType="manual"
                    show={open}
                    placement="bottom-start"
                    title="In a modal"
                    trigger={<Button>Modal popup</Button>}
                >
                    Notes stay with the session.
                </Popup>
            </div>
        </div>
    );
};

PopupLayers.play = async ({ canvasElement }) => {
    const doc = documentOf(canvasElement);
    const [page, inModal] = await waitFor(() => {
        const nodes = ['pf-popup-page', 'pf-popup-modal'].map((id) => doc.getElementById(id));
        if (nodes.some((n) => !n)) throw new Error('not open');
        return nodes;
    });
    const z = (token) => probe(canvasElement, 'zIndex', `var(${token})`, { position: 'relative' });
    // On the popup layer (400) from the page, not above toasts.
    await expect(getComputedStyle(page).zIndex, 'popup layer').toBe(z('--layer-popup'));
    // Opened from a modal it mounts in the modal's blanket and so rides its layer (510).
    await expect(inModal.closest('.plus-pattern-blanket'), 'mounted in the modal').not.toBeNull();
    await expect(getComputedStyle(inModal.closest('.plus-pattern-blanket')).zIndex, 'modal layer').toBe(z('--layer-modal'));
    await expect(getComputedStyle(inModal).zIndex, 'popup layer inside the modal').toBe(z('--layer-popup'));
};

export const PopupKeepsOffTheScreenEdge = () => {
    const open = useOpenAfterMount();
    return (
        <div style={{ position: 'fixed', top: '16px', left: 0 }}>
            <Popup
                id="pf-popup-edge"
                width="4-col"
                triggerType="manual"
                show={open}
                placement="bottom"
                trigger={<Button>Edge</Button>}
            >
                A wide popup opened from a trigger at the screen edge.
            </Popup>
        </div>
    );
};

PopupKeepsOffTheScreenEdge.play = async ({ canvasElement }) => {
    const doc = documentOf(canvasElement);
    await waitFor(() => {
        const popup = doc.getElementById('pf-popup-edge');
        if (!popup) throw new Error('not open');
        return expect(popup.getBoundingClientRect().left).toBeGreaterThanOrEqual(8);
    });
};

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------

export const TooltipSize = () => {
    const open = useOpenAfterMount();
    return (
        <div style={{ position: 'fixed', top: '48px', left: 0 }}>
            <Tooltip
                id="pf-tooltip"
                show={open}
                placement="bottom"
                text="Copies the session link so you can paste it into a message to the student's family"
            >
                <Button>Copy</Button>
            </Tooltip>
        </div>
    );
};

TooltipSize.play = async ({ canvasElement }) => {
    const doc = documentOf(canvasElement);
    const tooltip = await waitFor(() => {
        const node = doc.getElementById('pf-tooltip');
        if (!node) throw new Error('not open');
        return node;
    });
    const inner = tooltip;
    const style = getComputedStyle(inner);
    await expect(px(style.paddingTop)).toBe(4);
    await expect(px(style.paddingLeft)).toBe(8);
    await expect(px(style.borderTopLeftRadius)).toBe(6);
    await expect(style.fontSize).toBe('12px');
    await expect(style.lineHeight).toBe('16px');
    // It wraps past max-width-tooltip.
    await expect(inner.getBoundingClientRect().width).toBe(240);
    // And keeps 8 from the screen edge, 4 from its trigger.
    await waitFor(() => expect(inner.getBoundingClientRect().left).toBeGreaterThanOrEqual(8));
    const trigger = within(canvasElement).getByRole('button', { name: 'Copy' });
    await waitFor(() => expect(
        Math.round(inner.getBoundingClientRect().top - trigger.getBoundingClientRect().bottom),
    ).toBe(4));
};

// ---------------------------------------------------------------------------
// Flag
// ---------------------------------------------------------------------------

export const FlagsStack = () => (
    <FlagGroup data-testid="pf-flags">
        <Flag appearance="success" title="Changes saved" show autohide={false} data-testid="pf-flag-1">
            Your session notes are saved.
        </Flag>
        <Flag appearance="error" title="Upload failed" show data-testid="pf-flag-2">
            The file was larger than 10 MB.
        </Flag>
    </FlagGroup>
);

FlagsStack.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const doc = documentOf(canvasElement);
    // Measure where the flags settle: their enter slide moves them until it lands.
    await Promise.all(['pf-flag-1', 'pf-flag-2'].flatMap((id) => canvas.getByTestId(id).getAnimations().map((a) => a.finished)));
    const first = canvas.getByTestId('pf-flag-1').getBoundingClientRect();
    const second = canvas.getByTestId('pf-flag-2').getBoundingClientRect();
    const view = { width: doc.documentElement.clientWidth, height: doc.defaultView.innerHeight };

    // Bottom-left, 8 from the screen edge.
    await expect(Math.round(first.left)).toBe(8);
    await expect(Math.round(view.height - second.bottom)).toBe(8);
    // 400 wide, 16 apart.
    await expect(first.width).toBe(400);
    await expect(Math.round(second.top - first.bottom)).toBe(16);

    // Padded 16, title heading.xsmall 14/20 on the flag's own surface.
    const flag = canvas.getByTestId('pf-flag-1');
    await expect(px(getComputedStyle(flag).paddingTop)).toBe(16);
    const title = within(flag).getByText('Changes saved');
    await expect(getComputedStyle(title).fontSize).toBe('14px');
    await expect(getComputedStyle(title).lineHeight).toBe('20px');

    // The error flag stays: it has no timer to run out.
    await expect(canvas.getByTestId('pf-flag-2')).toBeVisible();
};
