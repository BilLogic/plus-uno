import React from 'react';
import PropTypes from 'prop-types';
import Radio from '../Form/forms/Radio';
import Checkbox from '../Form/forms/Checkbox';
import './ListGroup.scss';

/**
 * ListGroupItem - Unified list item component
 * 
 * Modes:
 * - selectable="none": Regular list item (clickable, static) - default
 * - selectable="single": Radio button selection (single select)
 * - selectable="multi": Checkbox selection (multi select)
 * 
 * All modes support size (b1, b2, b3), states, and styling.
 */
export const ListGroupItem = ({
    children,
    label,
    value,
    active = false,
    selected = false,
    disabled = false,
    href,
    action,
    style, // color variant
    size = 'b2', // 'b1', 'b2', 'b3' - default b2
    selectable = 'none', // 'none', 'single', 'multi'
    name,
    onClick,
    className = '',
    as = 'div',
    ...props
}) => {
    // Determine if this is a selectable item
    const isSelectable = selectable === 'single' || selectable === 'multi';

    // Font size based on size prop
    const fontSizeMap = {
        'b1': 'var(--font-size-body1)',
        'b2': 'var(--font-size-body2)',
        'b3': 'var(--font-size-body3)'
    };
    const fontSize = fontSizeMap[size] || fontSizeMap['b2'];

    // For selectable items, use selected prop; otherwise use active
    const isActive = isSelectable ? selected : active;

    // Determine the element type
    let Tag = as;
    if (!isSelectable) {
        if (href) Tag = 'a';
        else if (onClick || action) Tag = 'button';
    } else {
        Tag = 'div'; // Selectable items are always div with role="option"
    }

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
        isActive ? 'active' : '',
        disabled ? 'disabled' : '',
        (href || onClick || action || isSelectable) ? 'list-group-item-action' : '',
        isSelectable ? 'plus-list-option' : '',
        style ? `plus-list-group-item-${style}` : '',
        sizeClass,
        className
    ].filter(Boolean).join(' ');

    // Handle click for selectable items
    const handleClick = (e) => {
        if (disabled) return;
        if (isSelectable) {
            e.stopPropagation();
            if (onClick) onClick(value);
        } else if (onClick) {
            onClick(e);
        }
    };

    // Display label for selectable items
    const displayLabel = label || children;

    // Render selectable item with radio/checkbox
    if (isSelectable) {
        return (
            <div
                className={classes}
                style={{ fontSize }}
                onClick={handleClick}
                role="option"
                aria-selected={selected}
                aria-disabled={disabled}
                tabIndex={disabled ? -1 : 0}
                {...props}
            >
                {selectable === 'multi' ? (
                    <Checkbox
                        name={name}
                        value={value}
                        checked={selected}
                        disabled={disabled}
                        label={displayLabel}
                        size="small"
                        onChange={() => { }} // Handled by parent onClick
                        className="plus-list-option-checkbox"
                    />
                ) : (
                    <Radio
                        name={name}
                        value={value}
                        checked={selected}
                        disabled={disabled}
                        label={displayLabel}
                        size="small"
                        onChange={() => { }} // Handled by parent onClick
                        className="plus-list-option-radio"
                    />
                )}
            </div>
        );
    }

    // Render regular item
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
    label: PropTypes.node,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    active: PropTypes.bool,
    selected: PropTypes.bool,
    disabled: PropTypes.bool,
    href: PropTypes.string,
    action: PropTypes.bool,
    style: PropTypes.oneOf(['primary', 'secondary', 'tertiary', 'success', 'danger', 'warning', 'info', 'light', 'dark']),
    size: PropTypes.oneOf(['b1', 'b2', 'b3']),
    selectable: PropTypes.oneOf(['none', 'single', 'multi']),
    name: PropTypes.string,
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

// Sub-component exports
ListGroup.Item = ListGroupItem;

// Keep OptionList for form use cases
import OptionListComponent from '../Form/forms/OptionList';
ListGroup.OptionList = OptionListComponent;

export default ListGroup;
export { default as OptionList } from '../Form/forms/OptionList';
