import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import ListDetail, { LIST_DETAIL_FLOOR, listDetailView } from './ListDetail';

/**
 * List and detail: a list of 7 columns beside a detail Section of 5 while the
 * content holds the split floor (960); below it the detail replaces the list
 * behind a back link. `listDetailView` is the rule; widths and columns are
 * asserted in the browser, in the `Foundations/Patterns/List and detail`
 * stories.
 */
describe('listDetailView', () => {
    it('splits from the floor up, with or without a selection', () => {
        expect(LIST_DETAIL_FLOOR).toBe(960);
        expect(listDetailView({ width: 960, hasSelection: true })).toBe('split');
        expect(listDetailView({ width: 1232, hasSelection: false })).toBe('split');
    });

    it('below the floor shows the detail alone when a record is open, the list otherwise', () => {
        expect(listDetailView({ width: 959, hasSelection: true })).toBe('detail');
        expect(listDetailView({ width: 959, hasSelection: false })).toBe('list');
        expect(listDetailView({ width: 400, hasSelection: true })).toBe('detail');
    });
});

const renderIt = (props = {}) => render(
    <ListDetail
        list={<div>Queue rows</div>}
        detailTitle="Flag 1"
        detail={<div>Flag body</div>}
        hasSelection
        {...props}
    />,
);

describe('ListDetail', () => {
    it('puts next and previous in the detail header and runs them', async () => {
        const onNext = vi.fn();
        const onPrevious = vi.fn();
        renderIt({ onNext, onPrevious });
        const detail = screen.getByRole('heading', { name: 'Flag 1' }).closest('section');
        await userEvent.click(within(detail).getByRole('button', { name: 'Next' }));
        await userEvent.click(within(detail).getByRole('button', { name: 'Previous' }));
        expect(onNext).toHaveBeenCalledOnce();
        expect(onPrevious).toHaveBeenCalledOnce();
    });

    it('draws the detail Section with the subtle fill', () => {
        renderIt();
        expect(screen.getByRole('heading', { name: 'Flag 1' }).closest('section').className).toContain('plus-pattern-section-fill-subtle');
    });

    it('lets the list span the row when no record is open at the split', () => {
        const { container } = renderIt({ hasSelection: false, detail: null });
        expect(container.querySelector('.plus-list-detail__detail')).toBeNull();
        expect(screen.getByText('Queue rows')).toBeInTheDocument();
    });

    it('disables next and previous when the caller says there is none', () => {
        renderIt({ onNext: vi.fn(), onPrevious: vi.fn(), nextDisabled: true, previousDisabled: true });
        expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    });
});
