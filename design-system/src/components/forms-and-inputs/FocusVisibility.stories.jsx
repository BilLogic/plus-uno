import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import DatePicker from './DatePicker/DatePicker';
import Input from './Input';
import InputGroup from './InputGroup/InputGroup';
import NumberInput from './NumberInput';
import Select from './Select';
import Textarea from './Textarea';
import Listbox from './_internal/Listbox';

/**
 * Seeing where focus is, and what is selected, in every colour mode.
 *
 * WHY THIS FILE EXISTS. Two ways a sighted keyboard user lost track of a field.
 *
 * `Select`'s trigger reset its border to the resting colour on focus, with the
 * outline and shadow removed, so tabbing onto it changed nothing on screen.
 *
 * In forced-colours mode (Windows High Contrast) the browser repaints every
 * colour from a short system palette and drops box-shadows. The fields here
 * draw focus as a border-colour change, and a selected row's mark is a
 * primary-filled box or dot: all of it repainted to the same system colour as
 * its resting state, so neither focus nor selection showed. The fix draws
 * focus as an `outline`, which forced colours keep, and paints the selected
 * mark in the system `Highlight` colour.
 *
 * HOW FORCED COLOURS ARE TESTED. Not by turning the mode on. The runner can
 * emulate it only for the whole browser page, which the other story files
 * share, and a story that did so left later files rendering forced and failing
 * axe colour-contrast. So the forced-colours story reads the stylesheet
 * instead: of the rules under `@media (forced-colors: active)`, which apply to
 * the focused field, and to the selected mark and not its unselected neighbour.
 */

const stack = { display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '420px' };

/**
 * Every style rule the page's stylesheets hold under
 * `@media (forced-colors: active)`, nested rules included.
 *
 * @returns {CSSStyleRule[]}
 */
const forcedColorRules = () => {
    const found = [];
    const walk = (rules, forced) => {
        for (const rule of rules) {
            const isForced = forced
                || (rule instanceof CSSMediaRule && /forced-colors:\s*active/.test(rule.media.mediaText));
            if (rule instanceof CSSStyleRule && isForced) found.push(rule);
            if (rule.cssRules) walk(rule.cssRules, isForced);
        }
    };
    for (const sheet of document.styleSheets) {
        let rules;
        try {
            rules = sheet.cssRules;
        } catch {
            continue; // a cross-origin sheet; none of ours are
        }
        walk(rules, false);
    }
    return found;
};

/**
 * The value a forced-colours rule gives `property` on `element` in its current
 * state, or '' when none does. `matches` is read now, so a `:focus-visible` or
 * `:focus-within` rule counts only while the element is focused.
 *
 * @param {Element|null} element
 * @param {string} property
 * @returns {string}
 */
const forcedValue = (element, property) => {
    if (!element) return '';
    let value = '';
    for (const rule of forcedColorRules()) {
        let applies = false;
        try {
            applies = element.matches(rule.selectorText);
        } catch {
            applies = false; // a selector `matches` cannot parse
        }
        const declared = rule.style.getPropertyValue(property);
        if (applies && declared) value = declared;
    }
    return value;
};

export default {
    title: 'Components/Forms and inputs/Focus visibility',
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Regression cover: a focused field and a selected option can be seen, '
                    + 'including in forced-colours mode.',
            },
        },
    },
};

/**
 * Tabbing onto the Select trigger changes how it looks.
 */
export const SelectTriggerShowsFocus = () => (
    <div style={stack}>
        <Select aria-label="Subject" options={[{ value: 'maths', label: 'Maths' }]} />
    </div>
);

SelectTriggerShowsFocus.play = async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', { name: 'Subject' });
    const resting = getComputedStyle(trigger).borderColor;

    await userEvent.tab();
    await expect(document.activeElement).toBe(trigger);
    // The border colour transitions, so the focused colour arrives a beat later.
    await waitFor(() => expect(getComputedStyle(trigger).borderColor).not.toBe(resting));
};

/**
 * In forced-colours mode a focused field draws a solid outline, and a selected
 * option's mark is painted where an unselected one's is not.
 */
export const ForcedColorsKeepFocusAndSelection = () => (
    <div style={stack}>
        <Input id="fv-name" label="Name" />
        <Textarea id="fv-notes" label="Notes" />
        <NumberInput id="fv-hours" label="Hours" />
        <InputGroup id="fv-amount" label="Amount" leadingVisual="£" />
        <DatePicker id="fv-date" aria-label="Date" />
        <Select aria-label="Subject" options={[{ value: 'maths', label: 'Maths' }]} />
        <Listbox aria-label="Day" options={['Monday', 'Tuesday']} defaultValue="Tuesday" />
        <Listbox aria-label="Days" mode="multi" options={['Monday', 'Tuesday']} defaultValue={['Tuesday']} />
    </div>
);

ForcedColorsKeepFocusAndSelection.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const outlined = (element) => /\bsolid\b/.test(forcedValue(element, 'outline'));

    // Focus, field by field. The ring is on the control itself, or on the box
    // drawn around it where the field is a box with a control inside.
    const fields = [
        canvas.getByRole('textbox', { name: 'Name' }),
        canvas.getByRole('textbox', { name: 'Notes' }),
        canvas.getByLabelText(/Hours/),
        canvas.getByRole('textbox', { name: 'Amount' }),
        canvas.getByRole('combobox', { name: 'Date' }),
        canvas.getByRole('button', { name: 'Subject' }),
        canvas.getByRole('listbox', { name: 'Day' }),
    ];
    for (const field of fields) {
        field.focus();
        await expect(document.activeElement).toBe(field);
        await expect(
            outlined(field) || outlined(field.closest('.plus-date-picker-trigger')),
            `${field.getAttribute('aria-label') || field.id || field.textContent} shows focus`,
        ).toBe(true);
    }
    document.activeElement.blur();

    // Selection. A multi-select row's checkbox mark takes a forced fill and the
    // mark beside it does not; a single-select row is the only one with a check.
    const [unchecked, checked] = within(canvas.getByRole('listbox', { name: 'Days' }))
        .getAllByRole('option')
        .map((option) => option.querySelector('.plus-option-row-check'));
    await expect(forcedValue(checked, 'background-color'), 'Days: selected mark').not.toBe('');
    await expect(forcedValue(unchecked, 'background-color'), 'Days: unselected mark').toBe('');
    const marks = within(canvas.getByRole('listbox', { name: 'Day' }))
        .getAllByRole('option')
        .map((option) => Boolean(option.querySelector('.plus-option-row-selected-mark')));
    await expect(marks, 'Day: only the selected row is marked').toEqual([false, true]);
};
