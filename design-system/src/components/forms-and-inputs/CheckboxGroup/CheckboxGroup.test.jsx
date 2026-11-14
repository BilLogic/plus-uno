import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CheckboxGroup from './CheckboxGroup';
import Checkbox from '../Checkbox';

const tileOptions = [
    {
        value: 'math',
        label: 'Math',
        description: 'Algebra, geometry and number sense.',
        illustration: <svg data-testid="ill-math"><circle cx="10" cy="10" r="8" /></svg>,
    },
    {
        value: 'reading',
        label: 'Reading',
        description: 'Fluency and comprehension.',
        illustration: <svg data-testid="ill-reading"><rect width="16" height="16" /></svg>,
    },
    {
        value: 'science',
        label: 'Science',
        description: 'Inquiry and lab review.',
        illustration: <svg data-testid="ill-science"><polygon points="0,16 8,0 16,16" /></svg>,
    },
];

describe('CheckboxGroup', () => {
    it('renders a fieldset named by legend and passes value array in and out', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();

        const Controlled = () => {
            const [picked, setPicked] = useState(['math']);
            return (
                <CheckboxGroup
                    legend="Which subjects can you tutor?"
                    name="subjects"
                    options={tileOptions}
                    value={picked}
                    onChange={(next) => {
                        onChange(next);
                        setPicked(next);
                    }}
                />
            );
        };

        render(<Controlled />);

        const group = screen.getByRole('group', { name: 'Which subjects can you tutor?' });
        expect(group.tagName).toBe('FIELDSET');

        const math = within(group).getByRole('checkbox', { name: 'Math' });
        const reading = within(group).getByRole('checkbox', { name: 'Reading' });
        expect(math).toHaveAttribute('aria-checked', 'true');
        expect(reading).toHaveAttribute('aria-checked', 'false');

        await user.click(reading);
        expect(onChange).toHaveBeenLastCalledWith(['math', 'reading']);
        expect(reading).toHaveAttribute('aria-checked', 'true');

        await user.click(math);
        expect(onChange).toHaveBeenLastCalledWith(['reading']);
        expect(math).toHaveAttribute('aria-checked', 'false');
    });

    it('supports uncontrolled defaultValue and string options', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();

        render(
            <CheckboxGroup
                legend="Days available"
                options={['Monday', 'Wednesday', 'Friday']}
                defaultValue={['Wednesday']}
                onChange={onChange}
            />
        );

        expect(screen.getByRole('checkbox', { name: 'Wednesday' })).toHaveAttribute('aria-checked', 'true');
        expect(screen.getByRole('checkbox', { name: 'Monday' })).toHaveAttribute('aria-checked', 'false');

        await user.click(screen.getByRole('checkbox', { name: 'Friday' }));
        expect(onChange).toHaveBeenLastCalledWith(['Wednesday', 'Friday']);
    });

    it('announces a single group error even when options have descriptions', () => {
        render(
            <CheckboxGroup
                legend="Which subjects can you tutor?"
                appearance="tile"
                options={tileOptions}
                defaultValue={['math']}
                isRequired
                error="Select at least two subjects."
            />
        );

        const group = screen.getByRole('group', { name: /Which subjects can you tutor\?/ });
        const alerts = screen.getAllByRole('alert');
        expect(alerts).toHaveLength(1);
        expect(alerts[0]).toHaveTextContent('Select at least two subjects.');
        expect(group).toHaveAttribute('aria-describedby', alerts[0].id);

        const reading = within(group).getByRole('checkbox', { name: 'Reading' });
        const math = within(group).getByRole('checkbox', { name: 'Math' });
        expect(reading).toHaveAttribute('aria-invalid', 'true');
        expect(reading).toHaveAccessibleDescription('Fluency and comprehension.');
        expect(math).toHaveAccessibleDescription('Algebra, geometry and number sense.');
    });

    it('keeps checkbox semantics, decorative illustration, and top-to-bottom order in tile appearance', async () => {
        const user = userEvent.setup();
        render(
            <CheckboxGroup
                legend="Choose your focus areas"
                appearance="tile"
                options={tileOptions}
            />
        );

        const math = screen.getByRole('checkbox', { name: 'Math' });
        expect(math).toHaveAccessibleDescription('Algebra, geometry and number sense.');

        const illWrapper = screen.getByTestId('ill-math').parentElement;
        expect(illWrapper).toHaveAttribute('aria-hidden', 'true');

        // DOM order inside tile: illustration before label before description.
        const label = screen.getByText('Math').closest('label');
        const desc = screen.getByText('Algebra, geometry and number sense.');
        expect(illWrapper.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(label.compareDocumentPosition(desc) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

        // Keyboard Space toggles the tile's checkbox.
        math.focus();
        await user.keyboard(' ');
        expect(math).toHaveAttribute('aria-checked', 'true');

        // Clicking the tile container (outside label/checkbox) also toggles it.
        const readingTile = screen.getByTestId('ill-reading').closest('.plus-choice-tile');
        await user.click(readingTile);
        expect(screen.getByRole('checkbox', { name: 'Reading' })).toHaveAttribute('aria-checked', 'true');
    });

    it('renders illustration only when appearance is tile', () => {
        const { rerender } = render(
            <Checkbox
                name="solo"
                label="Math"
                appearance="plain"
                illustration={<svg data-testid="solo-ill" />}
            />
        );
        expect(screen.queryByTestId('solo-ill')).toBeNull();

        rerender(
            <Checkbox
                name="solo"
                label="Math"
                appearance="card"
                illustration={<svg data-testid="solo-ill" />}
            />
        );
        expect(screen.queryByTestId('solo-ill')).toBeNull();

        rerender(
            <Checkbox
                name="solo"
                label="Math"
                appearance="tile"
                illustration={<svg data-testid="solo-ill" />}
            />
        );
        expect(screen.getByTestId('solo-ill').parentElement).toHaveAttribute('aria-hidden', 'true');
    });

    it('respects isReadOnly and isDisabled across options', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();

        const { rerender } = render(
            <CheckboxGroup
                legend="Subjects"
                appearance="tile"
                options={tileOptions}
                defaultValue={['math']}
                isReadOnly
                onChange={onChange}
            />
        );

        await user.click(screen.getByRole('checkbox', { name: 'Reading' }));
        expect(onChange).not.toHaveBeenCalled();
        expect(screen.getByRole('checkbox', { name: 'Reading' })).toHaveAttribute('aria-checked', 'false');

        rerender(
            <CheckboxGroup
                legend="Subjects"
                appearance="tile"
                options={tileOptions}
                defaultValue={['math']}
                isDisabled
                onChange={onChange}
            />
        );
        expect(screen.getAllByRole('checkbox').every((cb) => cb.hasAttribute('data-disabled'))).toBe(true);
    });
});
