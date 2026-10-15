import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import DatePicker from './DatePicker/DatePicker';
import Input from './Input';
import InputGroup from './InputGroup/InputGroup';
import NumberInput from './NumberInput';
import OptionList from './OptionList';
import Select from './Select';
import Textarea from './Textarea';

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
 * focus as an `outline`, which forced colours keeps, and paints the selected
 * mark in the system `Highlight` colour.
 *
 * The assertions compare a state with its neighbour (focused against resting,
 * selected against unselected) rather than naming colours, because the system
 * palette is the user's to choose.
 */

const stack = { display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '420px' };

/**
 * Whether this is the Storybook test runner (Vitest Browser Mode), where the
 * page's media features can be emulated. Plain Storybook has no runner to ask,
 * so the forced-colours story only asserts inside it.
 *
 * @returns {boolean}
 */
const inTestRunner = () => import.meta.env.MODE === 'test' && window.__vitest_browser__ === true;

/**
 * Sets forced-colours mode through the runner's `emulateForcedColors` command
 * (vite.config.js). `null` restores the default.
 *
 * THIS USES A PRIVATE API, as the Skeleton stories do for reduced motion:
 * `window.__vitest_browser_runner__.commands` is Vitest's internal handle.
 *
 * @param {'active'|'none'|null} value
 */
const emulateForcedColors = async (value) => {
    if (!inTestRunner()) return;
    const commands = window.__vitest_browser_runner__?.commands;
    if (!commands) {
        throw new Error(
            'emulateForcedColors: the Vitest runner handle (window.__vitest_browser_runner__.commands) '
            + 'is missing. Check it against the installed Vitest version.',
        );
    }
    await commands.triggerCommand('emulateForcedColors', [value]);
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
    // Every story starts and ends in the default colour mode, so a failure
    // part-way cannot leave the page forced for the stories after it.
    beforeEach: async () => {
        await emulateForcedColors(null);
        return async () => {
            await emulateForcedColors(null);
        };
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
 * In forced-colours mode a focused field draws an outline, and a selected
 * option's mark differs from an unselected one's.
 */
export const ForcedColorsKeepFocusAndSelection = () => (
    <div style={stack}>
        <Input id="fv-name" label="Name" />
        <Textarea id="fv-notes" label="Notes" />
        <NumberInput id="fv-hours" label="Hours" />
        <InputGroup id="fv-amount" label="Amount" leadingVisual="£" />
        <DatePicker id="fv-date" aria-label="Date" />
        <Select aria-label="Subject" options={[{ value: 'maths', label: 'Maths' }]} />
        <OptionList aria-label="Day" options={['Monday', 'Tuesday']} defaultValue="Tuesday" />
        <OptionList aria-label="Days" mode="multi" options={['Monday', 'Tuesday']} defaultValue={['Tuesday']} />
    </div>
);

ForcedColorsKeepFocusAndSelection.play = async ({ canvasElement }) => {
    if (!inTestRunner()) return;
    await emulateForcedColors('active');
    await expect(window.matchMedia('(forced-colors: active)').matches).toBe(true);

    const canvas = within(canvasElement);
    const outlined = (element) => Boolean(element)
        && getComputedStyle(element).outlineStyle !== 'none'
        && parseFloat(getComputedStyle(element).outlineWidth) >= 2;

    // Focus, field by field. The ring is on the control itself, or on the box
    // drawn around it where the field is a box with a control inside.
    const fields = [
        canvas.getByRole('textbox', { name: 'Name' }),
        canvas.getByRole('textbox', { name: 'Notes' }),
        canvas.getByLabelText(/Hours/),
        canvas.getByRole('textbox', { name: 'Amount' }),
        canvas.getByRole('combobox', { name: 'Date' }),
        canvas.getByRole('button', { name: 'Subject' }),
        within(canvas.getByRole('listbox', { name: 'Day' })).getAllByRole('option')[0],
    ];
    for (const field of fields) {
        field.focus();
        await expect(document.activeElement).toBe(field);
        await expect(
            outlined(field) || outlined(field.closest('.plus-date-picker-trigger')),
            `${field.getAttribute('aria-label') || field.id || field.textContent} shows focus`,
        ).toBe(true);
    }

    // Selection, single and multi: the mark of the chosen option is painted
    // differently from the mark of the one beside it.
    for (const name of ['Day', 'Days']) {
        const [unselected, selected] = within(canvas.getByRole('listbox', { name }))
            .getAllByRole('option')
            .map((option) => option.querySelector('.plus-list-option-indicator'));
        await expect(getComputedStyle(selected).backgroundColor)
            .not.toBe(getComputedStyle(unselected).backgroundColor);
    }
};
