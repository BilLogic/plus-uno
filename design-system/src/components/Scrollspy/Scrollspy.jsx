import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './Scrollspy.scss';

// The Content Component
export const ScrollspyContent = ({
    id,
    children,
    className = '',
    style,
    height,
    ...props
}) => {
    const finalStyle = {
        ...style,
        position: 'relative',
        overflowY: 'auto',
        height: height || '100%'
    };

    return (
        <div
            id={id}
            className={`plus-scrollspy-content ${className}`}
            style={finalStyle}
            {...props}
        >
            {children}
        </div>
    );
};

ScrollspyContent.propTypes = {
    id: PropTypes.string.isRequired,
    children: PropTypes.node,
    className: PropTypes.string,
    style: PropTypes.object,
    height: PropTypes.string
};


// The Navbar/Spy Component
const Scrollspy = ({
    id,
    brand = 'Navbar',
    items = [],
    contentId, // The ID of the ScrollspyContent to spy on
    offset = 10,
    activeId: controlledActiveId,
    onActivate,
    className = '',
    style,
    ...props
}) => {
    const [internalActiveId, setInternalActiveId] = useState(items[0]?.href.replace('#', '') || '');
    const activeId = controlledActiveId !== undefined ? controlledActiveId : internalActiveId;

    useEffect(() => {
        if (!contentId) return;

        const contentElement = document.getElementById(contentId);
        if (!contentElement) return;

        const handleScroll = () => {
            const scrollTop = contentElement.scrollTop + offset;
            const sectionIds = items.map(item => item.href.replace('#', ''));

            let currentId = sectionIds[0];

            // Check sections in reverse to find the one we are currently in
            for (let i = sectionIds.length - 1; i >= 0; i--) {
                const sectionId = sectionIds[i];
                const section = document.getElementById(sectionId);

                if (section) {
                    // Calculate offset relative to the scrollable container's top
                    // We need to account for the container's offset calculation logic
                    // The legacy code used JQuery position().top which is relative to offset parent (likely the container if positioned)
                    // Here we can use offsetTop if the container is the offsetParent.

                    // A safer robust way without jQuery:
                    // section.offsetTop is relative to offsetParent.
                    // If contentElement is positioned (relative/absolute/fixed), it is likely the offsetParent.

                    if (section.offsetTop <= scrollTop) {
                        currentId = sectionId;
                        break;
                    }
                }
            }

            if (currentId !== activeId) {
                if (controlledActiveId === undefined) {
                    setInternalActiveId(currentId);
                }
                if (onActivate) {
                    onActivate(currentId);
                }
            }
        };

        contentElement.addEventListener('scroll', handleScroll);
        // Initial check
        handleScroll();

        return () => {
            contentElement.removeEventListener('scroll', handleScroll);
        };
    }, [contentId, items, offset, activeId, controlledActiveId, onActivate]);

    const handleLinkClick = (e, href) => {
        e.preventDefault();
        const targetId = href.replace('#', '');
        const targetElement = document.getElementById(targetId);
        const contentElement = document.getElementById(contentId);

        if (targetElement && contentElement) {
            contentElement.scrollTo({
                top: targetElement.offsetTop,
                behavior: 'smooth'
            });
        }
    };

    return (
        <nav
            id={id}
            className={`plus-scrollspy-navbar ${className}`}
            role="navigation"
            aria-label="Scrollspy navigation"
            style={style}
            {...props}
        >
            <div className="plus-scrollspy-brand">
                <p className="body-lead-txt">{brand}</p>
            </div>
            <div className="plus-scrollspy-spacer"></div>
            <div className="plus-nav-list plus-nav-pills">
                {items.map((item, index) => {
                    const itemId = item.href.replace('#', '');
                    const isActive = activeId === itemId;

                    return (
                        <div key={index} className={`plus-nav-item ${isActive ? 'plus-nav-item-selected' : ''} ${item.isDropdown ? 'plus-nav-item-dropdown' : ''}`}>
                            <a
                                href={item.href}
                                className={`plus-nav-link ${isActive ? 'active' : ''}`}
                                onClick={(e) => handleLinkClick(e, item.href)}
                            >
                                <span className="plus-nav-text body1-txt">{item.text}</span>
                                {item.isDropdown && <i className="fas fa-caret-down plus-nav-dropdown-icon"></i>}
                            </a>
                        </div>
                    );
                })}
            </div>
        </nav>
    );
};

Scrollspy.propTypes = {
    id: PropTypes.string,
    brand: PropTypes.node,
    items: PropTypes.arrayOf(PropTypes.shape({
        text: PropTypes.string.isRequired,
        href: PropTypes.string.isRequired,
        isDropdown: PropTypes.bool
    })).isRequired,
    contentId: PropTypes.string, // ID of the content container
    offset: PropTypes.number,
    activeId: PropTypes.string,
    onActivate: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object
};

export default Scrollspy;
