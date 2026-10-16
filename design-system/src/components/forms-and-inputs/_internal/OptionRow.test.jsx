import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import OptionRow from './OptionRow';

describe('OptionRow', () => {
    it('is an option named by its label, with its selection state', () => {
        render(<OptionRow label="Maths" selected />);
        const row = screen.getByRole('option', { name: 'Maths' });
        expect(row).toHaveAttribute('aria-selected', 'true');
    });

    it('keeps tabbable off the DOM and is a tab stop only when it holds the cursor', () => {
        const { rerender } = render(<OptionRow label="Maths" tabbable />);
        const row = screen.getByRole('option');
        expect(row).not.toHaveAttribute('tabbable');
        expect(row).toHaveAttribute('tabindex', '0');

        rerender(<OptionRow label="Maths" tabbable={false} />);
        expect(row).toHaveAttribute('tabindex', '-1');

        // In a listbox that keeps focus itself (aria-activedescendant), the row
        // takes no tab stop at all.
        rerender(<OptionRow label="Maths" />);
        expect(row).not.toHaveAttribute('tabindex');
    });

    it('selects with a click, Enter or Space, and not when disabled', async () => {
        const user = userEvent.setup();
        const onSelect = vi.fn();
        const { rerender } = render(<OptionRow label="Maths" value="maths" tabbable onSelect={onSelect} />);
        const row = screen.getByRole('option');

        await user.click(row);
        row.focus();
        await user.keyboard('{Enter}');
        await user.keyboard(' ');
        expect(onSelect).toHaveBeenCalledTimes(3);
        expect(onSelect).toHaveBeenLastCalledWith('maths');

        onSelect.mockClear();
        rerender(<OptionRow label="Maths" value="maths" tabbable disabled onSelect={onSelect} />);
        expect(row).toHaveAttribute('aria-disabled', 'true');
        await user.click(row);
        await user.keyboard('{Enter}');
        expect(onSelect).not.toHaveBeenCalled();
    });

    it('shows a description line under the label', () => {
        render(<OptionRow label="Maria Lopez" description="Grade 7 · Brookfield" />);
        expect(screen.getByRole('option', { name: /Maria Lopez/ })).toHaveTextContent('Grade 7 · Brookfield');
    });

    it('holds up to four leading items and one trailing item', () => {
        render(
            <OptionRow
                label="Linear equations"
                leading={[
                    <OptionRow.Indent key="indent" level={2} />,
                    <OptionRow.Toggle key="toggle" state="collapsed" />,
                    <OptionRow.Checkbox key="check" checked={false} indeterminate />,
                ]}
                trailing={<span data-testid="count">12</span>}
            />
        );
        const row = screen.getByRole('option');
        const leading = row.querySelector('.plus-option-row-leading');
        expect(leading.children).toHaveLength(3);
        expect(leading.querySelector('.plus-option-row-indent')).toHaveStyle({ '--plus-option-row-level': '2' });
        expect(leading.querySelector('.plus-option-row-check')).toHaveClass('is-indeterminate');
        expect(row.querySelector('.plus-option-row-trailing')).toContainElement(screen.getByTestId('count'));
    });

    it('warns when more than four leading items are passed', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        render(<OptionRow label="x" leading={[1, 2, 3, 4, 5].map((n) => <i key={n} />)} />);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('at most 4'));
        warn.mockRestore();
    });

    it('marks a selected single-select row with a check, unless told not to', () => {
        const { container, rerender } = render(<OptionRow label="Maths" selected />);
        expect(container.querySelector('.plus-option-row-selected-mark')).not.toBeNull();
        rerender(<OptionRow label="Maths" selected check={false} />);
        expect(container.querySelector('.plus-option-row-selected-mark')).toBeNull();
    });

    it('draws a create row as an option that reads "Create" and the text', () => {
        render(<OptionRow kind="create" label="Music" />);
        expect(screen.getByRole('option', { name: 'Create Music' })).toBeInTheDocument();
    });

    it('draws a group heading that is not an option and takes no focus', () => {
        render(<OptionRow kind="group" label="Recent" id="h1" tabbable />);
        expect(screen.queryByRole('option')).toBeNull();
        const heading = screen.getByText('Recent').closest('.plus-option-row');
        expect(heading).toHaveAttribute('id', 'h1');
        expect(heading).toHaveAttribute('role', 'presentation');
        expect(heading).not.toHaveAttribute('tabindex');
    });

    it('takes another role, such as a tree item, with its own aria', () => {
        render(<OptionRow role="treeitem" label="Algebra" aria-expanded={false} aria-level={1} />);
        const item = screen.getByRole('treeitem', { name: 'Algebra' });
        expect(item).toHaveAttribute('aria-expanded', 'false');
        expect(item).toHaveAttribute('aria-level', '1');
    });

    it('lets a tree toggle expand without selecting the row', async () => {
        const user = userEvent.setup();
        const onSelect = vi.fn();
        const onToggle = vi.fn();
        render(
            <OptionRow
                role="treeitem"
                label="Algebra"
                onSelect={onSelect}
                leading={<OptionRow.Toggle state="collapsed" onToggle={onToggle} />}
            />
        );
        await user.click(document.querySelector('.plus-option-row-toggle'));
        expect(onToggle).toHaveBeenCalledTimes(1);
        expect(onSelect).not.toHaveBeenCalled();
    });

    it('draws the dragging state and a drop line on either edge', () => {
        const { rerender } = render(<OptionRow label="Maths" dragging dropIndicator="before" />);
        const row = screen.getByRole('option');
        expect(row).toHaveClass('is-dragging', 'has-drop-indicator');
        expect(row).not.toHaveClass('has-drop-indicator-after');

        rerender(<OptionRow label="Maths" dropIndicator="after" />);
        expect(row).toHaveClass('has-drop-indicator-after');
        expect(row).not.toHaveClass('is-dragging', 'has-drop-indicator');
    });
});
