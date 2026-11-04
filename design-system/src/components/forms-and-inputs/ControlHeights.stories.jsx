import React from 'react';
import { expect, within } from 'storybook/test';

import { Breadcrumb, ButtonGroup, Checkbox, CloseButton, Radio, Range, Rating, Tabs as TabsComponent, Toggle, Button, IconButton } from '@/components';

/**
 * Two control heights: 32 for everything, 24 compact for buttons in table rows
 * and inline toolbars and for choice rows. Every control label is 14/20 and
 * every icon draws at 16, whatever the size prop says.
 *
 * Button takes `spacing`: default draws 32 and compact draws 24.
 *
 * Checkbox, Radio and Toggle rows are 24. Range, Rating,
 * Breadcrumb and Close button are 32. Button group, Nav pills and Nav tabs
 * follow the button.
 */
export default {
    title: 'Components/Forms and inputs/Control heights',
    tags: ['!dev', '!autodocs'],
};

const stack = { display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-start' };
const row = { display: 'flex', gap: '8px', alignItems: 'center' };

const box = (element) => element.getBoundingClientRect();
const heightOf = (element) => Math.round(box(element).height);

/** The label text style a control draws: 14/20, at the given weight. */
const expectLabel = async (element, name, weight) => {
    const style = getComputedStyle(element);
    await expect(style.fontSize, `${name} font size`).toBe('14px');
    await expect(style.lineHeight, `${name} line height`).toBe('20px');
    if (weight) await expect(style.fontWeight, `${name} font weight`).toBe(weight);
};

const BUTTON_HEIGHTS = { compact: 24, default: 32 };

/** Text, icon and icon-only buttons at each size. */
export const Buttons = () => (
    <div style={stack}>
        {Object.keys(BUTTON_HEIGHTS).map((spacing) => (
            <div key={spacing} style={row} data-spacing={spacing}>
                <Button appearance="primary" spacing={spacing} text={`Save ${spacing}`} />
                <Button spacing={spacing} text={`Add ${spacing}`} iconBefore="plus" />
                <IconButton spacing={spacing} appearance="subtle" icon="trash" label={`Delete ${spacing}`} />
            </div>
        ))}
    </div>
);

Buttons.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const [spacing, height] of Object.entries(BUTTON_HEIGHTS)) {
        const text = canvas.getByRole('button', { name: `Save ${spacing}` });
        const withIcon = canvas.getByRole('button', { name: `Add ${spacing}` });
        const iconOnly = canvas.getByRole('button', { name: `Delete ${spacing}` });

        for (const button of [text, withIcon, iconOnly]) {
            const name = `${spacing} ${button.getAttribute('aria-label') || button.textContent}`;
            await expect(heightOf(button), `${name} height`).toBe(height);
        }
        // An icon-only button is square.
        await expect(Math.round(box(iconOnly).width), `${spacing} icon-only width`).toBe(height);

        await expectLabel(text.querySelector('.plus-btn-text'), `${spacing} label`, '500');
        for (const button of [withIcon, iconOnly]) {
            const icon = button.querySelector('.plus-btn-visual i');
            await expect(getComputedStyle(icon).fontSize, `${spacing} icon`).toBe('16px');
        }
    }
};

/** A button keeps its size inside a heading, which sizes its own icons. */
export const ButtonInHeading = () => (
    <div className="h3" style={row}>
        <span>Heading</span>
        <IconButton appearance="subtle" icon="pen" label="Edit" />
    </div>
);

ButtonInHeading.play = async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Edit' });
    await expect(heightOf(button)).toBe(32);
    await expect(getComputedStyle(button.querySelector('i')).fontSize).toBe('16px');
};

/** Button group follows the button. */
export const Groups = () => (
    <div style={stack}>
        <ButtonGroup label="Small group">
            <Button text="Day" spacing="compact" />
            <Button text="Week" spacing="compact" />
        </ButtonGroup>
        <ButtonGroup label="Medium group">
            <Button text="Day" />
            <Button text="Week" />
        </ButtonGroup>
    </div>
);

Groups.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(heightOf(canvas.getByRole('group', { name: 'Small group' }))).toBe(24);
    await expect(heightOf(canvas.getByRole('group', { name: 'Medium group' }))).toBe(32);
};

/** Close button is a 32 box drawing a 16 ×. */
export const Close = () => <CloseButton label="Dismiss panel" />;

Close.play = async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Dismiss panel' });
    await expect(heightOf(button)).toBe(32);
    await expect(Math.round(box(button).width)).toBe(32);
    await expect(getComputedStyle(button.querySelector('i')).fontSize).toBe('16px');
};

const TOGGLE_SIZES = [16, 20];

/** Checkbox, Radio and Toggle rows are 24, labels 14/20. */
export const ChoiceRows = () => (
    <div style={stack}>
        <Checkbox label="Checkbox"/>
        <Radio name="radio-row" label="Radio"/>
        {TOGGLE_SIZES.map((size) => (
            <Toggle key={size} size={size} label={`Toggle ${size}`}/>
        ))}
        <Toggle aria-label="Bare toggle"/>
    </div>
);

ChoiceRows.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const [role, name, rowClass, labelClass] of [
        ['checkbox', 'Checkbox', '.plus-form-checkbox-row', '.plus-form-checkbox-label'],
        ['radio', 'Radio', '.plus-form-radio-row', '.plus-form-radio-label'],
    ]) {
        const input = canvas.getByRole(role, { name });
        const line = input.closest(rowClass);
        await expect(heightOf(line), `${name} row`).toBe(24);
        await expectLabel(line.querySelector(labelClass), name, '400');
    }
    for (const name of ['Toggle 16', 'Toggle 20']) {
        const toggle = canvas.getByRole('switch', { name });
        const line = toggle.closest('.plus-toggle-wrapper');
        await expect(heightOf(line), `${name} row`).toBe(24);
        await expectLabel(line.querySelector('.plus-toggle-label'), name, '400');
    }
    // Without a label it is not a row: the bare track keeps its own height.
    const bare = canvas.getByRole('switch', { name: 'Bare toggle' });
    await expect(heightOf(bare.closest('.plus-toggle-wrapper'))).toBeLessThan(24);
};

/** Range is 32, label 14/20. */
export const Ranges = () => (
    <div style={{ ...stack, width: '320px', alignItems: 'stretch' }}>
        <Range label="Range" value={40} onChange={() => {}}/>
    </div>
);

Ranges.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slider = canvas.getByRole('slider', { name: 'Range' });
    await expect(heightOf(slider), 'slider').toBe(32);
    // Range names its slider through `aria-labelledby`, not a native
    // `label[for]` — Base UI's Slider has no DOM-query label lookup the way
    // Checkbox and Radio do (see Range.jsx).
    await expectLabel(canvasElement.querySelector('.plus-field-label'), 'range label', '400');
};

/** Rating items are 32 with a 16 star. */
export const RatingItems = () => <Rating label="How did it go?" value={3} onChange={() => {}} />;

RatingItems.play = async ({ canvasElement }) => {
    const items = within(canvasElement).getAllByRole('radio');
    await expect(items).toHaveLength(5);
    for (const item of items) {
        await expect(heightOf(item)).toBe(32);
        await expect(Math.round(box(item).width)).toBe(32);
        await expect(getComputedStyle(item.querySelector('i')).fontSize).toBe('16px');
    }
};

/** Breadcrumb is 32, its text 14/20. */
export const Breadcrumbs = () => (
    <Breadcrumb items={[{ text: 'Home', href: '#home' }, { text: 'Sessions', href: '#sessions' }, { text: 'Today' }]} />
);

Breadcrumbs.play = async ({ canvasElement }) => {
    const list = canvasElement.querySelector('.plus-breadcrumb-list');
    await expect(heightOf(list)).toBe(32);
    for (const item of list.querySelectorAll('.plus-breadcrumb-item')) {
        await expectLabel(item, item.textContent);
    }
};

/** Nav tabs follow the button: 32, labels 14/20 medium; a selected tab is semibold. */
export const Tabs = () => (
    <div style={stack}>
        <TabsComponent activeKey="1" onSelect={() => {}} aria-label="Tabs">
            <TabsComponent.Tab eventKey="1">Home</TabsComponent.Tab>
            <TabsComponent.Tab eventKey="2">Profile</TabsComponent.Tab>
        </TabsComponent>
    </div>
);

Tabs.play = async ({ canvasElement }) => {
    const links = canvasElement.querySelectorAll('.plus-tab');
    await expect(links).toHaveLength(2);
    for (const link of links) {
        await expect(heightOf(link), `${link.textContent} height`).toBe(32);
        // Selected or not, a label stays medium: the indicator and the color mark selection.
        await expectLabel(link, link.textContent, '500');
    }
};
