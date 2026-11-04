import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HeadingLevelContext } from '@/lib/headingLevel';
import { Table } from '@/components';
import EmptyState from '.';

describe('EmptyState', () => {
    it('renders the header, description and both actions in order', () => {
        render(
            <EmptyState
                header="No students yet"
                description="Add a student to start planning sessions."
                primaryAction={<button type="button">Add student</button>}
                secondaryAction={<button type="button">Import</button>}
            />,
        );
        expect(screen.getByRole('heading', { name: 'No students yet' })).toBeInTheDocument();
        expect(screen.getByText('Add a student to start planning sessions.')).toBeInTheDocument();
        const buttons = screen.getAllByRole('button').map((b) => b.textContent);
        expect(buttons).toEqual(['Add student', 'Import']);
    });

    it('puts the header one level below the section that holds it', () => {
        render(
            <HeadingLevelContext.Provider value={2}>
                <EmptyState header="Nothing here" />
            </HeadingLevelContext.Provider>,
        );
        expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    it('shows the image slot, and the icon only when there is no image', () => {
        const { container, rerender } = render(<EmptyState header="A" icon="user-group" />);
        expect(container.querySelector('.fa-user-group')).toHaveAttribute('aria-hidden', 'true');
        rerender(<EmptyState header="A" icon="user-group" image={<img alt="" src="x.png" />} />);
        expect(container.querySelector('.fa-user-group')).toBeNull();
        expect(container.querySelector('.plus-empty-state__image img')).not.toBeNull();
    });

    it('carries the spacing class and falls back to default', () => {
        const { container, rerender } = render(<EmptyState header="A" spacing="compact" />);
        expect(container.firstChild).toHaveClass('plus-empty-state--compact');
        rerender(<EmptyState header="A" spacing="huge" />);
        expect(container.firstChild).toHaveClass('plus-empty-state--default');
    });

    it('renders no action row when there are no actions', () => {
        const { container } = render(<EmptyState header="A" />);
        expect(container.querySelector('.plus-empty-state__actions')).toBeNull();
    });

    it('fills a Table emptyState slot', () => {
        render(
            <Table
                headers={['Student']}
                rows={[]}
                emptyState={<EmptyState spacing="compact" header="No students yet" />}
            />,
        );
        expect(screen.getByRole('heading', { name: 'No students yet' })).toBeInTheDocument();
    });
});
