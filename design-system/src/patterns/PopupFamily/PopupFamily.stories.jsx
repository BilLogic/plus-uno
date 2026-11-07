import React from 'react';
import { expect, waitFor, within } from 'storybook/test';
import { Button, Popup, Flag, FlagGroup, Tooltip } from '@/components';
import { px } from '@/storybook-docs/lib/style-probes.js';

/** The popup widths, Popover/width-sm · md · lg. */
const POPUP_WIDTHS = ['sm', 'md', 'lg'];

/** The placements a Popup takes around its trigger. */
const POPUP_PLACEMENTS = ['top', 'bottom', 'left', 'right', 'bottom-start', 'bottom-end'];

/**
 * Stories for the Popups pattern page: Popup, Flag and Tooltip. They are
 * docs-only, built from the real components. A Popup is never a form: its
 * body is text or a short list. Menu's own cover lives on `DropdownMenu`'s
 * stories (`Components/Forms and inputs/Dropdown menu`).
 */
export default {
    title: 'Patterns/Popups',
    tags: ['!dev', '!autodocs'],
    argTypes: {
        title: {
            control: 'text',
            table: { category: 'Slots' },
        },
        width: {
            control: 'inline-radio',
            options: POPUP_WIDTHS,
            table: { category: 'Design' },
        },
        placement: {
            control: 'select',
            options: POPUP_PLACEMENTS,
            table: { category: 'Design' },
        },
    },
};

/**
 * A stage that reserves room for the layers it opens. It opens them a beat
 * after mounting: the placement engine measures the trigger through a ref,
 * which is only attached after the first render.
 */
// The pixel heights, gaps and padding in these stages are stage geometry: they reserve room for layers that float outside the flow, and are not design values.
const Stage = ({ height = 160, children, style }) => {
    const [open, setOpen] = React.useState(false);
    React.useEffect(() => { setOpen(true); }, []);
    return (
        <div style={{ minHeight: height, padding: 'var(--space-100)', ...style }}>
            {children({ open })}
        </div>
    );
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
                            <Popup
                                id={popupIds[width]}
                                width={width}
                                triggerType="manual"
                                show={open}
                                placement="bottom-start"
                                title="Session notes"
                                trigger={<Button text={`Popup ${width}`} spacing="compact" />}
                            >
                                {width === 'lg' ? noteList : 'Notes stay with the session.'}
                            </Popup>
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
    ['information', 'Heads up'],
    ['success', 'Changes saved'],
    ['warning', 'Check your entries'],
    ['error', 'Something went wrong'],
];

/** Flags: 400 wide, 16 apart. In use they sit bottom-left; the newest is at the bottom. */
export const Flags = {
    render: () => (
        <FlagGroup containerPosition="static">
            {flagKinds.map(([style, title]) => (
                <Flag key={style} appearance={style} title={title} show autohide={false}>
                    One or two sentences on what happened and what to do next.
                </Flag>
            ))}
        </FlagGroup>
    ),
    play: async ({ canvasElement }) => {
        const flags = canvasElement.querySelectorAll('.plus-flag');
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
                        <Button text="Copy" spacing="compact" />
                    </Tooltip>
                    <Tooltip
                        id="pfam-tooltip-long"
                        show={open}
                        placement="bottom"
                        text="Copies the session link so you can paste it into a message to the student's family"
                    >
                        <Button text="Share" spacing="compact" />
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
            return node;
        });
        await expect(short.getBoundingClientRect().height, 'one line is 24').toBe(24);
        const long = doc.getElementById('pfam-tooltip-long');
        await expect(long.getBoundingClientRect().width, 'max-width-tooltip').toBe(240);
    },
};

/** The Popup: pick its width and where it opens; click the trigger. */
/* ---------------------------------------------------- one value per story */

/** One Popup width tier per story, held open. */
const popupAt = (width) => (
    <Stage height={240}>
        {({ open }) => (
            <Popup
                width={width}
                triggerType="manual"
                show={open}
                placement="bottom-start"
                title="Session notes"
                trigger={<Button text={`Popup ${width}`} spacing="compact" />}
            >
                Notes stay with the session.
            </Popup>
        )}
    </Stage>
);

export const PopupSmall = { name: 'Popup small', render: () => popupAt('sm') };
export const PopupMedium = { name: 'Popup medium', render: () => popupAt('md') };
export const PopupLarge = { name: 'Popup large', render: () => popupAt('lg') };

/** One Flag appearance per story. */
const flagOf = (appearance, title) => (
    <FlagGroup containerPosition="static">
        <Flag appearance={appearance} title={title} show autohide={false}>
            One or two sentences on what happened and what to do next.
        </Flag>
    </FlagGroup>
);

export const FlagNormal = { name: 'Flag normal', render: () => flagOf('normal', 'Session moved') };
export const FlagInformation = { name: 'Flag information', render: () => flagOf('information', 'Heads up') };
export const FlagSuccess = { name: 'Flag success', render: () => flagOf('success', 'Changes saved') };
export const FlagWarning = { name: 'Flag warning', render: () => flagOf('warning', 'Check your entries') };
export const FlagError = { name: 'Flag error', render: () => flagOf('error', 'Something went wrong') };

/** Stage geometry for the single Tooltip stories: room above the trigger, and an inset so a wrapped Tooltip stays on screen. */
const TOOLTIP_STAGE = { height: 136, inset: 120 };

/** One Tooltip per story: one line, and one long enough to wrap. */
const tooltipOf = (text) => (
    <Stage height={TOOLTIP_STAGE.height} style={{ display: 'flex', alignItems: 'flex-end', paddingLeft: TOOLTIP_STAGE.inset }}>
        {({ open }) => (
            <Tooltip show={open} placement="top" text={text}>
                <Button text="Share" spacing="compact" />
            </Tooltip>
        )}
    </Stage>
);

export const TooltipOneLine = { name: 'Tooltip', render: () => tooltipOf('Copy link') };
export const TooltipWrapped = {
    name: 'Tooltip, wrapped',
    render: () => tooltipOf("Copies the session link so you can paste it into a message to the student's family"),
};

export const Interactive = {
    args: { title: 'Session notes', width: 'md', placement: 'bottom-start' },
    render: (args) => (
        <Stage height={220}>
            {() => (
                <Popup
                    width={args.width}
                    placement={args.placement}
                    title={args.title}
                    trigger={<Button text="Open popup" spacing="compact" />}
                >
                    Notes stay with the session.
                </Popup>
            )}
        </Stage>
    ),
};
