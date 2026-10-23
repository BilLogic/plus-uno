import React from 'react';
import { expect, spyOn, within } from 'storybook/test';

import {
    Breadcrumb,
    Button,
    ButtonGroup,
    Checkbox,
    CloseButton,
    NavPills,
    NavTabs,
    Radio,
    Range,
    Rating,
    Switch,
} from '@/components';

/**
 * Two control heights: 32 for everything, 24 compact for buttons in table rows
 * and inline toolbars and for choice rows. Every control label is 14/20 and
 * every icon draws at 16, whatever the size prop says.
 *
 * Size prop names stay. `medium` draws 32, `small` draws 24, and `large` is
 * deprecated: it draws like `medium` and warns in development.
 *
 * Checkbox, Radio and Switch rows are 24 at every size. Range, Rating,
 * Breadcrumb and Close button are 32. Button group, Nav pills and Nav tabs
 * follow the button.
 */
export default {
    title: 'Components/Actions/Control heights',
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

const BUTTON_HEIGHTS = { small: 24, medium: 32, large: 32 };

/** Text, icon and icon-only buttons at each size. */
export const Buttons = () => (
    <div style={stack}>
        {Object.keys(BUTTON_HEIGHTS).map((size) => (
            <div key={size} style={row} data-size={size}>
                <Button size={size} text={`Save ${size}`} />
                <Button size={size} fill="outline" text={`Add ${size}`} leadingVisual="plus" />
                <Button size={size} fill="ghost" leadingVisual="trash" aria-label={`Delete ${size}`} />
            </div>
        ))}
    </div>
);

Buttons.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const [size, height] of Object.entries(BUTTON_HEIGHTS)) {
        const text = canvas.getByRole('button', { name: `Save ${size}` });
        const withIcon = canvas.getByRole('button', { name: `Add ${size}` });
        const iconOnly = canvas.getByRole('button', { name: `Delete ${size}` });

        for (const button of [text, withIcon, iconOnly]) {
            const name = `${size} ${button.getAttribute('aria-label') || button.textContent}`;
            await expect(heightOf(button), `${name} height`).toBe(height);
        }
        // An icon-only button is square.
        await expect(Math.round(box(iconOnly).width), `${size} icon-only width`).toBe(height);

        await expectLabel(text.querySelector('.plus-btn-text'), `${size} label`, '500');
        for (const button of [withIcon, iconOnly]) {
            const icon = button.querySelector('.plus-btn-visual i');
            await expect(getComputedStyle(icon).fontSize, `${size} icon`).toBe('16px');
        }
    }
};

/** A button keeps its size inside a heading, which sizes its own icons. */
export const ButtonInHeading = () => (
    <div className="h3" style={row}>
        <span>Heading</span>
        <Button size="medium" fill="ghost" leadingVisual="pen" aria-label="Edit" />
    </div>
);

ButtonInHeading.play = async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Edit' });
    await expect(heightOf(button)).toBe(32);
    await expect(getComputedStyle(button.querySelector('i')).fontSize).toBe('16px');
};

/** `size="large"` is deprecated: it draws like `medium` and warns in development. */
let largeWarn;
export const LargeWarns = {
    beforeEach: () => {
        largeWarn = spyOn(console, 'warn').mockImplementation(() => {});
        return () => largeWarn.mockRestore();
    },
    render: () => (
        <div style={stack}>
            <div style={row}>
                <Button size="large" text="Large" />
                <Button size="medium" text="Medium" />
            </div>
            <ButtonGroup size="large" ariaLabel="Large group" buttons={[{ text: 'One' }]} />
            <Checkbox size="large" label="Large checkbox" />
            <Radio size="large" name="large" label="Large radio" />
            <Switch size="large" label="Large switch" />
            <Range size="large" label="Large range" value={40} onChange={() => {}} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const messages = largeWarn.mock.calls.map((call) => String(call[0]));
        for (const component of ['Button', 'Checkbox', 'Radio', 'Switch', 'Range']) {
            await expect(
                messages.some((m) => m.startsWith(`[${component}]`) && m.includes('size="large" is deprecated')),
                `${component} warns`,
            ).toBe(true);
        }
        const canvas = within(canvasElement);
        await expect(heightOf(canvas.getByRole('button', { name: 'Large' })))
            .toBe(heightOf(canvas.getByRole('button', { name: 'Medium' })));
    },
};

/** Button group follows the button. */
export const Groups = () => (
    <div style={stack}>
        <ButtonGroup size="small" ariaLabel="Small group" buttons={[{ text: 'Day' }, { text: 'Week' }]} />
        <ButtonGroup size="medium" ariaLabel="Medium group" buttons={[{ text: 'Day' }, { text: 'Week' }]} />
    </div>
);

Groups.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(heightOf(canvas.getByRole('group', { name: 'Small group' }))).toBe(24);
    await expect(heightOf(canvas.getByRole('group', { name: 'Medium group' }))).toBe(32);
};

/** Close button is a 32 box drawing a 16 ×. */
export const Close = () => <CloseButton what="panel" />;

Close.play = async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Dismiss panel' });
    await expect(heightOf(button)).toBe(32);
    await expect(Math.round(box(button).width)).toBe(32);
    await expect(getComputedStyle(button.querySelector('i')).fontSize).toBe('16px');
};

const CHOICE_SIZES = ['small', 'medium', 'large'];

/** Checkbox, Radio and Switch rows are 24 at every size, labels 14/20. */
export const ChoiceRows = () => (
    <div style={stack}>
        {CHOICE_SIZES.map((size) => (
            <div key={size} style={stack}>
                <Checkbox size={size} label={`Checkbox ${size}`} />
                <Radio size={size} name={`radio-${size}`} label={`Radio ${size}`} />
                <Switch size={size} label={`Switch ${size}`} />
            </div>
        ))}
        <Switch inputProps={{ 'aria-label': 'Bare switch' }} />
    </div>
);

ChoiceRows.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const size of CHOICE_SIZES) {
        for (const [role, name] of [
            ['checkbox', `Checkbox ${size}`],
            ['radio', `Radio ${size}`],
            ['switch', `Switch ${size}`],
        ]) {
            const input = canvas.getByRole(role, { name });
            const line = input.closest('.form-check');
            await expect(heightOf(line), `${name} row`).toBe(24);
            await expectLabel(line.querySelector('.form-check-label'), name, '400');
        }
    }
    // Without a label it is not a row: the bare track keeps its own height.
    const bare = canvas.getByRole('switch', { name: 'Bare switch' });
    await expect(heightOf(bare.parentElement)).toBeLessThan(24);
};

/** Range is 32 at every size, label 14/20. */
export const Ranges = () => (
    <div style={{ ...stack, width: '320px', alignItems: 'stretch' }}>
        {CHOICE_SIZES.map((size) => (
            <Range key={size} size={size} label={`Range ${size}`} value={40} onChange={() => {}} />
        ))}
    </div>
);

Ranges.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const size of CHOICE_SIZES) {
        const slider = canvas.getByRole('slider', { name: `Range ${size}` });
        await expect(heightOf(slider), `${size} slider`).toBe(32);
        await expectLabel(canvasElement.querySelector(`label[for="${slider.id}"]`), `${size} label`, '400');
    }
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
    const list = canvasElement.querySelector('.breadcrumb');
    await expect(heightOf(list)).toBe(32);
    for (const item of list.querySelectorAll('.breadcrumb-item')) {
        await expectLabel(item, item.textContent);
    }
};

/** Nav tabs and Nav pills follow the button: 32, labels 14/20 medium; a selected tab is semibold. */
export const Tabs = () => (
    <div style={stack}>
        <NavTabs activeKey="1" onSelect={() => {}} aria-label="Tabs">
            <NavTabs.Item eventKey="1">Home</NavTabs.Item>
            <NavTabs.Item eventKey="2">Profile</NavTabs.Item>
        </NavTabs>
        <NavPills activeKey="1" onSelect={() => {}} aria-label="Pills">
            <NavPills.Item eventKey="1">Day</NavPills.Item>
            <NavPills.Item eventKey="2">Week</NavPills.Item>
        </NavPills>
    </div>
);

Tabs.play = async ({ canvasElement }) => {
    const links = canvasElement.querySelectorAll('.nav-link');
    await expect(links).toHaveLength(4);
    for (const link of links) {
        await expect(heightOf(link), `${link.textContent} height`).toBe(32);
        // Selected or not, a label stays medium: the indicator and the color mark selection.
        await expectLabel(link, link.textContent, '500');
    }
};
