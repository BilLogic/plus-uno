import React, { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { animate } from 'motion/react';
import { Collapsible } from '@base-ui/react/collapsible';
import { SPRINGS } from '@/tokens/ladder/springs.generated.js';
import { ClippedTooltip } from '@/lib/ClippedTooltip';
import { useMotionReduced } from '@/lib/motionPreference';
import { measureRelativeBox } from '@/lib/navigationMotion';
import Button from '../../forms-and-inputs/Button';
import CountTag from '../../labels/CountTag';
import DropdownMenu, { ButtonItem } from '../../forms-and-inputs/DropdownMenu';
import Icon from '../../images-and-icons/Icon';
import IconButton from '../../forms-and-inputs/IconButton';
import Logo from '../../images-and-icons/Logo';
import Tooltip from '../../overlays-and-layering/Tooltip';
import { useSidebarControl } from '@/lib/sidebarControl';
import SidebarAccount, { ACCOUNT_ROLES } from './SidebarAccount';
import { clearOpenTabs, SIDEBAR_RECENT_TABS, useOpenTabs } from './openTabs';
import { sidebarGroups } from './sidebarConfig';
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
 * The PLUS sidebar: the app's navigation, 240 wide, padded 12, on the
 * sunken fill. Every row sits on one grid: rows 32 high from x 12 to 228 with
 * radius 8, a 24 icon slot centered on x 32, the label on x 48, and a trailing
 * slot centered on x 208.
 *
 * By default it fills with the groups for `user` (`sidebarConfig.js`, defaulting
 * to `'tutor'`), the signed-in person's account row, and open tabs from
 * `useOpenTabs()`. Pass `user` and `groups` together to add or override a
 * prototype's own area(s) by `id` while keeping the role's navigation; pass
 * `groups` without `user` (and/or `tabs`) to render custom groups directly.
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
 * - **Open tabs** (`useOpenTabs()` or `tabs[item.id]`): records a person
 *   opened (a session, a student) list under their row on a thread, one line
 *   on the icon column whose last row turns into the label column. Each tab
 *   shows a live dot at rest and Close on hover, focus and while selected;
 *   Delete or Backspace closes the focused tab. Three show, then "Show n more".
 *   On hover the row's icon slot turns into a collapse angle and its trailing
 *   slot into Close all. Exactly one row is selected: a selected tab takes the
 *   fill and its row goes to ink; collapsed, the row takes the fill and shows
 *   the tab count.
 * - **Icons**: every row icon is outlined (Font Awesome Free regular) in the
 *   one subtle icon color. A selected row shows the fill and the selected icon
 *   color, never a solid icon; a brand mark (`fa-brands fa-slack`) is the only
 *   exception.
 * - **Inner mode**: pass `inner` and the Sidebar's content swaps for an inner
 *   sidebar: one full-width Back button (`onBack`) with the area name centered,
 *   an optional full-width context dropdown (`inner.switcher`), then text-only
 *   rows (`inner.rows`: a record's stages, or a task's steps). The container,
 *   logo row and account row stay still; only the content swaps. The old
 *   content leaves at once and the new enters as one block, sliding 12 on
 *   `spatial.fast` from the end going in and from the start going back, and
 *   fading on `appearance.fast`, with no overshoot. Reduced motion keeps only
 *   the fade. Back shows the main Sidebar, where what was left sits as one open
 *   row (`tabs`) under its area.
 * - **Account row**: `SidebarAccount`, under a divider: the account menu (Profile,
 *   Help Center, Sign out) and, at the end, the Inbox bell with its unread count.
 *
 * Content is data. Nothing here changes the URL.
 */
const Sidebar = ({
    user,
    groups,
    activeId,
    activeTabId,
    onSelect,
    onHomeClick,
    onTabClick,
    onOpenTabSelect,
    tabs,
    onSelectTab,
    onCloseTab,
    onCloseAllTabs,
    modulesLeft = 0,
    lessonsLeft = 0,
    countTags,
    account,
    onProfile,
    onSignOut,
    helpHref,
    inboxCount,
    isInboxOpen,
    onInbox,
    homeHref = '/',
    slackUrl,
    onHome,
    onToggle,
    inner,
    onBack,
    storageKey = SIDEBAR_SECTIONS_STORAGE_KEY,
    label = 'Main',
    visible = true,
    id,
    className = '',
    style,
}) => {
    const baseId = useId();
    const control = useSidebarControl();
    const openTabs = useOpenTabs();
    const reduced = useMotionReduced();
    const navRef = useRef(null);
    const swapRef = useRef(null);
    const swapModeRef = useRef(inner ? 'inner' : 'main');
    const reducedRef = useRef(reduced);
    reducedRef.current = reduced;
    const glideRef = useRef(null);
    const mountedRef = useRef(false);
    const lastRowRef = useRef(null);
    const glideAnimRef = useRef(null);
    const sectionsKey = storageKey && account?.id ? `${storageKey}:${account.id}` : null;
    const [shutGroups, setShutGroups] = useState(() => readCollapsed(sectionsKey));
    const [shutRows, setShutRows] = useState({});
    const [showingAll, setShowingAll] = useState({});

    const resolvedGroups = useMemo(() => {
        if (groups === undefined) {
            return sidebarGroups(user ?? 'tutor', { slackUrl, countTags });
        }
        if (user !== undefined) {
            return sidebarGroups(user, { slackUrl, countTags, groups });
        }
        return groups;
    }, [groups, user, slackUrl, countTags]);

    const resolvedTabs = useMemo(() => {
        if (tabs !== undefined) return tabs;
        return Object.fromEntries(Object.entries(openTabs.byParent).map(([parentId, list]) => [
            parentId,
            list.map((tab) => ({ ...tab, label: tab.title, live: tab.status === 'live' })),
        ]));
    }, [tabs, openTabs.byParent]);

    const isRoleConfigured = groups === undefined || user !== undefined;
    const resolvedActiveId = useMemo(() => {
        if (activeId !== undefined) return activeId;
        if (activeTabId !== undefined || isRoleConfigured) {
            const page = activeTabId || 'home';
            const selectedTab = openTabs.tabs.find((tab) => tab.id === openTabs.selectedId);
            return selectedTab && selectedTab.parentId === page ? selectedTab.id : page;
        }
        return undefined;
    }, [activeId, activeTabId, isRoleConfigured, openTabs.tabs, openTabs.selectedId]);

    const effectiveModulesLeft = user === 'supervisor' ? 0 : modulesLeft;
    const effectiveLessonsLeft = user === 'supervisor' ? 0 : lessonsLeft;

    useLayoutEffect(() => {
        const navEl = navRef.current;
        const glideEl = glideRef.current;
        if (!navEl || !glideEl || !visible) return undefined;
        const activeEl = navEl.querySelector('[aria-current="page"]');
        const readRow = (el) => {
            const box = measureRelativeBox(el, navEl);
            return box
                ? { id: resolvedActiveId, x: box.x, y: box.y + navEl.scrollTop, width: box.width, height: box.height }
                : null;
        };
        if (!activeEl) {
            lastRowRef.current = null;
            return undefined;
        }
        if (!mountedRef.current) {
            mountedRef.current = true;
            lastRowRef.current = readRow(activeEl);
            return undefined;
        }
        const prev = lastRowRef.current;
        const next = readRow(activeEl);
        if (!prev || !next || prev.id === resolvedActiveId) {
            if (!navEl.dataset.gliding) lastRowRef.current = next;
            return undefined;
        }
        if (reduced) {
            glideAnimRef.current?.stop?.();
            delete navEl.dataset.gliding;
            lastRowRef.current = next;
            return undefined;
        }
        glideAnimRef.current?.stop?.();
        navEl.dataset.gliding = 'true';
        const from = { ...prev };
        const apply = (p) => {
            const lerp = (a, b) => a + (b - a) * p;
            const x = lerp(from.x, next.x);
            const y = lerp(from.y, next.y);
            const w = Math.max(0, lerp(from.width, next.width));
            const h = Math.max(0, lerp(from.height, next.height));
            glideEl.style.transform = `translate(${x}px, ${y}px)`;
            glideEl.style.width = `${w}px`;
            glideEl.style.height = `${h}px`;
            lastRowRef.current = { id: resolvedActiveId, x, y, width: w, height: h };
        };
        apply(0);
        const anim = animate(0, 1, {
            ...SPRINGS['spatial.fast'].productive,
            onUpdate: apply,
        });
        glideAnimRef.current = anim;
        Promise.resolve(anim.finished).then(() => {
            if (glideAnimRef.current !== anim) return;
            glideAnimRef.current = null;
            delete navEl.dataset.gliding;
            lastRowRef.current = readRow(activeEl);
        });
        return undefined;
    }, [resolvedActiveId, reduced, visible]);

    useLayoutEffect(() => () => { glideAnimRef.current?.stop?.(); }, []);

    // Swapping between the main and the inner sidebar: the container stays still
    // and only its content moves. The old content is already gone; the new one
    // enters as one block, sliding 12 from the end going in and from the start
    // going back on spatial.fast while it fades on appearance.fast. The slide and
    // the fade are two springs writing two custom properties the stylesheet reads
    // (`--_swap-p`, `--_swap-a`), so the distance stays the `--inline-lg` token.
    // Reduced motion drops the slide and keeps the fade.
    const mode = inner ? 'inner' : 'main';
    useLayoutEffect(() => {
        const previous = swapModeRef.current;
        swapModeRef.current = mode;
        const el = swapRef.current;
        if (previous === mode || !el) return undefined;
        const direction = getComputedStyle(el).direction === 'rtl' ? -1 : 1;
        const fadeOnly = reducedRef.current;
        el.dataset.swapping = 'true';
        el.dataset.swapMotion = fadeOnly ? 'fade' : 'slide-fade';
        el.dataset.swapFrom = mode === 'inner' ? 'end' : 'start';
        el.style.setProperty('--_swap-dir', String(mode === 'inner' ? direction : -direction));
        el.style.setProperty('--_swap-p', fadeOnly ? '1' : '0');
        el.style.setProperty('--_swap-a', '0');
        // The old content unmounted with the focus inside it: put focus where the new content begins.
        if (!document.activeElement || document.activeElement === document.body) {
            const target = mode === 'inner'
                ? el.querySelector('.plus-template-sidebar__back')
                : (el.querySelector('[aria-current="page"]') ?? el.querySelector('.plus-template-sidebar__row'));
            target?.focus({ preventScroll: true });
        }
        const fade = animate(0, 1, {
            ...SPRINGS['appearance.fast'].productive,
            onUpdate: (value) => el.style.setProperty('--_swap-a', String(Math.min(1, value))),
        });
        const slide = fadeOnly ? null : animate(0, 1, {
            ...SPRINGS['spatial.fast'].productive,
            onUpdate: (value) => el.style.setProperty('--_swap-p', String(value)),
        });
        let live = true;
        Promise.all([fade.finished, slide?.finished]).then(() => {
            if (!live) return;
            delete el.dataset.swapping;
            delete el.dataset.swapMotion;
            delete el.dataset.swapFrom;
            el.style.removeProperty('--_swap-dir');
            el.style.removeProperty('--_swap-p');
            el.style.removeProperty('--_swap-a');
        });
        return () => {
            live = false;
            fade.stop?.();
            slide?.stop?.();
        };
    }, [mode]);

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
        if (!resolvedActiveId) return;
        const parent = Object.keys(resolvedTabs || {}).find((key) => resolvedTabs[key]?.some((tab) => tab.id === resolvedActiveId));
        if (parent && shutRows[parent]) setShutRows((prev) => ({ ...prev, [parent]: false }));
        // Only a change of selection opens it; collapsing by hand must stick.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resolvedActiveId]);

    if (!visible) return null;

    const handleSelect = (rowId, item) => {
        if (tabs === undefined) openTabs.select(rowId);
        onSelect?.(rowId, item);
        if (rowId === 'home' && onHomeClick) {
            onHomeClick();
            return;
        }
        onTabClick?.(rowId);
    };

    const handleHome = onHome ?? (onHomeClick || onTabClick || onSelect
        ? () => {
            if (tabs === undefined) openTabs.select('home');
            if (onHomeClick) {
                onHomeClick();
                return;
            }
            if (onTabClick) {
                onTabClick('home');
                return;
            }
            onSelect?.('home', { id: 'home', text: 'Home' });
        }
        : undefined);

    const handleSelectTab = (tab, item) => {
        if (tabs === undefined) openTabs.select(tab.id);
        onSelectTab?.(tab, item);
        onOpenTabSelect?.(tab);
    };

    const handleCloseTab = (tab, item) => {
        if (onCloseTab) {
            onCloseTab(tab, item);
            return;
        }
        openTabs.close(tab.id);
    };

    const handleCloseAllTabs = (item) => {
        if (onCloseAllTabs) {
            onCloseAllTabs(item);
            return;
        }
        openTabs.closeAll(item.id);
    };

    const handleSignOut = () => {
        if (tabs === undefined) clearOpenTabs();
        onSignOut?.();
    };

    const toggleButton = control ? (
        <IconButton
            className="plus-template-sidebar__toggle"
            appearance="subtle"
            icon="angles-left"
            label="Close sidebar"
            tooltip="Close sidebar · Ctrl ["
            aria-expanded
            {...control.closeProps}
        />
    ) : onToggle ? (
        <IconButton
            className="plus-template-sidebar__toggle"
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
        const training = trainingCount(item.training, {
            lessonsLeft: effectiveLessonsLeft,
            modulesLeft: effectiveModulesLeft,
        });
        if (extra) return <span className="plus-template-sidebar__end">{extra}</span>;
        if (item.done) {
            return (
                <span className="plus-template-sidebar__end plus-template-sidebar__end--icon">
                    <Icon name="check" aria-hidden="true" />
                    <span className="visually-hidden">{item.doneLabel ?? 'Done'}</span>
                </span>
            );
        }
        if (training) {
            return (
                <span className="plus-template-sidebar__end">
                    <CountTag value={training.count} label={training.label} />
                </span>
            );
        }
        if (item.count) {
            return (
                <span className="plus-template-sidebar__end">
                    <CountTag value={item.count} label={item.countLabel} />
                </span>
            );
        }
        if (item.dot) {
            return (
                <span className="plus-template-sidebar__end">
                    <CountTag isDot appearance="info" label={item.dotLabel ?? 'New'} />
                </span>
            );
        }
        if (item.external) {
            return (
                <span className="plus-template-sidebar__end plus-template-sidebar__end--icon" aria-hidden="true">
                    <Icon name="arrow-up-right-from-square" />
                </span>
            );
        }
        return null;
    };

    const rowContent = (item, extra, labelRef) => (
        <>
            {item.textOnly ? null : (
                <span className="plus-template-sidebar__slot" aria-hidden="true">
                    {item.icon ? <Icon name={item.icon} /> : null}
                </span>
            )}
            <span ref={labelRef} className="plus-template-sidebar__label">{item.text}</span>
            {item.external ? <span className="visually-hidden">(opens in a new tab)</span> : null}
            {trailing(item, extra)}
        </>
    );

    /** A row: a link with `href`, else a button. A plain function, so a Tooltip's ref lands on the element. */
    const renderRow = ({ item, rowClass, current, onPress, extra, labelRef, ...rest }) => {
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
                    {rowContent(item, extra, labelRef)}
                </a>
            );
        }
        return (
            <button type="button" {...shared} onClick={rest['aria-disabled'] ? undefined : onPress}>
                {rowContent(item, extra, labelRef)}
            </button>
        );
    };

    const tabRow = (item, tab, last) => {
        const selected = resolvedActiveId === tab.id;
        const close = () => handleCloseTab(tab, item);
        // Delete and Backspace close the focused tab; focus moves to the next
        // tab, else the one before it, else the tab's row.
        const onKeyDown = (event) => {
            if (event.key !== 'Delete' && event.key !== 'Backspace') return;
            if (event.target.closest('.plus-template-sidebar__tab-close')) return;
            event.preventDefault();
            const li = event.currentTarget;
            const rowIn = (el) => (el?.matches('.plus-template-sidebar__tab') ? el.querySelector('.plus-template-sidebar__row') : null);
            const sibling = rowIn(li.nextElementSibling) ?? rowIn(li.previousElementSibling);
            const parent = li.closest('.plus-template-sidebar__item');
            close();
            requestAnimationFrame(() => {
                const target = sibling?.isConnected ? sibling : parent?.querySelector('.plus-template-sidebar__row');
                target?.focus();
            });
        };
        // The row is already a link or a button, so it carries the tooltip and
        // adds no tab stop. A clipped label shows its full text, with the longer
        // name after it when the tab has one; a tab that fits shows only that name.
        const row = (
            <ClippedTooltip
                text={tab.tooltip ? `${tab.label}. ${tab.tooltip}` : tab.label}
                textWhenFits={tab.tooltip}
                placement="right"
            >
                {({ measureRef }) => renderRow({
                    item: {
                        id: tab.id,
                        // A task's progress rides on its label, so Close never hides it.
                        text: tab.progress
                            ? <>{tab.label}<span className="plus-template-sidebar__progress">{tab.progress}</span></>
                            : tab.label,
                        href: tab.href,
                    },
                    rowClass: ['plus-template-sidebar__row', selected && 'plus-template-sidebar__row--selected'].filter(Boolean).join(' '),
                    current: selected,
                    onPress: () => handleSelectTab(tab, item),
                    extra: tab.live ? <CountTag isDot appearance="success" label="Live" /> : undefined,
                    labelRef: measureRef,
                })}
            </ClippedTooltip>
        );
        return (
            <li
                key={tab.id}
                className={['plus-template-sidebar__tab', last && 'plus-template-sidebar__tab--last', selected && 'plus-template-sidebar__tab--selected'].filter(Boolean).join(' ')}
                onKeyDown={onKeyDown}
            >
                {row}
                <IconButton
                    className="plus-template-sidebar__tab-close"
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
        const own = locked || item.external ? [] : (resolvedTabs?.[item.id] ?? []);
        const rowSelected = resolvedActiveId === item.id;
        const select = item.external ? undefined : () => handleSelect(item.id, item);

        if (locked) {
            return (
                <li key={item.id} className="plus-template-sidebar__item">
                    <Tooltip text={message} placement="right">
                        {renderRow({
                            item,
                            rowClass: 'plus-template-sidebar__row plus-template-sidebar__row--locked',
                            'aria-disabled': 'true',
                        })}
                    </Tooltip>
                </li>
            );
        }

        if (!own.length) {
            return (
                <li key={item.id} className="plus-template-sidebar__item">
                    {renderRow({
                        item,
                        rowClass: ['plus-template-sidebar__row', rowSelected && 'plus-template-sidebar__row--selected'].filter(Boolean).join(' '),
                        current: rowSelected,
                        onPress: select,
                    })}
                </li>
            );
        }

        const listId = `${baseId}-${item.id}-tabs`;
        const shut = Boolean(shutRows[item.id]);
        const tabSelected = own.some((tab) => tab.id === resolvedActiveId);
        // Exactly one selected row: collapsed with its tab selected, the row stands in for the tab.
        const standsIn = shut && tabSelected;
        const all = Boolean(showingAll[item.id]);
        const more = own.length - SIDEBAR_RECENT_TABS;
        const recent = all || more <= 0 ? own : own.slice(0, SIDEBAR_RECENT_TABS);
        // The selected tab always shows, even when it is past the first three.
        const selectedTab = own.find((tab) => tab.id === resolvedActiveId);
        const shown = selectedTab && !recent.includes(selectedTab) ? [...recent, selectedTab] : recent;
        const rowClass = [
            'plus-template-sidebar__row',
            (rowSelected || standsIn) && 'plus-template-sidebar__row--selected',
            !shut && tabSelected && 'plus-template-sidebar__row--ancestor',
        ].filter(Boolean).join(' ');

        return (
            <li key={item.id} className="plus-template-sidebar__item plus-template-sidebar__item--parent">
                <div className={['plus-template-sidebar__parent', shut && 'plus-template-sidebar__parent--shut'].filter(Boolean).join(' ')}>
                    {renderRow({
                        item,
                        rowClass,
                        current: rowSelected || standsIn,
                        onPress: select,
                        extra: shut ? <CountTag value={own.length} label={`${own.length} open tabs`} /> : undefined,
                    })}
                    <IconButton
                        className="plus-template-sidebar__twist"
                        appearance="subtle"
                        spacing="compact"
                        icon={<Icon name="angle-down" size={12} />}
                        label={`${shut ? 'Show' : 'Hide'} ${item.text} tabs`}
                        tooltip={shut ? 'Show tabs' : 'Hide tabs'}
                        aria-expanded={!shut}
                        aria-controls={shut ? undefined : listId}
                        onClick={() => flip(setShutRows, item.id)}
                    />
                    <IconButton
                        className="plus-template-sidebar__close-all"
                        appearance="subtle"
                        spacing="compact"
                        icon="xmark"
                        label={`Close all ${own.length} ${item.text.toLowerCase()} tabs`}
                        tooltip={`Close all ${own.length} tabs`}
                        onClick={() => handleCloseAllTabs(item)}
                    />
                </div>
                {shut ? null : (
                    <ul id={listId} className="plus-template-sidebar__tabs" aria-label={`Open ${item.text}`}>
                        {shown.map((tab, index) => tabRow(item, tab, more <= 0 && index === shown.length - 1))}
                        {more > 0 ? (
                            <Collapsible.Root
                                render={<li />}
                                className="plus-template-sidebar__tab plus-template-sidebar__tab--last plus-template-sidebar__tab--more"
                                open={all}
                                onOpenChange={() => flip(setShowingAll, item.id)}
                            >
                                <Collapsible.Trigger
                                    className="plus-template-sidebar__row"
                                    // The extra tabs are rows of the list this row sits in, so it points at that list, not at a panel of its own.
                                    render={(props) => <button {...props} aria-controls={listId} />}
                                >
                                    <span className="plus-template-sidebar__slot" aria-hidden="true" />
                                    <span className="plus-template-sidebar__label">{all ? 'Show less' : `Show ${more} more`}</span>
                                </Collapsible.Trigger>
                            </Collapsible.Root>
                        ) : null}
                    </ul>
                )}
            </li>
        );
    };

    const renderGroup = (group) => {
        const titleId = `${baseId}-${group.id}-title`;
        const listId = `${baseId}-${group.id}-list`;
        const locked = Boolean(group.lockedDuringOnboarding) && effectiveModulesLeft > 0;
        const message = locked ? lockMessage(group.title) : null;
        const shut = Boolean(group.title) && !locked && Boolean(shutGroups[group.id]);

        let title = null;
        if (group.title && locked) {
            title = (
                <div className="plus-template-sidebar__title plus-template-sidebar__title--locked">
                    <span id={titleId} className="plus-template-sidebar__title-text">{group.title}</span>
                    <Tooltip text={message} placement="right">
                        {/* The lock is focusable so a keyboard reaches its message. */}
                        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
                        <span className="plus-template-sidebar__caret plus-template-sidebar__caret--lock" tabIndex={0} role="img" aria-label={`Locked. ${message}`}>
                            <Icon name="lock" />
                        </span>
                    </Tooltip>
                </div>
            );
        } else if (group.title) {
            title = (
                <Collapsible.Trigger
                    className={['plus-template-sidebar__title', shut && 'plus-template-sidebar__title--shut'].filter(Boolean).join(' ')}
                >
                    <span id={titleId} className="plus-template-sidebar__title-text">{group.title}</span>
                    <span className="plus-template-sidebar__caret" aria-hidden="true">
                        <Icon name="angle-down" />
                    </span>
                </Collapsible.Trigger>
            );
        }

        const list = group.items.map((item) => renderItem(item, locked, message));

        if (group.title && !locked) {
            return (
                <Collapsible.Root
                    key={group.id}
                    className="plus-template-sidebar__group"
                    role="group"
                    aria-labelledby={titleId}
                    open={!shut}
                    onOpenChange={() => toggleGroup(group.id)}
                >
                    {title}
                    <Collapsible.Panel render={<ul />} className="plus-template-sidebar__list">
                        {list}
                    </Collapsible.Panel>
                </Collapsible.Root>
            );
        }

        return (
            <div
                key={group.id}
                className="plus-template-sidebar__group"
                role={group.title ? 'group' : undefined}
                aria-labelledby={group.title ? titleId : undefined}
            >
                {title}
                <ul id={listId} className="plus-template-sidebar__list">{list}</ul>
            </div>
        );
    };

    const renderInner = () => {
        const switcher = inner.switcher;
        const chosen = switcher?.options.find((option) => option.id === switcher.value);
        return (
            <div className="plus-template-sidebar__inner">
                <Button
                    className="plus-template-sidebar__back"
                    appearance="subtle"
                    shouldFitContainer
                    iconBefore="arrow-left"
                    text={inner.areaLabel}
                    onClick={onBack}
                />
                {switcher ? (
                    <div className="plus-template-sidebar__switcher">
                        <DropdownMenu
                            placement="bottom-start"
                            trigger={(
                                <Button
                                    className="plus-template-sidebar__switcher-trigger"
                                    appearance="default"
                                    shouldFitContainer
                                    iconAfter="angle-down"
                                    text={chosen?.text ?? switcher.label}
                                    aria-label={switcher.label ? `${switcher.label}: ${chosen?.text ?? ''}` : undefined}
                                />
                            )}
                        >
                            {switcher.options.map((option) => (
                                <ButtonItem
                                    key={option.id}
                                    isSelected={option.id === switcher.value}
                                    onClick={() => switcher.onChange?.(option.id, option)}
                                >
                                    {option.text}
                                </ButtonItem>
                            ))}
                        </DropdownMenu>
                    </div>
                ) : null}
                <ul className="plus-template-sidebar__list" aria-label={inner.label ?? `${inner.areaLabel} steps`}>
                    {inner.rows.map((row) => {
                        const selected = resolvedActiveId === row.id;
                        const off = Boolean(row.disabled);
                        const line = renderRow({
                            item: { ...row, textOnly: true },
                            rowClass: ['plus-template-sidebar__row', 'plus-template-sidebar__row--text', selected && 'plus-template-sidebar__row--selected', off && 'plus-template-sidebar__row--locked'].filter(Boolean).join(' '),
                            current: selected,
                            onPress: () => onSelect?.(row.id, row),
                            ...(off ? { 'aria-disabled': 'true' } : {}),
                        });
                        return (
                            <li key={row.id} className="plus-template-sidebar__item">
                                {off && row.disabledText ? <Tooltip text={row.disabledText} placement="right">{line}</Tooltip> : line}
                            </li>
                        );
                    })}
                </ul>
            </div>
        );
    };

    const brand = handleHome ? (
        <a
            className="plus-template-sidebar__brand"
            href={homeHref}
            aria-label="PLUS, go to Home"
            onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                event.preventDefault();
                handleHome();
            }}
        >
            <Logo appearance="colored" size={24} wordmark />
        </a>
    ) : (
        <a className="plus-template-sidebar__brand" href={homeHref} aria-label="PLUS, go to Home">
            <Logo appearance="colored" size={24} wordmark />
        </a>
    );

    return (
        <div id={id} className={['plus-template-sidebar', 'plus-sidebar', className].filter(Boolean).join(' ')} style={style}>
            <div className="plus-template-sidebar__logo-row">
                {brand}
                {toggleButton}
            </div>
            <nav ref={navRef} aria-label={label} className="plus-template-sidebar__nav">
                <span ref={glideRef} className="plus-template-sidebar__glide" aria-hidden="true" />
                <div key={mode} ref={swapRef} className="plus-template-sidebar__swap" data-mode={mode}>
                    {inner ? renderInner() : resolvedGroups.map(renderGroup)}
                </div>
            </nav>
            {account ? (
                <SidebarAccount
                    name={account.name}
                    preferredName={account.preferredName}
                    role={account.role}
                    onProfile={onProfile}
                    onSignOut={handleSignOut}
                    helpHref={helpHref}
                    inboxCount={inboxCount}
                    isInboxOpen={isInboxOpen}
                    onInbox={onInbox}
                />
            ) : null}
        </div>
    );
};

const itemShape = PropTypes.shape({
    /** Unique id; `activeId`, `onSelect` and `tabs` use it */
    id: PropTypes.string.isRequired,
    text: PropTypes.string,
    /** Font Awesome Free name for the 16 icon (`house`), drawn by Icon; a brand logo carries its family (`fa-brands fa-slack`); every other icon is outlined, selected or not */
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
    /** A task's progress ("2 of 5"), after its label */
    progress: PropTypes.string,
});

const groupShape = PropTypes.shape({
    id: PropTypes.string.isRequired,
    /** The section title; a group without one has no title row and never collapses */
    title: PropTypes.string,
    items: PropTypes.arrayOf(itemShape).isRequired,
    /** Locked while `modulesLeft` is above 0 */
    lockedDuringOnboarding: PropTypes.bool,
});

Sidebar.propTypes = {
    /** Role whose navigation fills the Sidebar when `groups` is omitted (defaults to `'tutor'`), or merged into `groups` when both are passed */
    user: PropTypes.oneOf(['tutor', 'supervisor']),
    /** Groups to render directly, or merged by `id` into the role's config (`sidebarConfig.js`) when `user` is also passed */
    groups: PropTypes.arrayOf(groupShape),
    /** Id of the selected row or tab; it carries `aria-current="page"` */
    activeId: PropTypes.string,
    /** Id of the row to show as selected when `activeId` is not set (e.g. `'sessions'`, `'home'`) */
    activeTabId: PropTypes.string,
    /** Called with `(id, item)` when a row other than an external link is pressed */
    onSelect: PropTypes.func,
    /** Home's press (the row and the logo); without it Home calls `onTabClick('home')` */
    onHomeClick: PropTypes.func,
    /** Called with the row id for every other row (external links excepted) */
    onTabClick: PropTypes.func,
    /** Called with the open tab (`{ id, parentId, recordId, title, href, status }`) when one is pressed */
    onOpenTabSelect: PropTypes.func,
    /** Open tabs by row id, in the order they show; defaults to `useOpenTabs()` */
    tabs: PropTypes.objectOf(PropTypes.arrayOf(tabShape)),
    /** Called with `(tab, item)` on a plain click of a tab */
    onSelectTab: PropTypes.func,
    /** Called with `(tab, item)` by a tab's Close and by Delete or Backspace */
    onCloseTab: PropTypes.func,
    /** Called with `(item)` by a row's Close all */
    onCloseAllTabs: PropTypes.func,
    /** Onboarding modules a tutor has left. Above 0, groups marked `lockedDuringOnboarding` lock, and the `modules` row counts it. Supervisors are never locked. */
    modulesLeft: PropTypes.number,
    /** Assigned lessons a tutor has left; the `lessons` row counts it */
    lessonsLeft: PropTypes.number,
    /** The trailing slot by row id when using the role config: `{ compliance-monitor: { count: 3, countLabel: '3 open flags' }, lessons: { dot: true } }` */
    countTags: PropTypes.objectOf(PropTypes.shape({
        count: PropTypes.number,
        countLabel: PropTypes.string,
        dot: PropTypes.bool,
        dotLabel: PropTypes.string,
    })),
    /** The signed-in person, for the account row. Their `id` keys the remembered sections. */
    account: PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string.isRequired,
        preferredName: PropTypes.string,
        role: PropTypes.oneOf(ACCOUNT_ROLES).isRequired,
    }),
    /** The account menu's Profile */
    onProfile: PropTypes.func,
    /** The account menu's Sign out, after open tabs are cleared when using `useOpenTabs()` */
    onSignOut: PropTypes.func,
    /** Help Center, a row in the account menu, opened in a new tab */
    helpHref: PropTypes.string,
    /** Unread notifications, drawn on the account row's bell */
    inboxCount: PropTypes.number,
    /** The Inbox is open beside the Sidebar: the bell takes the selected fill */
    isInboxOpen: PropTypes.bool,
    /** Opens and closes the Inbox from the bell; the bell is drawn only when this is set */
    onInbox: PropTypes.func,
    /** Where the logo goes */
    homeHref: PropTypes.string,
    /** Where Slack links in the role config; defaults to `SLACK_URL` */
    slackUrl: PropTypes.string,
    /** Called on a plain click of the logo; the caller goes Home */
    onHome: PropTypes.func,
    /** Standalone: the toggle's press. Inside a Frame the Frame draws the toggle's state. */
    onToggle: PropTypes.func,
    /**
     * Swaps the content for an inner sidebar: the area's Back button, an optional
     * context dropdown, then text-only rows. Omit it for the main Sidebar.
     */
    inner: PropTypes.shape({
        /** The area name, centered in the Back button ("Sessions") */
        areaLabel: PropTypes.string.isRequired,
        /** Text-only rows: a record's stages or a task's steps. The selected one is `activeId`. */
        rows: PropTypes.arrayOf(PropTypes.shape({
            id: PropTypes.string.isRequired,
            text: PropTypes.string.isRequired,
            href: PropTypes.string,
            count: PropTypes.number,
            countLabel: PropTypes.string,
            dot: PropTypes.bool,
            dotLabel: PropTypes.string,
            /** A finished step: a tick after the label; the row stays pressable */
            done: PropTypes.bool,
            /** The tick's accessible name; defaults to "Done" */
            doneLabel: PropTypes.string,
            /** A step the person has not reached: dimmed and not pressable */
            disabled: PropTypes.bool,
            /** Why a disabled step waits, shown in a tooltip */
            disabledText: PropTypes.string,
        })).isRequired,
        /** Accessible name of the rows' list; defaults to "<area> steps" */
        label: PropTypes.string,
        /** The full-width context dropdown under Back, such as the session switcher */
        switcher: PropTypes.shape({
            /** The dropdown's name; also its text when nothing is chosen */
            label: PropTypes.string,
            /** Id of the chosen option */
            value: PropTypes.string,
            options: PropTypes.arrayOf(PropTypes.shape({
                id: PropTypes.string.isRequired,
                text: PropTypes.string.isRequired,
            })).isRequired,
            /** Called with `(id, option)` when one is picked */
            onChange: PropTypes.func,
        }),
    }),
    /** Called by the inner sidebar's Back; the caller shows the main Sidebar and leaves the page where it is */
    onBack: PropTypes.func,
    /** The localStorage key collapsed sections are kept under, per account id; null keeps nothing */
    storageKey: PropTypes.string,
    /** Accessible name of the `nav` landmark */
    label: PropTypes.string,
    /** Whether the Sidebar renders */
    visible: PropTypes.bool,
    /** HTML id attribute on the Sidebar root element */
    id: PropTypes.string,
    /** Additional CSS class names applied to the Sidebar root */
    className: PropTypes.string,
    /** Inline styles applied to the Sidebar root */
    style: PropTypes.object,
};

export default Sidebar;
