import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TableBulkActions } from '.';

const actions = ['Message', 'Export', 'Assign', 'Remove'].map((label) => ({ label, onClick: vi.fn() }));

describe('TableBulkActions', () => {
    it('says the selected count, leaving the announcement to the table', () => {
        render(<TableBulkActions count={3} actions={actions.slice(0, 1)} />);
        const count = screen.getByText('3 selected');
        expect(count).not.toHaveAttribute('aria-live');
    });

    it('shows up to three actions and puts the rest in an overflow menu', () => {
        render(<TableBulkActions count={2} actions={actions} />);
        ['Message', 'Export', 'Assign'].forEach((label) => {
            expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
        });
        expect(screen.queryByRole('button', { name: 'Remove' })).toBeNull();
        expect(screen.getByRole('button', { name: 'More actions' })).toBeInTheDocument();
    });

    it('has no overflow menu with three actions or fewer', () => {
        render(<TableBulkActions count={2} actions={actions.slice(0, 3)} />);
        expect(screen.queryByRole('button', { name: 'More actions' })).toBeNull();
    });

    it('runs an action, with no Clear button', () => {
        render(<TableBulkActions count={2} actions={actions.slice(0, 2)} />);
        fireEvent.click(screen.getByRole('button', { name: 'Export' }));
        expect(actions[1].onClick).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole('button', { name: /clear/i })).toBeNull();
    });
});
