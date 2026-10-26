import React from 'react';
import { expect, waitFor, within } from 'storybook/test';
import { Button, Dropdown, Popover, Toast, ToastContainer, Tooltip } from '@/components';
import { px } from '@/storybook-docs/lib/style-probes.js';

/** The popup widths, Popover/width-sm · md · lg. */
const POPUP_WIDTHS = ['sm', 'md', 'lg'];

/** The placements a Popup takes around its trigger. */
const POPUP_PLACEMENTS = ['top', 'bottom', 'left', 'right', 'bottom-start', 'bottom-end'];

/**
 * Stories for the Popover family page: Menu, Popup, Flag and Tooltip. They
 * are docs-only, built from the real components. A Popup is never a form:
 * its body is text or a short list.
 */
export default {
    title: 'Foundations/Patterns/Popover family',
    tags: ['!dev', '!autodocs'],
    argTypes: {
        title: {
            control: 'text',
            description: 'The Popup title, in Heading/xsmall',
            table: { category: 'Slots' },
        },
        width: {
            control: 'inline-radio',
            options: POPUP_WIDTHS,
            description: 'The Popup width tier: 320 · 400 · 480',
            table: { category: 'Design' },
        },
        placement: {
            control: 'select',
            options: POPUP_PLACEMENTS,
            description: 'Where the Popup opens around its trigger; it flips when there is no room',
            table: { category: 'Design' },
        },
    },
};

/**
 * A stage that reserves room for the layers it opens. It opens them a beat
 * after mounting: the placement engine measures the trigger through a ref,
 * which is only attached after the first render.
 */
const Stage = ({ height = 160, children, style }) => {
    const [open, setOpen] = React.useState(false);
    React.useEffect(() => { setOpen(true); }, []);
    return (
        <div style={{ minHeight: height, padding: 'var(--space-100)', ...style }}>
            {children({ open })}
        </div>
    );
};

/** The style of the host element around a Button: a real DOM element, which the placement engine can take a ref from. */
const anchor = { display: 'inline-flex' };

const menuRows = [
    { text: 'Group heading', header: true },
    { text: 'Edit', leadingIcon: 'pen' },
    { text: 'Duplicate', leadingIcon: 'copy', selected: true },
    { text: 'Move to…', leadingIcon: 'arrow-right' },
    { text: 'Share', description: 'Anyone with the link can view', leadingIcon: 'share-nodes' },
];

const menuOf = (canvasElement) => canvasElement.querySelectorAll('.dropdown-menu.show');

/** The menu in its two sizes: 32 rows on radius 12, and 24 rows on radius 10. */
export const Menu = {
    render: () => (
        <div style={{ display: 'flex', gap: 'var(--section-stack-lg)', flexWrap: 'wrap', alignItems: 'flex-end', minHeight: 296, padding: 'var(--space-100)' }}>
            <Dropdown buttonText="Menu md" direction="dropup" isOpen items={menuRows} />
            <Dropdown buttonText="Menu sm" size="small" direction="dropup" isOpen items={menuRows} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const [md, sm] = menuOf(canvasElement);
        await expect(px(getComputedStyle(md).paddingTop), 'Popover/pad-menu').toBe(4);
        await expect(px(getComputedStyle(md).borderTopLeftRadius), 'radius-menu-md').toBe(12);
        await expect(px(getComputedStyle(sm).borderTopLeftRadius), 'radius-menu-sm').toBe(10);
        const [edit] = within(md).getAllByRole('button');
        await expect(edit.getBoundingClientRect().height, 'a row is 32').toBe(32);
        const [smEdit] = within(sm).getAllByRole('button');
        await expect(smEdit.getBoundingClientRect().height, 'a small row is 24').toBe(24);
    },
};

const sessions = Array.from({ length: 14 }, (_, i) => ({ text: `Session ${i + 1}` }));

/** A menu stops at 320 tall and scrolls; the cut row shows that there is more. */
export const MenuScrolls = {
    render: () => (
        <div style={{ display: 'flex', alignItems: 'flex-end', minHeight: 400, padding: 'var(--space-100)' }}>
            <Dropdown buttonText="Sessions" direction="dropup" isOpen items={sessions} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const [menu] = menuOf(canvasElement);
        await expect(menu.getBoundingClientRect().height, 'max-height-menu').toBe(320);
        await expect(menu.scrollHeight).toBeGreaterThan(menu.clientHeight);
    },
};

const noteList = (
    <ul style={{ margin: 0, paddingLeft: 'var(--space-200)', font: 'var(--body-default)' }}>
        <li>Notes stay with the session.</li>
        <li>The tutor sees them first.</li>
        <li>Parents never see them.</li>
    </ul>
);

const popupIds = { sm: 'pfam-popup-sm', md: 'pfam-popup-md', lg: 'pfam-popup-lg' };

/** The three width tiers, 320 · 400 · 480, padded 16 and 4 from the trigger. */
export const Popups = {
    render: () => (
        <Stage height={720}>
            {({ open }) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 216 }}>
                    {POPUP_WIDTHS.map((width) => (
                        <div key={width}>
                            <Popover
                                id={popupIds[width]}
                                width={width}
                                triggerType="manual"
                                show={open}
                                placement="bottom-start"
                                title="Session notes"
                                trigger={<span style={anchor}><Button text={`Popup ${width}`} style="secondary" fill="outline" size="small" /></span>}
                            >
                                {width === 'lg' ? noteList : 'Notes stay with the session.'}
                            </Popover>
                        </div>
                    ))}
                </div>
            )}
        </Stage>
    ),
    play: async ({ canvasElement }) => {
        const expected = { sm: 320, md: 400, lg: 480 };
        for (const width of POPUP_WIDTHS) {
            const popup = await waitFor(() => {
                const node = canvasElement.ownerDocument.getElementById(popupIds[width]);
                if (!node) throw new Error('not open');
                return node;
            });
            await expect(popup.getBoundingClientRect().width, `width ${width}`).toBe(expected[width]);
            await expect(px(getComputedStyle(popup).paddingTop), 'Popover/pad').toBe(16);
            await expect(px(getComputedStyle(popup).borderTopLeftRadius), 'Popover/radius').toBe(12);
        }
    },
};

const flagKinds = [
    ['info', 'Heads up'],
    ['success', 'Changes saved'],
    ['warning', 'Check your entries'],
    ['danger', 'Something went wrong'],
];

/** Flags: 400 wide, 16 apart. In use they sit bottom-left; the newest is at the bottom. */
export const Flags = {
    render: () => (
        <ToastContainer containerPosition="static">
            {flagKinds.map(([style, title]) => (
                <Toast key={style} style={style} title={title} show autohide={false}>
                    One or two sentences on what happened and what to do next.
                </Toast>
            ))}
        </ToastContainer>
    ),
    play: async ({ canvasElement }) => {
        const flags = canvasElement.querySelectorAll('.plus-toast');
        await expect(flags).toHaveLength(4);
        await expect(flags[0].getBoundingClientRect().width, 'Popover/width-flag').toBe(400);
        const gap = flags[1].getBoundingClientRect().top - flags[0].getBoundingClientRect().bottom;
        await expect(Math.round(gap), 'Popover/stack-flag').toBe(16);
    },
};

/** A tooltip is 24 tall on one line, and wraps past 240. */
export const Tooltips = {
    render: () => (
        <Stage height={200} style={{ display: 'flex', gap: 200, alignItems: 'flex-start', paddingTop: 56, paddingLeft: 120 }}>
            {({ open }) => (
                <>
                    <Tooltip id="pfam-tooltip-short" show={open} placement="top" text="Copy link">
                        <span style={anchor}><Button text="Copy" style="secondary" fill="outline" size="small" /></span>
                    </Tooltip>
                    <Tooltip
                        id="pfam-tooltip-long"
                        show={open}
                        placement="bottom"
                        text="Copies the session link so you can paste it into a message to the student's family"
                    >
                        <span style={anchor}><Button text="Share" style="secondary" fill="outline" size="small" /></span>
                    </Tooltip>
                </>
            )}
        </Stage>
    ),
    play: async ({ canvasElement }) => {
        const doc = canvasElement.ownerDocument;
        const short = await waitFor(() => {
            const node = doc.getElementById('pfam-tooltip-short');
            if (!node) throw new Error('not open');
            return node.querySelector('.tooltip-inner');
        });
        await expect(short.getBoundingClientRect().height, 'one line is 24').toBe(24);
        const long = doc.getElementById('pfam-tooltip-long').querySelector('.tooltip-inner');
        await expect(long.getBoundingClientRect().width, 'max-width-tooltip').toBe(240);
    },
};

/** The Popup: pick its width and where it opens; click the trigger. */
export const Interactive = {
    args: { title: 'Session notes', width: 'md', placement: 'bottom-start' },
    render: (args) => (
        <Stage height={220}>
            {() => (
                <Popover
                    width={args.width}
                    placement={args.placement}
                    title={args.title}
                    trigger={<span style={anchor}><Button text="Open popup" style="secondary" fill="outline" size="small" /></span>}
                >
                    Notes stay with the session.
                </Popover>
            )}
        </Stage>
    ),
};
