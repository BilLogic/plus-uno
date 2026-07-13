import React from 'react';
import PropTypes from 'prop-types';
import { Navbar as RBNavbar, Nav, Container } from 'react-bootstrap';
import './Navbar.scss';

/**
 * Navbar component for PLUS design system
 * Top navigation bar component for page layouts
 */
const Navbar = ({
    brand,
    items = [],
    backgroundColor = 'light',
    className = '',
    id,
    style,
    ...props
}) => {
    const navbarClasses = [
        'plus-navbar',
        `plus-navbar-bg-${backgroundColor}`,
        className
    ].filter(Boolean).join(' ');

    return (
        <RBNavbar
            id={id}
            className={navbarClasses}
            bg={backgroundColor}
            expand="lg"
            style={style}
            {...props}
        >
            <Container fluid>
                {brand && (
                    <RBNavbar.Brand className="plus-navbar-brand">
                        {brand}
                    </RBNavbar.Brand>
                )}
                {items && items.length > 0 && (
                    <RBNavbar.Collapse>
                        <Nav className="ms-auto">
                            {items.map((item, index) => (
                                <Nav.Link
                                    key={index}
                                    href={item.href || '#'}
                                    active={item.active}
                                    disabled={item.disabled}
                                    onClick={(e) => {
                                        if (item.onClick) {
                                            e.preventDefault();
                                            item.onClick(e);
                                        }
                                    }}
                                >
                                    {item.text}
                                </Nav.Link>
                            ))}
                        </Nav>
                    </RBNavbar.Collapse>
                )}
            </Container>
        </RBNavbar>
    );
};

Navbar.propTypes = {
    brand: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    items: PropTypes.arrayOf(PropTypes.shape({
        text: PropTypes.string.isRequired,
        href: PropTypes.string,
        onClick: PropTypes.func,
        active: PropTypes.bool,
        disabled: PropTypes.bool
    })),
    backgroundColor: PropTypes.oneOf(['light', 'dark', 'primary']),
    className: PropTypes.string,
    id: PropTypes.string,
    style: PropTypes.object
};

export default Navbar;

