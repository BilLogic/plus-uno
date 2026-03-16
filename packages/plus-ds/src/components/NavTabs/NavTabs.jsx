import React from 'react';
import PropTypes from 'prop-types';
import { Nav, NavDropdown } from 'react-bootstrap';
import './NavTabs.scss';

// Subcomponents are wrappers around React-Bootstrap Nav.Item/Link/Dropdown
const NavTabsItem = ({
    children,
    active = false,
    disabled = false,
    href,
    onClick,
    className = '',
    as,
    eventKey,
    ...props
}) => {
    return (
        <Nav.Item className={`plus-nav-item ${className}`}>
            <Nav.Link
                as={as}
                href={href}
                active={active}
                disabled={disabled}
                eventKey={eventKey}
                onClick={onClick}
                className="plus-nav-link"
                {...props}
            >
                {children}
            </Nav.Link>
        </Nav.Item>
    );
};

NavTabsItem.propTypes = {
    children: PropTypes.node,
    active: PropTypes.bool,
    disabled: PropTypes.bool,
    href: PropTypes.string,
    onClick: PropTypes.func,
    className: PropTypes.string,
    as: PropTypes.elementType,
    eventKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

const NavTabsDropdown = ({
    title,
    children, // dropdown items
    active = false,
    disabled = false,
    className = '',
    id,
    menuVariant, // 'dark' etc although we customize
    ...props
}) => {
    return (
        <NavDropdown
            title={title}
            id={id}
            active={active}
            disabled={disabled}
            className={`plus-nav-item plus-nav-dropdown ${className}`}
            menuVariant={menuVariant}
            {...props}
        >
            {children}
        </NavDropdown>
    );
};
NavTabsDropdown.propTypes = {
    title: PropTypes.node.isRequired,
    children: PropTypes.node,
    active: PropTypes.bool,
    disabled: PropTypes.bool,
    className: PropTypes.string,
    id: PropTypes.string,
    menuVariant: PropTypes.string
};

const NavTabs = ({
    children,
    alignment = 'left', // 'left', 'center', 'right', 'justified'
    className = '',
    defaultActiveKey,
    activeKey,
    onSelect,
    ...props
}) => {
    const justifyClass = alignment === 'center' ? 'justify-content-center' :
        alignment === 'right' ? 'justify-content-end' :
            alignment === 'justified' ? 'nav-justified' : '';

    return (
        <Nav
            variant="tabs"
            className={`plus-nav-tabs ${justifyClass} ${className}`}
            defaultActiveKey={defaultActiveKey}
            activeKey={activeKey}
            onSelect={onSelect}
            {...props}
        >
            {children}
        </Nav>
    );
};

NavTabs.propTypes = {
    children: PropTypes.node,
    alignment: PropTypes.oneOf(['left', 'center', 'right', 'justified']),
    className: PropTypes.string,
    defaultActiveKey: PropTypes.any,
    activeKey: PropTypes.any,
    onSelect: PropTypes.func
};

NavTabs.Item = NavTabsItem;
NavTabs.Dropdown = NavTabsDropdown;

export default NavTabs;
