import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TagInput from './TagInput';

const OPTIONS = [
    { id: 'a', label: 'Session prep' },
    { id: 'b', label: 'Goals' },
];

describe('TagInput, reorder grip', () => {
    it('is focusable on press, because Safari gives a plain button no focus and the list would close', async () => {
        render(<TagInput label="Topics" options={OPTIONS} onReorder={vi.fn()} />);
        const entry = screen.getByRole('combobox');
        fireEvent.focus(entry);
        fireEvent.click(entry);
        const grip = await screen.findByRole('button', { name: 'Reorder Session prep' });
        expect(grip).toHaveAttribute('tabindex', '0');
    });
});
