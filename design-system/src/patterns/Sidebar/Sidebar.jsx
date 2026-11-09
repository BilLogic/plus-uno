import React, { useCallback, useEffect, useId, useState } from 'react';
import PropTypes from 'prop-types';
import { CountTag, Icon, IconButton, Logo, Tooltip } from '@/components';
import { useSidebarControl } from '../Frame/SidebarControl';
import SidebarAccount, { ACCOUNT_ROLES } from './SidebarAccount';
import { SIDEBAR_RECENT_TABS } from './openTabs';
import './Sidebar.scss';

/** Where collapsed section titles are remembered, per person: `<key>:<account id>`. */
export const SIDEBAR_SECTIONS_STORAGE_KEY = 'plus-sidebar-sections';

/** The tooltip and message of a section locked until assigned training is done. */
export const lockMessage = (title) => `Complete your assigned training to unlock the ${title}`;

/** What a Training row counts: assigned lessons, or onboarding modules while onboarding is in progress. */
export const trainingCount = (kind, { lessonsLeft = 0, modulesLeft = 0 }) => {
    if (kind === 'lessons' && lessonsLeft > 0) {
        return { count: lessonsLeft, label: `${lessonsLeft} assigned ${lessonsLeft === 1 ? 'lesson' : 'lessons'} left` };
    }
    if (kind === 'modules' && modulesLeft > 0) {
        return { count: modulesLeft, label: `${modulesLeft} onboarding ${modulesLeft === 1 ? 'module' : 'modules'} left` };
    }
    return null;
};

const readCollapsed = (key) => {
    if (!key || typeof window === 'undefined') return {};
    try {
        const value = JSON.parse(window.localStorage.getItem(key));
        return value && typeof value === 'object' ? value : {};
    } catch {
        return {};
    }
};

const writeCollapsed = (key, value) => {
    if (!key || typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Storage full or blocked: the sections still collapse, they just forget.
    }
};

/**
 * Sidebar pattern: the app's side navigation, 240 wide, padded 12, on the
 * sunken fill. Every row sits on one grid: rows 32 high from x 12 to 228 with
 * radius 6, a 24 icon slot centered on x 32, the label on x 48, and a trailing
 * slot centered on x 208.
 *
 * - **Logo row**: the PLUS Logo lockup at height 24, a link to Home, and the
 *   sidebar toggle (`angles-left`) on the trailing column. Inside a Frame the
 *   toggle comes from the Frame; standalone, pass `onToggle`.
 * - **Groups**: the first has no title (Home, Slack). Every other group has a
 *   title row, a full 32 row that collapses its group; an `angle-down` shows
 *   after the title on hover and focus and turns right while collapsed. Each
 *   person's collapsed sections are remembered in localStorage.
 * - **Locked group**: while `modulesLeft` is above 0, a group marked
 *   `lockedDuringOnboarding` shows a lock in the title's caret slot, its rows
 *   in the subtlest text with no hover, and the tooltip "Complete your assigned
 *   training to unlock the Toolkit" (no number). It neither collapses nor opens.
 * - **Training counts**: a row with `training: 'lessons'` shows the Count tag of
 *   `lessonsLeft` ("2 assigned lessons left"); `training: 'modules'` shows
 *   `modulesLeft` ("3 onboarding modules left"), only while onboarding is in
 *   progress. Zero shows nothing.
 * - **Trailing slot**: a count, a dot, the external icon for a link that
 *   leaves the app, or a close button.
 * - **Open tabs** (`tabs[item.id]`): records a person opened (a session, a
 *   student) list under their row on a thread, one line on the icon column
 *   whose last row turns into the label column. Each tab shows a live dot at
 *   rest and Close on hover, focus and while selected; Delete or Backspace
 *   closes the focused tab. Three show, then "Show n more". On hover the row's
 *   icon slot turns into a collapse angle and its trailing slot into Close all.
 *   Exactly one row is selected: a selected tab takes the fill and its row goes
 *   to ink; collapsed, the row takes the fill and shows the tab count.
 * - **Account row**: `SidebarAccount`, under a divider.
 *
 * Content is data. The pattern draws what it is given and never changes the
 * URL; which groups a role sees is the caller's config.
 */
const PatternSidebar = ({
    groups = [],
    activeId,
    onSelect,
    tabs = {},
    onSelectTab,
    onCloseTab,
    onCloseAllTabs,
    modulesLeft = 0,
    lessonsLeft = 0,
    account,
    onProfile,
    onSignOut,
    helpHref,
    homeHref = '/',
    onHome,
    onToggle,
    storageKey = SIDEBAR_SECTIONS_STORAGE_KEY,
    label = 'Main',
    id,
    className = '',
    style,
}) => {
    const baseId = useId();
    const control = useSidebarControl();
    const sectionsKey = storageKey && account?.id ? `${storageKey}:${account.id}` : null;
    const [shutGroups, setShutGroups] = useState(() => readCollapsed(sectionsKey));
    const [shutRows, setShutRows] = useState({});
    const [showingAll, setShowingAll] = useState({});

    // A different person has their own sections.
    useEffect(() => { setShutGroups(readCollapsed(sectionsKey)); }, [sectionsKey]);

    const toggleGroup = useCallback((groupId) => {
        setShutGroups((prev) => {
            const next = { ...prev, [groupId]: !prev[groupId] };
            if (!next[groupId]) delete next[groupId];
            writeCollapsed(sectionsKey, next);
            return next;
        });
    }, [sectionsKey]);

    const flip = (setter, key) => setter((prev) => ({ ...prev, [key]: !prev[key] }));

    // A row with tabs opens on its own when one of its tabs is selected.
    useEffect(() => {
        if (!activeId) return;
        const parent = Object.keys(tabs || {}).find((key) => tabs[key]?.some((tab) => tab.id === activeId));
        if (parent && shutRows[parent]) setShutRows((prev) => ({ ...prev, [parent]: false }));
        // Only a change of selection opens it; collapsing by hand must stick.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeId]);

    const toggleButton = control ? (
        <IconButton
            className="plus-pattern-sidebar__toggle"
            appearance="subtle"
            icon="angles-left"
            label="Close sidebar"
            tooltip="Close sidebar · Ctrl ["
            aria-expanded
            {...control.closeProps}
        />
    ) : onToggle ? (
        <IconButton
            className="plus-pattern-sidebar__toggle"
            appearance="subtle"
            icon="angles-left"
            label="Close sidebar"
            tooltip="Close sidebar · Ctrl ["
            aria-expanded
            aria-keyshortcuts="Control+[ Meta+["
            onClick={onToggle}
        />
    ) : null;

    const trailing = (item, extra) => {
        const training = trainingCount(item.training, { lessonsLeft, modulesLeft });
        if (extra) return <span className="plus-pattern-sidebar__end">{extra}</span>;
        if (training) {
            return (
                <span className="plus-pattern-sidebar__end">
                    <CountTag value={training.count} spacing="compact" label={training.label} />
                </span>
            );
        }
        if (item.count) {
            return (
                <span className="plus-pattern-sidebar__end">
                    <CountTag value={item.count} spacing="compact" label={item.countLabel} />
                </span>
            );
        }
        if (item.dot) {
            return (
                <span className="plus-pattern-sidebar__end">
                    <CountTag isDot appearance="info" label={item.dotLabel ?? 'New'} />
                </span>
            );
        }
        if (item.external) {
            return (
                <span className="plus-pattern-sidebar__end plus-pattern-sidebar__end--icon" aria-hidden="true">
                    <Icon name="arrow-up-right-from-square" />
                </span>
            );
        }
        return null;
    };

    const rowContent = (item, extra) => (
        <>
            <span className="plus-pattern-sidebar__slot" aria-hidden="true">
                {item.icon ? <Icon name={item.icon} /> : null}
            </span>
            <span className="plus-pattern-sidebar__label">{item.text}</span>
            {item.external ? <span className="visually-hidden">(opens in a new tab)</span> : null}
            {trailing(item, extra)}
        </>
    );

    /** A row: a link with `href`, else a button. A plain function, so a Tooltip's ref lands on the element. */
    const renderRow = ({ item, rowClass, current, onPress, extra, ...rest }) => {
        const shared = {
            className: rowClass,
            'aria-current': current ? 'page' : undefined,
            ...rest,
        };
        if (item.href && !rest['aria-disabled']) {
            return (
                <a
                    {...shared}
                    href={item.href}
                    target={item.external ? '_blank' : undefined}
                    rel={item.external ? 'noopener noreferrer' : undefined}
                    onClick={(event) => {
                        // A plain click stays in the app; a modified click is the browser's.
                        if (item.external || !onPress) return;
                        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                        event.preventDefault();
                        onPress();
                    }}
                >
                    {rowContent(item, extra)}
                </a>
            );
        }
        return (
            <button type="button" {...shared} onClick={rest['aria-disabled'] ? undefined : onPress}>
                {rowContent(item, extra)}
            </button>
        );
    };

    const tabRow = (item, tab, last) => {
        const selected = activeId === tab.id;
        const close = () => onCloseTab?.(tab, item);
        // Delete and Backspace close the focused tab; focus moves to the next
        // tab, else the one before it, else the tab's row.
        const onKeyDown = (event) => {
            if (event.key !== 'Delete' && event.key !== 'Backspace') return;
            if (event.target.closest('.plus-pattern-sidebar__tab-close')) return;
            event.preventDefault();
            const li = event.currentTarget;
            const rowIn = (el) => (el?.matches('.plus-pattern-sidebar__tab') ? el.querySelector('.plus-pattern-sidebar__row') : null);
            const sibling = rowIn(li.nextElementSibling) ?? rowIn(li.previousElementSibling);
            const parent = li.closest('.plus-pattern-sidebar__item');
            close();
            requestAnimationFrame(() => {
                const target = sibling?.isConnected ? sibling : parent?.querySelector('.plus-pattern-sidebar__row');
                target?.focus();
            });
        };
        const row = (
            renderRow({
                item: { id: tab.id, text: tab.label, href: tab.href },
                rowClass: ['plus-pattern-sidebar__row', selected && 'plus-pattern-sidebar__row--selected'].filter(Boolean).join(' '),
                current: selected,
                onPress: () => onSelectTab?.(tab, item),
                extra: tab.live ? <CountTag isDot appearance="success" label="Live" /> : undefined,
            })
        );
        return (
            <li
                key={tab.id}
                className={['plus-pattern-sidebar__tab', last && 'plus-pattern-sidebar__tab--last', selected && 'plus-pattern-sidebar__tab--selected'].filter(Boolean).join(' ')}
                onKeyDown={onKeyDown}
            >
                {tab.tooltip ? <Tooltip text={tab.tooltip} placement="right">{row}</Tooltip> : row}
                <IconButton
                    className="plus-pattern-sidebar__tab-close"
                    appearance="subtle"
                    spacing="compact"
                    icon="xmark"
                    label={`Close ${tab.label}`}
                    tooltip="Close tab"
                    onClick={close}
                />
            </li>
        );
    };

    const renderItem = (item, locked, message) => {
        const own = locked || item.external ? [] : (tabs?.[item.id] ?? []);
        const rowSelected = activeId === item.id;
        const select = item.external ? undefined : () => onSelect?.(item.id, item);

        if (locked) {
            return (
                <li key={item.id} className="plus-pattern-sidebar__item">
                    <Tooltip text={message} placement="right">
                        {renderRow({
                            item,
                            rowClass: 'plus-pattern-sidebar__row plus-pattern-sidebar__row--locked',
                            'aria-disabled': 'true',
                        })}
                    </Tooltip>
                </li>
            );
        }

        if (!own.length) {
            return (
                <li key={item.id} className="plus-pattern-sidebar__item">
                    {renderRow({
                        item,
                        rowClass: ['plus-pattern-sidebar__row', rowSelected && 'plus-pattern-sidebar__row--selected'].filter(Boolean).join(' '),
                        current: rowSelected,
                        onPress: select,
                    })}
                </li>
            );
        }

        const listId = `${baseId}-${item.id}-tabs`;
        const shut = Boolean(shutRows[item.id]);
        const tabSelected = own.some((tab) => tab.id === activeId);
        // Exactly one selected row: collapsed with its tab selected, the row stands in for the tab.
        const standsIn = shut && tabSelected;
        const all = Boolean(showingAll[item.id]);
        const more = own.length - SIDEBAR_RECENT_TABS;
        const recent = all || more <= 0 ? own : own.slice(0, SIDEBAR_RECENT_TABS);
        // The selected tab always shows, even when it is past the first three.
        const selectedTab = own.find((tab) => tab.id === activeId);
        const shown = selectedTab && !recent.includes(selectedTab) ? [...recent, selectedTab] : recent;
        const rowClass = [
            'plus-pattern-sidebar__row',
            (rowSelected || standsIn) && 'plus-pattern-sidebar__row--selected',
            !shut && tabSelected && 'plus-pattern-sidebar__row--ancestor',
        ].filter(Boolean).join(' ');

        return (
            <li key={item.id} className="plus-pattern-sidebar__item plus-pattern-sidebar__item--parent">
                <div className={['plus-pattern-sidebar__parent', shut && 'plus-pattern-sidebar__parent--shut'].filter(Boolean).join(' ')}>
                    {renderRow({
                        item,
                        rowClass,
                        current: rowSelected || standsIn,
                        onPress: select,
                        extra: shut ? <CountTag value={own.length} spacing="compact" label={`${own.length} open tabs`} /> : undefined,
                    })}
                    <IconButton
                        className="plus-pattern-sidebar__twist"
                        appearance="subtle"
                        spacing="compact"
                        icon="angle-down"
                        label={`${shut ? 'Show' : 'Hide'} ${item.text} tabs`}
                        tooltip={shut ? 'Show tabs' : 'Hide tabs'}
                        aria-expanded={!shut}
                        aria-controls={shut ? undefined : listId}
                        onClick={() => flip(setShutRows, item.id)}
                    />
                    <IconButton
                        className="plus-pattern-sidebar__close-all"
                        appearance="subtle"
                        spacing="compact"
                        icon="xmark"
                        label={`Close all ${own.length} ${item.text.toLowerCase()} tabs`}
                        tooltip={`Close all ${own.length} tabs`}
                        onClick={() => onCloseAllTabs?.(item)}
                    />
                </div>
                {shut ? null : (
                    <ul id={listId} className="plus-pattern-sidebar__tabs" aria-label={`Open ${item.text}`}>
                        {shown.map((tab, index) => tabRow(item, tab, more <= 0 && index === shown.length - 1))}
                        {more > 0 ? (
                            <li className="plus-pattern-sidebar__tab plus-pattern-sidebar__tab--last plus-pattern-sidebar__tab--more">
                                <button
                                    type="button"
                                    className="plus-pattern-sidebar__row"
                                    aria-expanded={all}
                                    onClick={() => flip(setShowingAll, item.id)}
                                >
                                    <span className="plus-pattern-sidebar__slot" aria-hidden="true" />
                                    <span className="plus-pattern-sidebar__label">{all ? 'Show less' : `Show ${more} more`}</span>
                                </button>
                            </li>
                        ) : null}
                    </ul>
                )}
            </li>
        );
    };

    const renderGroup = (group) => {
        const titleId = `${baseId}-${group.id}-title`;
        const listId = `${baseId}-${group.id}-list`;
        const locked = Boolean(group.lockedDuringOnboarding) && modulesLeft > 0;
        const message = locked ? lockMessage(group.title) : null;
        const shut = Boolean(group.title) && !locked && Boolean(shutGroups[group.id]);

        let title = null;
        if (group.title && locked) {
            title = (
                <div className="plus-pattern-sidebar__title plus-pattern-sidebar__title--locked">
                    <span id={titleId} className="plus-pattern-sidebar__title-text">{group.title}</span>
                    <Tooltip text={message} placement="right">
                        {/* The lock is focusable so a keyboard reaches its message. */}
                        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
                        <span className="plus-pattern-sidebar__caret plus-pattern-sidebar__caret--lock" tabIndex={0} role="img" aria-label={`Locked. ${message}`}>
                            <Icon name="lock" />
                        </span>
                    </Tooltip>
                </div>
            );
        } else if (group.title) {
            title = (
                <button
                    type="button"
                    className={['plus-pattern-sidebar__title', shut && 'plus-pattern-sidebar__title--shut'].filter(Boolean).join(' ')}
                    aria-expanded={!shut}
                    aria-controls={shut ? undefined : listId}
                    onClick={() => toggleGroup(group.id)}
                >
                    <span id={titleId} className="plus-pattern-sidebar__title-text">{group.title}</span>
                    <span className="plus-pattern-sidebar__caret" aria-hidden="true">
                        <Icon name="angle-down" />
                    </span>
                </button>
            );
        }

        return (
            <div
                key={group.id}
                className="plus-pattern-sidebar__group"
                role={group.title ? 'group' : undefined}
                aria-labelledby={group.title ? titleId : undefined}
            >
                {title}
                {shut ? null : (
                    <ul id={listId} className="plus-pattern-sidebar__list">
                        {group.items.map((item) => renderItem(item, locked, message))}
                    </ul>
                )}
            </div>
        );
    };

    const brand = onHome ? (
        <a
            className="plus-pattern-sidebar__brand"
            href={homeHref}
            aria-label="PLUS, go to Home"
            onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                event.preventDefault();
                onHome();
            }}
        >
            <Logo appearance="colored" size={24} wordmark />
        </a>
    ) : (
        <a className="plus-pattern-sidebar__brand" href={homeHref} aria-label="PLUS, go to Home">
            <Logo appearance="colored" size={24} wordmark />
        </a>
    );

    return (
        <div id={id} className={['plus-pattern-sidebar', className].filter(Boolean).join(' ')} style={style}>
            <div className="plus-pattern-sidebar__logo-row">
                {brand}
                {toggleButton}
            </div>
            <nav aria-label={label} className="plus-pattern-sidebar__nav">
                {groups.map(renderGroup)}
            </nav>
            {account ? (
                <SidebarAccount
                    name={account.name}
                    preferredName={account.preferredName}
                    role={account.role}
                    onProfile={onProfile}
                    onSignOut={onSignOut}
                    helpHref={helpHref}
                />
            ) : null}
        </div>
    );
};

const itemShape = PropTypes.shape({
    /** Unique id; `activeId`, `onSelect` and `tabs` use it */
    id: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    /** Font Awesome Free name for the 16 icon (`house`), drawn by Icon; a brand logo carries its family (`fa-brands fa-slack`) */
    icon: PropTypes.string,
    /** Makes the row a link */
    href: PropTypes.string,
    /** With `href`: leaves the app in a new tab, never selected; the trailing slot shows the external icon */
    external: PropTypes.bool,
    /** A count in the trailing slot */
    count: PropTypes.number,
    /** The count's accessible name, e.g. "3 open flags" */
    countLabel: PropTypes.string,
    /** A dot in the trailing slot: something new */
    dot: PropTypes.bool,
    /** The dot's accessible name; "New" by default */
    dotLabel: PropTypes.string,
    /** A Training row: `lessons` counts `lessonsLeft`, `modules` counts `modulesLeft` */
    training: PropTypes.oneOf(['lessons', 'modules']),
});

const tabShape = PropTypes.shape({
    /** Unique across the sidebar; `activeId` selects it */
    id: PropTypes.string.isRequired,
    /** Short: time · teacher for a session (the day only when it is not today), the name for a student. It truncates. */
    label: PropTypes.string.isRequired,
    /** The longer name, in the tooltip (the school) */
    tooltip: PropTypes.string,
    /** The record's own route; the row links to it */
    href: PropTypes.string,
    /** A session happening now: the live dot at rest */
    live: PropTypes.bool,
});

PatternSidebar.propTypes = {
    /** The groups, in order. The first usually has no title (Home, Slack). */
    groups: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        /** The section title; a group without one has no title row and never collapses */
        title: PropTypes.string,
        items: PropTypes.arrayOf(itemShape).isRequired,
        /** Locked while `modulesLeft` is above 0 */
        lockedDuringOnboarding: PropTypes.bool,
    })),
    /** Id of the selected row or tab; it carries `aria-current="page"` */
    activeId: PropTypes.string,
    /** Called with `(id, item)` when a row other than an external link is pressed */
    onSelect: PropTypes.func,
    /** Open tabs by row id, in the order they show */
    tabs: PropTypes.objectOf(PropTypes.arrayOf(tabShape)),
    /** Called with `(tab, item)` on a plain click of a tab */
    onSelectTab: PropTypes.func,
    /** Called with `(tab, item)` by a tab's Close and by Delete or Backspace */
    onCloseTab: PropTypes.func,
    /** Called with `(item)` by a row's Close all */
    onCloseAllTabs: PropTypes.func,
    /** Onboarding modules a tutor has left. Above 0, groups marked `lockedDuringOnboarding` lock, and the `modules` row counts it. */
    modulesLeft: PropTypes.number,
    /** Assigned lessons a tutor has left; the `lessons` row counts it */
    lessonsLeft: PropTypes.number,
    /** The signed-in person, for the account row. Their `id` keys the remembered sections. */
    account: PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string.isRequired,
        preferredName: PropTypes.string,
        role: PropTypes.oneOf(ACCOUNT_ROLES).isRequired,
    }),
    /** The account menu's Profile */
    onProfile: PropTypes.func,
    /** The account menu's Sign out */
    onSignOut: PropTypes.func,
    /** Help Center, opened in a new tab */
    helpHref: PropTypes.string,
    /** Where the logo goes */
    homeHref: PropTypes.string,
    /** Called on a plain click of the logo; the caller goes Home */
    onHome: PropTypes.func,
    /** Standalone: the toggle's press. Inside a Frame the Frame draws the toggle's state. */
    onToggle: PropTypes.func,
    /** The localStorage key collapsed sections are kept under, per account id; null keeps nothing */
    storageKey: PropTypes.string,
    /** Accessible name of the `nav` landmark */
    label: PropTypes.string,
    id: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object,
};

export default PatternSidebar;
