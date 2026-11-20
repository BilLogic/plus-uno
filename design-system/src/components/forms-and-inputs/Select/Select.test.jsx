import React, { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import Select from './Select';

/**
 * Select, driven the way a page uses it: through its label, its value, the
 * keyboard, its messages and the form it sits in. The Storybook plays cover
 * the drawn result (geometry, colors, motion); these cover the behavior that
 * the open, staging, option-source and listbox pieces add up to.
 */

const SCHOOLS = [
    { value: 'north', label: 'North High' },
    { value: 'south', label: 'South High' },
    { value: 'riverside', label: 'Riverside Academy' },
];

const field = (name = 'School') => screen.getByRole('combobox', { name });
const options = () => screen.queryAllByRole('option');
const option = (name) => screen.getByRole('option', { name });
const submitted = (form) => [...new FormData(form).entries()];

describe('Select, single', () => {
    it('is named by its label and shows the placeholder until a pick', () => {
        render(<Select label="School" options={SCHOOLS} placeholder="Choose a school" />);
        expect(field()).toHaveAttribute('placeholder', 'Choose a school');
        expect(field()).toHaveValue('');
    });

    it('opens on click, picks a row, reports its id, shows its label and closes', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<Select label="School" options={SCHOOLS} onChange={onChange} />);
        await user.click(field());
        expect(field()).toHaveAttribute('aria-expanded', 'true');
        await user.click(await screen.findByRole('option', { name: 'South High' }));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('south');
        expect(field()).toHaveValue('South High');
        expect(field()).toHaveAttribute('aria-expanded', 'false');
        await waitFor(() => expect(options()).toHaveLength(0));
    });

    it('starts on defaultValue and keeps its own value when uncontrolled', async () => {
        const user = userEvent.setup();
        render(<Select label="School" options={SCHOOLS} defaultValue="north" />);
        expect(field()).toHaveValue('North High');
        await user.click(field());
        await user.click(await screen.findByRole('option', { name: 'Riverside Academy' }));
        expect(field()).toHaveValue('Riverside Academy');
    });

    it('shows the value it is given and holds it until the parent changes it', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        const { rerender } = render(<Select label="School" options={SCHOOLS} value="north" onChange={onChange} />);
        await user.click(field());
        await user.click(await screen.findByRole('option', { name: 'South High' }));
        expect(onChange).toHaveBeenLastCalledWith('south');
        expect(field()).toHaveValue('North High');
        rerender(<Select label="School" options={SCHOOLS} value="south" onChange={onChange} />);
        expect(field()).toHaveValue('South High');
    });

    it('marks the picked row selected when the list opens again', async () => {
        const user = userEvent.setup();
        render(<Select label="School" options={SCHOOLS} defaultValue="south" />);
        await user.click(field());
        expect(await screen.findByRole('option', { name: 'South High' })).toHaveAttribute('aria-selected', 'true');
        expect(option('North High')).toHaveAttribute('aria-selected', 'false');
    });

    it('filters as you type, then picks the match with Enter', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<Select label="School" options={SCHOOLS} onChange={onChange} />);
        await user.click(field());
        await user.type(field(), 'high');
        await waitFor(() => expect(options().map((row) => row.textContent)).toEqual(['North High', 'South High']));
        await user.clear(field());
        await user.type(field(), 'river');
        await waitFor(() => expect(options()).toHaveLength(1));
        await user.keyboard('{Enter}');
        expect(onChange).toHaveBeenLastCalledWith('riverside');
        expect(field()).toHaveValue('Riverside Academy');
    });

    it('says "No results" when nothing matches and picks nothing on Enter', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<Select label="School" options={SCHOOLS} onChange={onChange} />);
        await user.click(field());
        await user.type(field(), 'zzz');
        expect(await screen.findByText('No results')).toBeInTheDocument();
        await user.keyboard('{Enter}');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('drops typed text that was not picked when the list closes', async () => {
        const user = userEvent.setup();
        render(<Select label="School" options={SCHOOLS} defaultValue="north" />);
        await user.click(field());
        await user.type(field(), 'rive');
        await user.keyboard('{Escape}');
        expect(field()).toHaveValue('North High');
        expect(field()).toHaveFocus();
    });

    it('opens from the keyboard and picks with the arrows and Enter', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<Select label="School" options={SCHOOLS} onChange={onChange} />);
        await user.tab();
        expect(field()).toHaveFocus();
        await user.keyboard('{ArrowDown}');
        await screen.findAllByRole('option');
        await user.keyboard('{ArrowDown}{Enter}');
        expect(onChange).toHaveBeenLastCalledWith('south');
        expect(field()).toHaveAttribute('aria-expanded', 'false');
        expect(field()).toHaveFocus();
    });

    it('closes on Escape without changing the value', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<Select label="School" options={SCHOOLS} defaultValue="north" onChange={onChange} />);
        await user.click(field());
        await screen.findAllByRole('option');
        await user.keyboard('{Escape}');
        expect(field()).toHaveAttribute('aria-expanded', 'false');
        expect(onChange).not.toHaveBeenCalled();
        expect(field()).toHaveValue('North High');
    });

    it('closes and reports blur when focus leaves for another control', async () => {
        const user = userEvent.setup();
        const onBlur = vi.fn();
        render(
            <>
                <Select label="School" options={SCHOOLS} onBlur={onBlur} />
                <button type="button">After</button>
            </>,
        );
        await user.click(field());
        await screen.findAllByRole('option');
        await user.tab();
        await user.tab();
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(field()).toHaveAttribute('aria-expanded', 'false');
    });

    it('does not close or blur when focus moves from the field into its own list', async () => {
        const user = userEvent.setup();
        const onBlur = vi.fn();
        render(<Select label="School" options={SCHOOLS} onBlur={onBlur} />);
        await user.click(field());
        await user.click(await screen.findByRole('option', { name: 'North High' }));
        expect(onBlur).not.toHaveBeenCalled();
    });

    it('does not pick a disabled option', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(
            <Select
                label="School"
                onChange={onChange}
                options={[...SCHOOLS, { value: 'closed', label: 'Closed Campus', isDisabled: true }]}
            />,
        );
        await user.click(field());
        await user.click(await screen.findByRole('option', { name: 'Closed Campus' }));
        expect(onChange).not.toHaveBeenCalled();
    });
});

describe('Select, clearing', () => {
    it('clears with the field button, reports an empty value and keeps focus in the field', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<Select label="School" options={SCHOOLS} defaultValue="north" onChange={onChange} />);
        await user.click(screen.getByRole('button', { name: 'Clear school' }));
        expect(onChange).toHaveBeenLastCalledWith('');
        expect(field()).toHaveValue('');
        expect(field()).toHaveFocus();
        expect(screen.queryByRole('button', { name: 'Clear school' })).toBeNull();
    });

    it('clears with Delete while the list is shut', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<Select label="School" options={SCHOOLS} defaultValue="north" onChange={onChange} />);
        field().focus();
        await user.keyboard('{Delete}');
        expect(onChange).toHaveBeenLastCalledWith('');
        expect(field()).toHaveValue('');
    });

    it('cannot be emptied when required, unless clearable says so', () => {
        const { rerender } = render(<Select label="School" options={SCHOOLS} defaultValue="north" isRequired />);
        expect(screen.queryByRole('button', { name: 'Clear school' })).toBeNull();
        expect(field()).toHaveAttribute('aria-required', 'true');
        rerender(<Select label="School" options={SCHOOLS} defaultValue="north" isRequired clearable />);
        expect(screen.getByRole('button', { name: 'Clear school' })).toBeInTheDocument();
    });

    it('clears from the list footer and closes the list', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<Select label="School" options={SCHOOLS} defaultValue="north" onChange={onChange} />);
        await user.click(field());
        await user.click(await screen.findByRole('button', { name: 'Clear' }));
        expect(onChange).toHaveBeenLastCalledWith('');
        expect(field()).toHaveAttribute('aria-expanded', 'false');
    });
});

describe('Select, multiple', () => {
    it('accumulates picks, reports the array in order and keeps the list open', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<Select label="Schools" isMulti options={SCHOOLS} onChange={onChange} />);
        await user.click(field('Schools'));
        await user.click(await screen.findByRole('option', { name: 'North High' }));
        await user.click(option('South High'));
        expect(onChange).toHaveBeenNthCalledWith(1, ['north']);
        expect(onChange).toHaveBeenNthCalledWith(2, ['north', 'south']);
        expect(field('Schools')).toHaveAttribute('aria-expanded', 'true');
        await user.click(option('North High'));
        expect(onChange).toHaveBeenLastCalledWith(['south']);
    });

    it('removes a pick from its tag, and the last pick with Backspace in an empty search', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<Select label="Schools" isMulti options={SCHOOLS} defaultValue={['north', 'south']} onChange={onChange} />);
        await user.click(screen.getByRole('button', { name: 'Remove North High' }));
        expect(onChange).toHaveBeenLastCalledWith(['south']);
        await user.click(field('Schools'));
        await screen.findAllByRole('option');
        await user.keyboard('{Backspace}');
        expect(onChange).toHaveBeenLastCalledWith([]);
    });

    it('holds picks back until the list closes with commitOnClose, then reports once', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<Select label="Schools" isMulti commitOnClose options={SCHOOLS} onChange={onChange} />);
        await user.click(field('Schools'));
        await user.click(await screen.findByRole('option', { name: 'North High' }));
        await user.click(option('South High'));
        expect(onChange).not.toHaveBeenCalled();
        await user.keyboard('{Escape}');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(['north', 'south']);
    });

    it('stops at maxSelections, says why and disables the rest', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<Select label="Schools" isMulti maxSelections={1} options={SCHOOLS} onChange={onChange} />);
        await user.click(field('Schools'));
        await user.click(await screen.findByRole('option', { name: 'North High' }));
        // Said twice on purpose: in the caption the field is described by, and in the list footer.
        const said = screen.getAllByText('You can pick up to 1');
        expect(said).toHaveLength(2);
        expect(said.filter((node) => node.closest('[role="listbox"], .plus-listbox'))).toHaveLength(1);
        expect(field('Schools')).toHaveAccessibleDescription('You can pick up to 1');
        await user.click(option('South High'));
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('picks every match with Select all, and empties them again', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<Select label="Schools" isMulti selectAll options={SCHOOLS} onChange={onChange} />);
        await user.click(field('Schools'));
        const all = await screen.findByRole('button', { name: 'Select all' });
        await user.click(all);
        expect(onChange).toHaveBeenLastCalledWith(['north', 'south', 'riverside']);
        await user.click(screen.getByRole('button', { name: 'Select all' }));
        expect(onChange).toHaveBeenLastCalledWith([]);
    });
});

describe('Select, list keys', () => {
    it('moves the highlight to the first and last row with Home and End from an empty search', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<Select label="School" options={SCHOOLS} onChange={onChange} />);
        await user.click(field());
        await screen.findAllByRole('option');
        await user.keyboard('{End}');
        await waitFor(() => expect(field().getAttribute('aria-activedescendant')).toBe(option('Riverside Academy').id));
        await user.keyboard('{Home}');
        await waitFor(() => expect(field().getAttribute('aria-activedescendant')).toBe(option('North High').id));
        await user.keyboard('{End}{Enter}');
        expect(onChange).toHaveBeenLastCalledWith('riverside');
    });

    it('keeps Home and End for the caret once text is typed', async () => {
        const user = userEvent.setup();
        render(<Select label="School" options={SCHOOLS} />);
        await user.click(field());
        await user.type(field(), 'high');
        await waitFor(() => expect(options()).toHaveLength(2));
        const before = field().getAttribute('aria-activedescendant');
        await user.keyboard('{End}');
        expect(field().getAttribute('aria-activedescendant')).toBe(before);
    });
});

describe('Select, creating', () => {
    it('offers Create for text that matches nothing and picks the new option', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        const onCreate = vi.fn();
        render(<Select label="School" isCreatable options={SCHOOLS} onChange={onChange} onCreate={onCreate} />);
        await user.click(field());
        await user.type(field(), 'Eastside');
        await user.click(await screen.findByRole('option', { name: /Create\s+Eastside/ }));
        expect(onCreate).toHaveBeenCalledWith('Eastside');
        expect(onChange).toHaveBeenLastCalledWith('Eastside');
        expect(field()).toHaveValue('Eastside');
    });

    it('does not offer Create for text that matches an option, ignoring case', async () => {
        const user = userEvent.setup();
        render(<Select label="School" isCreatable options={SCHOOLS} />);
        await user.click(field());
        await user.type(field(), 'north high');
        await waitFor(() => expect(options()).toHaveLength(1));
        expect(screen.queryByRole('option', { name: /^Create/ })).toBeNull();
    });
});

describe('Select, not searchable', () => {
    // Pins today's behavior: a field that is not searchable has no type-ahead,
    // so typed letters neither filter nor move the highlight.
    it('is a combobox that is not a text input and opens on Space', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<Select label="School" isSearchable={false} options={SCHOOLS} defaultValue="north" onChange={onChange} />);
        expect(field().tagName).not.toBe('INPUT');
        expect(field()).toHaveTextContent('North High');
        await user.tab();
        await user.keyboard(' ');
        expect(field()).toHaveAttribute('aria-expanded', 'true');
        await user.keyboard('river');
        expect(await screen.findAllByRole('option')).toHaveLength(SCHOOLS.length);
        await user.click(option('South High'));
        expect(onChange).toHaveBeenLastCalledWith('south');
    });
});

describe('Select, disabled, read-only and waiting', () => {
    it('does not open, take focus or change when disabled', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<Select label="School" isDisabled options={SCHOOLS} defaultValue="north" onChange={onChange} />);
        expect(field()).toBeDisabled();
        await user.click(field());
        await user.keyboard('{ArrowDown}{Enter}');
        expect(options()).toHaveLength(0);
        expect(onChange).not.toHaveBeenCalled();
    });

    it('shows the value but does not open or change when read-only, and stays focusable', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<Select label="School" isReadOnly options={SCHOOLS} defaultValue="north" onChange={onChange} />);
        expect(field()).toHaveAttribute('aria-readonly', 'true');
        expect(field()).not.toBeDisabled();
        await user.tab();
        expect(field()).toHaveFocus();
        await user.keyboard('{ArrowDown}{Enter}{Delete}');
        await user.click(field());
        expect(options()).toHaveLength(0);
        expect(onChange).not.toHaveBeenCalled();
        expect(field()).toHaveTextContent('North High');
        expect(screen.queryByRole('button', { name: 'Clear school' })).toBeNull();
    });

    it('waits on the field it depends on, then clears when that field changes', async () => {
        const user = userEvent.setup();
        const Pair = () => {
            const [school, setSchool] = useState('');
            return (
                <>
                    <button type="button" onClick={() => setSchool('north')}>North</button>
                    <button type="button" onClick={() => setSchool('south')}>South</button>
                    <Select
                        label="Teacher"
                        options={[{ value: 'ng', label: 'Ms. Garcia' }]}
                        defaultValue="ng"
                        dependsOn={{ value: school, label: 'School' }}
                    />
                </>
            );
        };
        render(<Pair />);
        expect(field('Teacher')).toBeDisabled();
        expect(screen.getByText('Choose School first')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'North' }));
        await waitFor(() => {
            expect(field('Teacher')).toBeEnabled();
            expect(field('Teacher')).toHaveValue('');
        });
    });
});

describe('Select, controlled open', () => {
    it('asks the parent to open and close, and stays as the parent leaves it', async () => {
        const user = userEvent.setup();
        const onOpenChange = vi.fn();
        render(<Select label="School" options={SCHOOLS} isOpen={false} onOpenChange={onOpenChange} />);
        await user.click(field());
        expect(onOpenChange).toHaveBeenLastCalledWith(true);
        expect(field()).toHaveAttribute('aria-expanded', 'false');
        expect(options()).toHaveLength(0);
    });
});

describe('Select, messages', () => {
    it('describes the field with its caption', () => {
        render(<Select label="School" options={SCHOOLS} caption="Where the tutor teaches" />);
        const caption = screen.getByText('Where the tutor teaches');
        expect(field().getAttribute('aria-describedby')).toContain(caption.id);
    });

    it('replaces the caption with the error message and marks the field invalid', () => {
        render(<Select label="School" options={SCHOOLS} caption="Help" isInvalid errorMessage="Pick a school" />);
        expect(field()).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByText('Pick a school')).toBeInTheDocument();
        expect(screen.queryByText('Help')).toBeNull();
        expect(field().getAttribute('aria-describedby')).toContain(screen.getByText('Pick a school').id);
    });

    it('shows the success message in the caption place', () => {
        render(<Select label="School" options={SCHOOLS} isValid successMessage="Saved" />);
        expect(screen.getByText('Saved')).toBeInTheDocument();
        expect(field()).not.toHaveAttribute('aria-invalid', 'true');
    });
});

describe('Select, in a form', () => {
    it('submits the picked id under its name, and nothing when empty', async () => {
        const user = userEvent.setup();
        const { container } = render(
            <form>
                <Select label="School" name="school" options={SCHOOLS} />
            </form>,
        );
        const form = container.querySelector('form');
        expect(submitted(form)).toEqual([]);
        await user.click(field());
        await user.click(await screen.findByRole('option', { name: 'Riverside Academy' }));
        expect(submitted(form)).toEqual([['school', 'riverside']]);
    });

    // Pins today's behavior: isRequired is announced (aria-required) but the
    // field draws no native `required`, so an empty required Select does not
    // fail the form's own validity check. A page validates it and sets isInvalid.
    it('announces isRequired without blocking the form', () => {
        const { container } = render(
            <form>
                <Select label="School" name="school" isRequired options={SCHOOLS} />
            </form>,
        );
        expect(field()).toHaveAttribute('aria-required', 'true');
        expect(container.querySelector('form').checkValidity()).toBe(true);
    });

    it('submits one entry per value when multiple', () => {
        const { container } = render(
            <form>
                <Select label="Schools" isMulti name="schools" options={SCHOOLS} defaultValue={['north', 'south']} />
            </form>,
        );
        expect(submitted(container.querySelector('form'))).toEqual([['schools', 'north'], ['schools', 'south']]);
    });

    it('submits the committed value only: staged picks wait for the list to close', async () => {
        const user = userEvent.setup();
        const { container } = render(
            <form>
                <Select label="Schools" isMulti commitOnClose name="schools" options={SCHOOLS} />
            </form>,
        );
        const form = container.querySelector('form');
        await user.click(field('Schools'));
        await user.click(await screen.findByRole('option', { name: 'North High' }));
        expect(submitted(form)).toEqual([]);
        await user.keyboard('{Escape}');
        expect(submitted(form)).toEqual([['schools', 'north']]);
    });

    it('does not submit a disabled field, and drops the entry once cleared', async () => {
        const user = userEvent.setup();
        const { container, rerender } = render(
            <form>
                <Select label="School" name="school" options={SCHOOLS} defaultValue="north" isDisabled />
            </form>,
        );
        expect(submitted(container.querySelector('form'))).toEqual([]);
        rerender(
            <form>
                <Select label="School" name="school" options={SCHOOLS} defaultValue="north" />
            </form>,
        );
        expect(submitted(container.querySelector('form'))).toEqual([['school', 'north']]);
        await user.click(screen.getByRole('button', { name: 'Clear school' }));
        expect(submitted(container.querySelector('form'))).toEqual([]);
    });

    it('does not submit the form when Enter picks a row', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn((event) => event.preventDefault());
        render(
            <form onSubmit={onSubmit}>
                <Select label="School" name="school" options={SCHOOLS} />
            </form>,
        );
        await user.click(field());
        await screen.findAllByRole('option');
        await user.keyboard('{ArrowDown}{Enter}');
        expect(onSubmit).not.toHaveBeenCalled();
    });
});

describe('Select, loading options', () => {
    it('loads as it opens, filters by what is typed and picks from the result', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        const loadOptions = vi.fn(async (text) => {
            const rows = SCHOOLS.filter((o) => o.label.toLowerCase().includes(text.toLowerCase()));
            return { options: rows, total: rows.length };
        });
        render(<Select label="School" options={[]} loadOptions={loadOptions} onChange={onChange} />);
        await user.click(field());
        expect(await screen.findByRole('option', { name: 'North High' })).toBeInTheDocument();
        await user.type(field(), 'river');
        await waitFor(() => expect(options()).toHaveLength(1));
        await user.click(option('Riverside Academy'));
        expect(onChange).toHaveBeenLastCalledWith('riverside');
    });
});
