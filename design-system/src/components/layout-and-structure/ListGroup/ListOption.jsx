import React from 'react';
import PropTypes from 'prop-types';
import SelectionIndicator from './SelectionIndicator';
import './ListGroup.scss';

/**
 * ListOption Subcomponent
 * Flexible list option item for option list popups (Select dropdowns, menus)
 * Supports Radio (single select) or Checkbox (multi select) with proper controls
 */
export const ListOption = ({
    children,
    label,
    value,
    selected = false,
    disabled = false,
    mode = 'single', // 'single' (radio) or 'multi' (checkbox)
    name,
    onClick,
    className = '',
    /**
     * Whether this option holds the list's single tab stop. Defaults to true so
     * an option used on its own stays reachable; `ListGroup` passes false to
     * all but one when it manages a listbox.
     */
    tabbable = true,
    ...props
}) => {
    const displayLabel = label || children;

    const handleClick = (e) => {
        e.stopPropagation();
        if (!disabled && onClick) {
            onClick(value);
        }
    };

    const classes = [
        'list-group-item',
        'plus-list-group-item',
        'plus-list-option',
        'list-group-item-action',
        selected ? 'active' : '',
        disabled ? 'disabled' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <div
            className={classes}
            onClick={handleClick}
            role="option"
            aria-selected={selected}
            aria-disabled={disabled}
            tabIndex={disabled || !tabbable ? -1 : 0}
            {...props}
        >
            <SelectionIndicator mode={mode} selected={selected} disabled={disabled} />
            <span className="plus-list-option-label">{displayLabel}</span>
        </div>
    );
};

ListOption.propTypes = {
    children: PropTypes.node,
    label: PropTypes.node,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    selected: PropTypes.bool,
    disabled: PropTypes.bool,
    mode: PropTypes.oneOf(['single', 'multi']),
    name: PropTypes.string,
    onClick: PropTypes.func,
    className: PropTypes.string,
    tabbable: PropTypes.bool
};

export default ListOption;
