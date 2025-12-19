import React from 'react';
import PropTypes from 'prop-types';

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
    const getVisiblePages = () => {
        if (totalPages <= maxVisible) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const half = Math.floor(maxVisible / 2);
        let start = Math.max(1, currentPage - half);
        let end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start < maxVisible - 1) {
            start = Math.max(1, end - maxVisible + 1);
        }

        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    };

    const visiblePages = getVisiblePages();
    const showPrevEllipsis = visiblePages.length > 0 && visiblePages[0] > 1;
    const showNextEllipsis = visiblePages.length > 0 && visiblePages[visiblePages.length - 1] < totalPages;

    const handlePageChange = (e, page) => {
        e.preventDefault();
        if (onPageChange) {
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

    const renderPageItem = (page, isActive, isDisabled, content) => (
        <li className={`page-item ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''} ${type === 'icon' && typeof content !== 'string' ? 'page-item-icon' : ''}`} key={page}>
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
                    type === 'icon' ? <i className="fas fa-caret-left"></i> : prevText
                )}

                {/* Ellipsis Start */}
                {showPrevEllipsis && (
                    <li className="page-item disabled page-item-ellipsis">
                        <span className="page-link" aria-disabled="true">...</span>
                    </li>
                )}

                {/* Page Numbers */}
                {visiblePages.map(pageNum => renderPageItem(
                    pageNum,
                    pageNum === currentPage,
                    false,
                    pageNum
                ))}

                {/* Ellipsis End */}
                {showNextEllipsis && (
                    <li className="page-item disabled page-item-ellipsis">
                        <span className="page-link" aria-disabled="true">...</span>
                    </li>
                )}

                {/* Next Button */}
                {renderPageItem(
                    currentPage + 1,
                    false,
                    currentPage === totalPages,
                    type === 'icon' ? <i className="fas fa-caret-right"></i> : nextText
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
