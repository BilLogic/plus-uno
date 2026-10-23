import React, { useId } from 'react';
import PropTypes from 'prop-types';
import { Divider, SidebarTab } from '@/components';
import './Sidebar.scss';

/**
 * Sidebar pattern: the foundation side navigation. Mirrors the Figma
 * `_Sidebar` and `_Sidebar section` parts in Patterns › Surface container.
 *
 * - **Header**: a slot that stays put, for the logo.
 * - **Body**: the top-level items (Home), then sections. It scrolls inside the
 *   sidebar when it outgrows the frame; the header does not.
 * - **Section**: a 12 semibold group label, its items, and an optional divider.
 *   The label names a `role="group"` through `aria-labelledby`. It is not a
 *   heading, so the sidebar adds nothing to the page's heading outline.
 * - **Item**: a `SidebarTab` — 32 high, a 16 icon, a label that truncates, and
 *   the `description`, `elemAfter` and `actionsOnHover` slots.
 *
 * Content is data: one array of items and one of sections. The pattern draws
 * whatever it is given; which items a role sees is the caller's config.
 */
const PatternSidebar = ({
    header,
    items = [],
    sections = [],
    activeId,
    onSelect,
    label = 'Main',
    id,
    className = '',
    style,
}) => {
    const baseId = useId();

    const renderItem = (item) => {
        const select = item.external ? undefined : () => onSelect?.(item.id, item);
        return (
            <li key={item.id} className="plus-pattern-sidebar__item">
                <SidebarTab
                    text={item.text}
                    icon={item.icon}
                    description={item.description}
                    elemAfter={item.elemAfter}
                    actionsOnHover={item.actionsOnHover}
                    href={item.href}
                    external={item.external}
                    state={item.disabled ? 'disabled' : (activeId === item.id ? 'selected' : 'enabled')}
                    onClick={select}
                />
            </li>
        );
    };

    const list = (entries) => (
        <ul className="plus-pattern-sidebar__list">{entries.map(renderItem)}</ul>
    );

    return (
        <nav
            id={id}
            aria-label={label}
            className={['plus-pattern-sidebar', className].filter(Boolean).join(' ')}
            style={style}
        >
            {header ? <div className="plus-pattern-sidebar__header">{header}</div> : null}
            <div className="plus-pattern-sidebar__body">
                {items.length ? list(items) : null}
                {sections.map((section) => {
                    const labelId = `${baseId}-${section.id}`;
                    return (
                        <React.Fragment key={section.id}>
                            <div
                                role="group"
                                aria-labelledby={labelId}
                                className="plus-pattern-sidebar__section"
                            >
                                <div id={labelId} className="plus-pattern-sidebar__section-label">
                                    {section.title}
                                </div>
                                {list(section.items)}
                            </div>
                            {section.divider ? <Divider size="sm" className="plus-pattern-sidebar__divider" /> : null}
                        </React.Fragment>
                    );
                })}
            </div>
        </nav>
    );
};

const itemShape = PropTypes.shape({
    /** Unique id; `activeId` and `onSelect` use it */
    id: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    /** Font Awesome Free solid name for the 16 icon */
    icon: PropTypes.string,
    description: PropTypes.node,
    /** A count, badge or status at the end of the row */
    elemAfter: PropTypes.node,
    /** Controls shown on hover and focus */
    actionsOnHover: PropTypes.node,
    /** Makes the row a link */
    href: PropTypes.string,
    /** With `href`: opens a new tab and is never selected */
    external: PropTypes.bool,
    disabled: PropTypes.bool,
});

PatternSidebar.propTypes = {
    /** Header slot that stays put while the body scrolls: the logo */
    header: PropTypes.node,
    /** Top-level items above the sections, e.g. Home */
    items: PropTypes.arrayOf(itemShape),
    /** Sections: a group label, its items, and an optional divider after them */
    sections: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        /** The group label, 12 semibold */
        title: PropTypes.string.isRequired,
        items: PropTypes.arrayOf(itemShape).isRequired,
        /** Draw a divider after the section */
        divider: PropTypes.bool,
    })),
    /** Id of the selected item; it carries `aria-current="page"` */
    activeId: PropTypes.string,
    /** Called with `(id, item)` when an item other than an external link is pressed */
    onSelect: PropTypes.func,
    /** Accessible name of the `nav` landmark */
    label: PropTypes.string,
    id: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object,
};

export default PatternSidebar;
