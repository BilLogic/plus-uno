import { expectOverlayExit, withReducedMotion, settleAnimations } from '@/storybook-docs/lib/overlay-motion-plays';
import React, { useState } from 'react';
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test';
import Modal, { MODAL_HEIGHTS, MODAL_WIDTHS, MODAL_WIDTH_PX } from './Modal';
import { Button, FooterActions, IconButton, Select } from '@/components';
import { PanelBody, PanelCloseAction, PanelContainer, PanelHeader } from '@/patterns';
import { footerTracks } from '@/storybook-docs/lib/full-bleed-footer.jsx';
import { inEveryColorModeOf } from '@/storybook-docs/lib/color-modes.js';
import { probe, tokenLength } from '@/storybook-docs/lib/style-probes.js';
import { LiveAnatomy } from '@/storybook-docs/lib/template-page.jsx';
import { fitsCanvas, leadersCrossNoOtherPart, markersLevelWithParts } from '@/storybook-docs/lib/anatomy-asserts.js';
import { expectFullScale, expectNotInert } from '@/storybook-docs/lib/live-example-asserts.js';
import { ScrollStage } from '@/storybook-docs/lib/fit-stage.jsx';
import { openOverlay } from '@/lib/overlay.js';
import { BAR_TOKEN } from '@/storybook-docs/lib/multi-step-task.jsx';
import * as Demo from './modalDemo.jsx';

/** The stand-in screen the docs draw the overlay at: the Large mode, and a short template. */
const SCREEN = { width: 1024, height: 520 };

/** Modal widths at 1024: 4 · 6 · 8 · 10 screen columns plus 2 × 16. */
const WIDTHS_AT_1024 = {
    '4-col': MODAL_WIDTH_PX['4-col'][1],
    '6-col': MODAL_WIDTH_PX['6-col'][1],
    '8-col': MODAL_WIDTH_PX['8-col'][1],
    '10-col': MODAL_WIDTH_PX['10-col'][1],
};

const bodyCopy = (
    <p style={{ margin: 0, font: 'var(--body-default)' }}>
        Move Thursday’s session with Ana Ruiz to 4:30 PM? Ana and her tutor get an email with the new time.
    </p>
);

const longBody = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
        {Array.from({ length: 12 }, (_, i) => (
            <p key={i} style={{ margin: 0, font: 'var(--body-default)' }}>
                {`Paragraph ${i + 1}: long body content, so the body scrolls once the modal reaches its cap.`}
            </p>
        ))}
    </div>
);

const footerActions = (
    <FooterActions>
        <Button text="Discard" onClick={() => {}} />
        <Button text="Move session" appearance="primary" onClick={() => {}} />
    </FooterActions>
);

const footerWithAction = (action) => (
    <FooterActions>
        <Button text="Discard" onClick={() => {}} />
        <Button text={action} appearance="primary" onClick={() => {}} />
    </FooterActions>
);

const dialogs = (canvas) => canvas.getAllByRole('dialog');
const documentOf = (canvasElement) => within(canvasElement.ownerDocument.body);
const dialogNamed = (canvasElement, name) => documentOf(canvasElement).queryByRole('dialog', { name });
const expectDialogGone = (canvasElement, name) =>
    waitFor(() => expect(dialogNamed(canvasElement, name)).toBeNull());

export default {
    title: 'Templates/Modal',
    component: Modal,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        children: { table: { disable: true } },
        style: { table: { disable: true } },
        onClose: { table: { disable: true } },
        footer: { table: { disable: true } },
        primaryButton: { table: { disable: true } },
        secondaryButton: { table: { disable: true } },
        title: {
            control: 'text',
            table: { category: 'Slots' },
        },
        width: {
            control: 'inline-radio',
            options: MODAL_WIDTHS,
            table: { category: 'Design' },
        },
        height: {
            control: 'inline-radio',
            options: MODAL_HEIGHTS,
            table: { category: 'Design' },
        },
        id: {
            control: false,
            table: { disable: true, category: 'Development' },
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' },
        },
    },
};

/** A 6-col, hug modal in its Blanket: the blanket, the pads and the modal centered. */
export const Overview = {
    render: () => (
        <Demo.ModalStage title="Move session" screenHeight={SCREEN.height} footer={footerActions}>
            {bodyCopy}
        </Demo.ModalStage>
    ),
    play: async ({ canvas, canvasElement }) => {
        await settleAnimations(canvasElement);
        const overlay = canvasElement.querySelector('.plus-pattern-blanket');
        const [modal] = dialogs(canvas);
        const style = getComputedStyle(modal);
        await expect(style.paddingTop, 'Modal/pad').toBe(`${tokenLength(canvasElement, '--modal-pad-x-default')}px`);
        await expect(style.rowGap, 'Modal/stack-md').toBe(`${tokenLength(canvasElement, '--modal-stack-md')}px`);
        const header = modal.querySelector('.plus-dialog-header');
        const footer = modal.querySelector('.plus-dialog-footer');
        await expect(getComputedStyle(header).gap, 'Modal header gap').toBe(`${tokenLength(canvasElement, '--modal-inline-sm')}px`);
        await expect(getComputedStyle(header).gap, 'Modal header gap is 8px').toBe('8px');
        await expect(getComputedStyle(footer).gap, 'Modal footer gap').toBe(`${tokenLength(canvasElement, '--modal-inline-sm')}px`);
        await expect(getComputedStyle(footer).gap, 'Modal footer gap is 8px').toBe('8px');
        await expect(style.borderTopLeftRadius, 'Modal/radius').toBe(`${tokenLength(canvasElement, '--modal-radius')}px`);
        await expect(style.borderTopLeftRadius, 'Modal radius is 16').toBe('16px');
        await expect(getComputedStyle(footer).borderBottomLeftRadius, 'footer inner corners are square').toBe('0px');
        const overlayStyle = getComputedStyle(overlay);
        await expect(overlayStyle.paddingLeft, 'Overlay/pad-x').toBe(`${tokenLength(canvasElement, '--blanket-pad-x')}px`);
        await expect(overlayStyle.paddingTop, 'Overlay/pad-y').toBe(`${tokenLength(canvasElement, '--blanket-pad-y')}px`);
        await inEveryColorModeOf(canvasElement, async (mode, token) => {
            await expect(getComputedStyle(overlay).backgroundColor, `blanket fill (${mode})`).toBe(token('--ds-blanket'));
            await expect(getComputedStyle(modal).backgroundColor, `overlay material (${mode})`).toBe(token('--ds-surface-material-overlay'));
            await expect(getComputedStyle(modal).outlineColor, `material edge (${mode})`).toBe(token('--ds-border-material'));
            await expect(getComputedStyle(modal).boxShadow, `shadow blocking (${mode})`).toBe(probe(canvasElement, 'boxShadow', 'var(--ds-shadow-blocking)'));
        });
    },
};

/** 4-col · 6-col · 8-col · 10-col at the 1024 screen: 347 · 512 · 677 · 843. */
export const Widths = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-xl)' }}>
            {MODAL_WIDTHS.map((width) => (
                <Demo.ModalStage key={width} title={`width="${width}"`} width={width} screenHeight={320} footer={footerActions}>
                    {bodyCopy}
                </Demo.ModalStage>
            ))}
        </div>
    ),
    play: async ({ canvas, canvasElement }) => {
        await settleAnimations(canvasElement);
        const modals = dialogs(canvas);
        for (const [i, width] of MODAL_WIDTHS.entries()) {
            await expect(modals[i].getBoundingClientRect().width, `width ${width} at 1024`).toBeCloseTo(WIDTHS_AT_1024[width], 0);
        }
    },
};

/** Hug grows with its content up to the screen less the blanket pad, then scrolls; Fill sits at that height. */
export const Heights = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-xl)' }}>
            <Demo.ModalStage title='height="hug", short' screenHeight={SCREEN.height} footer={footerActions}>
                {bodyCopy}
            </Demo.ModalStage>
            <Demo.ModalStage title='height="hug", long' screenHeight={SCREEN.height} footer={footerActions}>
                {longBody}
            </Demo.ModalStage>
            <Demo.ModalStage title='height="fill"' screenHeight={SCREEN.height} height="fill" footer={footerActions}>
                {bodyCopy}
            </Demo.ModalStage>
        </div>
    ),
    play: async ({ canvas, canvasElement }) => {
        await settleAnimations(canvasElement);
        const [short, long] = dialogs(canvas);
        const cap = SCREEN.height - 2 * tokenLength(canvasElement, '--blanket-pad-y');
        await expect(short.getBoundingClientRect().height, 'a short hug modal hugs').toBeLessThan(cap);
        await expect(long.getBoundingClientRect().height, 'a long hug modal stops at the cap').toBeCloseTo(cap, 0);
        const body = long.querySelector('.plus-dialog-body');
        await expect(body.scrollHeight, 'the long body scrolls').toBeGreaterThan(body.clientHeight);
        await expect(body, 'a body that scrolls is a tab stop').toHaveAttribute('tabindex', '0');
    },
};

const fields = (rows) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
        {rows.map(([label, value]) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                <span style={{ font: 'var(--heading-xs)', color: 'var(--ds-text)' }}>{label}</span>
                <span style={{ font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>{value}</span>
            </div>
        ))}
    </div>
);

const STUDENTS = ['Ana Ruiz', 'Ben Okafor', 'Chloe Tran', 'Diego Alvarez', 'Emma Chen', 'Farah Haddad', 'Gabe Miller', 'Hana Sato', 'Isaac Reyes', 'Jada Brooks', 'Kai Nguyen', 'Lena Fischer'];

const sessionTabs = [
    {
        key: 'details',
        label: 'Details',
        content: fields([['Tutor', 'Kim Lee'], ['Time', 'Thursday, 4:30–5:15 PM'], ['Location', 'Room 204 · Lincoln High']]),
    },
    {
        key: 'students',
        label: 'Students',
        content: fields(STUDENTS.map((name, i) => [name, `Lincoln Middle · session ${i + 1} · attended, notes filed`])),
    },
    { key: 'notes', label: 'Notes', content: bodyCopy },
];

const saveActions = (
    <FooterActions>
        <Button text="Discard" onClick={() => {}} />
        <Button text="Save" appearance="primary" onClick={() => {}} />
    </FooterActions>
);

export const Tabs = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-xl)' }}>
            <Demo.ModalStage title="Session settings" screenHeight={SCREEN.height} tabs={sessionTabs} footer={saveActions} />
            <Modal
                inline
                show
                screenWidth={SCREEN.width}
                screenHeight={SCREEN.height}
                title="Session settings"
                width="8-col"
                height="fill"
                tabs={sessionTabs}
                defaultActiveTab="students"
                onClose={() => {}}
                footer={saveActions}
            />
        </div>
    ),
    play: async ({ canvas, canvasElement }) => {
        await settleAnimations(canvasElement);
        const [hug, fill] = dialogs(canvas);
        const cap = SCREEN.height - 2 * tokenLength(canvasElement, '--blanket-pad-y');
        const tabsOf = (modal) => within(modal).getAllByRole('tab');
        const panelOf = (modal) => within(modal).getByRole('tabpanel');

        const group = hug.querySelector('.plus-dialog-header-group');
        await expect(group.querySelector('[role="tablist"]'), 'the tablist is in the header').not.toBeNull();
        await expect(getComputedStyle(group).rowGap, 'Modal/stack-sm').toBe(`${tokenLength(canvasElement, '--modal-stack-sm')}px`);

        await userEvent.click(tabsOf(hug)[0]);
        await expect(panelOf(hug)).toHaveAttribute('aria-labelledby', tabsOf(hug)[0].id);
        await userEvent.keyboard('{ArrowRight}');
        await expect(tabsOf(hug)[1]).toHaveFocus();
        await expect(tabsOf(hug)[1]).toHaveAttribute('aria-selected', 'true');
        await userEvent.keyboard('{Home}');
        await expect(tabsOf(hug)[0]).toHaveFocus();
        await expect(tabsOf(hug)[0]).toHaveAttribute('aria-selected', 'true');

        await expect(hug.getBoundingClientRect().height, 'a short tab hugs').toBeLessThan(cap);
        await userEvent.click(within(hug).getByRole('tab', { name: 'Students' }));
        await waitFor(() => expect(hug.getBoundingClientRect().height, 'a long tab stops at the cap').toBeCloseTo(cap, 0));

        await expect(fill.getBoundingClientRect().height, 'fill sits at the cap').toBeCloseTo(cap, 0);
        const body = panelOf(fill);
        await expect(body.scrollHeight, 'the long tab scrolls').toBeGreaterThan(body.clientHeight);
    },
};

export const BodyMinHeight = {
    render: () => (
        <Demo.ModalStage title="Short body" screenHeight={320} footer={saveActions}>
            <p style={{ margin: 0, font: 'var(--body-default)' }}>One line.</p>
        </Demo.ModalStage>
    ),
    play: async ({ canvasElement }) => {
        await settleAnimations(canvasElement);
        const body = canvasElement.querySelector('.plus-dialog-body');
        await expect(getComputedStyle(body).minHeight, 'Modal/body-min-height').toBe('80px');
    },
};

export const CustomHeader = {
    render: () => (
        <Demo.ModalStage
            screenHeight={320}
            ariaLabel="Reschedule session"
            header={(
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <strong style={{ font: 'var(--heading-md)' }}>Reschedule</strong>
                    <Button text="Help" spacing="compact" onClick={() => {}} />
                </div>
            )}
            footer={saveActions}
        >
            {bodyCopy}
        </Demo.ModalStage>
    ),
    play: async ({ canvas, canvasElement }) => {
        await settleAnimations(canvasElement);
        const [modal] = dialogs(canvas);
        await expect(modal).toHaveAttribute('aria-label', 'Reschedule session');
        await expect(within(modal).getByRole('button', { name: 'Help' })).toBeInTheDocument();
        await expect(within(modal).queryByRole('button', { name: 'Close' })).toBeNull();
    },
};

export const Divider = {
    render: () => (
        <Demo.ModalStage title="Session notes" screenHeight={320} dividers footer={saveActions}>
            {bodyCopy}
        </Demo.ModalStage>
    ),
    play: async ({ canvasElement }) => {
        await settleAnimations(canvasElement);
        await expect(canvasElement.querySelectorAll('.plus-dialog-divider')).toHaveLength(2);
    },
};

export const Loading = {
    render: () => (
        <Demo.ModalStage title="Session details" screenHeight={320} loading footer={saveActions}>
            {bodyCopy}
        </Demo.ModalStage>
    ),
    play: async ({ canvasElement }) => {
        await settleAnimations(canvasElement);
        const body = canvasElement.querySelector('.plus-dialog-body');
        await expect(body).toHaveAttribute('aria-busy', 'true');
        await expect(canvasElement.querySelector('.plus-dialog-skeleton')).not.toBeNull();
    },
};

const widthStory = (width) => ({
    render: () => (
        <Demo.ModalStage title={`width="${width}"`} width={width} screenHeight={320} footer={footerActions}>
            {bodyCopy}
        </Demo.ModalStage>
    ),
    play: async ({ canvas, canvasElement }) => {
        await settleAnimations(canvasElement);
        const [modal] = dialogs(canvas);
        await expect(modal.getBoundingClientRect().width, `${width} at 1024`).toBeCloseTo(WIDTHS_AT_1024[width], 0);
    },
});

export const Width4Col = widthStory('4-col');
export const Width6Col = widthStory('6-col');
export const Width8Col = widthStory('8-col');
export const Width10Col = widthStory('10-col');

export const HugLong = {
    render: () => (
        <Demo.ModalStage title='height="hug"' screenHeight={SCREEN.height} footer={footerActions}>
            {longBody}
        </Demo.ModalStage>
    ),
};

export const HeightFill = {
    render: () => (
        <Modal inline show screenWidth={SCREEN.width} screenHeight={SCREEN.height} title='height="fill"' height="fill" onClose={() => {}} footer={footerActions}>
            {bodyCopy}
        </Modal>
    ),
};

export const TabsStill = {
    name: 'Tabs',
    render: () => (
        <Demo.ModalStage title="Session settings" screenHeight={SCREEN.height} tabs={sessionTabs} footer={saveActions} />
    ),
};

export const Interactive = {
    args: {
        title: 'Move session',
        width: '6-col',
        height: 'hug',
    },
    render: (args) => (
        <Modal
            inline
            show
            screenWidth={SCREEN.width}
            screenHeight={SCREEN.height}
            title={args.title}
            width={args.width}
            height={args.height}
            onClose={() => {}}
            footer={footerActions}
        >
            {longBody}
        </Modal>
    ),
};

/* ---------------------------------------------------------------------------
 * Live modal behavior (portal, focus move, Escape, Blanket press, scroll lock,
 * single-overlay slot, confirm view swap, blocking shadow, z-index layers).
 * ------------------------------------------------------------------------- */

export const LiveBehavior = () => {
    const [open, setOpen] = useState(false);
    const [blanket, setBlanket] = useState(true);
    return (
        <div style={{ display: 'flex', gap: 'var(--inline-sm)' }}>
            <Button text="Open modal" onClick={() => setOpen(true)} />
            <Button text="Toggle static" onClick={() => setBlanket((b) => (b === true ? 'static' : true))} />
            <Modal
                show={open}
                blanket={blanket}
                title="Confirm schedule"
                body="Focus moves into the Dialog, Escape or a Blanket press closes it, and body scroll is locked."
                secondaryButton={{ text: 'Keep editing', onClick: () => setOpen(false) }}
                primaryButton={{ text: 'Confirm', onClick: () => setOpen(false) }}
                onClose={() => setOpen(false)}
            />
        </div>
    );
};

LiveBehavior.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const doc = documentOf(canvasElement);
    const ownerDoc = canvasElement.ownerDocument;
    const trigger = canvas.getByRole('button', { name: 'Open modal' });

    await userEvent.click(trigger);
    const dialog = await doc.findByRole('dialog', { name: 'Confirm schedule' });
    await settleAnimations(ownerDoc.body);

    // 1. Focus moves into the Dialog.
    await expect(dialog.contains(ownerDoc.activeElement), 'focus moves inside the Dialog').toBe(true);

    // 2. Scroll lock on html or body while open.
    const locked = getComputedStyle(ownerDoc.documentElement).overflowY === 'hidden'
        || getComputedStyle(ownerDoc.body).overflowY === 'hidden'
        || ownerDoc.documentElement.style.overflow === 'hidden'
        || ownerDoc.body.style.overflow === 'hidden';
    await expect(locked, 'scroll is locked while Modal is open').toBe(true);

    // 3. Escape closes and returns focus to trigger.
    await userEvent.keyboard('{Escape}');
    await expectDialogGone(canvasElement, 'Confirm schedule');
    await expect(ownerDoc.activeElement, 'focus returns to trigger').toBe(trigger);

    // 4. Blanket press closes when blanket={true}.
    await userEvent.click(trigger);
    const reopened = await doc.findByRole('dialog', { name: 'Confirm schedule' });
    await settleAnimations(ownerDoc.body);
    const blanket = reopened.closest('.plus-pattern-blanket');
    await expect(blanket).not.toBeNull();
    fireEvent.mouseDown(blanket);
    fireEvent.click(blanket);
    await expectDialogGone(canvasElement, 'Confirm schedule');

    // 5. Static blanket refuses to close on Blanket press.
    await userEvent.click(canvas.getByRole('button', { name: 'Toggle static' }));
    await userEvent.click(trigger);
    const staticDialog = await doc.findByRole('dialog', { name: 'Confirm schedule' });
    await settleAnimations(ownerDoc.body);
    const staticBlanket = staticDialog.closest('.plus-pattern-blanket');
    fireEvent.mouseDown(staticBlanket);
    fireEvent.click(staticBlanket);
    await expect(doc.getByRole('dialog', { name: 'Confirm schedule' }), 'static blanket keeps Modal open').toBeInTheDocument();
    await userEvent.click(doc.getByRole('button', { name: 'Close' }));
    await expectDialogGone(canvasElement, 'Confirm schedule');
};

export const StaticBlanketRefusesToClose = () => {
    const [open, setOpen] = useState(true);
    const [closes, setCloses] = useState(0);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
            <Modal
                id="mdis-uploading"
                show={open}
                blanket="static"
                keyboard={false}
                title="Uploading transcript"
                body="Leaving now would discard it."
                showBottomButtons={false}
                onClose={() => {
                    setCloses((n) => n + 1);
                    setOpen(false);
                }}
            />
            <p data-testid="close-count">{closes}</p>
        </div>
    );
};

StaticBlanketRefusesToClose.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const doc = documentOf(canvasElement);
    const closes = canvas.getByTestId('close-count');

    await doc.findByText('Uploading transcript');
    await userEvent.keyboard('{Escape}');
    await expect(closes).toHaveTextContent('0');
    await expect(doc.getByText('Uploading transcript')).toBeInTheDocument();

    const blanket = canvasElement.ownerDocument.querySelector('.plus-pattern-blanket');
    await expect(blanket).not.toBeNull();
    blanket.click();
    await expect(closes).toHaveTextContent('0');
    await expect(doc.getByText('Uploading transcript')).toBeInTheDocument();

    await userEvent.click(doc.getByRole('button', { name: 'Close' }));
    await expectDialogGone(canvasElement, 'Uploading transcript');
    await expect(closes).toHaveTextContent('1');
};

export const BlockingShadow = () => (
    <Modal show title="Confirm schedule" body="This opens over the page." primaryButton={{ text: 'Confirm', onClick: () => {} }} onClose={() => {}} />
);

BlockingShadow.play = async ({ canvasElement }) => {
    const doc = documentOf(canvasElement);
    const dialog = await doc.findByRole('dialog', { name: 'Confirm schedule' });
    await settleAnimations(canvasElement.ownerDocument.body);
    await inEveryColorModeOf(canvasElement, async (mode) => {
        await expect(getComputedStyle(dialog).backgroundColor, `surface-overlay in ${mode}`)
            .toBe(probe(canvasElement, 'backgroundColor', 'var(--ds-surface-material-overlay)'));
        await expect(getComputedStyle(dialog).boxShadow, `shadow-blocking in ${mode}`)
            .toBe(probe(canvasElement, 'boxShadow', 'var(--ds-shadow-blocking)'));
    });
};

const OPTIONS = ['Lincoln Middle', 'Roosevelt K-8', 'North High', 'South High'].map((label) => ({ value: label.toLowerCase(), label }));

export const SelectKeepsOverlayShadow = () => (
    <Modal show title="Assign site" showBottomButtons={false} onClose={() => {}}>
        <Select label="Site" options={OPTIONS} />
    </Modal>
);

SelectKeepsOverlayShadow.play = async ({ canvasElement }) => {
    const doc = documentOf(canvasElement);
    await doc.findByRole('dialog', { name: 'Assign site' });
    await userEvent.click(doc.getByRole('combobox', { name: 'Site' }));
    const listbox = await doc.findByRole('listbox');
    const option = within(listbox).getByRole('option', { name: 'South High' });
    const overlay = doc.getByText('Assign site').closest('.plus-pattern-blanket');
    await expect(listbox.closest('.plus-pattern-blanket')).toBe(overlay);
    await expect(getComputedStyle(listbox.closest('.plus-listbox')).zIndex).toBe('510');
    await settleAnimations(canvasElement.ownerDocument.body);
    const box = option.getBoundingClientRect();
    const hit = canvasElement.ownerDocument.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    await expect(option.contains(hit)).toBe(true);
    await expect(getComputedStyle(listbox.closest('.plus-listbox')).boxShadow)
        .toBe(probe(canvasElement, 'boxShadow', 'var(--ds-shadow-overlay)'));
};

/* ---------------------------------------------------------------------------
 * Template page examples (Templates/Modal): Types, Anatomy, Widths, Tiers,
 * Footers, Key states, Stacking, Blanket, Motion.
 * ------------------------------------------------------------------------- */

const STAGE = 1024;
const rect = (el) => el.getBoundingClientRect();

const buttonsInside = async (canvasElement) => {
    fitsCanvas(canvasElement);
    const modalEl = canvasElement.querySelector('.plus-dialog');
    const modal = rect(modalEl);
    const scale = modalEl.offsetWidth > 0 ? modal.width / modalEl.offsetWidth : 1;
    const padX = (parseFloat(getComputedStyle(modalEl).paddingLeft) || 0) * scale;
    const padY = (parseFloat(getComputedStyle(modalEl).paddingBottom) || 0) * scale;
    const footer = canvasElement.querySelector('[data-probe="footer"]');
    const box = footer ? rect(footer) : modal;
    if (footer) {
        await expect(box.bottom, 'the footer sits inside the Modal’s bottom padding').toBeCloseTo(modal.bottom - padY, 0);
        await expect(box.left, 'the footer sits inside the Modal’s left padding').toBeCloseTo(modal.left + padX, 0);
        await expect(box.right, 'the footer sits inside the Modal’s right padding').toBeCloseTo(modal.right - padX, 0);
    }
    for (const button of canvasElement.querySelectorAll('.plus-dialog-footer button')) {
        const b = rect(button);
        await expect(b.left, 'a footer button starts inside its container').toBeGreaterThanOrEqual(box.left - 0.5);
        await expect(b.right, 'a footer button ends inside its container').toBeLessThanOrEqual(box.right + 0.5);
        await expect(b.bottom, 'a footer button ends inside the Modal').toBeLessThanOrEqual(modal.bottom + 0.5);
        await expect(b.height, 'button fills the footer’s height').toBeCloseTo(box.height, 0);
        await expect(button.scrollWidth, 'a button’s label fits its box').toBeLessThanOrEqual(button.clientWidth + 1);
    }
};

const sized = (story, width = STAGE) => <ScrollStage width={width}>{story}</ScrollStage>;

export const TypePassive = {
    name: 'Type: Passive',
    render: () => sized(<Demo.Passive />),
    play: async ({ canvas, canvasElement }) => {
        await settleAnimations(canvasElement);
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        fitsCanvas(canvasElement);
        await expect(canvasElement.querySelector('.plus-dialog-footer'), 'Passive has no footer').toBeNull();
        const close = canvas.getByRole('button', { name: 'Close' });
        await expect(close, 'Close is the way out').toBeInTheDocument();
        close.focus();
        await expect(close).toHaveFocus();
    },
};

export const TypeActive = {
    name: 'Type: Active',
    render: () => sized(<Demo.Active />),
    play: async ({ canvas, canvasElement }) => {
        await settleAnimations(canvasElement);
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const footer = canvasElement.querySelector('[data-probe="footer"]');
        const tracks = footerTracks(footer);
        const discard = canvas.getByRole('button', { name: 'Discard' });
        const action = canvas.getByRole('button', { name: 'Move session' });
        await expect(within(footer).queryByRole('button', { name: 'Cancel' }), 'no Cancel in footers').toBeNull();
        await expect(rect(discard).left, 'secondary starts on track 1').toBeCloseTo(tracks.span(1, 2).left, 0);
        await expect(rect(discard).right, 'secondary ends on track 2').toBeCloseTo(tracks.span(1, 2).right, 0);
        await expect(rect(action).left, 'primary starts on track 3').toBeCloseTo(tracks.span(3, 4).left, 0);
        await expect(rect(action).right, 'primary ends on track 4').toBeCloseTo(tracks.span(3, 4).right, 0);
        await buttonsInside(canvasElement);
        action.focus();
        await expect(action).toHaveFocus();
    },
};

export const TypeAcknowledge = {
    name: 'Type: Acknowledge',
    render: () => sized(<Demo.Acknowledge />),
    play: async ({ canvas, canvasElement }) => {
        await settleAnimations(canvasElement);
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const footer = canvasElement.querySelector('[data-probe="footer"]');
        const tracks = footerTracks(footer);
        const gotIt = canvas.getByRole('button', { name: 'Got it' });
        const button = rect(gotIt);
        await expect(button.left, 'one button starts on track 3').toBeCloseTo(tracks.span(3, 4).left, 0);
        await expect(button.right, 'one button ends on track 4').toBeCloseTo(tracks.span(3, 4).right, 0);
        await buttonsInside(canvasElement);
        gotIt.focus();
        await expect(gotIt).toHaveFocus();
    },
};

export const TypeSteps = {
    name: 'Type: Steps',
    render: () => sized(<Demo.Steps />),
    play: async ({ canvas, canvasElement }) => {
        await settleAnimations(canvasElement);
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const footer = canvasElement.querySelector('[data-probe="footer"]');
        const tracks = footerTracks(footer);
        await expect(canvasElement.querySelector('.plus-dialog').offsetWidth, '10-col at 1024').toBeCloseTo(WIDTHS_AT_1024['10-col'], 0);
        await expect(canvas.getByRole('navigation', { name: 'Steps' }), 'the steps run across the top').toHaveClass('plus-progress-tracker--horizontal');
        await expect(within(footer).queryByRole('button', { name: 'Cancel' }), 'no Cancel in steps footer').toBeNull();
        const back = rect(canvas.getByRole('button', { name: 'Back' }));
        const next = rect(canvas.getByRole('button', { name: 'Next' }));
        await expect(back.left, 'Back starts on track 1').toBeCloseTo(tracks.span(1, 2).left, 0);
        await expect(back.right, 'Back ends on track 2').toBeCloseTo(tracks.span(1, 2).right, 0);
        await expect(next.left, 'Next starts on track 3').toBeCloseTo(tracks.span(3, 4).left, 0);
        await expect(next.right, 'Next ends on track 4').toBeCloseTo(tracks.span(3, 4).right, 0);
        await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
        await expect(canvas.getByRole('button', { name: 'Schedule' }), 'on the last step Next takes the outcome’s name').toBeInTheDocument();
        await buttonsInside(canvasElement);
    },
};

const ANATOMY_PARTS = [
    { selector: '.plus-pattern-blanket', label: 'Blanket', side: 'end', at: 'start', holds: true },
    { selector: '.plus-dialog-header', label: 'Header', at: 'start' },
    { selector: '.plus-dialog-body', label: 'Body', at: 'middle' },
    { selector: '[data-probe="footer"]', label: 'Footer', at: 'end' },
];

export const AnatomyActive = {
    name: 'Anatomy: Active, 8-col',
    render: () => (
        <LiveAnatomy live scrollable width={STAGE} title="An 8-col Active Modal with its parts numbered" parts={ANATOMY_PARTS}>
            <Demo.ActiveForm />
        </LiveAnatomy>
    ),
    play: async ({ canvas, canvasElement }) => {
        await settleAnimations(canvasElement);
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        fitsCanvas(canvasElement);
        await markersLevelWithParts(canvasElement, ANATOMY_PARTS);
        const body = canvasElement.querySelector('.plus-dialog-body');
        await expect(body.scrollHeight, 'the body shows every field whole: nothing clips').toBeLessThanOrEqual(body.clientHeight + 1);
        leadersCrossNoOtherPart(canvasElement, ANATOMY_PARTS);
        const modal = canvasElement.querySelector('.plus-dialog');
        await expect(getComputedStyle(modal).paddingTop, 'pad 16 on every side').toBe(`${tokenLength(canvasElement, '--modal-pad-x-default')}px`);
        await expect(getComputedStyle(modal).borderTopLeftRadius, 'radius 16').toBe(`${tokenLength(canvasElement, '--modal-radius')}px`);
        // Form in a Modal: fields 40px, footer buttons 32px.
        const student = canvas.getByLabelText(/Student/);
        const fieldBox = student.closest('.plus-field');
        await expect(rect(fieldBox).height, 'Modal form fields are 40 high').toBeCloseTo(40, 0);
        const saveBtn = canvas.getByRole('button', { name: 'Save session' });
        await expect(rect(saveBtn).height, 'Modal form footer buttons are 32 high').toBeCloseTo(32, 0);
        await userEvent.clear(student);
        await userEvent.type(student, 'Ben Okafor');
        await expect(student).toHaveValue('Ben Okafor');
    },
};

export const WidthStrip = {
    render: () => (
        <ScrollStage width={STAGE}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-xl)' }}>
                {MODAL_WIDTHS.map((width) => (
                    <Demo.ModalStage key={width} width={width} screenHeight={240} title={width} footer={<Demo.TwoCells action="Save" />}>
                        <p style={{ margin: 0, font: 'var(--body-default)' }}>{`${width} on the 1024 screen grid.`}</p>
                    </Demo.ModalStage>
                ))}
            </div>
        </ScrollStage>
    ),
    play: async ({ canvas, canvasElement }) => {
        await settleAnimations(canvasElement);
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        fitsCanvas(canvasElement);
        const modals = canvas.getAllByRole('dialog');
        for (const [i, width] of MODAL_WIDTHS.entries()) {
            await expect(modals[i].offsetWidth, `${width} matches the grid at 1024`).toBeCloseTo(WIDTHS_AT_1024[width], 0);
        }
        await expect(modals[0].offsetWidth, 'widths step up').toBeLessThan(modals[1].offsetWidth);
        await expect(modals[1].offsetWidth, 'widths step up').toBeLessThan(modals[2].offsetWidth);
        await expect(modals[2].offsetWidth, 'widths step up').toBeLessThan(modals[3].offsetWidth);
    },
};

export const ResponsiveWidth = {
    name: 'Width behavior',
    args: { width: STAGE },
    parameters: { controls: { include: ['width'] } },
    argTypes: {
        width: { control: { type: 'range', min: 768, max: 1440, step: 8 }, description: 'The screen’s width, in px.', table: { category: 'Docs' } },
    },
    render: ({ width }) => (
        <ScrollStage width={width}>
            <Demo.ModalStage width="8-col" screenWidth={width} screenHeight={260} title="Session settings" footer={<Demo.TwoCells action="Save" />}>
                <p style={{ margin: 0, font: 'var(--body-default)' }}>The Modal takes its width from the screen grid.</p>
            </Demo.ModalStage>
        </ScrollStage>
    ),
    play: async ({ canvas, canvasElement }) => {
        await settleAnimations(canvasElement);
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        fitsCanvas(canvasElement);
        const blanket = canvasElement.querySelector('.plus-pattern-blanket');
        const modal = canvas.getByRole('dialog');
        const at = (screen) => {
            blanket.style.setProperty('--plus-overlay-screen', `${screen}px`);
            return modal.offsetWidth;
        };
        const small = at(768);
        const mid = at(1024);
        const large = at(1440);
        await expect(mid, '8-col at 1024').toBeCloseTo(WIDTHS_AT_1024['8-col'], 0);
        await expect(small, 'narrower screen, narrower Modal').toBeLessThan(mid);
        await expect(large, 'wider screen, wider Modal').toBeGreaterThan(mid);
    },
};

export const TierActive = { name: 'Tier: Active', render: () => sized(<Demo.TierActive />), play: async ({ canvasElement }) => {
    await settleAnimations(canvasElement); await buttonsInside(canvasElement);
} };

export const TierDanger = {
    name: 'Tier: Active with Danger',
    render: () => sized(<Demo.TierDanger />),
    play: async ({ canvas, canvasElement }) => {
        await settleAnimations(canvasElement);
        const footer = canvasElement.querySelector('[data-probe="footer"]');
        const tracks = footerTracks(footer);
        const safer = canvas.getByRole('button', { name: 'Archive instead' });
        const danger = canvas.getByRole('button', { name: 'Delete note' });
        await expect(safer, 'safer alternative is default secondary').toHaveClass('plus-btn--default');
        await expect(danger, 'the action takes the Danger appearance').toHaveClass('plus-btn--danger');
        await expect(rect(safer).left, 'safer alternative starts on track 1').toBeCloseTo(tracks.span(1, 2).left, 0);
        await expect(rect(safer).right, 'safer alternative ends on track 2').toBeCloseTo(tracks.span(1, 2).right, 0);
        await expect(rect(danger).left, 'danger primary starts on track 3').toBeCloseTo(tracks.span(3, 4).left, 0);
        await expect(rect(danger).right, 'danger primary ends on track 4').toBeCloseTo(tracks.span(3, 4).right, 0);
        await buttonsInside(canvasElement);
    },
};

export const TierTypeName = {
    name: 'Tier: Danger, type the name',
    render: () => sized(<Demo.TierTypeName />),
    play: async ({ canvas, canvasElement }) => {
        await settleAnimations(canvasElement);
        await expect(canvas.getByRole('button', { name: 'Delete group' }), 'Danger waits for the name').toHaveAttribute('aria-disabled', 'true');
        await expect(canvas.getByText('Type Fractions group to enable Delete group.'), 'the caption carries the reason').toBeVisible();
        await userEvent.type(canvas.getByRole('textbox', { name: /Group name/ }), 'Fractions group');
        await waitFor(() => expect(canvas.getByRole('button', { name: 'Delete group' })).not.toHaveAttribute('aria-disabled', 'true'));
        await buttonsInside(canvasElement);
    },
};

export const FooterOne = {
    name: 'Footer: One button',
    render: () => sized(<Demo.Acknowledge />),
    play: async ({ canvasElement }) => {
        await settleAnimations(canvasElement);
        const footer = canvasElement.querySelector('[data-probe="footer"]');
        const tracks = footerTracks(footer);
        const [button] = footer.querySelectorAll('button');
        await expect(footer.offsetHeight, 'the footer is 48 high').toBeCloseTo(tokenLength(footer, BAR_TOKEN), 0);
        await expect(rect(button).left, '1 button starts on track 3').toBeCloseTo(tracks.span(3, 4).left, 0);
        await expect(rect(button).right, '1 button ends on track 4').toBeCloseTo(tracks.span(3, 4).right, 0);
        await buttonsInside(canvasElement);
    },
};

export const FooterTwo = {
    name: 'Footer: Two buttons',
    render: () => sized(<Demo.Active />),
    play: async ({ canvasElement }) => {
        await settleAnimations(canvasElement);
        const footer = canvasElement.querySelector('[data-probe="footer"]');
        const tracks = footerTracks(footer);
        const [secondary, primary] = [...footer.querySelectorAll('button')];
        await expect(within(footer).queryByRole('button', { name: 'Cancel' }), 'no Cancel in footers').toBeNull();
        await expect(secondary, 'secondary is default appearance').toHaveClass('plus-btn--default');
        await expect(primary, 'primary is rightmost').toHaveClass('plus-btn--primary');
        await expect(rect(secondary).left, 'secondary starts on track 1').toBeCloseTo(tracks.span(1, 2).left, 0);
        await expect(rect(secondary).right, 'secondary ends on track 2').toBeCloseTo(tracks.span(1, 2).right, 0);
        await expect(rect(primary).left, 'primary starts on track 3').toBeCloseTo(tracks.span(3, 4).left, 0);
        await expect(rect(primary).right, 'primary ends on track 4').toBeCloseTo(tracks.span(3, 4).right, 0);
        await buttonsInside(canvasElement);
    },
};

export const FooterThree = {
    name: 'Footer: Three buttons',
    render: () => sized(<Demo.ModalStage title="Schedule session" footer={<Demo.ThreeCells />}><p style={{ margin: 0, font: 'var(--body-default)' }}>Save it as a draft, or schedule it now.</p></Demo.ModalStage>),
    play: async ({ canvasElement }) => {
        await settleAnimations(canvasElement);
        const footer = canvasElement.querySelector('[data-probe="footer"]');
        const tracks = footerTracks(footer);
        const buttons = [...footer.querySelectorAll('button')];
        await expect(buttons, 'three cells').toHaveLength(3);
        await expect(buttons[0].className, 'only the last is Primary').not.toContain('primary');
        await expect(buttons[1].className, 'only the last is Primary').not.toContain('primary');
        await expect(buttons[2].className, 'only the last is Primary').toContain('primary');
        await expect(rect(buttons[0]).left, 'first button in track 2').toBeCloseTo(tracks.track(2).left, 0);
        await expect(rect(buttons[1]).left, 'second button in track 3').toBeCloseTo(tracks.track(3).left, 0);
        await expect(rect(buttons[2]).left, 'third button in track 4').toBeCloseTo(tracks.track(4).left, 0);
        await buttonsInside(canvasElement);
    },
};

export const FooterTextLeft = {
    name: 'Footer: Text button left',
    render: () => sized(<Demo.ModalStage title="Schedule session" footer={<Demo.TextLeftCells />}><p style={{ margin: 0, font: 'var(--body-default)' }}>Skip for now, save a draft, or schedule it.</p></Demo.ModalStage>),
    play: async ({ canvasElement }) => {
        await settleAnimations(canvasElement);
        const footer = canvasElement.querySelector('[data-probe="footer"]');
        const tracks = footerTracks(footer);
        const [leading, secondary, primary] = [...footer.querySelectorAll('button')];
        await expect(leading, 'text button is subtle').toHaveClass('plus-btn--subtle');
        await expect(leading, 'text button hugs its label and takes no track').not.toHaveClass('plus-btn--fit-container');
        await expect(rect(leading).left, 'text button hugs the left content edge').toBeCloseTo(tracks.box.left, 0);
        await expect(rect(secondary).left, 'first filled button sits in track 3').toBeCloseTo(tracks.track(3).left, 0);
        await expect(rect(primary).left, 'second filled button sits in track 4').toBeCloseTo(tracks.track(4).left, 0);
        await buttonsInside(canvasElement);
    },
};

export const FooterDestructive = {
    name: 'Footer: Destructive split',
    render: () => sized(<Demo.TierDanger />),
    play: async ({ canvasElement }) => {
        await settleAnimations(canvasElement);
        const footer = canvasElement.querySelector('[data-probe="footer"]');
        const tracks = footerTracks(footer);
        const [safer, danger] = [...footer.querySelectorAll('button')];
        await expect(safer).toHaveClass('plus-btn--default');
        await expect(danger).toHaveClass('plus-btn--danger');
        await expect(rect(safer).left).toBeCloseTo(tracks.span(1, 2).left, 0);
        await expect(rect(danger).left).toBeCloseTo(tracks.span(3, 4).left, 0);
        await buttonsInside(canvasElement);
    },
};

export const FooterNarrow = {
    name: 'Footer: Single action in a narrow container',
    render: () => sized(<Demo.ModalStage width="4-col" title="Session moved" footer={<Demo.OneCell action="Got it" />}><p style={{ margin: 0, font: 'var(--body-default)' }}>Thursday’s session with Ana is now at 4:30 PM.</p></Demo.ModalStage>),
    play: async ({ canvasElement }) => {
        await settleAnimations(canvasElement);
        const footer = canvasElement.querySelector('[data-probe="footer"]');
        const tracks = footerTracks(footer);
        const [button] = footer.querySelectorAll('button');
        await expect(rect(button).left, 'single action in narrow container starts on track 1').toBeCloseTo(tracks.span(1, 4).left, 0);
        await expect(rect(button).right, 'single action in narrow container ends on track 4').toBeCloseTo(tracks.span(1, 4).right, 0);
        await buttonsInside(canvasElement);
    },
};

export const KeyLongContent = {
    name: 'Key state: Long content',
    render: () => sized(<Demo.LongContent />),
    play: async ({ canvasElement }) => {
        await settleAnimations(canvasElement);
        const body = canvasElement.querySelector('.plus-dialog-body');
        const footer = canvasElement.querySelector('.plus-dialog-footer');
        const before = rect(footer).top;
        await expect(body.scrollHeight, 'the body scrolls past the cap').toBeGreaterThan(body.clientHeight);
        body.scrollTop = body.scrollHeight;
        await expect(rect(footer).top, 'the footer never moves').toBe(before);
        await buttonsInside(canvasElement);
    },
};

export const KeyLoading = {
    name: 'Key state: Loading',
    render: () => sized(<Demo.LoadingBody />),
    play: async ({ canvas, canvasElement }) => {
        await settleAnimations(canvasElement);
        await expect(canvasElement.querySelector('.plus-dialog-body .plus-skeleton'), 'the body shows its content’s own loading state').not.toBeNull();
        await expect(canvas.getByRole('heading', { level: 1, name: 'Session history' }), 'the title stays real').toBeInTheDocument();
    },
};

export const KeyConfirmInside = {
    name: 'Key state: Its confirm',
    render: () => sized(<Demo.ConfirmInside />),
    play: async ({ canvas, canvasElement }) => {
        await settleAnimations(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: 'Delete session' }));
        await expect(canvas.getAllByRole('dialog'), 'still one Modal').toHaveLength(1);
        await expect(canvas.getByRole('heading', { level: 1, name: 'Delete session?' }), 'the title swaps in place').toBeInTheDocument();
        await waitFor(() => expect(canvas.getByText(/cannot be undone/), 'a warning SectionMessage says the consequence').toBeVisible());
        await settleAnimations(canvasElement);
        await expect(canvasElement.querySelector('.plus-section-message--warning, [class*="section-message"][class*="warning"]'), 'the message is the warning appearance').not.toBeNull();
        await expect(canvas.getByRole('button', { name: 'Delete session' }), 'the action is Danger').toHaveClass('plus-btn--danger');
        await userEvent.click(canvas.getByRole('button', { name: 'Back' }));
        await expect(canvas.getByRole('heading', { level: 1, name: 'Session details' }), 'Back returns').toBeInTheDocument();
        await buttonsInside(canvasElement);
    },
};

export const StackConfirmOverPanel = {
    name: 'Stacking: Confirm over a Panel',
    render: () => sized(<Demo.ConfirmOverPanel />),
    play: async ({ canvas, canvasElement }) => {
        await settleAnimations(canvasElement);
        fitsCanvas(canvasElement);
        await waitFor(() => expect(canvas.queryByRole('dialog', { name: 'Delete student?' }), 'the confirm is open').not.toBeNull());
        const blanket = canvasElement.querySelector('.plus-pattern-blanket');
        const panel = rect(canvasElement.querySelector('.plus-panel'));
        const cover = rect(blanket);
        await expect(cover.left, 'the confirm’s Blanket covers the Panel').toBeLessThanOrEqual(panel.left + 0.5);
        await expect(cover.right, 'the confirm’s Blanket covers the Panel').toBeGreaterThanOrEqual(panel.right - 0.5);
        await expect(canvas.getByText('Ana Ruiz'), 'the Panel is open under the confirm').toBeInTheDocument();
        await userEvent.click(canvas.getByRole('button', { name: 'Archive instead' }));
        await waitFor(() => expect(canvas.queryByRole('dialog', { name: 'Delete student?' })).toBeNull());
        await expect(canvasElement.ownerDocument.activeElement, 'focus returns to the Panel').toBe(canvas.getByRole('button', { name: 'Delete student' }));
    },
};

export const StackModalOnModalRefused = {
    name: 'Stacking: Confirm inside the Modal',
    render: () => sized(<Demo.ConfirmInside start="confirm" />),
    play: async ({ canvas, canvasElement }) => {
        await settleAnimations(canvasElement);
        fitsCanvas(canvasElement);
        await expect(canvas.getAllByRole('dialog'), 'one Modal, one Blanket').toHaveLength(1);
        await expect(canvasElement.querySelector('.plus-section-message--warning, [class*="section-message"][class*="warning"]')).not.toBeNull();
        await expect(canvas.getByRole('button', { name: 'Delete session' })).toHaveClass('plus-btn--danger');
        const first = openOverlay();
        const warn = console.warn;
        console.warn = () => {};
        try {
            await expect(first).not.toBeNull();
            await expect(openOverlay()).toBeNull();
        } finally {
            console.warn = warn;
            first?.release();
        }
    },
};

/* ---------------------------------------------------------------------------
 * Blanket section stories
 * ------------------------------------------------------------------------- */

const guideFill = (token, percent) => `color-mix(in srgb, var(${token}) ${percent}%, transparent)`;
const bandStyle = (extra) => ({
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    pointerEvents: 'none',
    background: guideFill('--ds-background-information-bold', 24),
    color: 'var(--ds-text-information-bolder)',
    font: 'var(--body-sm)',
    zIndex: 1,
    ...extra,
});

export const BlanketInline = {
    render: () => (
        <Modal inline show screenWidth={768} screenHeight={480} width="6-col" title="Move session" onClose={() => {}} footer={footerWithAction('Move session')}>
            {bodyCopy}
        </Modal>
    ),
    play: async ({ canvas, canvasElement }) => {
        await settleAnimations(canvasElement);
        const overlay = canvasElement.querySelector('.plus-pattern-blanket');
        const modal = canvas.getByRole('dialog');
        await expect(modal.getBoundingClientRect().width, '6-col at 768').toBeCloseTo(384, 0);
        await inEveryColorModeOf(canvasElement, async (mode, token) => {
            await expect(getComputedStyle(overlay).backgroundColor, `blanket in ${mode}`).toBe(token('--ds-blanket'));
        });
    },
};

export const BlanketPads = {
    render: () => (
        <div style={{ position: 'relative', width: 768, maxWidth: '100%' }}>
            <Modal inline show screenWidth={768} screenHeight={520} width="6-col" title="Move session" onClose={() => {}} footer={footerWithAction('Move session')}>
                {bodyCopy}
            </Modal>
            <div data-guide="pad-y" style={bandStyle({ top: 0, left: 0, right: 0, height: 'var(--blanket-pad-y)' })}>pad-y 64</div>
            <div data-guide="pad-y" style={bandStyle({ bottom: 0, left: 0, right: 0, height: 'var(--blanket-pad-y)' })}>pad-y 64</div>
            <div data-guide="pad-x" style={bandStyle({ top: 'var(--blanket-pad-y)', bottom: 'var(--blanket-pad-y)', left: 0, width: 'var(--blanket-pad-x)' })} />
            <div data-guide="pad-x" style={bandStyle({ top: 'var(--blanket-pad-y)', bottom: 'var(--blanket-pad-y)', right: 0, width: 'var(--blanket-pad-x)' })} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        await settleAnimations(canvasElement);
        const overlay = canvasElement.querySelector('.plus-pattern-blanket');
        const style = getComputedStyle(overlay);
        await expect(style.paddingLeft, 'Overlay/pad-x').toBe(`${tokenLength(canvasElement, '--blanket-pad-x')}px`);
        await expect(style.paddingTop, 'Overlay/pad-y').toBe(`${tokenLength(canvasElement, '--blanket-pad-y')}px`);
    },
};

export const BlanketScreenGrid = {
    render: () => {
        const grid = Math.min(1232, Math.max(720, 1024 - 48));
        return (
            <div style={{ position: 'relative', width: 1024, maxWidth: '100%' }}>
                <Modal inline show screenWidth={1024} screenHeight={520} width="6-col" title="Move session" onClose={() => {}} footer={footerWithAction('Move session')}>
                    {bodyCopy}
                </Modal>
                <div
                    data-guide="screen-grid"
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: '50%',
                        width: grid,
                        maxWidth: '100%',
                        transform: 'translateX(-50%)',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
                        columnGap: 'var(--grid-gutter)',
                        pointerEvents: 'none',
                    }}
                >
                    {Array.from({ length: 12 }, (_, i) => (
                        <div key={i} style={{ background: guideFill('--ds-background-danger-bold', 12) }} />
                    ))}
                </div>
            </div>
        );
    },
    play: async ({ canvas, canvasElement }) => {
        await settleAnimations(canvasElement);
        const grid = canvasElement.querySelector('[data-guide="screen-grid"]');
        await expect(grid.children, '12 columns').toHaveLength(12);
        const modal = canvas.getByRole('dialog');
        await expect(modal.getBoundingClientRect().width, '6-col at 1024').toBeCloseTo(512, 0);
    },
};

export const BlanketInteractive = {
    args: { screenWidth: 1024 },
    render: (args) => (
        <Modal inline show screenWidth={args.screenWidth} screenHeight={420} width="6-col" title="Move session" onClose={() => {}} footer={footerWithAction('Move session')}>
            {bodyCopy}
        </Modal>
    ),
};

export const BlanketLayers = {
    render: () => (
        <Modal show title="Move session" onClose={() => {}} footer={footerWithAction('Move session')}>
            {bodyCopy}
        </Modal>
    ),
    play: async ({ canvasElement }) => {
        await settleAnimations(canvasElement.ownerDocument.body);
        const overlay = canvasElement.ownerDocument.querySelector('.plus-pattern-blanket');
        const modal = documentOf(canvasElement).getByRole('dialog');
        const z = (token) => probe(canvasElement, 'zIndex', `var(${token})`, { position: 'relative' });
        await expect(getComputedStyle(overlay).position).toBe('fixed');
        await expect(getComputedStyle(overlay).zIndex, 'blanket layer').toBe(z('--layer-blanket'));
        await expect(getComputedStyle(modal).zIndex, 'modal layer').toBe(z('--layer-modal'));
    },
};

export const BlanketConfirmOverPanel = {
    render: () => (
        <div style={{ position: 'relative', width: 1024, maxWidth: '100%', height: 520, overflow: 'hidden', background: 'var(--ds-surface)' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0 }}>
                <PanelContainer width="var(--panel-width-default)">
                    <PanelHeader title="Session" actions={<PanelCloseAction onClick={() => {}} />} />
                    <PanelBody>
                        <p style={{ margin: 0, font: 'var(--body-default)' }}>Thursday, 4:30 PM with Ana Ruiz.</p>
                    </PanelBody>
                </PanelContainer>
            </div>
            <Modal inline show screenWidth={1024} screenHeight={520} width="6-col" title="Discard changes?" onClose={() => {}} footer={footerWithAction('Discard')} style={{ margin: 'auto' }}>
                <p style={{ margin: 0, font: 'var(--body-default)' }}>Your edits to this session are not saved.</p>
            </Modal>
        </div>
    ),
    play: async ({ canvas, canvasElement }) => {
        await settleAnimations(canvasElement);
        const confirm = canvas.getByRole('dialog', { name: 'Discard changes?' });
        await expect(confirm.getBoundingClientRect().width, '6-col at 1024').toBeCloseTo(512, 0);
        await expect(canvasElement.querySelectorAll('.plus-pattern-blanket').length).toBe(1);
    },
};

const MotionOverlay = () => {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button text="Session details" onClick={() => setOpen(!open)} />
            <Modal inline show={open} title="Session details" onClose={() => setOpen(false)}>
                Notes from the session
            </Modal>
        </>
    );
};
const overlayMotionPlay = (reduced = false) => async ({ canvas, canvasElement }) => {
    const trigger = canvas.getByRole('button', { name: 'Session details' });
    await userEvent.click(trigger);
    const surface = canvasElement.querySelector('.plus-modal');
    await expect(surface).not.toBeNull();
    await expectOverlayExit(surface, () => trigger.click(), reduced);
    await expect(canvasElement.querySelector('.plus-pattern-blanket')).toBeNull();
};
export const MotionOpenClose = { render: MotionOverlay, play: overlayMotionPlay() };
export const MotionReduced = { ...MotionOpenClose, decorators: [withReducedMotion], play: overlayMotionPlay(true) };

const BlanketMotionOverlay = () => {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button text="Session details" onClick={() => setOpen(!open)} />
            <Modal inline show={open} title="Session details" onClose={() => setOpen(false)}>
                Notes from the session
            </Modal>
        </>
    );
};
const blanketMotionPlay = (reduced = false) => async ({ canvas, canvasElement }) => {
    const trigger = canvas.getByRole('button', { name: 'Session details' });
    await userEvent.click(trigger);
    const surface = canvasElement.querySelector('.plus-pattern-blanket');
    await expect(surface).not.toBeNull();
    await expectOverlayExit(surface, () => trigger.click(), reduced);
    await expect(canvasElement.querySelector('.plus-pattern-blanket')).toBeNull();
};
export const BlanketMotionOpenClose = { render: BlanketMotionOverlay, play: blanketMotionPlay() };
export const BlanketMotionReduced = { ...BlanketMotionOpenClose, decorators: [withReducedMotion], play: blanketMotionPlay(true) };
