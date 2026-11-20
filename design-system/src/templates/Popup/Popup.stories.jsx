import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { Button, ButtonItem, Popup, POPUP_WIDTH_PX } from '@/components';
import { ScrollStage } from '@/storybook-docs/lib/fit-stage.jsx';
import { LiveAnatomy } from '@/storybook-docs/lib/template-page.jsx';
import { fitsCanvas, leadersCrossNoOtherPart, markersLevelWithParts } from '@/storybook-docs/lib/anatomy-asserts.js';
import { expectFullScale, expectNotInert } from '@/storybook-docs/lib/live-example-asserts.js';
import { expectMenuFade } from '@/storybook-docs/lib/overlay-motion-plays';
import { tokenLength } from '@/storybook-docs/lib/style-probes.js';
import * as Demo from './popupDemo.jsx';

const { TYPE_STAGE } = Demo;

/**
 * Stories for the Popup template page. Each holds one real layer open in a
 * stage that reserves its room, and each play asserts what a reader sees: the
 * layer is open, it sits inside its stage with nothing clipped, and its size,
 * edge and offset come from the tokens.
 */
export default {
    // A test harness and the page's figures: `!dev` keeps it out of the sidebar. The page is Templates/Popup (Popup.mdx).
    title: 'Templates/Popup/Examples',
    tags: ['!dev', '!autodocs'],
};

const rect = (el) => el.getBoundingClientRect();

/** Stage heights per type, in px: room for the trigger, the 4 gap and the open layer. Docs geometry. */
const HEIGHT = { menu: 290, select: 180, filter: 290, stacked: 520, profile: 240, content: 250, long: 240, load: 140 };

const found = (canvasElement, selector) => waitFor(() => {
    const node = canvasElement.querySelector(selector);
    if (!node) throw new Error(`${selector} is not open`);
    return node;
});

/** The open layer sits inside its stage, whole: nothing clips it. */
const holdsInStage = async (canvasElement, selector) => {
    fitsCanvas(canvasElement);
    const layer = await found(canvasElement, selector);
    /* The stage fires a resize after 250ms to place its layer: retry until it settles. */
    await waitFor(() => {
        const stage = rect(canvasElement.querySelector('[data-popup-stage]'));
        const box = rect(layer);
        expect(box.left, 'the layer starts inside the stage').toBeGreaterThanOrEqual(stage.left - 0.5);
        expect(box.right, 'the layer ends inside the stage').toBeLessThanOrEqual(stage.right + 0.5);
        expect(box.top, 'the layer starts inside the stage').toBeGreaterThanOrEqual(stage.top - 0.5);
        expect(box.bottom, 'the layer ends inside the stage').toBeLessThanOrEqual(stage.bottom + 0.5);
    });
    return layer;
};

/* ------------------------------------------------------------------ types */

export const TypeMenu = {
    name: 'Type: Menu',
    render: () => <Demo.PopupStage height={HEIGHT.menu} side="end">{(mount) => <Demo.Menu mount={mount} />}</Demo.PopupStage>,
    play: async ({ canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const layer = await holdsInStage(canvasElement, '.plus-dropdown-menu');
        const items = within(layer).getAllByRole('menuitem');
        await expect(items, 'a short list of rows').toHaveLength(4);
        items[0].focus();
        await expect(items[0]).toHaveFocus();
    },
};

export const TypeSelectList = {
    name: 'Type: Select list',
    render: () => <Demo.PopupStage height={HEIGHT.select}>{(mount) => <Demo.SelectList mount={mount} />}</Demo.PopupStage>,
    play: async ({ canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const layer = await holdsInStage(canvasElement, '.plus-popup-select');
        const listbox = within(layer).getByRole('listbox');
        const options = within(layer).getAllByRole('option');
        await expect(options, 'one list').toHaveLength(3);
        listbox.focus();
        await expect(listbox).toHaveFocus();
    },
};

export const TypeFilterMenu = {
    name: 'Type: Filter menu',
    render: () => <Demo.PopupStage height={HEIGHT.filter} side="end">{(mount) => <Demo.FilterMenuLayer mount={mount} />}</Demo.PopupStage>,
    play: async ({ canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const layer = await holdsInStage(canvasElement, '.plus-filter-menu');
        await expect(layer, 'two or three categories sit side by side').toHaveClass('plus-filter-menu--side-by-side');
        const footer = layer.querySelector('.plus-filter-menu__footer');
        const clear = within(footer).getByRole('button', { name: 'Clear' });
        await expect(clear.className, 'Clear is Subtle').toContain('subtle');
        await expect(within(footer).getByRole('button', { name: 'Apply' }).className, 'Apply is Default, no Primary').toContain('default');
        clear.focus();
        await expect(clear).toHaveFocus();
    },
};

export const TypeFilterMenuStacked = {
    name: 'Type: Filter menu, stacked',
    render: () => (
        <Demo.PopupStage height={HEIGHT.stacked} side="end">
            {(mount) => <Demo.FilterMenuLayer mount={mount} categories={Demo.STACKED} width="4-col" />}
        </Demo.PopupStage>
    ),
    play: async ({ canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const layer = await holdsInStage(canvasElement, '.plus-filter-menu');
        await expect(layer, 'four or more categories stack').toHaveClass('plus-filter-menu--stacked');
        await expect(layer, 'up to 4-col').toHaveClass('plus-popup--4-col');
        const apply = within(layer).getByRole('button', { name: 'Apply' });
        await expect(apply, 'the footer stays pinned under the scrolling categories').toBeInTheDocument();
        apply.focus();
        await expect(apply).toHaveFocus();
    },
};

export const TypeProfileMenu = {
    name: 'Type: Profile menu',
    render: () => <Demo.PopupStage height={HEIGHT.profile}>{(mount) => <Demo.ProfileMenu mount={mount} />}</Demo.PopupStage>,
    play: async ({ canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const layer = await holdsInStage(canvasElement, '.plus-dropdown-menu');
        const signOut = within(layer).getByRole('menuitem', { name: 'Sign out' });
        await expect(signOut, 'Sign out closes the menu').toBeInTheDocument();
        signOut.focus();
        await expect(signOut).toHaveFocus();
    },
};

export const TypeContent = {
    name: 'Type: Content',
    render: () => <Demo.PopupStage height={HEIGHT.content}>{(mount) => <Demo.Content mount={mount} />}</Demo.PopupStage>,
    play: async ({ canvas, canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        const layer = await holdsInStage(canvasElement, '.plus-popup');
        await expect(layer, 'content takes 4-col, the cap').toHaveClass('plus-popup--4-col');
        await expect(layer.getAttribute('role'), 'content is a popup, not a dialog that traps focus').not.toBeNull();
        const trigger = canvas.getByRole('button', { name: 'Notes' });
        trigger.focus();
        await expect(trigger).toHaveFocus();
    },
};

/* --------------------------------------------------------------- anatomy */

const ANATOMY_PARTS = [
    { selector: '.plus-filter-menu__trigger', label: 'Trigger', side: 'end', at: 'middle' },
    { selector: '.plus-filter-menu', label: 'Layer', side: 'end', at: 'start', holds: true },
    { selector: '.plus-filter-menu__categories', label: 'Categories', side: 'end', at: 'middle' },
    { selector: '.plus-filter-menu__footer', label: 'Footer', side: 'end', at: 'end' },
];

export const AnatomyFilterMenu = {
    name: 'Anatomy: Filter menu',
    render: () => (
        <LiveAnatomy live scrollable width={TYPE_STAGE} title="A filter menu off the Filter icon with its parts numbered" parts={ANATOMY_PARTS}>
            <Demo.PopupStage height={HEIGHT.filter} side="end">{(mount) => <Demo.FilterMenuLayer mount={mount} />}</Demo.PopupStage>
        </LiveAnatomy>
    ),
    play: async ({ canvasElement }) => {
        await expectNotInert(canvasElement);
        await expectFullScale(canvasElement);
        fitsCanvas(canvasElement);
        await found(canvasElement, '.plus-filter-menu');
        await markersLevelWithParts(canvasElement, ANATOMY_PARTS);
        leadersCrossNoOtherPart(canvasElement, ANATOMY_PARTS);
        const layer = canvasElement.querySelector('.plus-filter-menu');
        await expect(getComputedStyle(layer).paddingTop, 'pad 16').toBe(`${tokenLength(canvasElement, '--popup-pad')}px`);
        await expect(getComputedStyle(layer).borderTopLeftRadius, 'radius 12').toBe(`${tokenLength(canvasElement, '--popup-radius')}px`);
        const trigger = rect(canvasElement.querySelector('.plus-filter-menu__trigger'));
        const gap = rect(layer).top - trigger.bottom;
        const stage = canvasElement.querySelector('[data-popup-stage]');
        const scale = rect(stage).width / stage.offsetWidth;
        await expect(Math.round(gap / scale), 'the layer hangs 4 below its trigger').toBe(tokenLength(canvasElement, '--popup-offset'));
        await expect(Math.round((rect(layer).right - trigger.right) / scale), 'aligned to the trigger’s end edge').toBe(0);
        const apply = within(layer).getByRole('button', { name: 'Apply' });
        apply.focus();
        await expect(apply).toHaveFocus();
    },
};

/* ---------------------------------------------------------------- widths */

/** The screen the column steps are read at: the same 1024 the Modal's widths use. Docs geometry. */
const SCREEN = 1024;
/** The stage the three steps lay out side by side at, in px: wide enough for the 4-col layer and its stage pad. Docs geometry. */
const WIDTHS_STAGE = 1280;
const READ_AT = { '--plus-overlay-screen': `${SCREEN}px` };

const WIDTH_NOTES = {
    auto: 'Notes stay with the session.',
    '3-col': 'Notes stay with the session. The tutor sees them first.',
    '4-col': 'Notes stay with the session. The tutor sees them first, and parents never see them.',
};

/** Auto, 3-col and 4-col at the 1024 screen, each held open under its own trigger. */
export const WidthSteps = {
    name: 'Widths',
    render: () => (
        <ScrollStage width={WIDTHS_STAGE}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.3fr', gap: 'var(--stack-xl) var(--inline-xl)' }}>
                {['auto', '3-col', '4-col'].map((width) => (
                    <Demo.PopupStage key={width} height={200}>
                        {(mount) => (
                            <Popup
                                id={`popup-width-${width}`}
                                show
                                triggerType="manual"
                                container={mount}
                                width={width}
                                style={READ_AT}
                                placement="bottom-start"
                                title="Session notes"
                                trigger={<Button text={width === 'auto' ? 'auto' : width} spacing="compact" />}
                            >
                                {WIDTH_NOTES[width]}
                            </Popup>
                        )}
                    </Demo.PopupStage>
                ))}
            </div>
        </ScrollStage>
    ),
    play: async ({ canvasElement }) => {
        fitsCanvas(canvasElement);
        const width = {};
        for (const key of ['auto', '3-col', '4-col']) {
            const node = await found(canvasElement, `#popup-width-${key}`);
            width[key] = node.offsetWidth;
        }
        await expect(width.auto, 'auto hugs inside 160 to 320').toBeGreaterThanOrEqual(tokenLength(canvasElement, '--popup-min-width'));
        await expect(width.auto, 'auto hugs inside 160 to 320').toBeLessThanOrEqual(tokenLength(canvasElement, '--popup-max-width'));
        await expect(width['3-col'], '3-col at 1024').toBeCloseTo(POPUP_WIDTH_PX['3-col'][1], 0);
        await expect(width['4-col'], '4-col at 1024').toBeCloseTo(POPUP_WIDTH_PX['4-col'][1], 0);
    },
};

/* ------------------------------------------------------------- placement */

/** The same pair of lines the page states: 4 below the trigger, on the trigger's own side of the bar. */
export const Placement = {
    render: () => (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--stack-xl) var(--inline-xl)' }}>
            <Demo.PopupStage height={HEIGHT.menu} side="start">
                {(mount) => <Demo.SelectList mount={mount} />}
            </Demo.PopupStage>
            <Demo.PopupStage height={HEIGHT.menu} side="end">
                {(mount) => <Demo.Menu mount={mount} />}
            </Demo.PopupStage>
        </div>
    ),
    play: async ({ canvasElement }) => {
        fitsCanvas(canvasElement);
        const [startStage, endStage] = canvasElement.querySelectorAll('[data-popup-stage]');
        const select = await found(startStage, '.plus-popup-select');
        const menu = await found(endStage, '.plus-dropdown-menu');
        const scale = rect(startStage).width / startStage.offsetWidth;
        const offset = tokenLength(canvasElement, '--popup-offset');

        const startTrigger = rect(startStage.querySelector('.plus-popup-select__trigger'));
        await expect(Math.round(rect(select).left - startTrigger.left), 'a start trigger gets a start-aligned layer').toBe(0);
        await expect(Math.round((rect(select).top - startTrigger.bottom) / scale), 'both open 4 below').toBe(offset);

        const endTrigger = rect(within(endStage).getByRole('button', { name: 'More' }));
        await expect(Math.round(rect(menu).right - endTrigger.right), 'an end trigger gets an end-aligned layer').toBe(0);
        await expect(Math.round((rect(menu).top - endTrigger.bottom) / scale), 'both open 4 below').toBe(offset);
    },
};

/* ------------------------------------------------------------ key states */

const LONG_LABEL = 'Move every remaining session in the Spring fractions group to the Monday evening block';

export const KeyLongLabel = {
    name: 'Key: Long label',
    render: () => (
        <Demo.PopupStage height={HEIGHT.long} side="end">
            {(mount) => (
                <Demo.Menu
                    mount={mount}
                    rows={(
                        <>
                            <ButtonItem>Reschedule</ButtonItem>
                            <ButtonItem description="Ana and her tutor get an email with the new time">{LONG_LABEL}</ButtonItem>
                        </>
                    )}
                />
            )}
        </Demo.PopupStage>
    ),
    play: async ({ canvasElement }) => {
        const layer = await holdsInStage(canvasElement, '.plus-dropdown-menu');
        await expect(layer.offsetWidth, 'a menu stops at 320').toBeLessThanOrEqual(tokenLength(canvasElement, '--dropdown-menu-max-width'));
        const label = within(layer).getByText(LONG_LABEL);
        await expect(label.scrollWidth, 'the label ends in an ellipsis').toBeGreaterThan(label.clientWidth);
    },
};

export const KeyLoading = {
    name: 'Key: Loading a list',
    render: () => <Demo.PopupStage height={HEIGHT.load} side="end">{(mount) => <Demo.Menu mount={mount} isLoading />}</Demo.PopupStage>,
    play: async ({ canvasElement }) => {
        const layer = await holdsInStage(canvasElement, '.plus-dropdown-menu');
        await expect(within(layer).getByText('Loading options'), 'one row, no skeleton').toBeInTheDocument();
        await expect(layer.querySelector('.plus-skeleton'), 'no skeleton on a menu').toBeNull();
    },
};

export const KeyLoadFailed = {
    name: 'Key: Load failed',
    render: () => <Demo.PopupStage height={HEIGHT.load} side="end">{(mount) => <Demo.Menu mount={mount} hasError onRetry={() => {}} />}</Demo.PopupStage>,
    play: async ({ canvasElement }) => {
        const layer = await holdsInStage(canvasElement, '.plus-dropdown-menu');
        await expect(within(layer).getByText('Couldn’t load options'.replace('’', "'")), 'says so').toBeInTheDocument();
        await expect(within(layer).getByRole('menuitem', { name: 'Retry' }), 'and offers Retry').toBeInTheDocument();
    },
};

/** The layer fades in place on appearance.fast, in and out: no clip, scale or travel. */
export const KeyOpensWithAFade = {
    name: 'Key: Opens with a fade',
    render: () => (
        <div style={{ padding: 'calc(var(--pad-x-lg) * 4)', display: 'flex', justifyContent: 'center' }}>
            <Popup id="popup-template-fade" trigger={<Button text="Details" />} title="Session 12" placement="bottom-start">
                Ran 45 minutes over.
            </Popup>
        </div>
    ),
    play: async ({ canvasElement }) => {
        await userEvent.click(within(canvasElement).getByRole('button', { name: 'Details' }));
        const layer = await waitFor(() => {
            const node = canvasElement.ownerDocument.getElementById('popup-template-fade');
            if (!node) throw new Error('the layer is not open');
            return node;
        });
        await expectMenuFade(layer, 'enter');
        await userEvent.keyboard('{Escape}');
        await expectMenuFade(layer, 'exit');
        await waitFor(() => expect(layer.isConnected).toBe(false));
    },
};

/** No room below: the layer opens above its trigger and stays 8 from the stage's edge. */
export const KeyFlipped = {
    name: 'Key: Flipped',
    render: () => <Demo.PopupStage height={320} side="end" align="end">{(mount) => <Demo.Menu mount={mount} />}</Demo.PopupStage>,
    play: async ({ canvas, canvasElement }) => {
        const layer = await holdsInStage(canvasElement, '.plus-dropdown-menu');
        const more = canvas.getByRole('button', { name: 'More' });
        const stage = canvasElement.querySelector('[data-popup-stage]');
        /* Read the trigger, the stage and its scale inside the retry: the picture is scaled after it opens, so a box read once goes stale. */
        await waitFor(() => {
            const trigger = rect(more);
            const scale = rect(stage).width / stage.offsetWidth;
            expect(rect(layer).bottom, 'the layer opens above the trigger').toBeLessThanOrEqual(trigger.top);
            expect((rect(stage).bottom - rect(layer).bottom) / scale, 'and stays clear of the edge').toBeGreaterThanOrEqual(0);
        });
    },
};

/** After Apply the menu closes and the count sits on the Filter icon. */
export const KeyFilterApplied = {
    name: 'Key: Filter applied',
    render: () => (
        <Demo.PopupStage height={96} side="end">
            {(mount) => <Demo.FilterMenuLayer mount={mount} isOpen={false} defaultValue={{ status: ['Upcoming'], subject: ['Math'] }} />}
        </Demo.PopupStage>
    ),
    play: async ({ canvas, canvasElement }) => {
        fitsCanvas(canvasElement);
        await expect(canvas.getByRole('button', { name: 'Filters, 2 applied' }), 'the count rides on the icon').toBeInTheDocument();
        await expect(canvasElement.querySelector('.plus-filter-menu'), 'the menu is closed').toBeNull();
    },
};
