import React from 'react';
import PropTypes from 'prop-types';
import './ListGroup.scss';

/**
 * ListGroupItem - a row in a list of content, links or actions.
 *
 * A list of options to pick from is not a ListGroup: that is the option list
 * under a field, built on the forms `_internal` Listbox and OptionRow.
 *
 * Supports size (b1, b2, b3), active and disabled states, and contextual styles.
 */
export const ListGroupItem = ({
    children,
    active = false,
    disabled = false,
    href,
    action,
    style, // color variant
    size = 'b2', // 'b1', 'b2', 'b3' - default b2
    onClick,
    className = '',
    as = 'div',
    ...props
}) => {
    // Font size based on size prop
    const fontSizeMap = {
        'b1': 'var(--font-size-body1)',
        'b2': 'var(--font-size-body2)',
        'b3': 'var(--font-size-body3)'
    };
    const fontSize = fontSizeMap[size] || fontSizeMap['b2'];

    // Determine the element type
    let Tag = as;
    if (href) Tag = 'a';
    else if (onClick || action) Tag = 'button';

    // Map size to typography class
    const sizeClass = {
        'b1': 'body1-txt',
        'b2': 'body2-txt',
        'b3': 'body3-txt'
    }[size] || 'body1-txt';

    const classes = [
        'list-group-item',
        'plus-list-group-item',
        `plus-list-group-item--${size}`,
        active ? 'active' : '',
        disabled ? 'disabled' : '',
        (href || onClick || action) ? 'list-group-item-action' : '',
        style ? `plus-list-group-item-${style}` : '',
        sizeClass,
        className
    ].filter(Boolean).join(' ');

    const handleClick = (e) => {
        if (disabled) return;
        if (onClick) onClick(e);
    };

    const itemProps = {
        className: classes,
        onClick: disabled ? undefined : handleClick,
        href: disabled ? undefined : href,
        disabled: Tag === 'button' ? disabled : undefined,
        'aria-disabled': disabled ? 'true' : undefined,
        tabIndex: disabled && (Tag === 'a' || Tag === 'button') ? -1 : undefined,
        type: Tag === 'button' ? 'button' : undefined,
        ...props
    };

    return (
        <Tag {...itemProps} style={{ fontSize, ...props.style }}>
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
    size: PropTypes.oneOf(['b1', 'b2', 'b3']),
    onClick: PropTypes.func,
    className: PropTypes.string,
    as: PropTypes.elementType
};

const ListGroup = ({
    children,
    flush = false,
    horizontal = false,
    as = 'div',
    className = '',
    ...props
}) => {
    const Tag = as;

    const listClasses = [
        'list-group',
        'plus-list-group',
        flush ? 'list-group-flush' : '',
        horizontal ? 'list-group-horizontal' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <Tag className={listClasses} {...props}>
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

// Sub-component exports
ListGroup.Item = ListGroupItem;

export default ListGroup;
