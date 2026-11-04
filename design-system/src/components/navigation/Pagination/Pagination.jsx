import React from 'react';
import PropTypes from 'prop-types';
import './Pagination.scss';

export const PAGINATION_SPACINGS = ['default', 'compact'];
export const PAGINATION_NAVIGATORS = ['icon', 'text'];

const cx = (...names) => names.filter(Boolean).join(' ');

/**
 * One page of the trail. A real button, so Enter and Space both work and the
 * current page announces as `aria-current="page"`. A button needs no `href`,
 * so a disabled one has nothing to navigate to by accident.
 */
const PaginationPage = ({ page, isCurrent = false, onSelect, label }) => (
    <li className="plus-pagination__item">
        <button
            type="button"
            className={cx('plus-pagination__page', isCurrent && 'plus-pagination__page--current')}
            aria-current={isCurrent ? 'page' : undefined}
            aria-label={label}
            onClick={() => onSelect && onSelect(page)}
        >
            {page}
        </button>
    </li>
);

PaginationPage.propTypes = {
    page: PropTypes.number.isRequired,
    isCurrent: PropTypes.bool,
    onSelect: PropTypes.func,
    /** Accessible name; the number alone when omitted. */
    label: PropTypes.string,
};

/**
 * The Previous or Next control. `direction` picks the caret; `navigator`
 * picks a caret alone (named by `label`) or the label as visible text. Disabled
 * keeps the control in the tab order with `aria-disabled`, so a screen reader
 * user finds it and hears why it does nothing.
 */
const PaginationNavigator = ({ direction, navigator = 'icon', label, isDisabled = false, onSelect }) => (
    <li className="plus-pagination__item">
        <button
            type="button"
            className={cx(
                'plus-pagination__navigator',
                navigator === 'icon' && 'plus-pagination__navigator--icon'
            )}
            aria-label={navigator === 'icon' ? label : undefined}
            aria-disabled={isDisabled ? 'true' : undefined}
            onClick={() => {
                if (!isDisabled && onSelect) onSelect();
            }}
        >
            {navigator === 'icon'
                ? <i className={`fa-solid fa-caret-${direction === 'previous' ? 'left' : 'right'}`} aria-hidden="true"></i>
                : label}
        </button>
    </li>
);

PaginationNavigator.propTypes = {
    direction: PropTypes.oneOf(['previous', 'next']).isRequired,
    navigator: PropTypes.oneOf(PAGINATION_NAVIGATORS),
    label: PropTypes.string.isRequired,
    isDisabled: PropTypes.bool,
    onSelect: PropTypes.func,
};

const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
    navigator = 'icon',
    spacing = 'default',
    max = 5,
    previousLabel = 'Previous',
    nextLabel = 'Next',
    label = 'Page navigation',
    id,
    className = ''
}) => {
    // A window of `max` pages around the current one. Page 1 and the last page
    // stay reachable when the window leaves them out.
    const getVisiblePages = () => {
        if (totalPages <= max) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const half = Math.floor(max / 2);
        let start = Math.max(1, currentPage - half);
        const end = Math.min(totalPages, start + max - 1);
        start = Math.max(1, end - max + 1);

        const pages = new Set();
        if (start > 1) pages.add(1);
        for (let i = start; i <= end; i++) pages.add(i);
        if (end < totalPages) pages.add(totalPages);

        return Array.from(pages).sort((a, b) => a - b);
    };

    const visiblePages = getVisiblePages();

    const goTo = (page) => {
        if (onPageChange && page >= 1 && page <= totalPages) {
            onPageChange(page);
        }
    };

    return (
        <nav aria-label={label} id={id}>
            <ul
                className={cx(
                    'plus-pagination',
                    spacing === 'compact' && 'plus-pagination--compact',
                    className
                )}
            >
                <PaginationNavigator
                    direction="previous"
                    navigator={navigator}
                    label={previousLabel}
                    isDisabled={currentPage <= 1}
                    onSelect={() => goTo(currentPage - 1)}
                />

                {visiblePages.map((pageNum, index) => {
                    const prevPage = index > 0 ? visiblePages[index - 1] : null;
                    const hasGap = prevPage !== null && pageNum - prevPage > 1;

                    return (
                        <React.Fragment key={pageNum}>
                            {hasGap && (
                                <li className="plus-pagination__item" aria-hidden="true">
                                    <span className="plus-pagination__gap">&hellip;</span>
                                </li>
                            )}
                            <PaginationPage
                                page={pageNum}
                                isCurrent={pageNum === currentPage}
                                label={`Page ${pageNum}`}
                                onSelect={goTo}
                            />
                        </React.Fragment>
                    );
                })}

                <PaginationNavigator
                    direction="next"
                    navigator={navigator}
                    label={nextLabel}
                    isDisabled={currentPage >= totalPages}
                    onSelect={() => goTo(currentPage + 1)}
                />
            </ul>
        </nav>
    );
};

Pagination.Page = PaginationPage;
Pagination.Navigator = PaginationNavigator;

Pagination.propTypes = {
    /** Current page, 1-based. */
    currentPage: PropTypes.number.isRequired,
    /** Total number of pages. */
    totalPages: PropTypes.number.isRequired,
    /** Called with the page number to move to. */
    onPageChange: PropTypes.func,
    /** Previous and Next as a caret (`icon`) or as their labels (`text`). */
    navigator: PropTypes.oneOf(PAGINATION_NAVIGATORS),
    /** `default` is a 32 row, `compact` a 24 row. */
    spacing: PropTypes.oneOf(PAGINATION_SPACINGS),
    /** Most page numbers shown at once. */
    max: PropTypes.number,
    /** Accessible name of the Previous control. */
    previousLabel: PropTypes.string,
    /** Accessible name of the Next control. */
    nextLabel: PropTypes.string,
    /** Accessible label of the navigation region. */
    label: PropTypes.string,
    id: PropTypes.string,
    className: PropTypes.string
};

export default Pagination;
