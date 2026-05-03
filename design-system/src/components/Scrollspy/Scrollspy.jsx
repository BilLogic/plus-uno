import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Dropdown from '@/components/Dropdown';
import './Scrollspy.scss';

/** Y-offset of `el`'s top edge within `scrollContainer`'s scrollable content (any DOM nesting). */
function scrollOffsetTop(el, scrollContainer) {
    if (!el || !scrollContainer) return 0;
    const cRect = scrollContainer.getBoundingClientRect();
    const eRect = el.getBoundingClientRect();
    return scrollContainer.scrollTop + (eRect.top - cRect.top);
}

/** Section ids in scroll order (top-level links, then each dropdown target in order). */
function collectSectionIds(navItems) {
    const ids = [];
    navItems.forEach((item) => {
        if (item.isDropdown && item.dropdownItems?.length) {
            item.dropdownItems.forEach((d) => ids.push(d.href.replace('#', '')));
        } else if (item.href) {
            ids.push(item.href.replace('#', ''));
        }
    });
    return ids;
}

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
    const firstSectionId = items.length
        ? (items[0].isDropdown
            ? items[0].dropdownItems?.[0]?.href.replace('#', '')
            : items[0].href.replace('#', ''))
        : '';
    const [internalActiveId, setInternalActiveId] = useState(firstSectionId || '');
    const activeId = controlledActiveId !== undefined ? controlledActiveId : internalActiveId;
    const activeIdRef = useRef(activeId);
    activeIdRef.current = activeId;

    useEffect(() => {
        if (!contentId) return;

        const contentElement = document.getElementById(contentId);
        if (!contentElement) return;

        const handleScroll = () => {
            const probe = contentElement.scrollTop + offset;
            const sectionIds = collectSectionIds(items);

            let currentId = sectionIds[0];

            // Check sections in reverse to find the one we are currently in
            for (let i = sectionIds.length - 1; i >= 0; i--) {
                const sectionId = sectionIds[i];
                const section = document.getElementById(sectionId);

                if (section) {
                    const sectionTop = scrollOffsetTop(section, contentElement);
                    if (sectionTop <= probe) {
                        currentId = sectionId;
                        break;
                    }
                }
            }

            if (currentId !== activeIdRef.current) {
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
    }, [contentId, items, offset, controlledActiveId, onActivate]);

    const handleLinkClick = (e, href) => {
        e.preventDefault();
        const targetId = href.replace('#', '');
        const targetElement = document.getElementById(targetId);
        const contentElement = document.getElementById(contentId);

        if (targetElement && contentElement) {
            const top = scrollOffsetTop(targetElement, contentElement) - offset;
            contentElement.scrollTo({
                top: Math.max(0, top),
                behavior: 'smooth'
            });
            if (controlledActiveId === undefined) {
                setInternalActiveId(targetId);
            }
            if (onActivate) {
                onActivate(targetId);
            }
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
            <div className="plus-nav-list">
                {items.map((item, index) => {
                    if (item.isDropdown && item.dropdownItems?.length) {
                        const isDdActive = item.dropdownItems.some(
                            (d) => d.href.replace('#', '') === activeId
                        );
                        return (
                            <div
                                key={index}
                                className={`plus-nav-item plus-nav-item-dropdown ${isDdActive ? 'plus-nav-item-selected' : ''}`}
                            >
                                <Dropdown
                                    id={id ? `${id}-dropdown-${index}` : undefined}
                                    className={`plus-scrollspy-nav-dropdown ${isDdActive ? 'plus-scrollspy-nav-dropdown--active' : ''}`}
                                    style="default"
                                    fill="ghost"
                                    toggle={(
                                        <span className={`plus-nav-link ${isDdActive ? 'active' : ''}`}>
                                            <span className="plus-nav-text">{item.text}</span>
                                            <i className="fa-solid fa-caret-down plus-nav-dropdown-icon" aria-hidden />
                                        </span>
                                    )}
                                    items={item.dropdownItems.map((d) => ({
                                        text: d.text,
                                        onClick: (e) => handleLinkClick(e, d.href)
                                    }))}
                                />
                            </div>
                        );
                    }

                    const itemId = item.href.replace('#', '');
                    const isActive = activeId === itemId;

                    return (
                        <div key={index} className={`plus-nav-item ${isActive ? 'plus-nav-item-selected' : ''}`}>
                            <a
                                href={item.href}
                                className={`plus-nav-link ${isActive ? 'active' : ''}`}
                                onClick={(e) => handleLinkClick(e, item.href)}
                            >
                                <span className="plus-nav-text">{item.text}</span>
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
        href: PropTypes.string,
        isDropdown: PropTypes.bool,
        dropdownItems: PropTypes.arrayOf(PropTypes.shape({
            text: PropTypes.string.isRequired,
            href: PropTypes.string.isRequired
        }))
    })).isRequired,
    contentId: PropTypes.string, // ID of the content container
    offset: PropTypes.number,
    activeId: PropTypes.string,
    onActivate: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object
};

export default Scrollspy;
