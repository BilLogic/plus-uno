import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import PatternDrawer, { DRAWER_PLACEMENTS } from '@/patterns/PatternDrawer';
import { OVERLAY_WIDTHS } from '@/patterns/Overlay';
import { Button } from '@/components';
import { inEveryColorModeOf } from '@/storybook-docs/lib/color-modes.js';
import { probe, tokenLength } from '@/storybook-docs/lib/style-probes.js';

/** The stand-in screen the docs draw the drawer at: the Large mode, and a short template. */
const SCREEN = { width: 1024, height: 520 };

/** Figma's Modal/width-modal-* at 1024: 6 · 8 · 10 screen columns plus 2 × 16. */
const WIDTHS_AT_1024 = { sm: 512, md: 677, lg: 843 };

const details = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--element-stack-md)' }}>
        <p style={{ margin: 0, font: 'var(--body-default)' }}>Ana Ruiz · Algebra I · Grade 9</p>
        <p style={{ margin: 0, font: 'var(--body-default)' }}>Thursday, 4:00–5:00 PM · Room 204 with Jordan Lee</p>
        <p style={{ margin: 0, font: 'var(--body-default)' }}>
            Last session: reviewed factoring and assigned practice set 3. Ana finished 8 of 10 problems and asked to go over word problems next time.
        </p>
    </div>
);

const longBody = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--element-stack-md)' }}>
        {Array.from({ length: 30 }, (_, i) => (
            <p key={i} style={{ margin: 0, font: 'var(--body-default)' }}>
                {`${i + 1}. Session note: reviewed linear equations, checked homework, and set a goal for next week.`}
            </p>
        ))}
    </div>
);

const footerActions = (
    <>
        <Button text="Cancel" style="secondary" fill="outline" size="small" onClick={() => {}} />
        <Button text="Save changes" style="primary" fill="filled" size="small" onClick={() => {}} />
    </>
);

/** An inline drawer at the stand-in screen, for docs. */
const Inline = (props) => (
    <PatternDrawer
        inline
        screenWidth={SCREEN.width}
        screenHeight={SCREEN.height}
        title="Session details"
        description="Thursday · 4:00–5:00 PM"
        onClose={() => {}}
        footer={footerActions}
        {...props}
    />
);

const dialogs = (canvasElement) => within(canvasElement).getAllByRole('dialog');

export default {
    title: 'Foundations/Patterns/Drawer',
    component: PatternDrawer,
    tags: ['!dev', '!autodocs'],
    argTypes: {
        children: { table: { disable: true } },
        style: { table: { disable: true } },
        onClose: { table: { disable: true } },
        footer: { table: { disable: true } },
        open: { table: { disable: true } },
        inline: { table: { disable: true } },
        screenWidth: { table: { disable: true } },
        screenHeight: { table: { disable: true } },
        title: {
            control: 'text',
            description: 'Drawer title',
            table: { category: 'Slots' },
        },
        description: {
            control: 'text',
            description: 'One line under the title',
            table: { category: 'Slots' },
        },
        width: {
            control: 'inline-radio',
            options: OVERLAY_WIDTHS,
            description: 'Screen-grid columns: 6 · 8 · 10 plus the drawer pad',
            table: { category: 'Design' },
        },
        placement: {
            control: 'inline-radio',
            options: DRAWER_PLACEMENTS,
            description: 'The screen edge it sits at',
            table: { category: 'Design' },
        },
        id: { control: false, table: { disable: true, category: 'Development' } },
        className: { control: false, table: { disable: true, category: 'Development' } },
    },
};

/** A sm drawer at the end edge of the 1024 screen: the scrim, no pad, the drawer full height. */
export const Overview = {
    render: () => <Inline>{details}</Inline>,
    play: async ({ canvasElement }) => {
        const overlay = canvasElement.querySelector('.plus-pattern-overlay');
        const [drawer] = dialogs(canvasElement);
        const style = getComputedStyle(drawer);
        await expect(style.paddingTop, 'Drawer/pad').toBe(`${tokenLength(canvasElement, '--drawer-pad')}px`);
        await expect(style.rowGap, 'Drawer/stack-md').toBe(`${tokenLength(canvasElement, '--drawer-stack-md')}px`);
        await expect(style.borderTopLeftRadius, 'no radius at the edge').toBe('0px');
        await expect(getComputedStyle(overlay).paddingTop, 'no pad at an edge').toBe('0px');
        const box = overlay.getBoundingClientRect();
        const panel = drawer.getBoundingClientRect();
        await expect(panel.height, 'full height').toBeCloseTo(SCREEN.height, 0);
        await expect(panel.right, 'flush with the end edge').toBeCloseTo(box.right, 0);
        await expect(within(drawer).getByRole('heading', { level: 1 })).toHaveTextContent('Session details');
        const title = getComputedStyle(within(drawer).getByRole('heading', { level: 1 }));
        await expect(title.font, 'Heading/medium').toBe(probe(canvasElement, 'font', 'var(--heading-medium)'));
        await inEveryColorModeOf(canvasElement, async (mode, token) => {
            await expect(getComputedStyle(overlay).backgroundColor, `scrim is the blanket (${mode})`).toBe(token('--ds-blanket'));
            await expect(getComputedStyle(drawer).backgroundColor, `surface overlay (${mode})`).toBe(token('--ds-surface-overlay'));
            await expect(getComputedStyle(drawer).boxShadow, `shadow overlay (${mode})`).toBe(probe(canvasElement, 'boxShadow', 'var(--ds-shadow-overlay)'));
            await expect(getComputedStyle(drawer.querySelector('.plus-pattern-drawer-description')).color, `description is subtle (${mode})`).toBe(token('--ds-text-subtle'));
        });
    },
};

/** sm · md · lg at the 1024 screen: 512 · 677 · 843, the Modal width steps. */
export const Widths = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-stack-md)' }}>
            {OVERLAY_WIDTHS.map((width) => (
                <Inline key={width} title={`width="${width}"`} width={width} screenHeight={320}>{details}</Inline>
            ))}
        </div>
    ),
    play: async ({ canvasElement }) => {
        const drawers = dialogs(canvasElement);
        for (const [i, width] of OVERLAY_WIDTHS.entries()) {
            await expect(drawers[i].getBoundingClientRect().width, `width ${width} at 1024`).toBeCloseTo(WIDTHS_AT_1024[width], 0);
        }
    },
};

/** `end` (default) on the right edge, `start` on the left: always full height, never centered. */
export const Placements = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-stack-md)' }}>
            {DRAWER_PLACEMENTS.map((placement) => (
                <Inline key={placement} title={`placement="${placement}"`} placement={placement} screenHeight={360}>{details}</Inline>
            ))}
        </div>
    ),
    play: async ({ canvasElement }) => {
        const overlays = canvasElement.querySelectorAll('.plus-pattern-overlay');
        const [end, start] = dialogs(canvasElement);
        await expect(end.getBoundingClientRect().right, 'end meets the right edge').toBeCloseTo(overlays[0].getBoundingClientRect().right, 0);
        await expect(start.getBoundingClientRect().left, 'start meets the left edge').toBeCloseTo(overlays[1].getBoundingClientRect().left, 0);
        await expect(start.getBoundingClientRect().height, 'full height').toBeCloseTo(360, 0);
    },
};

/** Content past the screen: the body scrolls, the footer stays pinned, and the body becomes a tab stop. */
export const LongContent = {
    render: () => <Inline title="Session history" description="All 30 sessions this term" width="md">{longBody}</Inline>,
    play: async ({ canvasElement }) => {
        const [drawer] = dialogs(canvasElement);
        const body = drawer.querySelector('.plus-pattern-drawer-body');
        await expect(drawer.getBoundingClientRect().height, 'still the screen height').toBeCloseTo(SCREEN.height, 0);
        await expect(body.scrollHeight, 'the body scrolls').toBeGreaterThan(body.clientHeight);
        await waitFor(() => expect(body).toHaveAttribute('tabindex', '0'));
        const footer = drawer.querySelector('.plus-pattern-drawer-footer');
        await expect(footer.getBoundingClientRect().bottom, 'footer pinned to the bottom pad')
            .toBeCloseTo(drawer.getBoundingClientRect().bottom - tokenLength(canvasElement, '--drawer-pad'), 0);
    },
};

/** A button opens a real drawer over the page; its focus handling is what the play test checks. */
const WithTrigger = (args) => {
    const [open, setOpen] = React.useState(false);
    return (
        <>
            <Button text="Open session details" style="primary" fill="filled" size="small" onClick={() => setOpen(true)} />
            <PatternDrawer
                {...args}
                open={open}
                onClose={() => setOpen(false)}
                footer={(
                    <>
                        <Button text="Cancel" style="secondary" fill="outline" size="small" onClick={() => setOpen(false)} />
                        <Button text="Save changes" style="primary" fill="filled" size="small" onClick={() => setOpen(false)} />
                    </>
                )}
            >
                <p style={{ margin: 0, font: 'var(--body-default)' }}>
                    Ana Ruiz · Algebra I. <a href="#notes">Open the session notes</a>
                </p>
            </PatternDrawer>
        </>
    );
};

/**
 * Keyboard and focus: opening moves focus to the first control, Tab and
 * Shift+Tab cycle inside, Escape and the scrim close it, and focus returns to
 * the button that opened it.
 */
export const KeyboardAndFocus = {
    args: { title: 'Session details', description: 'Thursday · 4:00–5:00 PM', width: 'sm', placement: 'end' },
    render: (args) => <WithTrigger {...args} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const opener = canvas.getByRole('button', { name: 'Open session details' });
        await userEvent.click(opener);
        const drawer = await canvas.findByRole('dialog', { name: 'Session details' });
        await expect(drawer).toHaveAttribute('aria-modal', 'true');
        const close = within(drawer).getByRole('button', { name: 'Close' });
        const link = within(drawer).getByRole('link', { name: 'Open the session notes' });
        const cancel = within(drawer).getByRole('button', { name: 'Cancel' });
        const save = within(drawer).getByRole('button', { name: 'Save changes' });
        await expect(close, 'focus moves to the first control').toHaveFocus();
        await userEvent.tab();
        await expect(link).toHaveFocus();
        await userEvent.tab();
        await expect(cancel).toHaveFocus();
        await userEvent.tab();
        await expect(save).toHaveFocus();
        await userEvent.tab();
        await expect(close, 'Tab past the last control wraps to the first').toHaveFocus();
        await userEvent.tab({ shift: true });
        await expect(save, 'Shift+Tab before the first wraps to the last').toHaveFocus();
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(canvas.queryByRole('dialog')).not.toBeInTheDocument());
        await expect(opener, 'focus returns to the opener').toHaveFocus();

        await userEvent.click(opener);
        const again = await canvas.findByRole('dialog');
        const overlay = again.parentElement;
        const box = overlay.getBoundingClientRect();
        await userEvent.click(overlay, { clientX: box.left + 8, clientY: box.top + 8 });
        await waitFor(() => expect(canvas.queryByRole('dialog')).not.toBeInTheDocument());
        await expect(opener, 'a scrim click returns focus too').toHaveFocus();
    },
};

export const Interactive = {
    args: {
        title: 'Session details',
        description: 'Thursday · 4:00–5:00 PM',
        width: 'sm',
        placement: 'end',
    },
    render: (args) => (
        <Inline title={args.title} description={args.description} width={args.width} placement={args.placement}>
            {longBody}
        </Inline>
    ),
};
