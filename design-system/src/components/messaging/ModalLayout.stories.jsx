import React, { useState } from 'react';
import { expect, spyOn, userEvent, waitFor, within } from 'storybook/test';

import Modal from './Modal';
import { Select } from '@/components';
// The app shell's floating nav: it has to sit under a modal's scrim like any page chrome.
import NavFab from '../../../../src/components/NavFab/NavFab';

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

/** The dialog is a portal; `within(canvasElement)` cannot see it. */
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

/** The scrim color the token resolves to, read the same way. */
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
                    + 'open and closed, Hug and Fill with short and long content, the scrim, the '
                    + 'layer a menu takes inside a modal, and a nested confirm.',
            },
        },
    },
};

/* -------------------------------------------------------------------------- */
/* Width                                                                       */
/* -------------------------------------------------------------------------- */

/** Figma's Modal/width-modal-* per mode, and what 1280 and wider hold. */
const WIDTHS = {
    768: { sm: 384, md: 507, lg: 629 },
    1024: { sm: 512, md: 677, lg: 843 },
    1280: { sm: 640, md: 848, lg: 1056 },
    // Content caps at 1232, so the modal grid stops growing at 1280.
    1600: { sm: 640, md: 848, lg: 1056 },
    // Under 768 it never shrinks: content never goes under 720.
    600: { sm: 384, md: 507, lg: 629 },
};

function ScreenFrame({ screen, sidebar, children }) {
    return (
        <div
            data-testid={`screen-${screen}-${sidebar ? 'sidebar' : 'nosidebar'}`}
            style={{ '--plus-modal-screen': `${screen}px`, display: 'flex', gap: 'var(--space-100)', width: '100%' }}
        >
            {sidebar && <div data-sidebar style={{ flex: '0 0 var(--layout-width-sidebar)' }} />}
            <div style={{ ...stack, flex: '1 1 0', minWidth: 0, overflow: 'hidden' }}>{children}</div>
        </div>
    );
}

export const WidthPerScreen = () => (
    <div style={stack}>
        {Object.keys(WIDTHS).flatMap((screen) => [false, true].map((sidebar) => (
            <ScreenFrame key={`${screen}-${sidebar}`} screen={screen} sidebar={sidebar}>
                {['sm', 'md', 'lg'].map((size) => (
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
        <Modal show={open} width="md" title="Read from the screen" body={SHORT} showBottomButtons={false} onClose={() => setOpen(false)} />
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

const capOf = (canvasElement) => lengthOf(canvasElement.ownerDocument, '--layout-max-height-modal');
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
/* Scrim and layers                                                            */
/* -------------------------------------------------------------------------- */

export const Scrim = () => <HeightCase height="hug" body={SHORT} title="Over the scrim" />;
Scrim.play = async ({ canvasElement }) => {
    const doc = canvasElement.ownerDocument;
    const dialog = await dialogOf(canvasElement, 'Over the scrim');
    const scrim = doc.querySelector('.modal-backdrop');
    await expect(scrim).not.toBeNull();
    await waitFor(() => expect(getComputedStyle(scrim).opacity).toBe('1'));
    // The scrim's color is the token's, black at 38%, and nothing else tints it.
    await expect(getComputedStyle(scrim).backgroundColor).toBe(colorOf(doc, '--overlay-scrim'));
    await expect(getComputedStyle(scrim).backgroundColor).toBe('rgba(0, 0, 0, 0.38)');
    // Atlassian's layers: scrim 500, modal 510.
    await expect(getComputedStyle(scrim).zIndex).toBe('500');
    await expect(getComputedStyle(dialog.closest('.modal')).zIndex).toBe('510');
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
    // field inside one, it takes the modal's layer: it mounts in the modal's
    // overlay, after the dialog.
    const overlay = doc.getByText('Pick a subject').closest('.modal');
    await expect(listbox.closest('.modal')).toBe(overlay);
    await expect(getComputedStyle(listbox.closest('.plus-listbox')).zIndex).toBe('400');
    // The menu is drawn above the modal it opened from: the topmost element
    // at the option's center is the option, not the dialog under it.
    const box = option.getBoundingClientRect();
    const hit = canvasElement.ownerDocument.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    await expect(option.contains(hit)).toBe(true);
};

/**
 * Page chrome sits under the scrim: a sticky table header (Bootstrap's
 * `.sticky-top`, on the card layer) and the app's floating nav (navigation).
 * Bootstrap had them at 1020 and 1100, above a modal at 510.
 */
export const ChromeUnderTheScrim = () => (
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

ChromeUnderTheScrim.play = async ({ canvasElement }) => {
    const doc = canvasElement.ownerDocument;
    await dialogOf(canvasElement, 'Over the page chrome');
    const scrim = doc.querySelector('.modal-backdrop');
    const scrimLayer = Number(getComputedStyle(scrim).zIndex);
    const head = within(canvasElement).getByTestId('sticky-head');
    const fab = doc.querySelector('.nav-fab');
    await expect(getComputedStyle(head).zIndex).toBe('100');
    await expect(getComputedStyle(fab).zIndex).toBe('200');
    for (const el of [head, fab]) {
        await expect(Number(getComputedStyle(el).zIndex)).toBeLessThan(scrimLayer);
        // Nothing of the chrome is the top element where it is drawn: the overlay covers it.
        const box = el.getBoundingClientRect();
        const hit = doc.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
        await expect(el.contains(hit)).toBe(false);
        await expect(Boolean(hit.closest('.modal, .modal-backdrop'))).toBe(true);
    }
};

/* -------------------------------------------------------------------------- */
/* Nested confirm                                                              */
/* -------------------------------------------------------------------------- */

export const NestedConfirm = () => {
    const [confirming, setConfirming] = useState(false);
    const [closed, setClosed] = useState(false);
    return (
        <>
            <Modal
                show={!closed}
                width="md"
                title="Edit session"
                body="Discarding loses your changes."
                secondaryButton={{ text: 'Discard', onClick: () => setConfirming(true) }}
                primaryButton={{ text: 'Save', onClick: () => setClosed(true) }}
                onClose={() => setClosed(true)}
            >
                <Modal
                    show={confirming}
                    width="sm"
                    title="Discard changes?"
                    body="This cannot be undone."
                    secondaryButton={{ text: 'Keep editing', onClick: () => setConfirming(false) }}
                    primaryButton={{ text: 'Discard', style: 'danger', onClick: () => { setConfirming(false); setClosed(true); } }}
                    onClose={() => setConfirming(false)}
                />
            </Modal>
        </>
    );
};

NestedConfirm.play = async ({ canvasElement }) => {
    const doc = documentOf(canvasElement);
    const outer = await dialogOf(canvasElement, 'Edit session');
    await userEvent.click(within(outer).getByRole('button', { name: 'Discard' }));
    const inner = await dialogOf(canvasElement, 'Discard changes?');
    const scrims = canvasElement.ownerDocument.querySelectorAll('.modal-backdrop');
    await expect(scrims).toHaveLength(2);
    // The second overlay covers the first modal: the top element over its Save
    // button belongs to the confirm's overlay, so the first modal cannot be
    // used underneath, and the second scrim lies inside the first modal's layer.
    const save = within(outer).getByRole('button', { name: 'Save' }).getBoundingClientRect();
    const confirmOverlay = inner.closest('.modal');
    await waitFor(() => {
        const hit = canvasElement.ownerDocument.elementFromPoint(save.left + 2, save.top + 2);
        expect(confirmOverlay.contains(hit) || hit === scrims[1]).toBe(true);
    });
    await expect(outer.closest('.modal').contains(scrims[1])).toBe(true);
    // Escape closes only the top one.
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(doc.queryByText('Discard changes?')).toBeNull());
    await expect(doc.getByText('Edit session')).toBeInTheDocument();
    await expect(inner.isConnected).toBe(false);
};

/**
 * At most two overlays stack. A third is refused rather than replacing the
 * top one: it does not open, development builds warn, it calls its `onClose`,
 * and the two below keep working.
 */
export const ThirdOverlayStaysClosed = () => {
    const [confirming, setConfirming] = useState(false);
    const [third, setThird] = useState(false);
    return (
        <Modal
            show
            width="md"
            title="Edit session"
            body="Discarding loses your changes."
            secondaryButton={{ text: 'Discard', onClick: () => setConfirming(true) }}
            primaryButton={{ text: 'Save' }}
            onClose={() => {}}
        >
            <Modal
                show={confirming}
                width="sm"
                title="Discard changes?"
                body="This cannot be undone."
                secondaryButton={{ text: 'Why?', onClick: () => setThird(true) }}
                primaryButton={{ text: 'Keep editing', onClick: () => setConfirming(false) }}
                onClose={() => setConfirming(false)}
            >
                <Modal
                    show={third}
                    width="sm"
                    title="A third overlay"
                    body="This should never show."
                    showBottomButtons={false}
                    onClose={() => setThird(false)}
                />
            </Modal>
        </Modal>
    );
};

ThirdOverlayStaysClosed.play = async ({ canvasElement }) => {
    const doc = documentOf(canvasElement);
    const warn = spyOn(console, 'warn').mockImplementation(() => {});
    try {
        const outer = await dialogOf(canvasElement, 'Edit session');
        await userEvent.click(within(outer).getByRole('button', { name: 'Discard' }));
        const inner = await dialogOf(canvasElement, 'Discard changes?');
        await userEvent.click(within(inner).getByRole('button', { name: 'Why?' }));

        await waitFor(() => expect(warn).toHaveBeenCalledWith(expect.stringMatching(/At most 2 overlays stack/)));
        await expect(doc.queryByText('A third overlay'), 'the third does not open').toBeNull();
        await expect(canvasElement.ownerDocument.querySelectorAll('.modal-backdrop')).toHaveLength(2);
        await expect(inner.contains(canvasElement.ownerDocument.activeElement), 'focus stays in the confirm').toBe(true);

        // The refused modal called its onClose, so its owner says closed and a
        // second press tries again rather than doing nothing.
        await userEvent.click(within(inner).getByRole('button', { name: 'Why?' }));
        await waitFor(() => expect(warn).toHaveBeenCalledTimes(2));
        await expect(doc.queryByText('A third overlay')).toBeNull();

        // The confirm still works: Escape closes it and leaves the first modal.
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(doc.queryByText('Discard changes?')).toBeNull());
        await expect(doc.getByText('Edit session')).toBeInTheDocument();
        await expect(canvasElement.ownerDocument.querySelectorAll('.modal-backdrop')).toHaveLength(1);
    } finally {
        warn.mockRestore();
    }
};

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
            headerActions={<button type="button" aria-label="Copy link"><i className="fa-solid fa-link" aria-hidden="true" /></button>}
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
    await expect(Math.round(box.right - done.right)).toBe(Math.round(lengthOf(canvasElement.ownerDocument, '--modal-pad')));

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
