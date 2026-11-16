import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RadioGroup from './RadioGroup';
import Radio from '../Radio';

const tileOptions = [
    {
        value: 'one-on-one',
        label: 'One-on-one',
        description: 'Tutor one student through a focused goal.',
        illustration: <svg data-testid="ill-one"><circle cx="10" cy="10" r="8" /></svg>,
    },
    {
        value: 'small-group',
        label: 'Small group',
        description: 'Guide two to four students together.',
        illustration: <svg data-testid="ill-group"><rect width="16" height="16" /></svg>,
    },
    {
        value: 'drop-in',
        label: 'Drop-in help',
        description: 'Answer quick homework questions.',
        illustration: <svg data-testid="ill-drop"><polygon points="0,16 8,0 16,16" /></svg>,
    },
];

describe('RadioGroup tiles', () => {
    it('moves focus and selects across tiles with arrow keys and announces the selected tile', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();

        render(
            <RadioGroup
                legend="How would you like to tutor?"
                appearance="tile"
                orientation="inline"
                options={tileOptions}
                defaultValue="one-on-one"
                onChange={onChange}
            />
        );

        const group = screen.getByRole('radiogroup', { name: 'How would you like to tutor?' });
        const first = within(group).getByRole('radio', { name: 'One-on-one' });
        const second = within(group).getByRole('radio', { name: 'Small group' });
        const third = within(group).getByRole('radio', { name: 'Drop-in help' });

        expect(first).toHaveAttribute('aria-checked', 'true');
        expect(first).toHaveAccessibleDescription('Tutor one student through a focused goal.');
        expect(second).toHaveAttribute('aria-checked', 'false');

        first.focus();
        expect(document.activeElement).toBe(first);

        await user.keyboard('{ArrowRight}');
        expect(document.activeElement).toBe(second);
        expect(second).toHaveAttribute('aria-checked', 'true');
        expect(first).toHaveAttribute('aria-checked', 'false');
        expect(onChange).toHaveBeenLastCalledWith('small-group');

        await user.keyboard('{ArrowDown}');
        expect(document.activeElement).toBe(third);
        expect(third).toHaveAttribute('aria-checked', 'true');
        expect(onChange).toHaveBeenLastCalledWith('drop-in');
    });

    it('marks the illustration decorative, orders illustration before label and description, and omits illustration off tile', async () => {
        const user = userEvent.setup();

        const { rerender } = render(
            <RadioGroup
                legend="How would you like to tutor?"
                appearance="tile"
                options={tileOptions}
            />
        );

        const illWrapper = screen.getByTestId('ill-one').parentElement;
        expect(illWrapper).toHaveAttribute('aria-hidden', 'true');

        const label = screen.getByText('One-on-one').closest('label');
        const desc = screen.getByText('Tutor one student through a focused goal.');
        expect(illWrapper.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(label.compareDocumentPosition(desc) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

        // Clicking the tile surface selects the radio.
        const secondTile = screen.getByTestId('ill-group').closest('.plus-choice-tile');
        await user.click(secondTile);
        expect(screen.getByRole('radio', { name: 'Small group' })).toHaveAttribute('aria-checked', 'true');

        // Plain and card appearances ignore `illustration`.
        rerender(
            <RadioGroup
                legend="How would you like to tutor?"
                appearance="card"
                options={tileOptions}
            />
        );
        expect(screen.queryByTestId('ill-one')).toBeNull();

        rerender(
            <Radio
                name="solo"
                value="a"
                label="One-on-one"
                appearance="plain"
                illustration={<svg data-testid="solo-radio-ill" />}
            />
        );
        expect(screen.queryByTestId('solo-radio-ill')).toBeNull();
    });

    it('announces a single error on a tile group with descriptions', () => {
        render(
            <RadioGroup
                legend="How would you like to tutor?"
                appearance="tile"
                options={tileOptions}
                isRequired
                error="Choose a tutoring format."
            />
        );

        const alerts = screen.getAllByRole('alert');
        expect(alerts).toHaveLength(1);
        expect(alerts[0]).toHaveTextContent('Choose a tutoring format.');
    });
});

describe('RadioGroup soft appearance', () => {
    it('matches a plain RadioGroup in role, aria-checked, keyboard navigation, and form submission', async () => {
        const user = userEvent.setup();
        const onPlainChange = vi.fn();
        const onSoftChange = vi.fn();

        const { container } = render(
            <form>
                <RadioGroup
                    name="plainFormat"
                    legend="Plain format"
                    appearance="plain"
                    options={tileOptions}
                    defaultValue="one-on-one"
                    onChange={onPlainChange}
                />
                <RadioGroup
                    name="softFormat"
                    legend="Soft format"
                    appearance="soft"
                    options={tileOptions}
                    defaultValue="one-on-one"
                    onChange={onSoftChange}
                />
            </form>
        );

        const plainGroup = screen.getByRole('radiogroup', { name: 'Plain format' });
        const softGroup = screen.getByRole('radiogroup', { name: 'Soft format' });
        const snapshot = (group) =>
            within(group)
                .getAllByRole('radio')
                .map((r) => ({ role: r.getAttribute('role'), checked: r.getAttribute('aria-checked') }));

        expect(snapshot(softGroup)).toEqual(snapshot(plainGroup));
        expect(screen.queryByTestId('ill-one')).toBeNull();

        // Arrow keys move focus and selection identically across plain and soft groups.
        within(plainGroup).getByRole('radio', { name: 'One-on-one' }).focus();
        await user.keyboard('{ArrowDown}');
        within(softGroup).getByRole('radio', { name: 'One-on-one' }).focus();
        await user.keyboard('{ArrowDown}');

        expect(snapshot(softGroup)).toEqual(snapshot(plainGroup));
        expect(onSoftChange).toHaveBeenLastCalledWith('small-group');
        expect(onSoftChange.mock.calls).toEqual(onPlainChange.mock.calls);

        // Clicking a soft row's description activates its radio, matching clicking the plain option.
        await user.click(within(plainGroup).getByRole('radio', { name: 'Drop-in help' }));
        await user.click(within(softGroup).getByText('Answer quick homework questions.'));

        expect(snapshot(softGroup)).toEqual(snapshot(plainGroup));
        expect(onSoftChange).toHaveBeenLastCalledWith('drop-in');

        const formData = new FormData(container.querySelector('form'));
        expect(formData.get('softFormat')).toBe(formData.get('plainFormat'));
    });

    it('ignores row surface clicks when disabled or read-only', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();

        render(
            <>
                <RadioGroup
                    name="disabledFormat"
                    legend="Disabled format"
                    appearance="soft"
                    options={tileOptions}
                    defaultValue="one-on-one"
                    isDisabled
                    onChange={onChange}
                />
                <RadioGroup
                    name="readOnlyFormat"
                    legend="Read-only format"
                    appearance="soft"
                    options={tileOptions}
                    defaultValue="one-on-one"
                    isReadOnly
                    onChange={onChange}
                />
            </>
        );

        const disabledGroup = screen.getByRole('radiogroup', { name: 'Disabled format' });
        const readOnlyGroup = screen.getByRole('radiogroup', { name: 'Read-only format' });

        await user.click(within(disabledGroup).getByText('Guide two to four students together.'));
        await user.click(within(readOnlyGroup).getByText('Guide two to four students together.'));

        expect(within(disabledGroup).getByRole('radio', { name: 'One-on-one' })).toHaveAttribute('aria-checked', 'true');
        expect(within(disabledGroup).getByRole('radio', { name: 'Small group' })).toHaveAttribute('aria-checked', 'false');
        expect(within(readOnlyGroup).getByRole('radio', { name: 'One-on-one' })).toHaveAttribute('aria-checked', 'true');
        expect(within(readOnlyGroup).getByRole('radio', { name: 'Small group' })).toHaveAttribute('aria-checked', 'false');
        expect(onChange).not.toHaveBeenCalled();
    });
});
