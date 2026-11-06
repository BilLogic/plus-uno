import React, { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import Modal from './Modal';
import { Select } from '@/components';
// The app shell's floating nav: it has to sit under a modal's blanket like any page chrome.
import NavFab from '../../../../src/components/NavFab/NavFab';
import { iconClass } from '../../lib/icon';

/**
 * Where a `Modal` sits and how big it is.
 *
 * WHY THIS FILE EXISTS. A modal's width used to follow the page grid, so it
 * shrank when the sidebar docked and changed when the sidebar was toggled. It
 * now spans 6 · 8 · 10 columns of the SCREEN grid plus its own pad, grows with
 * the screen, never shrinks below the 768 screen and ignores the sidebar. Its
 * height hugs its content up to the screen less the overlay pad, or fills to
 * that cap. A render assertion cannot see any of that, so these stories measure
 * the boxes.
 *
 * The screen grid is read from `--plus-modal-screen` when an ancestor sets it,
 * and from the browser width otherwise. The width stories set it on a frame so
 * the three layout modes can be measured in one browser.
 */

const stack = { display: 'flex', flexDirection: 'column', gap: 'var(--space-150)', alignItems: 'flex-start' };

/** Blanket positions fixed over the page rather than canvas-local; query from the document. */
const documentOf = (canvasElement) => within(canvasElement.ownerDocument.body);

/** Rounded to a whole pixel, as Figma's modes hold the widths. */
const widthOf = (el) => Math.round(el.getBoundingClientRect().width);
const heightOf = (el) => Math.round(el.getBoundingClientRect().height);

/** A token's resolved length in px, read through a probe so `calc()` and `var()` are resolved. */
function lengthOf(doc, token) {
    const probe = doc.createElement('div');
    probe.style.position = 'absolute';
    probe.style.height = `var(${token})`;
    doc.body.appendChild(probe);
    const px = probe.getBoundingClientRect().height;
    probe.remove();
    return px;
}

/** The blanket color the token resolves to, read the same way. */
function colorOf(doc, token) {
    const probe = doc.createElement('div');
    probe.style.backgroundColor = `var(${token})`;
    doc.body.appendChild(probe);
    const color = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return color;
}

const SHORT = 'Short body copy.';
const LONG = `${'Long body copy that runs well past the cap. '.repeat(160)}The end.`;

export default {
    title: 'Components/Messaging/Modal layout',
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Interaction cover for the modal grid: width per layout mode with the sidebar '
                    + 'open and closed, Hug and Fill with short and long content, the blanket, and the '
                    + 'layer a menu takes inside a modal.',
            },
        },
    },
};

/* -------------------------------------------------------------------------- */
/* Width                                                                       */
/* -------------------------------------------------------------------------- */

/** Figma's Modal/width-modal-* per mode, and what 1280 and wider hold. */
const WIDTHS = {
    768: { '6-col': 384, '8-col': 507, '10-col': 629 },
    1024: { '6-col': 512, '8-col': 677, '10-col': 843 },
    1280: { '6-col': 640, '8-col': 848, '10-col': 1056 },
    // Content caps at 1232, so the modal grid stops growing at 1280.
    1600: { '6-col': 640, '8-col': 848, '10-col': 1056 },
    // Under 768 it never shrinks: content never goes under 720.
    600: { '6-col': 384, '8-col': 507, '10-col': 629 },
};

function ScreenFrame({ screen, sidebar, children }) {
    return (
        <div
            data-testid={`screen-${screen}-${sidebar ? 'sidebar' : 'nosidebar'}`}
            style={{ '--plus-modal-screen': `${screen}px`, display: 'flex', gap: 'var(--space-100)', width: '100%' }}
        >
            {sidebar && <div data-sidebar style={{ flex: '0 0 var(--frame-sidebar-width)' }} />}
            <div style={{ ...stack, flex: '1 1 0', minWidth: 0, overflow: 'hidden' }}>{children}</div>
        </div>
    );
}

export const WidthPerScreen = () => (
    <div style={stack}>
        {Object.keys(WIDTHS).flatMap((screen) => [false, true].map((sidebar) => (
            <ScreenFrame key={`${screen}-${sidebar}`} screen={screen} sidebar={sidebar}>
                {['6-col', '8-col', '10-col'].map((size) => (
                    <Modal
                        key={size}
                        renderAs="inline"
                        show
                        width={size}
                        title={`${size} at ${screen}`}
                        body={SHORT}
                        showBottomButtons={false}
                        data-testid={`modal-${screen}-${sidebar ? 'sidebar' : 'nosidebar'}-${size}`}
                        onClose={() => {}}
                    />
                ))}
            </ScreenFrame>
        )))}
    </div>
);

WidthPerScreen.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const [screen, sizes] of Object.entries(WIDTHS)) {
        for (const [size, expected] of Object.entries(sizes)) {
            const closed = widthOf(canvas.getByTestId(`modal-${screen}-nosidebar-${size}`));
            const open = widthOf(canvas.getByTestId(`modal-${screen}-sidebar-${size}`));
            await expect({ screen, size, width: closed }).toEqual({ screen, size, width: expected });
            // The sidebar takes 240 from the page, and nothing from the modal.
            await expect({ screen, size, width: open }).toEqual({ screen, size, width: expected });
        }
    }
};

/** With no stand-in, the real screen sets the width: the same rule, read from the browser. */
export const WidthFromTheBrowser = () => {
    const [open, setOpen] = useState(true);
    return (
        <Modal show={open} width="8-col" title="Read from the screen" body={SHORT} showBottomButtons={false} onClose={() => setOpen(false)} />
    );
};

WidthFromTheBrowser.play = async ({ canvasElement }) => {
    const doc = documentOf(canvasElement);
    const view = canvasElement.ownerDocument.defaultView;
    const dialog = (await doc.findByText('Read from the screen')).closest('.plus-modal');
    // Screen pad 24: from 1440, where the pad is 32, the grid is capped either way.
    const grid = Math.min(1232, Math.max(720, view.innerWidth - 2 * 24));
    const column = (grid - 11 * 16) / 12;
    await expect(widthOf(dialog)).toBe(Math.round(8 * column + 7 * 16 + 2 * 16));
};

/* -------------------------------------------------------------------------- */
/* Height                                                                      */
/* -------------------------------------------------------------------------- */

function HeightCase({ height, body, title }) {
    const [open, setOpen] = useState(true);
    return (
        <Modal
            show={open}
            height={height}
            title={title}
            body={body}
            secondaryButton={{ text: 'Cancel', onClick: () => setOpen(false) }}
            primaryButton={{ text: 'Save', onClick: () => setOpen(false) }}
            onClose={() => setOpen(false)}
        />
    );
}

const capOf = (canvasElement) => lengthOf(canvasElement.ownerDocument, '--blanket-max-height-modal');
const dialogOf = async (canvasElement, title) => (await documentOf(canvasElement).findByText(title)).closest('.plus-modal');

export const HugShort = () => <HeightCase height="hug" body={SHORT} title="Hug, short" />;
HugShort.play = async ({ canvasElement }) => {
    const dialog = await dialogOf(canvasElement, 'Hug, short');
    await expect(heightOf(dialog)).toBeLessThan(Math.round(capOf(canvasElement)) / 2);
    const body = dialog.querySelector('.plus-modal-body');
    // Nothing to scroll, so nothing to reach by keyboard.
    await expect(body).not.toHaveAttribute('tabindex');
};

export const HugLong = () => <HeightCase height="hug" body={LONG} title="Hug, long" />;
HugLong.play = async ({ canvasElement }) => {
    const dialog = await dialogOf(canvasElement, 'Hug, long');
    await expect(heightOf(dialog)).toBe(Math.round(capOf(canvasElement)));
    // Past the cap the body scrolls, the header and footer stay, and the
    // scrolling region is a tab stop so a keyboard can scroll it.
    const body = dialog.querySelector('.plus-modal-body');
    await expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
    await waitFor(() => expect(body).toHaveAttribute('tabindex', '0'));
    const save = within(dialog).getByRole('button', { name: 'Save' }).getBoundingClientRect();
    await expect(save.bottom).toBeLessThanOrEqual(dialog.getBoundingClientRect().bottom);
};

export const FillShort = () => <HeightCase height="fill" body={SHORT} title="Fill, short" />;
FillShort.play = async ({ canvasElement }) => {
    const dialog = await dialogOf(canvasElement, 'Fill, short');
    await expect(heightOf(dialog)).toBe(Math.round(capOf(canvasElement)));
};

export const FillLong = () => <HeightCase height="fill" body={LONG} title="Fill, long" />;
FillLong.play = async ({ canvasElement }) => {
    const dialog = await dialogOf(canvasElement, 'Fill, long');
    await expect(heightOf(dialog)).toBe(Math.round(capOf(canvasElement)));
    const body = dialog.querySelector('.plus-modal-body');
    await expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
};

/* -------------------------------------------------------------------------- */
/* Blanket and layers                                                            */
/* -------------------------------------------------------------------------- */

export const Blanket = () => <HeightCase height="hug" body={SHORT} title="Over the blanket" />;
Blanket.play = async ({ canvasElement }) => {
    const doc = canvasElement.ownerDocument;
    const dialog = await dialogOf(canvasElement, 'Over the blanket');
    const blanket = dialog.closest('.plus-pattern-blanket');
    await expect(blanket).not.toBeNull();
    // The blanket's fill is color.blanket, in whichever mode is in force, and nothing else tints it.
    await expect(getComputedStyle(blanket).backgroundColor).toBe(colorOf(doc, '--ds-blanket'));
    // The layers: blanket 500, modal 510. The dialog is the blanket's
    // direct child, so it takes the modal layer straight from Blanket's own
    // `> *` rule, with no intermediate wrapper.
    await expect(getComputedStyle(blanket).zIndex).toBe('500');
    await expect(getComputedStyle(dialog).zIndex).toBe('510');
};

const OPTIONS = ['Algebra', 'Geometry', 'Statistics', 'Calculus'].map((label) => ({ value: label.toLowerCase(), label }));

export const MenuInsideModal = () => (
    <Modal show title="Pick a subject" showBottomButtons={false} onClose={() => {}}>
        <Select label="Subject" options={OPTIONS} />
    </Modal>
);

MenuInsideModal.play = async ({ canvasElement }) => {
    const doc = documentOf(canvasElement);
    await doc.findByText('Pick a subject');
    await userEvent.click(doc.getByRole('combobox', { name: 'Subject' }));
    const listbox = await doc.findByRole('listbox');
    const option = within(listbox).getByRole('option', { name: 'Statistics' });
    // A menu is on the popup layer (400), under a modal (510). Opened from a
    // field inside one, it takes the modal's blanket: it mounts in the
    // modal's overlay, after the dialog.
    const overlay = doc.getByText('Pick a subject').closest('.plus-pattern-blanket');
    await expect(listbox.closest('.plus-pattern-blanket')).toBe(overlay);
    await expect(getComputedStyle(listbox.closest('.plus-listbox')).zIndex).toBe('400');
    // The menu is drawn above the modal it opened from: the topmost element
    // at the option's center is the option, not the dialog under it.
    const box = option.getBoundingClientRect();
    const hit = canvasElement.ownerDocument.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    await expect(option.contains(hit)).toBe(true);
};

/**
 * Page chrome sits under the blanket: a sticky table header (Bootstrap's
 * `.sticky-top`, on the card layer) and the app's floating nav (navigation).
 * Bootstrap had them at 1020 and 1100, above a modal at 510.
 */
export const ChromeUnderTheBlanket = () => (
    <div>
        <div style={{ height: 'var(--size-2000)', overflow: 'auto' }}>
            {/* Bootstrap's markup, as LessonsOverviewPage draws it. */}
            <table className="table m-0">
                <thead className="bg-light sticky-top" data-testid="sticky-head">
                    <tr><th>Lesson</th><th>Status</th></tr>
                </thead>
                <tbody>
                    {OPTIONS.map(({ value, label }) => <tr key={value}><td>{label}</td><td>Open</td></tr>)}
                </tbody>
            </table>
        </div>
        <NavFab />
        <Modal show title="Over the page chrome" body={SHORT} showBottomButtons={false} onClose={() => {}} />
    </div>
);

ChromeUnderTheBlanket.play = async ({ canvasElement }) => {
    const doc = canvasElement.ownerDocument;
    const dialog = await dialogOf(canvasElement, 'Over the page chrome');
    const blanket = dialog.closest('.plus-pattern-blanket');
    const blanketLayer = Number(getComputedStyle(blanket).zIndex);
    const head = within(canvasElement).getByTestId('sticky-head');
    const fab = doc.querySelector('.nav-fab');
    await expect(getComputedStyle(head).zIndex).toBe('100');
    await expect(getComputedStyle(fab).zIndex).toBe('200');
    for (const el of [head, fab]) {
        await expect(Number(getComputedStyle(el).zIndex)).toBeLessThan(blanketLayer);
        // Nothing of the chrome is the top element where it is drawn: the overlay covers it.
        const box = el.getBoundingClientRect();
        const hit = doc.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
        await expect(el.contains(hit)).toBe(false);
        await expect(Boolean(hit.closest('.plus-pattern-blanket'))).toBe(true);
    }
};

/**
 * A follow-up that needs confirming does not stack a second Modal: `view`
 * swaps this same dialog's content and footer in place. See the Modal
 * stories (`ConfirmView`, `ConfirmViewEscape`, `TwoOverlayLimit`) for the
 * confirm view and the overlay stack limit.
 */

/* -------------------------------------------------------------------------- */
/* Header, dividers, loading                                                   */
/* -------------------------------------------------------------------------- */

export const HeaderOptions = () => (
    <div style={{ ...stack, '--plus-modal-screen': '1024px' }}>
        <Modal
            renderAs="inline"
            show
            title="Share report"
            description="People with the link can view it."
            headerActions={<button type="button" aria-label="Copy link"><i className={iconClass('link')} aria-hidden="true" /></button>}
            dividers
            body={SHORT}
            primaryButton={{ text: 'Done' }}
            data-testid="with-everything"
            onClose={() => {}}
        />
        <Modal
            renderAs="inline"
            show
            title="Uploading"
            showCloseButton={false}
            body={SHORT}
            showBottomButtons={false}
            data-testid="no-close"
            onClose={() => {}}
        />
        <Modal
            renderAs="inline"
            show
            loading
            title="Loading details"
            body={SHORT}
            showBottomButtons={false}
            data-testid="loading"
            onClose={() => {}}
        />
    </div>
);

HeaderOptions.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const full = canvas.getByTestId('with-everything');
    // The title is the dialog's h1; the description sits under it.
    await expect(within(full).getByRole('heading', { level: 1, name: 'Share report' })).toBeInTheDocument();
    await expect(within(full).getByText('People with the link can view it.')).toBeInTheDocument();
    await expect(within(full).getByRole('button', { name: 'Copy link' })).toBeInTheDocument();
    const close = within(full).getByRole('button', { name: 'Close modal' });
    await expect(heightOf(close)).toBe(32);
    await expect(full.querySelectorAll('.plus-modal-divider')).toHaveLength(2);
    // Footer actions align right.
    const done = within(full).getByRole('button', { name: 'Done' }).getBoundingClientRect();
    const box = full.getBoundingClientRect();
    await expect(Math.round(box.right - done.right)).toBe(Math.round(lengthOf(canvasElement.ownerDocument, '--modal-pad-x-default')));

    const noClose = canvas.getByTestId('no-close');
    await expect(within(noClose).queryByRole('button', { name: 'Close modal' })).toBeNull();
    await expect(noClose.querySelectorAll('.plus-modal-divider')).toHaveLength(0);

    const loading = canvas.getByTestId('loading');
    const body = loading.querySelector('.plus-modal-body');
    await expect(body).toHaveAttribute('aria-busy', 'true');
    await expect(within(loading).queryByText(SHORT)).toBeNull();
    await expect(loading.querySelectorAll('.plus-modal-skeleton > *')).toHaveLength(3);
};

/** The dialog is named by its title, and described by its description. */
export const NamedAndDescribed = () => (
    <Modal show title="Delete session" description="This removes it for everyone." showBottomButtons={false} onClose={() => {}} />
);

NamedAndDescribed.play = async ({ canvasElement }) => {
    const doc = documentOf(canvasElement);
    const dialog = await doc.findByRole('dialog', { name: 'Delete session' });
    await expect(dialog).toHaveAccessibleDescription('This removes it for everyone.');
};
