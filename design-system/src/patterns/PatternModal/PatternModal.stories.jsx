import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import PatternModal from '@/patterns/PatternModal';
import Overlay, { OVERLAY_HEIGHTS, OVERLAY_WIDTHS } from '@/patterns/Overlay';
import { Button } from '@/components';
import { inEveryColorModeOf } from '@/storybook-docs/lib/color-modes.js';
import { probe, tokenLength } from '@/storybook-docs/lib/style-probes.js';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--element-stack-md)' }}>
        {Array.from({ length: 12 }, (_, i) => (
            <p key={i} style={{ margin: 0, font: 'var(--body-default)' }}>
                {`Paragraph ${i + 1}: long body content, so the body scrolls once the modal reaches its cap.`}
            </p>
        ))}
    </div>
);

const footerActions = (
    <>
        <Button text="Cancel" style="secondary" fill="outline" size="small" onClick={() => {}} />
        <Button text="Move session" style="primary" fill="filled" size="small" onClick={() => {}} />
    </>
);

/** An inline Overlay at the stand-in screen, holding one modal. */
const InOverlay = ({ children, height = SCREEN.height }) => (
    <Overlay inline screenWidth={SCREEN.width} screenHeight={height}>
        {children}
    </Overlay>
);

const dialogs = (canvasElement) => within(canvasElement).getAllByRole('dialog');

export default {
    title: 'Foundations/Patterns/Modal',
    component: PatternModal,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        children: { table: { disable: true } },
        style: { table: { disable: true } },
        onClose: { table: { disable: true } },
        footer: { table: { disable: true } },
        title: {
            control: 'text',
            description: 'Modal title',
            table: { category: 'Slots' },
        },
        width: {
            control: 'inline-radio',
            options: OVERLAY_WIDTHS,
            description: 'Screen-grid columns: 6 · 8 · 10 plus the modal pad',
            table: { category: 'Design' },
        },
        height: {
            control: 'inline-radio',
            options: OVERLAY_HEIGHTS,
            description: 'Hug the content to the screen less 128, or fill to it',
            table: { category: 'Design' },
        },
        maxHeight: { table: { disable: true } },
        padding: { table: { disable: true } },
        gap: { table: { disable: true } },
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

/** A sm, hug modal in its Overlay: the scrim, the pads and the modal centered. */
export const Overview = {
    render: () => (
        <InOverlay>
            <PatternModal title="Move session" onClose={() => {}} footer={footerActions}>
                {bodyCopy}
            </PatternModal>
        </InOverlay>
    ),
    play: async ({ canvasElement }) => {
        const overlay = canvasElement.querySelector('.plus-pattern-overlay');
        const [modal] = dialogs(canvasElement);
        const style = getComputedStyle(modal);
        await expect(style.paddingTop, 'Modal/pad').toBe(`${tokenLength(canvasElement, '--modal-pad')}px`);
        await expect(style.rowGap, 'Modal/stack-md').toBe(`${tokenLength(canvasElement, '--modal-stack-md')}px`);
        await expect(style.borderTopLeftRadius, 'Modal/radius').toBe(`${tokenLength(canvasElement, '--modal-radius')}px`);
        const overlayStyle = getComputedStyle(overlay);
        await expect(overlayStyle.paddingLeft, 'Overlay/pad-x').toBe(`${tokenLength(canvasElement, '--overlay-pad-x')}px`);
        await expect(overlayStyle.paddingTop, 'Overlay/pad-y').toBe(`${tokenLength(canvasElement, '--overlay-pad-y')}px`);
        await inEveryColorModeOf(canvasElement, async (mode, token) => {
            await expect(getComputedStyle(overlay).backgroundColor, `scrim is the blanket (${mode})`).toBe(token('--ds-blanket'));
            await expect(getComputedStyle(modal).backgroundColor, `surface overlay (${mode})`).toBe(token('--ds-surface-overlay'));
            await expect(getComputedStyle(modal).boxShadow, `shadow overlay (${mode})`).toBe(probe(canvasElement, 'boxShadow', 'var(--ds-shadow-overlay)'));
        });
    },
};

/** sm · md · lg at the 1024 screen: 512 · 677 · 843, as Figma's Large mode draws them. */
export const Widths = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-stack-md)' }}>
            {OVERLAY_WIDTHS.map((width) => (
                <InOverlay key={width} height={320}>
                    <PatternModal title={`width="${width}"`} width={width} onClose={() => {}} footer={footerActions}>
                        {bodyCopy}
                    </PatternModal>
                </InOverlay>
            ))}
        </div>
    ),
    play: async ({ canvasElement }) => {
        const modals = dialogs(canvasElement);
        for (const [i, width] of OVERLAY_WIDTHS.entries()) {
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
            <InOverlay>
                <PatternModal title='height="hug", short' onClose={() => {}} footer={footerActions}>
                    {bodyCopy}
                </PatternModal>
            </InOverlay>
            <InOverlay>
                <PatternModal title='height="hug", long' onClose={() => {}} footer={footerActions}>
                    {longBody}
                </PatternModal>
            </InOverlay>
            <InOverlay>
                <PatternModal title='height="fill"' height="fill" onClose={() => {}} footer={footerActions}>
                    {bodyCopy}
                </PatternModal>
            </InOverlay>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const [short, long, fill] = dialogs(canvasElement);
        const cap = SCREEN.height - 2 * tokenLength(canvasElement, '--overlay-pad-y');
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--element-stack-md)' }}>
        {rows.map(([label, value]) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--element-stack-sm)' }}>
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
        content: fields(STUDENTS.map((name, i) => [name, `Algebra I · session ${i + 1} · attended, notes filed`])),
    },
    { key: 'notes', label: 'Notes', content: bodyCopy },
];

const saveActions = (
    <>
        <Button text="Cancel" style="secondary" fill="outline" size="small" onClick={() => {}} />
        <Button text="Save" style="primary" fill="filled" size="small" onClick={() => {}} />
    </>
);

/**
 * A tab group under the title, as `_Modal header` type=tabs: NavTabs in tabs
 * mode, in the header, so it stays put while only the body scrolls. The body is
 * the selected tab's panel. Left and Right move between tabs, Home and End jump
 * to the ends.
 */
export const Tabs = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-stack-md)' }}>
            <InOverlay>
                <PatternModal title="Session settings" tabs={sessionTabs} onClose={() => {}} footer={saveActions} />
            </InOverlay>
            <InOverlay>
                <PatternModal
                    title="Session settings"
                    width="md"
                    height="fill"
                    tabs={sessionTabs}
                    defaultActiveTab="students"
                    onClose={() => {}}
                    footer={saveActions}
                />
            </InOverlay>
        </div>
    ),
    play: async ({ canvasElement }) => {
        const [hug, fill] = dialogs(canvasElement);
        const cap = SCREEN.height - 2 * tokenLength(canvasElement, '--overlay-pad-y');
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
 * The body never draws shorter than Modal/body-min-height 96, however little
 * it holds, as Figma holds it.
 */
export const BodyMinHeight = {
    render: () => (
        <InOverlay>
            <PatternModal title="Move session" onClose={() => {}} footer={footerActions}>
                <span>Short.</span>
            </PatternModal>
        </InOverlay>
    ),
    play: async ({ canvasElement }) => {
        const [modal] = dialogs(canvasElement);
        const body = modal.querySelector('.plus-pattern-modal-body');
        await expect(getComputedStyle(body).minHeight, 'Modal/body-min-height').toBe('96px');
        await expect(body.getBoundingClientRect().height).toBeGreaterThanOrEqual(96);
    },
};

/** `header` replaces the title row, as `_Modal header` type=custom; the caller names the dialog. */
export const CustomHeader = {
    render: () => (
        <InOverlay>
            <PatternModal
                aria-label="Reschedule"
                header={(
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <strong style={{ font: 'var(--heading-medium)' }}>Reschedule</strong>
                        <Button text="Help" style="secondary" fill="outline" size="small" onClick={() => {}} />
                    </div>
                )}
                footer={footerActions}
            >
                {bodyCopy}
            </PatternModal>
        </InOverlay>
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
        <InOverlay>
            <PatternModal title="Move session" divider onClose={() => {}} footer={footerActions}>
                {bodyCopy}
            </PatternModal>
        </InOverlay>
    ),
    play: async ({ canvasElement }) => {
        const [modal] = dialogs(canvasElement);
        const rules = modal.querySelectorAll('.plus-pattern-modal-divider');
        await expect(rules).toHaveLength(2);
        await inEveryColorModeOf(canvasElement, async (mode, token) => {
            for (const rule of rules) {
                await expect(getComputedStyle(rule).backgroundColor, `rule color (${mode})`).toBe(token('--ds-border'));
                await expect(getComputedStyle(rule).height, 'rule is one border wide').toBe(`${tokenLength(canvasElement, '--size-element-border')}px`);
            }
        });
    },
};

/** `loading` swaps the body for a Skeleton paragraph and marks it busy, as Figma's `loading?`. */
export const Loading = {
    render: () => (
        <InOverlay>
            <PatternModal title="Move session" loading onClose={() => {}} footer={footerActions}>
                {bodyCopy}
            </PatternModal>
        </InOverlay>
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

export const Interactive = {
    args: {
        title: 'Move session',
        width: 'sm',
        height: 'hug',
    },
    render: (args) => (
        <InOverlay>
            <PatternModal
                title={args.title}
                width={args.width}
                height={args.height}
                onClose={() => {}}
                footer={footerActions}
            >
                {longBody}
            </PatternModal>
        </InOverlay>
    ),
};
