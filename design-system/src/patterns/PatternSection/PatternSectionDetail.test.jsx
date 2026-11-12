import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { SplitContext } from '../Frame/SplitContext';
import PatternSection, { SECTION_DETAIL_FLOOR, sectionDetailView } from './PatternSection';

/**
 * The Section's optional `detail` region: the body is the list, the region on
 * its right shows one record. The split holds from 960 of the Section's own
 * width (or the Frame's resolver); below it the detail replaces the list behind
 * a back link. `sectionDetailView` is the rule; widths and columns are asserted
 * in the browser, in the `Templates/Section/Section` stories.
 */
describe('sectionDetailView', () => {
    it('splits from the floor up, with or without a selection', () => {
        expect(SECTION_DETAIL_FLOOR).toBe(960);
        expect(sectionDetailView({ splitHolds: true, hasSelection: true })).toBe('split');
        expect(sectionDetailView({ splitHolds: true, hasSelection: false })).toBe('split');
    });

    it('below the floor shows the detail alone when a record is open, the list otherwise', () => {
        expect(sectionDetailView({ splitHolds: false, hasSelection: true })).toBe('detail');
        expect(sectionDetailView({ splitHolds: false, hasSelection: false })).toBe('list');
    });
});

// The resolver is set so the split state never depends on jsdom's window width.
const renderIt = (props = {}) => render(
    <SplitContext.Provider value>
        <PatternSection
            title="Queue"
            detail={<div>Flag body</div>}
            detailTitle="Flag 1"
            hasSelection
            {...props}
        >
            <div>Queue rows</div>
        </PatternSection>
    </SplitContext.Provider>,
);

describe('PatternSection detail', () => {
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

    it('draws the detail with the subtle fill', () => {
        renderIt();
        expect(screen.getByRole('heading', { name: 'Flag 1' }).closest('section').className).toContain('plus-pattern-section-fill-subtle');
    });

    it('draws no detail when no record is open at the split, so the list spans the row', () => {
        const { container } = renderIt({ hasSelection: false, detail: null });
        expect(container.querySelector('.plus-pattern-section-detail')).toBeNull();
        expect(container.querySelector('.plus-pattern-section-with-detail--split')).not.toBeNull();
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

    it('draws no detail wrapper on a plain Section', () => {
        const { container } = render(<PatternSection title="Sessions">Body</PatternSection>);
        expect(container.querySelector('.plus-pattern-section-with-detail')).toBeNull();
    });
});

describe('PatternSection detail inside a Frame with sectionDetail', () => {
    const inFrame = (splitHolds) => render(
        <SplitContext.Provider value={splitHolds}>
            <PatternSection title="Queue" detail={<div>Flag body</div>} detailTitle="Flag 1" hasSelection>
                <div>Queue rows</div>
            </PatternSection>
        </SplitContext.Provider>,
    );

    it('follows the resolver: split when it holds, the detail alone when it does not', () => {
        const held = inFrame(true);
        expect(held.container.querySelector('.plus-pattern-section-with-detail--split')).not.toBeNull();
        held.unmount();
        const dropped = inFrame(false);
        expect(dropped.container.querySelector('.plus-pattern-section-with-detail--detail')).not.toBeNull();
        expect(screen.queryByText('Queue rows')).toBeNull();
    });
});

describe('PatternSection detail back link', () => {
    const narrow = (props) => render(
        <SplitContext.Provider value={false}>
            <PatternSection title="Queue" detail={<div>Flag body</div>} detailTitle="Flag 1" hasSelection {...props}>
                <div>Queue rows</div>
            </PatternSection>
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
