import React from 'react';
import PropTypes from 'prop-types';

export const ListGroupItem = ({
    children,
    active = false,
    disabled = false,
    href,
    action, // true if button/link behavior is desired without explicit href
    style, // color variant
    onClick,
    className = '',
    as = 'div', // 'div', 'a', 'button', 'li'
    ...props
}) => {
    // Determine the element type automatically if not explicitly 'as'
    let Tag = as;
    if (href) Tag = 'a';
    else if (onClick || action) Tag = 'button';
    else if (as === 'div' && !action && !onClick && !href) Tag = 'div'; // Default item
    // Note: If parent is <ul>, default should be <li> unless it's a link/button which can be direct children in some contexts, 
    // but BS4/5 usually wants <li> or <a>/ <button> as direct children of .list-group.
    // If we use <ul> for parent, we should use <li> for static items.

    // The legacy code logic:
    // If <ul>:
    //   if link/button -> direct child
    //   if div -> wrap in <li>

    // In React, we'll let the user/parent control the tag, but default intelligently.
    // If the parent is a ListGroup with as="ul", items should probably be "li" or "a"/"button".

    const classes = [
        'list-group-item',
        'plus-list-group-item',
        active ? 'active' : '',
        disabled ? 'disabled' : '',
        (href || onClick || action) ? 'list-group-item-action' : '',
        style ? `plus-list-group-item-${style}` : '',
        'body1-txt', // Text style per legacy
        className
    ].filter(Boolean).join(' ');

    const itemProps = {
        className: classes,
        onClick: disabled ? undefined : onClick,
        href: disabled ? undefined : href,
        disabled: Tag === 'button' ? disabled : undefined,
        'aria-disabled': disabled ? 'true' : undefined,
        tabIndex: disabled && (Tag === 'a' || Tag === 'button') ? -1 : undefined,
        type: Tag === 'button' ? 'button' : undefined,
        ...props
    };

    return (
        <Tag {...itemProps}>
            <div className="plus-list-group-item-content">
                {children}
            </div>
        </Tag>
    );
};

ListGroupItem.propTypes = {
    children: PropTypes.node,
    active: PropTypes.bool,
    disabled: PropTypes.bool,
    href: PropTypes.string,
    action: PropTypes.bool,
    style: PropTypes.oneOf(['primary', 'secondary', 'tertiary', 'success', 'danger', 'warning', 'info', 'light', 'dark']),
    onClick: PropTypes.func,
    className: PropTypes.string,
    as: PropTypes.elementType
};

const ListGroup = ({
    children,
    flush = false,
    horizontal = false, // Added for completeness though not in legacy explicit args
    as = 'div', // 'div' or 'ul'
    className = '',
    ...props
}) => {
    const Tag = as;
    const classes = [
        'list-group',
        'plus-list-group',
        flush ? 'list-group-flush' : '',
        horizontal ? 'list-group-horizontal' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <Tag className={classes} {...props}>
            {children}
        </Tag>
    );
};

ListGroup.propTypes = {
    children: PropTypes.node,
    flush: PropTypes.bool,
    horizontal: PropTypes.bool,
    as: PropTypes.elementType,
    className: PropTypes.string
};

// Sub-component export
ListGroup.Item = ListGroupItem;

export default ListGroup;
