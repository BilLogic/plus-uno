import React from 'react';
import { expect, waitFor, within } from 'storybook/test';

import { px, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { Dropdown, Toast, ToastContainer } from '@/components';
import Popover from './Popover/Popover';
import Tooltip from './Tooltip/Tooltip';

/**
 * The Popover family: Menu, Popup, Flag and Tooltip.
 *
 * Floating layers behave the same everywhere, and these stories hold them to
 * the Patterns page's Popover section: menu rows of 32 that grow with a
 * description line, a menu inset 4 that is 160 to 320 wide and stops at 320
 * tall with a cut row, popups 320 · 400 · 480 padded 16, tooltips 4 · 8 up to
 * 240, flags 400 wide stacking 16 apart bottom-left, and every one of them at
 * least 8 from the screen edge, 4 from its trigger.
 *
 * Popups and tooltips portal out of the story canvas, so those queries run
 * against the document. Their triggers are plain `button`s: Popper measures
 * the trigger through a ref, and a host element is the one that is sure to
 * take one.
 */

export default {
    title: 'Components/Overlays and layering/Popup family',
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Behavior cover for the Popover family: menu rows and scrolling, popup '
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

/** The items of an open Dropdown's menu. */
const menuOf = (canvasElement) => canvasElement.querySelector('.dropdown-menu.show');

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------

const rowItems = [
    { text: 'Rename', leadingIcon: 'pen' },
    { text: 'Share', description: 'Anyone with the link can view', leadingIcon: 'link' },
    { text: 'Duplicate', selected: true },
];

export const MenuRows = () => (
    <div style={{ minHeight: '240px', padding: '16px' }}>
        <Dropdown buttonText="Actions" isOpen items={rowItems} />
    </div>
);

MenuRows.play = async ({ canvasElement }) => {
    const menu = menuOf(canvasElement);
    const menuStyle = getComputedStyle(menu);

    // The menu insets its rows 4 and rounds to radius-menu-md.
    await expect(px(menuStyle.paddingTop)).toBe(4);
    await expect(px(menuStyle.paddingLeft)).toBe(4);
    await expect(px(menuStyle.borderTopLeftRadius)).toBe(12);

    const rows = within(menu).getAllByRole('button');
    const [plain, described, selected] = rows;

    // A row is an Item 32; a Description line makes it grow, it does not
    // squeeze into 32.
    await expect(plain.getBoundingClientRect().height).toBe(32);
    await expect(described.getBoundingClientRect().height).toBe(48);
    await expect(within(described).getByText('Anyone with the link can view')).toBeVisible();

    // The row's label is 14/20, and the description 12/16.
    const label = within(plain).getByText('Rename');
    await expect(getComputedStyle(label).fontSize).toBe('14px');
    await expect(getComputedStyle(label).lineHeight).toBe('20px');
    const description = within(described).getByText('Anyone with the link can view');
    await expect(getComputedStyle(description).fontSize).toBe('12px');
    await expect(getComputedStyle(description).lineHeight).toBe('16px');

    // Icons draw at 16.
    const icon = plain.querySelector('i');
    await expect(getComputedStyle(icon).fontSize).toBe('16px');

    // Selected is the primary state layer 08 with primary text, no left bar.
    const selectedStyle = getComputedStyle(selected);
    await expect(selectedStyle.backgroundColor).toBe(tokenColor(canvasElement, '--color-primary-state-08'));
    await expect(selectedStyle.color).toBe(tokenColor(canvasElement, '--color-primary-text'));
    await expect(getComputedStyle(selected, '::before').content).toBe('none');
};

export const MenuRowsSmall = () => (
    <div style={{ minHeight: '200px', padding: '16px' }}>
        <Dropdown buttonText="Actions" size="small" isOpen items={rowItems} />
    </div>
);

MenuRowsSmall.play = async ({ canvasElement }) => {
    const menu = menuOf(canvasElement);
    // size=sm: rows of 24 on radius-item-sm 6, in a menu on radius-menu-sm 10.
    await expect(px(getComputedStyle(menu).borderTopLeftRadius)).toBe(10);
    const [plain] = within(menu).getAllByRole('button');
    await expect(plain.getBoundingClientRect().height).toBe(24);
    await expect(px(getComputedStyle(plain).borderTopLeftRadius)).toBe(6);
    await expect(px(getComputedStyle(plain).paddingLeft)).toBe(8);
};

const longList = Array.from({ length: 14 }, (_, i) => ({ text: `Session ${i + 1}` }));

export const MenuScrollsAt320 = () => (
    <div style={{ minHeight: '400px', padding: '16px' }}>
        <Dropdown buttonText="Sessions" isOpen items={longList} />
    </div>
);

MenuScrollsAt320.play = async ({ canvasElement }) => {
    const menu = menuOf(canvasElement);
    const box = menu.getBoundingClientRect();

    // It stops at max-height-menu and scrolls past it.
    await expect(box.height).toBe(320);
    await expect(menu.scrollHeight).toBeGreaterThan(menu.clientHeight);

    // 4 + 9 rows of 32 + 28 of the tenth: the cut row says there is more.
    const inner = box.bottom - px(getComputedStyle(menu).paddingBottom) - px(getComputedStyle(menu).borderBottomWidth);
    const rows = within(menu).getAllByRole('button');
    const cut = rows.filter((row) => {
        const r = row.getBoundingClientRect();
        return r.top < inner && r.bottom > inner;
    });
    await expect(cut).toHaveLength(1);
    await expect(inner - cut[0].getBoundingClientRect().top).toBeGreaterThanOrEqual(8);
    await expect(cut[0].getBoundingClientRect().bottom - inner).toBeGreaterThanOrEqual(8);
};

export const MenuWidths = () => (
    <div style={{ minHeight: '200px', padding: '16px', display: 'flex', gap: '360px' }}>
        <Dropdown buttonText="A" isOpen items={[{ text: 'Go' }]} className="pf-narrow" />
        <Dropdown
            buttonText="B"
            isOpen
            className="pf-wide"
            items={[{ text: 'A very long menu item that would run well past the widest a menu is allowed to grow' }]}
        />
    </div>
);

MenuWidths.play = async ({ canvasElement }) => {
    const narrow = canvasElement.querySelector('.pf-narrow .dropdown-menu');
    const wide = canvasElement.querySelector('.pf-wide .dropdown-menu');
    // min-width-menu 160 · max-width-menu 320.
    await expect(narrow.getBoundingClientRect().width).toBe(160);
    await expect(wide.getBoundingClientRect().width).toBe(320);
};

export const MenuKeepsOffTheScreenEdge = () => (
    <div style={{ position: 'fixed', top: '16px', right: 0 }}>
        <Dropdown
            buttonText="…"
            ariaLabel="More"
            isOpen
            items={[{ text: 'Move to another session' }, { text: 'Remove' }]}
        />
    </div>
);

MenuKeepsOffTheScreenEdge.play = async ({ canvasElement }) => {
    const menu = menuOf(canvasElement);
    const view = documentOf(canvasElement).documentElement.clientWidth;
    await waitFor(() => expect(menu.getBoundingClientRect().right).toBeLessThanOrEqual(view - 8));
};

// ---------------------------------------------------------------------------
// Popup
// ---------------------------------------------------------------------------

const popupIds = { sm: 'pf-popup-sm', md: 'pf-popup-md', lg: 'pf-popup-lg' };

export const PopupWidths = () => {
    const open = useOpenAfterMount();
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '200px', padding: '24px 600px 240px 24px' }}>
            {Object.entries(popupIds).map(([width, id]) => (
                <Popover
                    key={width}
                    id={id}
                    width={width}
                    triggerType="manual"
                    show={open}
                    placement="bottom-start"
                    title="Session notes"
                    trigger={<button type="button">{`Popup ${width}`}</button>}
                >
                    Notes stay with the session.
                </Popover>
            ))}
        </div>
    );
};

PopupWidths.play = async ({ canvasElement }) => {
    const doc = documentOf(canvasElement);
    const expected = { sm: 320, md: 400, lg: 480 };
    for (const [width, id] of Object.entries(popupIds)) {
        const popup = await waitFor(() => {
            const node = doc.getElementById(id);
            if (!node) throw new Error(`${id} not open`);
            return node;
        });
        await expect(popup.getBoundingClientRect().width).toBe(expected[width]);
        const style = getComputedStyle(popup);
        await expect(px(style.paddingTop)).toBe(16);
        await expect(px(style.paddingLeft)).toBe(16);
        await expect(px(style.borderTopLeftRadius)).toBe(12);
    }

    // One surface: the title is heading.xsmall 14/20 on the popup's own fill,
    // not a dark header bar.
    const popup = doc.getElementById(popupIds.sm);
    const title = within(popup).getByText('Session notes');
    await expect(getComputedStyle(title).fontSize).toBe('14px');
    await expect(getComputedStyle(title).lineHeight).toBe('20px');
    await expect(getComputedStyle(title).backgroundColor).toBe('rgba(0, 0, 0, 0)');

    // 4 from its trigger.
    const trigger = within(canvasElement).getByRole('button', { name: 'Popup sm' });
    await waitFor(() => expect(
        Math.round(popup.getBoundingClientRect().top - trigger.getBoundingClientRect().bottom),
    ).toBe(4));
};

export const PopupKeepsOffTheScreenEdge = () => {
    const open = useOpenAfterMount();
    return (
        <div style={{ position: 'fixed', top: '16px', left: 0 }}>
            <Popover
                id="pf-popup-edge"
                width="lg"
                triggerType="manual"
                show={open}
                placement="bottom"
                trigger={<button type="button">Edge</button>}
            >
                A wide popup opened from a trigger at the screen edge.
            </Popover>
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
                <button type="button">Copy</button>
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
    const inner = tooltip.querySelector('.tooltip-inner');
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
    <ToastContainer data-testid="pf-flags">
        <Toast style="success" title="Changes saved" show autohide={false} data-testid="pf-flag-1">
            Your session notes are saved.
        </Toast>
        <Toast style="danger" title="Upload failed" show data-testid="pf-flag-2">
            The file was larger than 10 MB.
        </Toast>
    </ToastContainer>
);

FlagsStack.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const doc = documentOf(canvasElement);
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
