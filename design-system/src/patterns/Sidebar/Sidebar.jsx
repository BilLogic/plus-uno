import React, { useEffect, useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Count, Divider, SidebarTab } from '@/components';
import { SIDEBAR_RECENT_TABS } from './openTabs';
import './Sidebar.scss';

/**
 * Sidebar pattern: the foundation side navigation. Mirrors the Figma
 * `_Sidebar`, `_Sidebar section` and `_Sidebar open tab` parts in Patterns ›
 * Surface container.
 *
 * - **Header**: a slot that stays put, for the logo.
 * - **Body**: the top-level items (Home), then sections. It scrolls inside the
 *   sidebar when it outgrows the frame; the header does not.
 * - **Section**: a 12 semibold group label, its items, and an optional divider.
 *   The label names a `role="group"` through `aria-labelledby`. It is not a
 *   heading, so the sidebar adds nothing to the page's heading outline.
 * - **Item**: a `SidebarTab` — 32 high, a 16 icon, a label that truncates, and
 *   the `description`, `elemAfter` and `actionsOnHover` slots.
 * - **Open tabs**: records a person has opened (a session, a student), listed
 *   under the item they belong to (`openTabs[item.id]`, most recent first). The
 *   item becomes an accordion: a chevron (a disclosure button, with
 *   `aria-expanded` and `aria-controls`) shows and hides them, and the list opens
 *   on its own when a tab is opened. The label still opens the item's own page.
 *   Each tab is a `SidebarTab` indented 12, with an optional "Live" dot and × on
 *   hover; Delete or Backspace closes the focused tab. The parent shows "Close
 *   all" on hover. Past 5 tabs a "Show N more" row expands the rest.
 *
 * Content is data: one array of items and one of sections. The pattern draws
 * whatever it is given; which items a role sees is the caller's config. The open
 * tabs come from the caller too (`useOpenTabs()` keeps them), and the pattern
 * never changes the URL.
 */
const PatternSidebar = ({
    header,
    items = [],
    sections = [],
    activeId,
    onSelect,
    openTabs = {},
    onTabSelect,
    onTabClose,
    onTabsCloseAll,
    label = 'Main',
    id,
    className = '',
    style,
}) => {
    const baseId = useId();
    const [collapsed, setCollapsed] = useState(() => new Set());
    const [showingAll, setShowingAll] = useState(() => new Set());
    const toggleIn = (setter, key) => setter((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
    });

    // A parent opens on its own when one of its tabs is opened or brought to the
    // front: a tab newer than any it had, or more tabs than it had. Closing one
    // is neither, so it leaves a collapsed parent collapsed.
    const seen = useRef({});
    useEffect(() => {
        const opened = [];
        for (const [parentId, tabs] of Object.entries(openTabs || {})) {
            const count = tabs?.length ?? 0;
            const newest = Math.max(0, ...(tabs ?? []).map((tab) => tab.openedAt ?? 0));
            const before = seen.current[parentId];
            if (before && (newest > before.newest || count > before.count)) opened.push(parentId);
            seen.current[parentId] = { newest: Math.max(newest, before?.newest ?? 0), count };
        }
        if (opened.length) {
            setCollapsed((prev) => {
                if (!opened.some((key) => prev.has(key))) return prev;
                const next = new Set(prev);
                opened.forEach((key) => next.delete(key));
                return next;
            });
        }
    }, [openTabs]);

    const tabRow = (item, tab) => {
        const close = () => onTabClose?.(tab, item);

        // Delete and Backspace close the focused tab. Focus moves to the next
        // tab, else the one before it, else the parent's row.
        const onKeyDown = (event) => {
            if (event.key !== 'Delete' && event.key !== 'Backspace') return;
            event.preventDefault();
            const li = event.currentTarget;
            const rowIn = (el) => (el?.matches('.plus-pattern-sidebar__tab') ? el.querySelector('.plus-sidebar-tab') : null);
            const sibling = rowIn(li.nextElementSibling) ?? rowIn(li.previousElementSibling);
            // The parent's `li` outlives its row: closing the last tab redraws
            // the row without the accordion, so it is found again afterwards.
            const parent = li.closest('.plus-pattern-sidebar__item');
            close();
            requestAnimationFrame(() => {
                const target = sibling?.isConnected ? sibling : parent?.querySelector('.plus-sidebar-tab');
                target?.focus();
            });
        };

        const select = (event) => {
            if (!onTabSelect) return;
            // A plain click stays in the app. A modified click is the browser's
            // (a new browser tab), since the row is a link to the record.
            if (event && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
            event?.preventDefault();
            onTabSelect(tab, item);
        };

        return (
            <li key={tab.id} className="plus-pattern-sidebar__tab" onKeyDown={onKeyDown}>
                <SidebarTab
                    text={tab.title}
                    leadingVisual={false}
                    href={tab.href}
                    state={activeId === tab.id ? 'selected' : 'enabled'}
                    elemAfter={tab.status === 'live' ? <Count appearance="dot" style="success" label="Live" /> : undefined}
                    actionsOnHover={(
                        <Button
                            style="default"
                            fill="ghost"
                            size="small"
                            leadingVisual="xmark"
                            aria-label={`Close ${tab.title}`}
                            onClick={close}
                        />
                    )}
                    onClick={select}
                />
            </li>
        );
    };

    const renderItem = (item) => {
        const select = item.external ? undefined : () => onSelect?.(item.id, item);
        const tabs = item.external || item.disabled ? [] : (openTabs?.[item.id] ?? []);
        const row = (extra) => (
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
                {...extra}
            />
        );

        if (!tabs.length) {
            return <li key={item.id} className="plus-pattern-sidebar__item">{row()}</li>;
        }

        const listId = `${baseId}-${item.id}-tabs`;
        const expanded = !collapsed.has(item.id);
        const all = showingAll.has(item.id);
        const more = tabs.length - SIDEBAR_RECENT_TABS;
        const recent = all || more <= 0 ? tabs : tabs.slice(0, SIDEBAR_RECENT_TABS);
        // The selected tab always shows, even when it is older than the five.
        const selectedTab = tabs.find((tab) => tab.id === activeId);
        const shown = selectedTab && !recent.includes(selectedTab) ? [...recent, selectedTab] : recent;
        // A collapsed parent stands in for its selected tab, so something is selected.
        const parentSelected = activeId === item.id || (!expanded && Boolean(selectedTab));

        return (
            <li key={item.id} className="plus-pattern-sidebar__item plus-pattern-sidebar__item--parent">
                <div className="plus-pattern-sidebar__parent">
                    {row({
                        state: item.disabled ? 'disabled' : (parentSelected ? 'selected' : 'enabled'),
                        actionsOnHover: (
                            <>
                                {item.actionsOnHover}
                                <Button
                                style="default"
                                fill="ghost"
                                size="small"
                                text="Close all"
                                aria-label={`Close all ${item.text} tabs`}
                                onClick={() => onTabsCloseAll?.(item)}
                                />
                            </>
                        ),
                    })}
                    <span className="plus-pattern-sidebar__chevron">
                        <Button
                            style="default"
                            fill="ghost"
                            size="small"
                            leadingVisual={expanded ? 'chevron-down' : 'chevron-right'}
                            aria-label={`${item.text} tabs`}
                            aria-expanded={expanded}
                            aria-controls={listId}
                            onClick={() => toggleIn(setCollapsed, item.id)}
                        />
                    </span>
                </div>
                <ul
                    id={listId}
                    className="plus-pattern-sidebar__list plus-pattern-sidebar__tabs"
                    aria-label={`Open ${item.text}`}
                    hidden={!expanded}
                >
                    {shown.map((tab) => tabRow(item, tab))}
                    {more > 0 ? (
                        <li className="plus-pattern-sidebar__more">
                            <SidebarTab
                                text={all ? 'Show fewer' : `Show ${more} more`}
                                leadingVisual={false}
                                onClick={() => toggleIn(setShowingAll, item.id)}
                            />
                        </li>
                    ) : null}
                </ul>
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
    /** Unique id; `activeId`, `onSelect` and `openTabs` use it */
    id: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    /** Font Awesome Free solid name for the 16 icon */
    icon: PropTypes.string,
    description: PropTypes.node,
    /** A count, badge or status at the end of the row */
    elemAfter: PropTypes.node,
    /** Controls shown on hover and focus. An item with open tabs adds "Close all" after them. */
    actionsOnHover: PropTypes.node,
    /** Makes the row a link */
    href: PropTypes.string,
    /** With `href`: opens a new tab and is never selected */
    external: PropTypes.bool,
    disabled: PropTypes.bool,
});

const openTabShape = PropTypes.shape({
    /** Unique across the sidebar; `activeId` selects it */
    id: PropTypes.string.isRequired,
    /** The record's name. It truncates. */
    title: PropTypes.string.isRequired,
    /** The record's own route; the row links to it */
    href: PropTypes.string,
    /** `live` draws the green Live dot, named "Live" */
    status: PropTypes.oneOf(['live']),
    /** Bigger is newer. When the newest changes, the parent opens. */
    openedAt: PropTypes.number,
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
    /** Id of the selected item or open tab; it carries `aria-current="page"` */
    activeId: PropTypes.string,
    /** Called with `(id, item)` when an item other than an external link is pressed */
    onSelect: PropTypes.func,
    /** Open tabs by parent item id, most recent first. `useOpenTabs().byParent` is this shape. */
    openTabs: PropTypes.objectOf(PropTypes.arrayOf(openTabShape)),
    /** Called with `(tab, item)` on a plain click of a tab; the caller shows the record. Without it the row is a plain link. */
    onTabSelect: PropTypes.func,
    /** Called with `(tab, item)` by the tab's × and by Delete or Backspace */
    onTabClose: PropTypes.func,
    /** Called with `(item)` by the parent's "Close all" */
    onTabsCloseAll: PropTypes.func,
    /** Accessible name of the `nav` landmark */
    label: PropTypes.string,
    id: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object,
};

export default PatternSidebar;
