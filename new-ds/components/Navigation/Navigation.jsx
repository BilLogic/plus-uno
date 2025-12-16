import React from 'react';
import PropTypes from 'prop-types';

/**
 * Navigation component for PLUS design system.
 * Universal navigation component supporting horizontal/vertical layouts, tabs/pills, and dropdowns.
 */
const Navigation = ({
    items = [],
    type = 'horizontal',
    alignment = 'left',
    id,
    className = '',
    style,
}) => {
    const classes = [
        'plus-nav',
        `plus-nav-${type}`,
        `plus-nav-align-${alignment}`,
        className
    ].filter(Boolean).join(' ');

    return (
        <nav
            id={id}
            className={classes}
            style={style}
            role="navigation"
            aria-label="Navigation"
        >
            <div className="plus-nav-list">
                {items.map((item, index) => (
                    <NavItem
                        key={index}
                        item={item}
                        type={type}
                        index={index}
                    />
                ))}
            </div>
            {(type === 'horizontal' || type === 'tabs') && (
                <div className="plus-nav-divider" />
            )}
        </nav>
    );
};

const NavItem = ({ item, type, index }) => {
    const itemClasses = [
        'plus-nav-item',
        item.selected ? 'plus-nav-item-selected' : '',
        item.disabled ? 'plus-nav-item-disabled' : '',
        (item.dropdownItems && item.dropdownItems.length > 0) ? 'plus-nav-item-dropdown' : ''
    ].filter(Boolean).join(' ');

    const linkClasses = [
        'plus-nav-link',
    ].filter(Boolean).join(' ');

    const Tag = item.href && !item.disabled ? 'a' : 'button';

    return (
        <div className={itemClasses}>
            <div className="plus-nav-item-content">
                <Tag
                    type={Tag === 'button' ? 'button' : undefined}
                    href={Tag === 'a' ? item.href : undefined}
                    className={linkClasses}
                    disabled={Tag === 'button' && item.disabled}
                    onClick={(e) => {
                        if (item.onClick && !item.disabled) {
                            if (!item.href) e.preventDefault();
                            item.onClick(e, item, index);
                        }
                    }}
                >
                    <span className="plus-nav-text body1-txt">{item.text}</span>
                    {item.dropdownItems && item.dropdownItems.length > 0 && (
                        <i className="fas fa-caret-down plus-nav-dropdown-icon" />
                    )}
                </Tag>
            </div>
            {item.dropdownItems && item.dropdownItems.length > 0 && (
                <DropdownMenu
                    items={item.dropdownItems}
                    type={type}
                />
            )}
        </div>
    );
};

const DropdownMenu = ({ items, type }) => {
    return (
        <div className="plus-nav-dropdown dropdown-menu" role="menu">
            {items.map((dropdownItem, idx) => (
                <a
                    key={idx}
                    className="dropdown-item plus-nav-dropdown-item"
                    href={dropdownItem.href || '#'}
                    role="menuitem"
                    onClick={(e) => {
                        if (dropdownItem.onClick) {
                            if (!dropdownItem.href || dropdownItem.href === '#') e.preventDefault();
                            dropdownItem.onClick(e, dropdownItem);
                        }
                    }}
                >
                    {dropdownItem.text}
                </a>
            ))}
        </div>
    );
};

Navigation.propTypes = {
    items: PropTypes.arrayOf(PropTypes.shape({
        text: PropTypes.string.isRequired,
        href: PropTypes.string,
        onClick: PropTypes.func,
        selected: PropTypes.bool,
        disabled: PropTypes.bool,
        dropdownItems: PropTypes.arrayOf(PropTypes.object)
    })).isRequired,
    type: PropTypes.oneOf(['horizontal', 'vertical', 'tabs', 'pills']),
    alignment: PropTypes.oneOf(['left', 'center', 'right']),
    id: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object,
};

export default Navigation;
