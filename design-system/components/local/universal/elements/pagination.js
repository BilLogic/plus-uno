/**
 * @fileoverview Pagination component for PLUS design system.
 * Universal element component for pagination navigation.
 * Built on Bootstrap 4.6.2 pagination with PLUS design token customizations.
 * Matches Figma design system specifications.
 */

/**
 * Creates a pagination component
 * @param {Object} options - Pagination configuration
 * @param {number} options.currentPage - Current active page (1-indexed)
 * @param {number} options.totalPages - Total number of pages
 * @param {Function} [options.onPageChange] - Callback function when page changes (receives page number)
 * @param {string} [options.id] - Pagination ID
 * @param {string} [options.ariaLabel='Page navigation'] - ARIA label for accessibility
 * @param {boolean} [options.showFirstLast=true] - Show first/last page buttons
 * @param {boolean} [options.showPrevNext=true] - Show previous/next buttons
 * @param {number} [options.maxVisible=5] - Maximum number of visible page numbers
 * @param {string} [options.prevText='Previous'] - Previous button text
 * @param {string} [options.nextText='Next'] - Next button text
 * @param {string} [options.firstText='First'] - First button text
 * @param {string} [options.lastText='Last'] - Last button text
 * @param {string} [options.size] - Size variant ('small', 'default', 'large')
 * @returns {HTMLElement} Pagination element
 */
export function createPagination({
    currentPage,
    totalPages,
    onPageChange = null,
    id = null,
    ariaLabel = 'Page navigation',
    showFirstLast = false,
    showPrevNext = true,
    maxVisible = 5,
    prevText = 'Previous',
    nextText = 'Next',
    firstText = 'First',
    lastText = 'Last',
    size = 'default'
}) {
    // Validate inputs
    if (!currentPage || !totalPages) {
        throw new Error('currentPage and totalPages are required');
    }
    
    if (currentPage < 1 || currentPage > totalPages) {
        throw new Error('currentPage must be between 1 and totalPages');
    }
    
    if (totalPages < 1) {
        throw new Error('totalPages must be at least 1');
    }

    // Create nav wrapper
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', ariaLabel);
    if (id) {
        nav.id = id;
    }

    // Create pagination ul
    const pagination = document.createElement('ul');
    pagination.classList.add('pagination', 'plus-pagination');
    
    if (size && size !== 'default') {
        pagination.classList.add(`plus-pagination-${size}`);
    }

    // Helper function to create page item
    const createPageItem = (pageNumber, text, isActive = false, isDisabled = false) => {
        const li = document.createElement('li');
        li.classList.add('page-item');
        
        if (isActive) {
            li.classList.add('active');
        }
        
        if (isDisabled) {
            li.classList.add('disabled');
        }

        const link = document.createElement('a');
        link.classList.add('page-link');
        link.textContent = text;
        
        if (isActive) {
            link.setAttribute('aria-current', 'page');
        }
        
        if (isDisabled) {
            link.setAttribute('tabindex', '-1');
            link.setAttribute('aria-disabled', 'true');
            link.href = '#';
        } else {
            link.href = '#';
            if (onPageChange) {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    onPageChange(pageNumber);
                });
            }
        }

        li.appendChild(link);
        return li;
    };

    // Calculate visible page range
    const getVisiblePages = () => {
        if (totalPages <= maxVisible) {
            // Show all pages if total is less than max visible
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const half = Math.floor(maxVisible / 2);
        let start = Math.max(1, currentPage - half);
        let end = Math.min(totalPages, start + maxVisible - 1);

        // Adjust if we're near the end
        if (end - start < maxVisible - 1) {
            start = Math.max(1, end - maxVisible + 1);
        }

        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    };

    // First button
    if (showFirstLast && totalPages > 1) {
        const firstItem = createPageItem(1, firstText, false, currentPage === 1);
        pagination.appendChild(firstItem);
    }

    // Previous button
    if (showPrevNext) {
        const prevItem = createPageItem(currentPage - 1, prevText, false, currentPage === 1);
        pagination.appendChild(prevItem);
    }

    // Page numbers
    const visiblePages = getVisiblePages();
    
    // Show ellipsis before if needed
    if (visiblePages[0] > 1) {
        const ellipsisLi = document.createElement('li');
        ellipsisLi.classList.add('page-item', 'disabled');
        const ellipsisLink = document.createElement('span');
        ellipsisLink.classList.add('page-link');
        ellipsisLink.textContent = '...';
        ellipsisLink.setAttribute('aria-disabled', 'true');
        ellipsisLi.appendChild(ellipsisLink);
        pagination.appendChild(ellipsisLi);
    }

    // Visible page numbers
    visiblePages.forEach(pageNum => {
        const isActive = pageNum === currentPage;
        const pageItem = createPageItem(pageNum, pageNum.toString(), isActive, false);
        pagination.appendChild(pageItem);
    });

    // Show ellipsis after if needed
    if (visiblePages[visiblePages.length - 1] < totalPages) {
        const ellipsisLi = document.createElement('li');
        ellipsisLi.classList.add('page-item', 'disabled');
        const ellipsisLink = document.createElement('span');
        ellipsisLink.classList.add('page-link');
        ellipsisLink.textContent = '...';
        ellipsisLink.setAttribute('aria-disabled', 'true');
        ellipsisLi.appendChild(ellipsisLink);
        pagination.appendChild(ellipsisLi);
    }

    // Next button
    if (showPrevNext) {
        const nextItem = createPageItem(currentPage + 1, nextText, false, currentPage === totalPages);
        pagination.appendChild(nextItem);
    }

    // Last button
    if (showFirstLast && totalPages > 1) {
        const lastItem = createPageItem(totalPages, lastText, false, currentPage === totalPages);
        pagination.appendChild(lastItem);
    }

    nav.appendChild(pagination);
    return nav;
}

