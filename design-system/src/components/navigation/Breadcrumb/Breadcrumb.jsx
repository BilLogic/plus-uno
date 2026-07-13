import React from 'react';
import PropTypes from 'prop-types';
import RBBreadcrumb from 'react-bootstrap/Breadcrumb';
import './Breadcrumb.scss';

/**
 * Breadcrumb component for PLUS design system.
 * Universal element component for navigation breadcrumbs.
 * Uses React Bootstrap Breadcrumb as base.
 */
const Breadcrumb = ({ items, id, separator = '/', className = '', style }) => {
    // React Bootstrap uses --bs-breadcrumb-divider CSS variable for separator
    // We set it inline if a custom separator is provided
    const breadcrumbStyle = {
        ...style,
        '--bs-breadcrumb-divider': typeof separator === 'string' ? `'${separator}'` : separator
    };

    return (
        <RBBreadcrumb
            className={`plus-breadcrumb body1-txt ${className}`}
            style={breadcrumbStyle}
        >
            {items.map((item, index) => {
                const isLast = index === items.length - 1;
                return (
                    <RBBreadcrumb.Item
                        key={index}
                        href={item.href}
                        active={!item.href || isLast} // If no href, or it's the last item, it's active
                        onClick={(e) => {
                            if (item.onClick) {
                                e.preventDefault();
                                item.onClick(e);
                            }
                        }}
                        id={isLast && id ? id : undefined}
                        className={isLast ? 'plus-breadcrumb-current' : 'plus-breadcrumb-link'}
                    // Note: RB adds 'active' class automatically if active prop is true.
                    >
                        {item.text}
                    </RBBreadcrumb.Item>
                );
            })}
        </RBBreadcrumb>
    );
};

Breadcrumb.propTypes = {
    items: PropTypes.arrayOf(
        PropTypes.shape({
            text: PropTypes.string.isRequired,
            href: PropTypes.string,
            onClick: PropTypes.func,
        })
    ).isRequired,
    id: PropTypes.string,
    separator: PropTypes.node,
    className: PropTypes.string,
    style: PropTypes.object,
};

export default Breadcrumb;
