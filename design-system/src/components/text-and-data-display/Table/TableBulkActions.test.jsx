import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TableBulkActions } from '.';

const actions = ['Message', 'Export', 'Assign', 'Remove'].map((label) => ({ label, onClick: vi.fn() }));

describe('TableBulkActions', () => {
    it('announces the selected count politely', () => {
        render(<TableBulkActions count={3} actions={actions.slice(0, 1)} onClear={() => {}} />);
        const count = screen.getByText('3 selected');
        expect(count).toHaveAttribute('aria-live', 'polite');
    });

    it('shows up to three actions and puts the rest in an overflow menu', () => {
        render(<TableBulkActions count={2} actions={actions} onClear={() => {}} />);
        ['Message', 'Export', 'Assign'].forEach((label) => {
            expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
        });
        expect(screen.queryByRole('button', { name: 'Remove' })).toBeNull();
        expect(screen.getByRole('button', { name: 'More actions' })).toBeInTheDocument();
    });

    it('has no overflow menu with three actions or fewer', () => {
        render(<TableBulkActions count={2} actions={actions.slice(0, 3)} onClear={() => {}} />);
        expect(screen.queryByRole('button', { name: 'More actions' })).toBeNull();
    });

    it('runs an action and clears the selection', () => {
        const onClear = vi.fn();
        render(<TableBulkActions count={2} actions={actions.slice(0, 2)} onClear={onClear} />);
        fireEvent.click(screen.getByRole('button', { name: 'Export' }));
        expect(actions[1].onClick).toHaveBeenCalledTimes(1);
        fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
        expect(onClear).toHaveBeenCalledTimes(1);
    });
});
