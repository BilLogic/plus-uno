import React from 'react';
import PropTypes from 'prop-types';
import { Nav, NavDropdown } from 'react-bootstrap';
import './NavPills.scss';

const NavPillsItem = ({
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
                className="plus-nav-link plus-nav-item-pill"
                {...props}
            >
                <div className="plus-nav-item-content">
                    {children}
                </div>
            </Nav.Link>
        </Nav.Item>
    );
};

NavPillsItem.propTypes = {
    children: PropTypes.node,
    active: PropTypes.bool,
    disabled: PropTypes.bool,
    href: PropTypes.string,
    onClick: PropTypes.func,
    className: PropTypes.string,
    as: PropTypes.elementType,
    eventKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

const NavPillsDropdown = ({
    title, // Usually "text" in previous implementation, RB uses "title"
    children,
    active = false,
    disabled = false,
    className = '',
    id,
    menuVariant,
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

NavPillsDropdown.propTypes = {
    title: PropTypes.node.isRequired,
    children: PropTypes.node,
    active: PropTypes.bool,
    disabled: PropTypes.bool,
    className: PropTypes.string,
    id: PropTypes.string,
    menuVariant: PropTypes.string
};


const NavPills = ({
    children,
    alignment = 'left', // 'left', 'center', 'right'
    direction = 'horizontal', // 'horizontal', 'vertical'
    className = '',
    defaultActiveKey,
    activeKey,
    onSelect,
    ...props
}) => {
    const classes = [
        'plus-nav-pills',
        alignment === 'center' ? 'justify-content-center' :
            alignment === 'right' ? 'justify-content-end' : '',
        direction === 'vertical' ? 'flex-column' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <Nav
            variant="pills" // Use BS pills logic for state management, but override styles
            className={classes}
            defaultActiveKey={defaultActiveKey}
            activeKey={activeKey}
            onSelect={onSelect}
            {...props}
        >
            {children}
        </Nav>
    );
};

NavPills.propTypes = {
    children: PropTypes.node,
    alignment: PropTypes.oneOf(['left', 'center', 'right']),
    direction: PropTypes.oneOf(['horizontal', 'vertical']),
    className: PropTypes.string,
    defaultActiveKey: PropTypes.any,
    activeKey: PropTypes.any,
    onSelect: PropTypes.func
};

NavPills.Item = NavPillsItem;
NavPills.Dropdown = NavPillsDropdown;

export default NavPills;
