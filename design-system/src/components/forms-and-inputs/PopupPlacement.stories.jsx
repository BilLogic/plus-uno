import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { tokenLength } from '@/storybook-docs/lib/style-probes.js';

import Cascader from './Cascader';
import Select from './Select';
import TagInput from './TagInput';
import TreeSelect from './TreeSelect';

/**
 * The popup placement rule, held across every field-anchored popup that
 * shares it: `Select` and `TagInput` (the shared `Listbox`), `TreeSelect` and
 * `Cascader`. The `Dropdown` menu has its own placement stories beside it.
 *
 * - **Gap:** `--size-element-gap-xs` between the field and the popup, below
 *   it or, with no room below, above it.
 * - **Alignment:** left edges line up; a popup that would run past the
 *   viewport's right edge right-aligns to the field instead.
 * - **Width:** at least the field's width, growing with its content up to
 *   320px; a field wider than that keeps its own width. `Cascader`'s columns
 *   are exempt from the 320px cap.
 */
export default {
    title: 'Components/Forms and inputs/Popup placement',
    tags: ['!dev', '!autodocs'],
};

/** The cap on a popup's content-driven width, from the approved rule. */
const POPUP_MAX_WIDTH = 320;

const SHORT = [
    { value: 'a', label: 'Algebra' },
    { value: 'b', label: 'Biology' },
];
const LONG = [
    { value: 'a', label: 'Algebra and the long road through quadratic equations for beginners' },
    { value: 'b', label: 'Biology' },
];
const TREE = [
    { label: 'Mathematics and the long road through quadratic equations', value: 'maths', children: [{ label: 'Algebra', value: 'algebra' }] },
    { label: 'Science', value: 'science' },
];
const SHORT_TREE = [
    { label: 'Maths', value: 'maths' },
    { label: 'Science', value: 'science' },
];
const CASCADE = [
    {
        label: 'Mathematics and its many branches',
        value: 'maths',
        children: [{ label: 'Algebra and the long road through quadratic equations', value: 'algebra' }],
    },
    { label: 'Science', value: 'science' },
];

/* ---------------------------------------------------------------- probes */

/** The open popup surface for each component. */
const SURFACE = {
    select: '.plus-listbox--floating',
    tagInput: '.plus-listbox--floating',
    treeSelect: '.plus-tree-select-menu',
    cascader: '.plus-cascader-menu',
};

/** Open the story's one field and return its box, the popup's box and the gap token. */
const openPopup = async (canvasElement, kind) => {
    const field = canvasElement.querySelector('.plus-field');
    await userEvent.click(kind === 'tagInput' ? field.querySelector('input') : field);
    const surface = await waitFor(() => {
        const el = document.querySelector(SURFACE[kind]);
        expect(el, 'the popup is open').not.toBeNull();
        expect(el).toBeVisible();
        return el;
    });
    // Let placement settle over a frame before measuring.
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return {
        field: field.getBoundingClientRect(),
        popup: surface.getBoundingClientRect(),
        gap: tokenLength(canvasElement, '--size-element-gap-xs'),
    };
};

const expectBelow = async ({ field, popup, gap }) => {
    await expect(popup.top - field.bottom, 'the gap below the field').toBeCloseTo(gap, 0);
    await expect(popup.left, 'left edges line up').toBeCloseTo(field.left, 0);
};

const expectAbove = async ({ field, popup, gap }) => {
    await expect(popup.bottom, 'the popup flipped above').toBeLessThanOrEqual(field.top);
    await expect(field.top - popup.bottom, 'the gap above the field').toBeCloseTo(gap, 0);
};

const expectRightAligned = async ({ field, popup }) => {
    await expect(popup.width, 'the popup is wider than the field').toBeGreaterThan(field.width);
    await expect(popup.right, 'right edges line up').toBeCloseTo(field.right, 0);
    await expect(popup.right, 'inside the viewport').toBeLessThanOrEqual(document.documentElement.clientWidth);
};

/* --------------------------------------------------------------- layouts */

/** A field `width` wide near the top-left of the canvas. */
const AtTop = ({ width = 200, children }) => (
    <div style={{ padding: '24px 24px 360px' }}>
        <div style={{ width }}>{children}</div>
    </div>
);

/** A field pinned to the bottom of the viewport, so there is no room below. */
const AtBottom = ({ children }) => (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'flex-end', padding: '360px 24px 0', boxSizing: 'border-box' }}>
        <div style={{ width: 200 }}>{children}</div>
    </div>
);

/** A narrow field against the right edge, so a wide popup cannot fit left-aligned. */
const AtRightEdge = ({ children }) => (
    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '24px 0 360px' }}>
        <div style={{ width: 120 }}>{children}</div>
    </div>
);

/* --------------------------------------------------------- Select (Listbox) */

export const SelectBelow = () => <AtTop><Select label="Subject" options={SHORT} /></AtTop>;
SelectBelow.play = async ({ canvasElement }) => expectBelow(await openPopup(canvasElement, 'select'));

export const SelectFlipsAbove = () => <AtBottom><Select label="Subject" options={SHORT} /></AtBottom>;
SelectFlipsAbove.play = async ({ canvasElement }) => expectAbove(await openPopup(canvasElement, 'select'));

export const SelectRightAligns = () => <AtRightEdge><Select label="Subject" options={LONG} /></AtRightEdge>;
SelectRightAligns.play = async ({ canvasElement }) => expectRightAligned(await openPopup(canvasElement, 'select'));

export const SelectWidthIsTheFieldsWhenContentIsShort = () => <AtTop width={240}><Select label="Subject" options={SHORT} /></AtTop>;
SelectWidthIsTheFieldsWhenContentIsShort.play = async ({ canvasElement }) => {
    const { field, popup } = await openPopup(canvasElement, 'select');
    await expect(popup.width, 'as wide as the field').toBeCloseTo(field.width, 0);
};

export const SelectWidthCapsLongContent = () => <AtTop width={120}><Select label="Subject" options={LONG} /></AtTop>;
SelectWidthCapsLongContent.play = async ({ canvasElement }) => {
    const { popup } = await openPopup(canvasElement, 'select');
    await expect(popup.width, 'long content stops at the cap').toBeCloseTo(POPUP_MAX_WIDTH, 0);
};

export const SelectWidthFollowsAWideField = () => <AtTop width={360}><Select label="Subject" options={LONG} /></AtTop>;
SelectWidthFollowsAWideField.play = async ({ canvasElement }) => {
    const { field, popup } = await openPopup(canvasElement, 'select');
    await expect(popup.width, 'a field past the cap keeps its width').toBeCloseTo(field.width, 0);
};

/* ------------------------------------------------------- TagInput (Listbox) */

export const TagInputFlipsAbove = () => <AtBottom><TagInput label="Topics" options={SHORT} /></AtBottom>;
TagInputFlipsAbove.play = async ({ canvasElement }) => expectAbove(await openPopup(canvasElement, 'tagInput'));

export const TagInputRightAligns = () => <AtRightEdge><TagInput label="Topics" options={LONG} /></AtRightEdge>;
TagInputRightAligns.play = async ({ canvasElement }) => expectRightAligned(await openPopup(canvasElement, 'tagInput'));

/* ------------------------------------------------------------- TreeSelect */

export const TreeSelectBelow = () => <AtTop><TreeSelect options={SHORT_TREE} /></AtTop>;
TreeSelectBelow.play = async ({ canvasElement }) => expectBelow(await openPopup(canvasElement, 'treeSelect'));

export const TreeSelectFlipsAbove = () => <AtBottom><TreeSelect options={SHORT_TREE} /></AtBottom>;
TreeSelectFlipsAbove.play = async ({ canvasElement }) => expectAbove(await openPopup(canvasElement, 'treeSelect'));

export const TreeSelectRightAligns = () => <AtRightEdge><TreeSelect options={TREE} /></AtRightEdge>;
TreeSelectRightAligns.play = async ({ canvasElement }) => expectRightAligned(await openPopup(canvasElement, 'treeSelect'));

export const TreeSelectWidthIsTheFieldsWhenContentIsShort = () => <AtTop width={240}><TreeSelect options={SHORT_TREE} /></AtTop>;
TreeSelectWidthIsTheFieldsWhenContentIsShort.play = async ({ canvasElement }) => {
    const { field, popup } = await openPopup(canvasElement, 'treeSelect');
    await expect(popup.width, 'as wide as the field').toBeCloseTo(field.width, 0);
};

export const TreeSelectWidthCapsLongContent = () => <AtTop width={120}><TreeSelect options={TREE} /></AtTop>;
TreeSelectWidthCapsLongContent.play = async ({ canvasElement }) => {
    const { popup } = await openPopup(canvasElement, 'treeSelect');
    await expect(popup.width, 'long content stops at the cap').toBeCloseTo(POPUP_MAX_WIDTH, 0);
};

export const TreeSelectWidthFollowsAWideField = () => <AtTop width={360}><TreeSelect options={TREE} /></AtTop>;
TreeSelectWidthFollowsAWideField.play = async ({ canvasElement }) => {
    const { field, popup } = await openPopup(canvasElement, 'treeSelect');
    await expect(popup.width, 'a field past the cap keeps its width').toBeCloseTo(field.width, 0);
};

/* ---------------------------------------------------------------- Cascader */

export const CascaderBelow = () => <AtTop><Cascader options={CASCADE} /></AtTop>;
CascaderBelow.play = async ({ canvasElement }) => expectBelow(await openPopup(canvasElement, 'cascader'));

export const CascaderFlipsAbove = () => <AtBottom><Cascader options={CASCADE} /></AtBottom>;
CascaderFlipsAbove.play = async ({ canvasElement }) => expectAbove(await openPopup(canvasElement, 'cascader'));

export const CascaderRightAligns = () => <AtRightEdge><Cascader options={CASCADE} /></AtRightEdge>;
CascaderRightAligns.play = async ({ canvasElement }) => expectRightAligned(await openPopup(canvasElement, 'cascader'));

/** Columns are exempt from the cap: an opened path grows the popup past 320px. */
export const CascaderColumnsPassTheCap = () => <AtTop width={120}><Cascader options={CASCADE} /></AtTop>;
CascaderColumnsPassTheCap.play = async ({ canvasElement }) => {
    const { field } = await openPopup(canvasElement, 'cascader');
    await userEvent.click(within(canvasElement).getByRole('option', { name: /Mathematics/ }));
    await waitFor(() => expect(canvasElement.querySelectorAll('.plus-cascader-column').length, 'two columns open').toBe(2));
    const popup = canvasElement.querySelector('.plus-cascader-menu').getBoundingClientRect();
    await expect(popup.width, 'at least the field').toBeGreaterThanOrEqual(field.width);
    await expect(popup.width, 'columns pass the cap').toBeGreaterThan(POPUP_MAX_WIDTH);
};

/* --------------------------------------------------------- outside press */

/** A press inside the popup keeps it open; a press outside the field and popup closes it. */
const expectOutsidePressCloses = async (canvasElement, kind, inside) => {
    await openPopup(canvasElement, kind);
    await userEvent.click(inside(within(canvasElement)));
    await expect(document.querySelector(SURFACE[kind]), 'a press inside keeps it open').not.toBeNull();
    await userEvent.click(within(canvasElement).getByText('Outside the field'));
    await waitFor(() => expect(document.querySelector(SURFACE[kind]), 'a press outside closes it').toBeNull());
};

const WithOutside = ({ children }) => (
    <AtTop>
        {children}
        <p>Outside the field</p>
    </AtTop>
);

export const TreeSelectClosesOnAnOutsidePress = () => <WithOutside><TreeSelect options={TREE} /></WithOutside>;
TreeSelectClosesOnAnOutsidePress.play = async ({ canvasElement }) => expectOutsidePressCloses(
    canvasElement,
    'treeSelect',
    (canvas) => canvas.getByRole('treeitem', { name: /Mathematics/ }).querySelector('.plus-option-row-toggle'),
);

export const CascaderClosesOnAnOutsidePress = () => <WithOutside><Cascader options={CASCADE} /></WithOutside>;
CascaderClosesOnAnOutsidePress.play = async ({ canvasElement }) => expectOutsidePressCloses(
    canvasElement,
    'cascader',
    (canvas) => canvas.getByRole('option', { name: /Mathematics/ }),
);
