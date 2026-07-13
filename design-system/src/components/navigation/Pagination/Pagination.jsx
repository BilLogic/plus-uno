import React from 'react';
import PropTypes from 'prop-types';
import './Pagination.scss';

const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
    type = 'icon', // 'icon' or 'text'
    size = 'default',
    maxVisible = 5,
    prevText = 'Previous',
    nextText = 'Next',
    ariaLabel = 'Page navigation',
    id,
    className = ''
}) => {
    // Determine visible page numbers
    // Logic: Show maxVisible pages centered around currentPage, but always include page 1 and last page when there are ellipses
    const getVisiblePages = () => {
        if (totalPages <= maxVisible) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const half = Math.floor(maxVisible / 2);
        let start = Math.max(1, currentPage - half);
        let end = Math.min(totalPages, start + maxVisible - 1);

        // Adjust if we don't have enough pages
        if (end - start < maxVisible - 1) {
            start = Math.max(1, end - maxVisible + 1);
        }

        // Check if we need ellipses
        const needsPrevEllipsis = start > 2;
        const needsNextEllipsis = end < totalPages - 1;

        // Build the page array, always including 1 and last page when ellipses are needed
        const pages = new Set();

        // Always include page 1 if there's a previous ellipsis
        if (needsPrevEllipsis) {
            pages.add(1);
        }

        // Add the visible range
        for (let i = start; i <= end; i++) {
            pages.add(i);
        }

        // Always include last page if there's a next ellipsis
        if (needsNextEllipsis) {
            pages.add(totalPages);
        }

        // Convert to sorted array
        return Array.from(pages).sort((a, b) => a - b);
    };

    const visiblePages = getVisiblePages();

    const handlePageChange = (e, page) => {
        e.preventDefault();
        if (onPageChange && page >= 1 && page <= totalPages) {
            onPageChange(page);
        }
    };

    const containerClasses = [
        'pagination',
        'plus-pagination',
        size !== 'default' ? `plus-pagination-${size}` : '',
        type !== 'icon' ? `plus-pagination-${type}` : '',
        className
    ].filter(Boolean).join(' ');

    const renderPageItem = (page, isActive, isDisabled, content, isIconButton = false) => (
        <li 
            className={`page-item ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''} ${isIconButton ? 'page-item-icon' : ''}`} 
            key={page}
        >
            <a
                className="page-link"
                href="#"
                onClick={(e) => !isDisabled && handlePageChange(e, page)}
                aria-current={isActive ? 'page' : undefined}
                aria-disabled={isDisabled ? 'true' : undefined}
                tabIndex={isDisabled ? -1 : undefined}
            >
                {content}
            </a>
        </li>
    );

    return (
        <nav aria-label={ariaLabel} id={id}>
            <ul className={containerClasses}>
                {/* Previous Button */}
                {renderPageItem(
                    currentPage - 1,
                    false,
                    currentPage === 1,
                    type === 'icon' ? <i className="fas fa-caret-left"></i> : prevText,
                    type === 'icon'
                )}

                {/* Render pages with proper ellipsis placement */}
                {visiblePages.map((pageNum, index) => {
                    const prevPage = index > 0 ? visiblePages[index - 1] : null;
                    const gapBefore = prevPage && pageNum - prevPage > 1;

                    return (
                        <React.Fragment key={pageNum}>
                            {/* Show ellipsis before if there's a gap from previous page */}
                            {gapBefore && (
                                <li className="page-item disabled page-item-ellipsis" key={`ellipsis-before-${pageNum}`}>
                                    <span className="page-link" aria-disabled="true">...</span>
                                </li>
                            )}
                            {/* Render the page */}
                            {renderPageItem(
                                pageNum,
                                pageNum === currentPage,
                                false,
                                pageNum
                            )}
                        </React.Fragment>
                    );
                })}

                {/* Next Button */}
                {renderPageItem(
                    currentPage + 1,
                    false,
                    currentPage === totalPages,
                    type === 'icon' ? <i className="fas fa-caret-right"></i> : nextText,
                    type === 'icon'
                )}
            </ul>
        </nav>
    );
};

Pagination.propTypes = {
    currentPage: PropTypes.number.isRequired,
    totalPages: PropTypes.number.isRequired,
    onPageChange: PropTypes.func,
    type: PropTypes.oneOf(['icon', 'text']),
    size: PropTypes.oneOf(['small', 'default', 'large']),
    maxVisible: PropTypes.number,
    prevText: PropTypes.string,
    nextText: PropTypes.string,
    ariaLabel: PropTypes.string,
    id: PropTypes.string,
    className: PropTypes.string
};

export default Pagination;
