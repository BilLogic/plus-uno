import React from 'react';
import PropTypes from 'prop-types';
import './Breadcrumb.scss';

/**
 * Breadcrumb component for PLUS design system.
 * Universal element component for navigation breadcrumbs.
 */
/*
 * `items` defaults to `[]` even though its prop type is `isRequired`. A required
 * prop is a lint, not a guarantee: React renders anyway, and `items.map` on
 * `undefined` took the whole page down rather than the one breadcrumb.
 *
 * Found by `DocumentedContract.stories.jsx`, and only once this component's page
 * gained a Usage tab: the guard renders each DOCUMENTED prop against fabricated
 * required props, and it cannot fabricate an `arrayOf(shape)`. So documenting
 * `separator` is what first rendered a Breadcrumb with no items, and the crash
 * had been reachable by any caller all along.
 */
const Breadcrumb = ({ items = [], id, separator = '/', label = 'breadcrumb', className = '', style }) => (
    <nav
        aria-label={label}
        className={`plus-breadcrumb ${className}`}
        style={{ ...style, '--plus-breadcrumb-divider': typeof separator === 'string' ? `'${separator}'` : separator }}
    >
        <ol className="plus-breadcrumb-list">
            {items.map((item, index) => {
                const isLast = index === items.length - 1;
                // Active if there's no href, or it's the last item.
                const isCurrent = !item.href || isLast;
                return isCurrent ? (
                    <li
                        key={index}
                        id={isLast && id ? id : undefined}
                        aria-current={isLast ? 'page' : undefined}
                        className="plus-breadcrumb-item plus-breadcrumb-current"
                    >
                        {item.text}
                    </li>
                ) : (
                    <li key={index} className="plus-breadcrumb-item plus-breadcrumb-link">
                        <a
                            href={item.href}
                            onClick={(e) => {
                                if (item.onClick) {
                                    e.preventDefault();
                                    item.onClick(e);
                                }
                            }}
                        >
                            {item.text}
                        </a>
                    </li>
                );
            })}
        </ol>
    </nav>
);

Breadcrumb.propTypes = {
    /** The trail, in order, as `{ text, href, onClick }`. The last item, and any item without `href`, is the current page and is not a link. `onClick` replaces the navigation with a handler. */
    items: PropTypes.arrayOf(
        PropTypes.shape({
            text: PropTypes.string.isRequired,
            href: PropTypes.string,
            onClick: PropTypes.func,
        })
    ).isRequired,
    /** The `id` attribute of the last (current) item. */
    id: PropTypes.string,
    /** What is drawn between items. A string is used as is; the default is `/`. */
    separator: PropTypes.node,
    /** Accessible label for the nav region that wraps the breadcrumbs. */
    label: PropTypes.string,
    /** Extra class names added to the `nav` element beside the component's own. */
    className: PropTypes.string,
    /** Inline styles for the `nav` element. */
    style: PropTypes.object,
};

export default Breadcrumb;
