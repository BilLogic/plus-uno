import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import PatternModal from '@/patterns/PatternModal';
import Backdrop, { BACKDROP_HEIGHTS, BACKDROP_WIDTHS } from '@/patterns/Backdrop';
import { Button } from '@/components';
import { inEveryColorModeOf } from '@/storybook-docs/lib/color-modes.js';
import { probe, tokenLength } from '@/storybook-docs/lib/style-probes.js';
import { LiveAnatomy } from '@/storybook-docs/lib/template-page.jsx';
import { fitsCanvas, leadersCrossNoOtherPart, markersLevelWithParts } from '@/storybook-docs/lib/anatomy-asserts.js';
import { FitStage } from '@/storybook-docs/lib/fit-stage.jsx';
import { openOverlay } from '@/lib/overlay.js';
import { BAR_TOKEN } from '@/storybook-docs/lib/focused-task.jsx';
import * as Demo from './modalDemo.jsx';

/** The stand-in screen the docs draw the overlay at: the Large mode, and a short template. */
const SCREEN = { width: 1024, height: 520 };

/** Figma's Modal/width-modal-* at 1024: 6 · 8 · 10 screen columns plus 2 × 16. */
const WIDTHS_AT_1024 = { sm: 512, md: 677, lg: 843 };

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
    <>
        <Button text="Cancel" spacing="compact" onClick={() => {}} />
        <Button text="Move session" appearance="primary" spacing="compact" onClick={() => {}} />
    </>
);

/** An inline Backdrop at the stand-in screen, holding one modal. */
const InBackdrop = ({ children, height = SCREEN.height }) => (
    <Backdrop inline screenWidth={SCREEN.width} screenHeight={height}>
        {children}
    </Backdrop>
);

const dialogs = (canvasElement) => within(canvasElement).getAllByRole('dialog');

export default {
    title: 'Templates/Modal/Modal',
    component: PatternModal,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        children: { table: { disable: true } },
        style: { table: { disable: true } },
        onClose: { table: { disable: true } },
        footer: { table: { disable: true } },
        title: {
            control: 'text',
            table: { category: 'Slots' },
        },
        width: {
            control: 'inline-radio',
            options: BACKDROP_WIDTHS,
            table: { category: 'Design' },
        },
        height: {
            control: 'inline-radio',
            options: BACKDROP_HEIGHTS,
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

/** A sm, hug modal in its Backdrop: the backdrop, the pads and the modal centered. */
export const Overview = {
    render: () => (
        <InBackdrop>
            <PatternModal title="Move session" onClose={() => {}} footer={footerActions}>
                {bodyCopy}
            </PatternModal>
        </InBackdrop>
    ),
    play: async ({ canvasElement }) => {
        const overlay = canvasElement.querySelector('.plus-pattern-backdrop');
        const [modal] = dialogs(canvasElement);
        const style = getComputedStyle(modal);
        await expect(style.paddingTop, 'Modal/pad').toBe(`${tokenLength(canvasElement, '--modal-pad-x-default')}px`);
        await expect(style.rowGap, 'Modal/stack-md').toBe(`${tokenLength(canvasElement, '--modal-stack-md')}px`);
        await expect(style.borderTopLeftRadius, 'Modal/radius').toBe(`${tokenLength(canvasElement, '--modal-radius')}px`);
        const overlayStyle = getComputedStyle(overlay);
        await expect(overlayStyle.paddingLeft, 'Overlay/pad-x').toBe(`${tokenLength(canvasElement, '--blanket-pad-x')}px`);
        await expect(overlayStyle.paddingTop, 'Overlay/pad-y').toBe(`${tokenLength(canvasElement, '--blanket-pad-y')}px`);
        await inEveryColorModeOf(canvasElement, async (mode, token) => {
            await expect(getComputedStyle(overlay).backgroundColor, `backdrop fill (${mode})`).toBe(token('--ds-blanket'));
            await expect(getComputedStyle(modal).backgroundColor, `surface overlay (${mode})`).toBe(token('--ds-surface-overlay'));
            await expect(getComputedStyle(modal).boxShadow, `shadow overlay (${mode})`).toBe(probe(canvasElement, 'boxShadow', 'var(--ds-shadow-overlay)'));
        });
    },
};

/** sm · md · lg at the 1024 screen: 512 · 677 · 843, as Figma's Large mode draws them. */
export const Widths = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-stack-md)' }}>
            {BACKDROP_WIDTHS.map((width) => (
                <InBackdrop key={width} height={320}>
                    <PatternModal title={`width="${width}"`} width={width} onClose={() => {}} footer={footerActions}>
                        {bodyCopy}
                    </PatternModal>
                </InBackdrop>
            ))}
        </div>
    ),
    play: async ({ canvasElement }) => {
        const modals = dialogs(canvasElement);
        for (const [i, width] of BACKDROP_WIDTHS.entries()) {
            await expect(modals[i].getBoundingClientRect().width, `width ${width} at 1024`).toBeCloseTo(WIDTHS_AT_1024[width], 0);
        }
    },
};

/**
 * Hug grows with its content up to the screen less the overlay pad above and
 * below, then the body scrolls; Fill always sits at that height.
 */
export const Heights = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-stack-md)' }}>
            <InBackdrop>
                <PatternModal title='height="hug", short' onClose={() => {}} footer={footerActions}>
                    {bodyCopy}
                </PatternModal>
            </InBackdrop>
            <InBackdrop>
                <PatternModal title='height="hug", long' onClose={() => {}} footer={footerActions}>
                    {longBody}
                </PatternModal>
            </InBackdrop>
            <InBackdrop>
                <PatternModal title='height="fill"' height="fill" onClose={() => {}} footer={footerActions}>
                    {bodyCopy}
                </PatternModal>
            </InBackdrop>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const [short, long, fill] = dialogs(canvasElement);
        const cap = SCREEN.height - 2 * tokenLength(canvasElement, '--blanket-pad-y');
        await expect(short.getBoundingClientRect().height, 'a short hug modal hugs').toBeLessThan(cap);
        await expect(long.getBoundingClientRect().height, 'a long hug modal stops at the cap').toBeCloseTo(cap, 0);
        await expect(fill.getBoundingClientRect().height, 'fill sits at the cap').toBeCloseTo(cap, 0);
        const body = long.querySelector('.plus-pattern-modal-body');
        await expect(body.scrollHeight, 'the long body scrolls').toBeGreaterThan(body.clientHeight);
        await expect(body, 'a body that scrolls is a tab stop').toHaveAttribute('tabindex', '0');
        await expect(fill.querySelector('.plus-pattern-modal-body')).toHaveAttribute('tabindex', '0');
    },
};

const fields = (rows) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
        {rows.map(([label, value]) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                <span style={{ font: 'var(--heading-xsmall)', color: 'var(--ds-text)' }}>{label}</span>
                <span style={{ font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>{value}</span>
            </div>
        ))}
    </div>
);

const STUDENTS = ['Ana Ruiz', 'Ben Okafor', 'Chloe Tran', 'Diego Alvarez', 'Emma Chen', 'Farah Haddad', 'Gabe Miller', 'Hana Sato', 'Isaac Reyes', 'Jada Brooks', 'Kai Nguyen', 'Lena Fischer'];

/** Three views of one session, the students one long enough to scroll. */
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
    <>
        <Button text="Cancel" spacing="compact" onClick={() => {}} />
        <Button text="Save" appearance="primary" spacing="compact" onClick={() => {}} />
    </>
);

/**
 * A tab group under the title, as `_Modal header` type=tabs: `Tabs` in the
 * header, so it stays put while only the body scrolls. The body is
 * the selected tab's panel. Left and Right move between tabs, Home and End jump
 * to the ends.
 */
export const Tabs = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-stack-md)' }}>
            <InBackdrop>
                <PatternModal title="Session settings" tabs={sessionTabs} onClose={() => {}} footer={saveActions} />
            </InBackdrop>
            <InBackdrop>
                <PatternModal
                    title="Session settings"
                    width="md"
                    height="fill"
                    tabs={sessionTabs}
                    defaultActiveTab="students"
                    onClose={() => {}}
                    footer={saveActions}
                />
            </InBackdrop>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const [hug, fill] = dialogs(canvasElement);
        const cap = SCREEN.height - 2 * tokenLength(canvasElement, '--blanket-pad-y');
        const tabsOf = (modal) => within(modal).getAllByRole('tab');
        const panelOf = (modal) => within(modal).getByRole('tabpanel');
        const selectedOf = (modal) => tabsOf(modal).find((tab) => tab.getAttribute('aria-selected') === 'true');

        // The tabs sit in the header, Modal/stack-sm under the title row.
        const group = hug.querySelector('.plus-pattern-modal-header-group');
        await expect(group.querySelector('[role="tablist"]'), 'the tablist is in the header').not.toBeNull();
        await expect(getComputedStyle(group).rowGap, 'Modal/stack-sm').toBe(`${tokenLength(canvasElement, '--modal-stack-sm')}px`);

        // Keyboard: arrows move selection and focus together; the panel follows.
        await userEvent.click(tabsOf(hug)[0]);
        await expect(panelOf(hug)).toHaveAttribute('aria-labelledby', tabsOf(hug)[0].id);
        await userEvent.keyboard('{ArrowRight}');
        await expect(tabsOf(hug)[1]).toHaveFocus();
        await expect(tabsOf(hug)[1]).toHaveAttribute('aria-selected', 'true');
        await expect(panelOf(hug), 'the panel is named by its tab').toHaveAttribute('aria-labelledby', tabsOf(hug)[1].id);
        await userEvent.keyboard('{End}');
        await expect(tabsOf(hug)[2]).toHaveAttribute('aria-selected', 'true');
        await userEvent.keyboard('{ArrowRight}');
        await expect(tabsOf(hug)[0], 'Right wraps to the first tab').toHaveAttribute('aria-selected', 'true');
        await userEvent.keyboard('{ArrowLeft}');
        await expect(tabsOf(hug)[2], 'Left wraps to the last tab').toHaveAttribute('aria-selected', 'true');
        await userEvent.keyboard('{Home}');
        await expect(tabsOf(hug)[0]).toHaveFocus();
        await expect(tabsOf(hug).filter((tab) => tab.tabIndex === 0), 'one tab stop for the strip').toHaveLength(1);
        await userEvent.tab();
        await expect(panelOf(hug), 'Tab moves from the strip into the panel').toHaveFocus();

        // Hug: a short tab hugs, a long one stops at the cap and scrolls.
        await expect(hug.getBoundingClientRect().height, 'a short tab hugs').toBeLessThan(cap);
        await userEvent.click(within(hug).getByRole('tab', { name: 'Students' }));
        await waitFor(() => expect(hug.getBoundingClientRect().height, 'a long tab stops at the cap').toBeCloseTo(cap, 0));

        // Fill: the tabs stay put while the body scrolls under them.
        await expect(fill.getBoundingClientRect().height, 'fill sits at the cap').toBeCloseTo(cap, 0);
        const body = panelOf(fill);
        const strip = within(fill).getByRole('tablist');
        await expect(body.scrollHeight, 'the long tab scrolls').toBeGreaterThan(body.clientHeight);
        const stripTop = strip.getBoundingClientRect().top;
        body.scrollTop = body.scrollHeight;
        await waitFor(() => expect(body.scrollTop).toBeGreaterThan(0));
        await expect(strip.getBoundingClientRect().top, 'the tabs do not scroll').toBeCloseTo(stripTop, 0);
        await expect(fill.getBoundingClientRect().height, 'switching tabs never resizes a fill modal').toBeCloseTo(cap, 0);
        await userEvent.click(within(fill).getByRole('tab', { name: 'Details' }));
        await expect(panelOf(fill).scrollTop, 'a new tab starts at the top').toBe(0);
        await expect(fill.getBoundingClientRect().height, 'fill holds its height on a short tab').toBeCloseTo(cap, 0);

        await inEveryColorModeOf(canvasElement, async (mode, token) => {
            for (const [name, modal] of [['hug', hug], ['fill', fill]]) {
                const selected = selectedOf(modal);
                await expect(getComputedStyle(selected).color, `${name}: selected tab ink (${mode})`).toBe(token('--ds-text-selected'));
                await expect(getComputedStyle(selected).borderBottomColor, `${name}: selected tab underline (${mode})`).toBe(token('--ds-border-selected'));
                await expect(getComputedStyle(modal).backgroundColor, `${name}: surface overlay (${mode})`).toBe(token('--ds-surface-overlay'));
            }
        });
    },
};

/**
 * The body never draws shorter than Modal/body-min-height 80, however little
 * it holds, as Figma holds it.
 */
export const BodyMinHeight = {
    render: () => (
        <InBackdrop>
            <PatternModal title="Move session" onClose={() => {}} footer={footerActions}>
                <span>Short.</span>
            </PatternModal>
        </InBackdrop>
    ),
    play: async ({ canvasElement }) => {
        const [modal] = dialogs(canvasElement);
        const body = modal.querySelector('.plus-pattern-modal-body');
        await expect(getComputedStyle(body).minHeight, 'Modal/body-min-height').toBe('80px');
        await expect(body.getBoundingClientRect().height).toBeGreaterThanOrEqual(80);
    },
};

/** `header` replaces the title row, as `_Modal header` type=custom; the caller names the dialog. */
export const CustomHeader = {
    render: () => (
        <InBackdrop>
            <PatternModal
                aria-label="Reschedule"
                header={(
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <strong style={{ font: 'var(--heading-medium)' }}>Reschedule</strong>
                        <Button text="Help" spacing="compact" onClick={() => {}} />
                    </div>
                )}
                footer={footerActions}
            >
                {bodyCopy}
            </PatternModal>
        </InBackdrop>
    ),
    play: async ({ canvasElement }) => {
        const [modal] = dialogs(canvasElement);
        const view = within(modal);
        await expect(view.getByText('Reschedule')).toBeInTheDocument();
        await expect(view.queryByRole('button', { name: 'Close' }), 'no default close button').toBeNull();
        await expect(modal).toHaveAttribute('aria-label', 'Reschedule');
        await expect(modal).not.toHaveAttribute('aria-labelledby');
    },
};

/** `divider` draws a rule under the header and above the footer, as Figma's `divider?`. */
export const Divider = {
    render: () => (
        <InBackdrop>
            <PatternModal title="Move session" divider onClose={() => {}} footer={footerActions}>
                {bodyCopy}
            </PatternModal>
        </InBackdrop>
    ),
    play: async ({ canvasElement }) => {
        const [modal] = dialogs(canvasElement);
        const rules = modal.querySelectorAll('.plus-pattern-modal-divider');
        await expect(rules).toHaveLength(2);
        await inEveryColorModeOf(canvasElement, async (mode, token) => {
            for (const rule of rules) {
                await expect(getComputedStyle(rule).backgroundColor, `rule color (${mode})`).toBe(token('--ds-border'));
                await expect(getComputedStyle(rule).height, 'rule is one border wide').toBe(`${tokenLength(canvasElement, '--border-default')}px`);
            }
        });
    },
};

/** `loading` swaps the body for a Skeleton paragraph and marks it busy, as Figma's `loading?`. */
export const Loading = {
    render: () => (
        <InBackdrop>
            <PatternModal title="Move session" loading onClose={() => {}} footer={footerActions}>
                {bodyCopy}
            </PatternModal>
        </InBackdrop>
    ),
    play: async ({ canvasElement }) => {
        const [modal] = dialogs(canvasElement);
        const body = modal.querySelector('.plus-pattern-modal-body');
        await expect(body).toHaveAttribute('aria-busy', 'true');
        await expect(within(modal).queryByText(/Move Thursday/), 'the real body is not drawn').toBeNull();
        await expect(body.querySelector('[aria-hidden="true"]'), 'a skeleton stands in').not.toBeNull();
        await expect(within(modal).getByRole('button', { name: 'Move session' }), 'the footer stays').toBeInTheDocument();
    },
};

/* ---------------------------------------------------- one value per story */

/** One width step per story, at the 1024 screen. */
const atWidth = (width) => (
    <InBackdrop height={320}>
        <PatternModal title="Move session" width={width} onClose={() => {}} footer={footerActions}>
            {bodyCopy}
        </PatternModal>
    </InBackdrop>
);

export const WidthSmall = { name: 'Small', render: () => atWidth('sm') };
export const WidthMedium = { name: 'Medium', render: () => atWidth('md') };
export const WidthLarge = { name: 'Large', render: () => atWidth('lg') };

/** Hug with long content: it stops at the cap and the body scrolls. */
export const HugLong = {
    name: 'Hug, long content',
    render: () => (
        <InBackdrop>
            <PatternModal title="Session history" onClose={() => {}} footer={footerActions}>
                {longBody}
            </PatternModal>
        </InBackdrop>
    ),
};

/** Fill: the modal sits at the cap, however little it holds. */
export const HeightFill = {
    name: 'Fill',
    render: () => (
        <InBackdrop>
            <PatternModal title="Session settings" height="fill" onClose={() => {}} footer={saveActions}>
                {bodyCopy}
            </PatternModal>
        </InBackdrop>
    ),
};

/** A tab group under the title, with no play: the docs page shows it at rest. */
export const TabsStill = {
    name: 'Tabs',
    render: () => (
        <InBackdrop>
            <PatternModal title="Session settings" tabs={sessionTabs} onClose={() => {}} footer={saveActions} />
        </InBackdrop>
    ),
};

export const Interactive = {
    args: {
        title: 'Move session',
        width: 'sm',
        height: 'hug',
    },
    render: (args) => (
        <InBackdrop>
            <PatternModal
                title={args.title}
                width={args.width}
                height={args.height}
                onClose={() => {}}
                footer={footerActions}
            >
                {longBody}
            </PatternModal>
        </InBackdrop>
    ),
};

/* ---------------------------------------------------------------------------
 * The template page's examples (Templates/Modal): types, anatomy, widths,
 * destructive tiers, footers, key states and stacking. Each play asserts what a
 * person sees: the footer's height from its token, the footer holding still
 * while the body scrolls, and every button inside its container.
 * ------------------------------------------------------------------------- */

const STAGE = 1024; // docs-literal: the page's stand-in screen
const rect = (el) => el.getBoundingClientRect();

/** Every footer button sits inside the Modal's box and the footer's own box: nothing overflows its container. */
const buttonsInside = async (canvasElement) => {
    fitsCanvas(canvasElement);
    const modal = rect(canvasElement.querySelector('.plus-pattern-modal'));
    const footer = canvasElement.querySelector('[data-probe="footer"]');
    const box = footer ? rect(footer) : modal;
    if (footer) {
        await expect(box.bottom, 'the footer is flush with the Modal’s bottom').toBeCloseTo(modal.bottom, 0);
        await expect(box.left, 'the footer is flush with the Modal’s left edge').toBeCloseTo(modal.left, 0);
        await expect(box.right, 'the footer is flush with the Modal’s right edge').toBeCloseTo(modal.right, 0);
    }
    for (const button of canvasElement.querySelectorAll('.plus-pattern-modal-footer button')) {
        const b = rect(button);
        await expect(b.left, 'a footer button starts inside its container').toBeGreaterThanOrEqual(box.left - 0.5);
        await expect(b.right, 'a footer button ends inside its container').toBeLessThanOrEqual(box.right + 0.5);
        await expect(b.bottom, 'a footer button ends inside the Modal').toBeLessThanOrEqual(modal.bottom + 0.5);
        await expect(b.height, 'a full-bleed button fills the footer’s height').toBeCloseTo(box.height, 0);
        await expect(button.scrollWidth, 'a button’s label fits its box').toBeLessThanOrEqual(button.clientWidth + 1);
    }
};

/** The 1024 stand-in screen, drawn to fit the canvas: never wider than it. */
const sized = (story, width = STAGE) => <FitStage width={width}>{story}</FitStage>;

export const TypePassive = {
    name: 'Type: Passive',
    render: () => sized(<Demo.Passive />),
    play: async ({ canvasElement }) => {
        fitsCanvas(canvasElement);
        await expect(canvasElement.querySelector('.plus-pattern-modal-footer'), 'Passive has no footer').toBeNull();
        await expect(within(canvasElement).getByRole('button', { name: 'Close' }), 'Close is the way out').toBeInTheDocument();
    },
};

export const TypeActive = {
    name: 'Type: Active',
    render: () => sized(<Demo.Active />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(rect(canvas.getByRole('button', { name: 'Cancel' })).left, 'Cancel (Default) left of the action').toBeLessThan(rect(canvas.getByRole('button', { name: 'Move session' })).left);
        await buttonsInside(canvasElement);
    },
};

export const TypeAcknowledge = {
    name: 'Type: Acknowledge',
    render: () => sized(<Demo.Acknowledge />),
    play: async ({ canvasElement }) => {
        const modal = rect(canvasElement.querySelector('.plus-pattern-modal'));
        const button = rect(within(canvasElement).getByRole('button', { name: 'Got it' }));
        await expect(button.width, 'one button fills the whole footer').toBeCloseTo(modal.width, 0);
        await buttonsInside(canvasElement);
    },
};

export const TypeSteps = {
    name: 'Type: Steps',
    render: () => sized(<Demo.Steps />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const modal = rect(canvasElement.querySelector('.plus-pattern-modal'));
        await expect(canvasElement.querySelector('.plus-pattern-modal').offsetWidth, '10-col at 1024').toBeCloseTo(WIDTHS_AT_1024.lg, 0);
        await expect(canvas.getByRole('navigation', { name: 'Steps' }), 'the steps run across the top').toHaveClass('plus-progress-tracker--horizontal');
        const back = rect(canvas.getByRole('button', { name: 'Back' }));
        await expect(back.left, 'Back and Next share the right half').toBeGreaterThanOrEqual(modal.left + modal.width / 2 - 1);
        await expect(canvas.getByRole('button', { name: 'Cancel' }).className, 'Cancel is Subtle').toContain('subtle');
        await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
        await expect(canvas.getByRole('button', { name: 'Schedule' }), 'on the last step Next takes the outcome’s name').toBeInTheDocument();
        await buttonsInside(canvasElement);
    },
};

const ANATOMY_PARTS = [
    { selector: '.plus-pattern-backdrop', label: 'Backdrop', side: 'end', at: 'start', holds: true },
    { selector: '.plus-pattern-modal-header', label: 'Header', at: 'start' },
    { selector: '.plus-pattern-modal-body', label: 'Body', at: 'middle' },
    { selector: '[data-probe="footer"]', label: 'Footer', at: 'end' },
];

export const AnatomyActive = {
    name: 'Anatomy: Active, 8-col',
    render: () => (
        <LiveAnatomy width={STAGE} title="An 8-col Active Modal with its parts numbered" parts={ANATOMY_PARTS}>
            <Demo.ActiveForm />
        </LiveAnatomy>
    ),
    play: async ({ canvasElement }) => {
        fitsCanvas(canvasElement);
        await markersLevelWithParts(canvasElement, ANATOMY_PARTS);
        const body = canvasElement.querySelector('.plus-pattern-modal-body');
        await expect(body.scrollHeight, 'the body shows every field whole: nothing clips').toBeLessThanOrEqual(body.clientHeight + 1);
        leadersCrossNoOtherPart(canvasElement, ANATOMY_PARTS);
        const modal = canvasElement.querySelector('.plus-pattern-modal');
        await expect(getComputedStyle(modal).paddingTop, 'pad 16 on every side').toBe(`${tokenLength(canvasElement, '--modal-pad-x-default')}px`);
        await expect(getComputedStyle(modal).borderTopLeftRadius, 'radius 12').toBe(`${tokenLength(canvasElement, '--modal-radius')}px`);
    },
};

/** The width steps against the screen grid: 6 · 8 · 10 columns plus 16 a side at 1024. 4-col is Planned. */
export const WidthStrip = {
    render: () => (
        <FitStage width={STAGE}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-stack-md)', inlineSize: STAGE }}>
            {[['sm', '6-col'], ['md', '8-col'], ['lg', '10-col']].map(([width, label]) => (
                <Demo.ModalStage key={width} width={width} height={240} title={label} footer={<Demo.TwoCells action="Save" />}>
                    <p style={{ margin: 0, font: 'var(--body-default)' }}>{`${label} on the 1024 screen grid.`}</p>
                </Demo.ModalStage>
            ))}
        </div>
        </FitStage>
    ),
    play: async ({ canvasElement }) => {
        fitsCanvas(canvasElement);
        const modals = within(canvasElement).getAllByRole('dialog');
        for (const [i, width] of ['sm', 'md', 'lg'].entries()) {
            await expect(modals[i].offsetWidth, `${width} matches the grid at 1024`).toBeCloseTo(WIDTHS_AT_1024[width], 0);
        }
        await expect(modals[0].offsetWidth, 'widths step up').toBeLessThan(modals[1].offsetWidth);
        await expect(modals[1].offsetWidth, 'widths step up').toBeLessThan(modals[2].offsetWidth);
    },
};

/** Width behavior: the screen's width is the control; a Modal grows with it and never shrinks. */
export const ResponsiveWidth = {
    name: 'Width behavior',
    args: { width: STAGE },
    parameters: { controls: { include: ['width'] } },
    argTypes: {
        width: { control: { type: 'range', min: 768, max: 1440, step: 8 }, description: 'The screen’s width, in px.', table: { category: 'Docs' } },
    },
    render: ({ width }) => (
        <FitStage width={width}>
            <Demo.ModalStage width="md" screenWidth={width} height={260} title="Session settings" footer={<Demo.TwoCells action="Save" />}>
                <p style={{ margin: 0, font: 'var(--body-default)' }}>The Modal takes its width from the screen grid.</p>
            </Demo.ModalStage>
        </FitStage>
    ),
    play: async ({ canvasElement }) => {
        fitsCanvas(canvasElement);
        const backdrop = canvasElement.querySelector('.plus-pattern-backdrop');
        const modal = within(canvasElement).getByRole('dialog');
        const at = (screen) => {
            backdrop.style.setProperty('--plus-overlay-screen', `${screen}px`);
            return modal.offsetWidth;
        };
        const small = at(768);
        const mid = at(1024);
        const large = at(1440);
        await expect(mid, '8-col at 1024').toBeCloseTo(WIDTHS_AT_1024.md, 0);
        await expect(small, 'narrower screen, narrower Modal').toBeLessThan(mid);
        await expect(large, 'wider screen, wider Modal').toBeGreaterThan(mid);
    },
};

export const TierActive = { name: 'Tier: Active', render: () => sized(<Demo.TierActive />), play: async ({ canvasElement }) => { await buttonsInside(canvasElement); } };

export const TierDanger = {
    name: 'Tier: Active with Danger',
    render: () => sized(<Demo.TierDanger />),
    play: async ({ canvasElement }) => {
        await expect(within(canvasElement).getByRole('button', { name: 'Delete note' }), 'the action takes the Danger appearance').toHaveClass('plus-btn--danger');
        await buttonsInside(canvasElement);
    },
};

export const TierTypeName = {
    name: 'Tier: Danger, type the name',
    render: () => sized(<Demo.TierTypeName />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
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
        const footer = canvasElement.querySelector('[data-probe="footer"]');
        await expect(footer.offsetHeight, 'the footer is 48 high').toBeCloseTo(tokenLength(footer, BAR_TOKEN), 0);
        await buttonsInside(canvasElement);
    },
};

export const FooterTwo = {
    name: 'Footer: Two buttons',
    render: () => sized(<Demo.Active />),
    play: async ({ canvasElement }) => {
        const [cancel, action] = [...canvasElement.querySelectorAll('.plus-pattern-modal-footer button')].map(rect);
        await expect(cancel.width, 'half each').toBeCloseTo(action.width, 0);
        await buttonsInside(canvasElement);
    },
};

export const FooterThree = {
    name: 'Footer: Three buttons',
    render: () => sized(<Demo.ModalStage title="Schedule session" footer={<Demo.ThreeCells />}><p style={{ margin: 0, font: 'var(--body-default)' }}>Save it as a draft, or schedule it now.</p></Demo.ModalStage>),
    play: async ({ canvasElement }) => {
        const buttons = [...canvasElement.querySelectorAll('.plus-pattern-modal-footer button')];
        await expect(buttons, 'three cells').toHaveLength(3);
        await expect(buttons[0].className, 'only the last is Primary').not.toContain('primary');
        await expect(buttons[2].className, 'only the last is Primary').toContain('primary');
        await buttonsInside(canvasElement);
    },
};

export const KeyLongContent = {
    name: 'Key state: Long content',
    render: () => sized(<Demo.LongContent />),
    play: async ({ canvasElement }) => {
        const body = canvasElement.querySelector('.plus-pattern-modal-body');
        const footer = canvasElement.querySelector('.plus-pattern-modal-footer');
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
    play: async ({ canvasElement }) => {
        await expect(canvasElement.querySelector('.plus-pattern-modal-body .plus-skeleton'), 'the body shows its content’s own loading state').not.toBeNull();
        await expect(within(canvasElement).getByRole('heading', { level: 1, name: 'Session history' }), 'the title stays real').toBeInTheDocument();
    },
};

export const KeyConfirmInside = {
    name: 'Key state: Its confirm',
    render: () => sized(<Demo.ConfirmInside />),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await userEvent.click(canvas.getByRole('button', { name: 'Delete session' }));
        await expect(canvas.getAllByRole('dialog'), 'still one Modal').toHaveLength(1);
        await expect(canvas.getByRole('heading', { level: 1, name: 'Delete session?' }), 'the title swaps in place').toBeInTheDocument();
        await expect(canvas.getByText(/cannot be undone/), 'a warning SectionMessage says the consequence').toBeVisible();
        await expect(canvasElement.querySelector('.plus-section-message--warning, [class*="section-message"][class*="warning"]'), 'the message is the warning appearance').not.toBeNull();
        await expect(canvas.getByRole('button', { name: 'Delete session' }), 'the action is Danger').toHaveClass('plus-btn--danger');
        await userEvent.click(canvas.getByRole('button', { name: 'Back' }));
        await expect(canvas.getByRole('heading', { level: 1, name: 'Session details' }), 'Back returns').toBeInTheDocument();
        await buttonsInside(canvasElement);
    },
};

const dialogNamed = (canvasElement, name) => within(canvasElement).queryByRole('dialog', { name });

/**
 * A confirm Modal over a Panel, drawn open: the Panel open, the confirm over it,
 * and the confirm's own Backdrop covering the Panel. Cancel closes the confirm and
 * focus returns to the Panel's Delete student button.
 */
export const StackConfirmOverPanel = {
    name: 'Stacking: Confirm over a Panel',
    render: () => sized(<Demo.ConfirmOverPanel />),
    play: async ({ canvasElement }) => {
        fitsCanvas(canvasElement);
        const canvas = within(canvasElement);
        await waitFor(() => expect(dialogNamed(canvasElement, 'Delete student?'), 'the confirm is open').not.toBeNull());
        const backdrop = canvasElement.querySelector('.plus-pattern-backdrop');
        const panel = rect(canvasElement.querySelector('.plus-panel'));
        const cover = rect(backdrop);
        await expect(cover.left, 'the confirm’s Backdrop covers the Panel').toBeLessThanOrEqual(panel.left + 0.5);
        await expect(cover.right, 'the confirm’s Backdrop covers the Panel').toBeGreaterThanOrEqual(panel.right - 0.5);
        await expect(cover.top, 'the confirm’s Backdrop covers the Panel').toBeLessThanOrEqual(panel.top + 0.5);
        await expect(cover.bottom, 'the confirm’s Backdrop covers the Panel').toBeGreaterThanOrEqual(panel.bottom - 0.5);
        await expect(canvas.getByText('Ana Ruiz'), 'the Panel is open under the confirm').toBeInTheDocument();
        await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
        await waitFor(() => expect(dialogNamed(canvasElement, 'Delete student?')).toBeNull());
        await expect(canvasElement.ownerDocument.activeElement, 'focus returns to the Panel').toBe(canvas.getByRole('button', { name: 'Delete student' }));
        await expect(canvas.getByText('Ana Ruiz'), 'the Panel is still open').toBeInTheDocument();
    },
};

/**
 * A Modal never opens on another Modal; one that needs a confirm holds it inside itself.
 * Drawn open: the confirm view, a warning SectionMessage in the body and a Danger action.
 */
export const StackModalOnModalRefused = {
    name: 'Stacking: Confirm inside the Modal',
    render: () => sized(<Demo.ConfirmInside start="confirm" />),
    play: async ({ canvasElement }) => {
        fitsCanvas(canvasElement);
        const canvas = within(canvasElement);
        await expect(canvas.getAllByRole('dialog'), 'one Modal, one Backdrop').toHaveLength(1);
        await expect(canvasElement.querySelector('.plus-section-message--warning, [class*="section-message"][class*="warning"]'), 'a warning SectionMessage in the body').not.toBeNull();
        await expect(canvas.getByRole('button', { name: 'Delete session' }), 'the action takes the Danger appearance').toHaveClass('plus-btn--danger');
        // The overlay module refuses a second Modal while one is open.
        const first = openOverlay();
        const warn = console.warn;
        console.warn = () => {};
        try {
            await expect(first, 'the first Modal takes the slot').not.toBeNull();
            await expect(openOverlay(), 'the second Modal stays closed').toBeNull();
        } finally {
            console.warn = warn;
            first?.release();
        }
    },
};
