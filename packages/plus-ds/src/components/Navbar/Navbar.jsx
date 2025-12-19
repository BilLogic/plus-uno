import React from 'react';
import PropTypes from 'prop-types';

/**
 * Navbar component for PLUS design system.
 * Navbar container component with different types, background colors, and navbar items.
 */
const Navbar = ({
    brand = 'Navbar',
    items = [],
    type = 'all',
    backgroundColor = 'light',
    components = [],
    id,
    className = '',
    style,
}) => {
    const classes = [
        'plus-navbar',
        `plus-navbar-${type}`,
        `plus-navbar-${backgroundColor}`,
        'navbar',
        'navbar-expand-lg',
        backgroundColor === 'dark' ? 'navbar-dark' : 'navbar-light',
        className
    ].filter(Boolean).join(' ');

    return (
        <nav
            id={id}
            className={classes}
            style={style}
            role="navigation"
            aria-label="Main Navigation"
        >
            <div className="container-fluid">
                <a className="navbar-brand plus-navbar-brand h4" href="#">
                    {brand}
                </a>

                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarContent"
                    aria-controls="navbarContent"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="navbarContent">
                    {/* Navigation Items */}
                    {items && items.length > 0 && (
                        <ul className="navbar-nav me-auto mb-2 mb-lg-0 plus-navbar-nav">
                            {items.map((item, index) => (
                                <NavbarItem key={index} item={item} />
                            ))}
                        </ul>
                    )}

                    {/* Components (Search, Buttons, etc.) */}
                    {components && components.length > 0 && (
                        <div className="plus-navbar-components d-flex align-items-center gap-2">
                            {components.map((comp, index) => (
                                <NavbarComponent key={index} component={comp} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

const NavbarItem = ({ item }) => {
    const isDropdown = item.dropdownItems && item.dropdownItems.length > 0;

    return (
        <li className={`nav-item plus-navbar-item ${isDropdown ? 'dropdown' : ''}`}>
            <a
                className={`nav-link ${item.active ? 'active' : ''} ${isDropdown ? 'dropdown-toggle' : ''}`}
                href={item.href || '#'}
                role={isDropdown ? 'button' : undefined}
                data-bs-toggle={isDropdown ? 'dropdown' : undefined}
                aria-expanded={isDropdown ? 'false' : undefined}
                onClick={(e) => {
                    if (item.onClick) {
                        if (!item.href || item.href === '#') e.preventDefault();
                        item.onClick(e);
                    }
                }}
            >
                {item.text}
            </a>
            {isDropdown && (
                <ul className="dropdown-menu">
                    {item.dropdownItems.map((dropdownItem, idx) => (
                        <li key={idx}>
                            <a
                                className="dropdown-item"
                                href={dropdownItem.href || '#'}
                                onClick={(e) => {
                                    if (dropdownItem.onClick) {
                                        if (!dropdownItem.href || dropdownItem.href === '#') e.preventDefault();
                                        dropdownItem.onClick(e);
                                    }
                                }}
                            >
                                {dropdownItem.text}
                            </a>
                        </li>
                    ))}
                </ul>
            )}
        </li>
    );
};

const NavbarComponent = ({ component }) => {
    if (component.type === 'button') {
        return (
            <button
                type={component.buttonType || 'button'}
                className={`btn btn-${component.variant || 'primary'} ${component.className || ''}`}
                onClick={component.onClick}
            >
                {component.text}
            </button>
        );
    }

    if (component.type === 'form') {
        return (
            <form className="d-flex" role="search">
                <div className="input-group">
                    {component.input && (
                        <input
                            className="form-control"
                            type={component.input.type || 'search'}
                            placeholder={component.input.placeholder || 'Search'}
                            aria-label="Search"
                        />
                    )}
                    {component.button && (
                        <button className="btn btn-outline-success" type="submit">
                            {component.button.text || 'Search'}
                        </button>
                    )}
                </div>
            </form>
        );
    }

    // Allow rendering raw React node if type is 'custom' or unspecified
    if (component.content) {
        return <div>{component.content}</div>;
    }

    return null;
};

Navbar.propTypes = {
    brand: PropTypes.string,
    items: PropTypes.arrayOf(PropTypes.object),
    type: PropTypes.string,
    backgroundColor: PropTypes.string,
    components: PropTypes.arrayOf(PropTypes.object),
    id: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object,
};

export default Navbar;
