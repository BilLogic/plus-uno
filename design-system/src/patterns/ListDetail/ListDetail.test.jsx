import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { SplitContext } from '../Frame/SplitContext';
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
        expect(listDetailView({ splitHolds: true, hasSelection: true })).toBe('split');
        expect(listDetailView({ splitHolds: true, hasSelection: false })).toBe('split');
    });

    it('below the floor shows the detail alone when a record is open, the list otherwise', () => {
        expect(listDetailView({ splitHolds: false, hasSelection: true })).toBe('detail');
        expect(listDetailView({ splitHolds: false, hasSelection: false })).toBe('list');
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

    it('names the detail region from its title', () => {
        renderIt();
        expect(screen.getByRole('region', { name: 'Flag 1' })).toBeInTheDocument();
    });

    it('disables next and previous when the caller says there is none', () => {
        renderIt({ onNext: vi.fn(), onPrevious: vi.fn(), nextDisabled: true, previousDisabled: true });
        expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    });
});

describe('ListDetail inside a Frame with listDetail', () => {
    const inFrame = (splitHolds) => render(
        <SplitContext.Provider value={splitHolds}>
            <ListDetail list={<div>Queue rows</div>} detail={<div>Flag body</div>} detailTitle="Flag 1" hasSelection />
        </SplitContext.Provider>,
    );

    it('follows the resolver: split when it holds, the detail alone when it does not', () => {
        const held = inFrame(true);
        expect(held.container.querySelector('.plus-list-detail--split')).not.toBeNull();
        held.unmount();
        const dropped = inFrame(false);
        expect(dropped.container.querySelector('.plus-list-detail--detail')).not.toBeNull();
        expect(screen.queryByText('Queue rows')).toBeNull();
    });
});

describe('ListDetail back link', () => {
    const narrow = (props) => render(
        <SplitContext.Provider value={false}>
            <ListDetail list={<div>Queue rows</div>} detail={<div>Flag body</div>} detailTitle="Flag 1" hasSelection {...props} />
        </SplitContext.Provider>,
    );

    it('is not drawn without a handler', () => {
        narrow();
        expect(screen.queryByRole('button', { name: 'Back to list' })).toBeNull();
    });

    it('runs onBack when the detail replaces the list', async () => {
        const onBack = vi.fn();
        narrow({ onBack });
        await userEvent.click(screen.getByRole('button', { name: 'Back to list' }));
        expect(onBack).toHaveBeenCalledOnce();
    });
});
