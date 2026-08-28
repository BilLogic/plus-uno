/**
 * `NavTabs` — a tab strip, in one of two modes.
 *
 * `mode="navigation"` (the default) is the original component: a thin wrapper
 * over react-bootstrap's `Nav variant="tabs"`. Standalone, that is a NAVIGATION
 * BAR STYLED LIKE TABS — `Nav` only produces tab semantics inside a
 * `Tab.Container`, which this never rendered. Measured on the Overview story
 * before #256: `<div>` with no role, three `<a href="#" role="button">` items,
 * no `aria-selected`, no `aria-controls`, `tabindex="0"` on all three.
 *
 * `mode="tabs"` is the WAI-ARIA tabs pattern, opt-in. Three specs under
 * `src/specs/Home` render this component as navigation today, so tab semantics
 * could not simply be switched on for everyone; the navigation path below is
 * unchanged, and `NavTabs.test.jsx` holds it there with a navigation twin for
 * every tabs-mode case.
 *
 * The reference implementation is `src/storybook-docs/docs-tabs.jsx`, which has
 * run the documentation's own tab strip since #253. This is that behaviour
 * generalised: roving tabindex, arrow keys that move selection and focus
 * together, and real `<button>` elements rather than anchors with `href="#"`
 * that push a history entry and move the scroll position on every tab change.
 */
import React, { useCallback, useId, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Nav, NavDropdown } from 'react-bootstrap';
import './NavTabs.scss';

/**
 * What a tab needs from the strip around it: which key is active, the id pair
 * linking it to its panel, and how to select.
 *
 * Null in navigation mode, which is how `NavTabsItem` knows which markup to
 * render without the caller passing anything down by hand.
 */
const TabsContext = React.createContext(null);

// Subcomponents are wrappers around React-Bootstrap Nav.Item/Link/Dropdown
const NavTabsItem = ({
    children,
    active,
    disabled = false,
    href,
    onClick,
    className = '',
    as,
    eventKey,
    ...props
}) => {
    const tabs = React.useContext(TabsContext);

    if (tabs) {
        const selected = active !== undefined ? active : tabs.activeKey === eventKey;
        // The roving index comes from the STRIP, never from a per-item `active`.
        //
        // Two separate ways to lose the keyboard if it did: two items marked
        // `active` give the strip two stops in the tab sequence, and
        // `active={false}` on the genuinely selected one gives it none, which
        // takes the whole tablist out of the sequence. The `InteractionStates`
        // story sets `active` on four items at once — for appearance, which is
        // what the prop is for. `tabs.roving` names exactly one item, and it
        // skips a disabled selection, because a disabled <button> cannot take
        // focus and would be a stop nobody can reach.
        const rovingStop = tabs.roving === eventKey;
        return (
            // `role="presentation"` because ARIA requires the tablist to own its
            // tabs, and this wrapper carries the -1px overlap that sits the tab
            // on the container's bottom border — it cannot just be dropped.
            <div className={`plus-nav-item ${className}`} role="presentation">
                <button
                    type="button"
                    role="tab"
                    id={tabs.tabId(eventKey)}
                    ref={(el) => tabs.register(eventKey, el)}
                    aria-selected={selected}
                    // Omitted rather than dangled: a tab pointing at an id that
                    // is not in the document sends assistive technology to
                    // nothing, which is worse than not pointing at all.
                    {...(tabs.hasPanel(eventKey) ? { 'aria-controls': tabs.panelId(eventKey) } : {})}
                    // Roving tabindex: one stop for the whole strip, arrows move
                    // within it. Every item being a stop is what made a six-tab
                    // set six stops in the tab sequence before #256.
                    tabIndex={rovingStop ? 0 : -1}
                    disabled={disabled}
                    className={`plus-nav-link${selected ? ' active' : ''}`}
                    onClick={(event) => {
                        onClick?.(event);
                        tabs.select(eventKey, event);
                    }}
                    {...props}
                >
                    {children}
                </button>
            </div>
        );
    }

    return (
        <Nav.Item className={`plus-nav-item ${className}`}>
            <Nav.Link
                as={as}
                href={href}
                {...(active !== undefined ? { active } : {})}
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

/**
 * The panel one tab controls. `mode="tabs"` only.
 *
 * Declared as a child of `NavTabs` so the component owns both halves of the
 * `aria-controls` / `aria-labelledby` pair; a caller wiring those by hand is
 * how they end up pointing at ids that do not exist. `NavTabs` reads the props
 * off this element and renders the active panel itself, which is why this
 * renders nothing of its own.
 */
const NavTabsPanel = ({ children }) => <>{children}</>;

NavTabsPanel.propTypes = {
    children: PropTypes.node,
    eventKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
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

const alignmentClass = (alignment) =>
    alignment === 'center' ? 'justify-content-center' :
        alignment === 'right' ? 'justify-content-end' :
            alignment === 'justified' ? 'nav-justified' : '';

/**
 * The tabs-mode strip: a `role="tablist"` of buttons, plus the active panel.
 *
 * Children that are neither an `Item` nor a `Panel` are rendered in the strip
 * where they sit and left out of the tab set — a `NavTabs.Dropdown` is not a
 * tab, so the arrow keys walk past it.
 */
const NavTabsAsTabs = ({
    children,
    alignment,
    className,
    defaultActiveKey,
    activeKey,
    onSelect,
    ...props
}) => {
    const baseId = useId();
    const nodes = useRef(new Map());
    const [uncontrolled, setUncontrolled] = useState(defaultActiveKey);
    const controlled = activeKey !== undefined;
    const active = controlled ? activeKey : uncontrolled;

    /** The item keys, in render order — the order the arrow keys walk. */
    const items = useMemo(() => {
        const found = [];
        React.Children.forEach(children, (child) => {
            if (React.isValidElement(child) && child.type === NavTabsItem) {
                found.push({ key: child.props.eventKey, disabled: Boolean(child.props.disabled) });
            }
        });
        return found;
    }, [children]);

    const panels = useMemo(() => {
        const found = new Map();
        React.Children.forEach(children, (child) => {
            if (React.isValidElement(child) && child.type === NavTabsPanel) {
                found.set(child.props.eventKey, child.props.children);
            }
        });
        return found;
    }, [children]);

    const select = useCallback(
        (key, event) => {
            // A controlled strip does not move itself, matching `Nav`: the
            // caller owns `activeKey` and moves it from `onSelect`.
            if (!controlled) setUncontrolled(key);
            onSelect?.(key, event);
        },
        [controlled, onSelect],
    );

    /**
     * The one item that holds the strip's place in the tab sequence.
     *
     * The selected one, unless it is disabled or is not in the list at all —
     * then the first enabled item, so the strip is always reachable by Tab.
     * Undefined only when every item is disabled, which is a strip with nothing
     * to operate.
     */
    const roving = useMemo(() => {
        const selected = items.find((item) => item.key === active);
        if (selected && !selected.disabled) return selected.key;
        return items.find((item) => !item.disabled)?.key;
    }, [items, active]);

    const context = useMemo(
        () => ({
            activeKey: active,
            roving,
            tabId: (key) => `${baseId}-tab-${key}`,
            panelId: (key) => `${baseId}-panel-${key}`,
            hasPanel: (key) => panels.has(key),
            register: (key, el) => {
                if (el) nodes.current.set(key, el);
                else nodes.current.delete(key);
            },
            select,
        }),
        [active, baseId, panels, roving, select],
    );

    /** Left/Right move between tabs, Home/End to the ends — WAI-ARIA tabs pattern. */
    const onKeyDown = (event) => {
        if (items.length === 0) return;
        // Where the walk starts when `active` names no item — a strip rendered
        // before its selection is known, or an `activeKey` whose item has been
        // removed. `findIndex` returns -1 there, and using that as the origin
        // sends ArrowLeft to `length - 2` rather than the last tab: -1 - 1 is
        // -2, which wraps two short. Right happens to be correct by accident,
        // since -1 + 1 is 0. Anchoring on the roving stop instead makes both
        // directions start from the tab the focus is actually on.
        const activeIndex = items.findIndex((item) => item.key === active);
        const from = activeIndex === -1 ? items.findIndex((item) => item.key === roving) : activeIndex;
        let step;
        let start;
        if (event.key === 'ArrowRight') { start = from; step = 1; }
        else if (event.key === 'ArrowLeft') { start = from; step = -1; }
        else if (event.key === 'Home') { start = -1; step = 1; }
        else if (event.key === 'End') { start = items.length; step = -1; }
        else return;

        // Walk past disabled tabs: a disabled <button> cannot take focus, so
        // landing on one would move the selection and strand the focus behind
        // it. Bounded by the item count, so a strip where every other tab is
        // disabled walks all the way round, finds nothing, and does nothing.
        let index = start;
        let found = false;
        for (let taken = 0; taken < items.length; taken += 1) {
            index = (index + step + items.length) % items.length;
            if (!items[index].disabled) { found = true; break; }
        }
        if (!found || items[index].key === active) return;

        event.preventDefault();
        select(items[index].key, event);
        nodes.current.get(items[index].key)?.focus();
    };

    const strip = [];
    React.Children.forEach(children, (child, i) => {
        if (React.isValidElement(child) && child.type === NavTabsPanel) return;
        const key = child?.key ?? i;
        if (React.isValidElement(child) && child.type === NavTabsItem) {
            strip.push(<React.Fragment key={key}>{child}</React.Fragment>);
            return;
        }
        // Anything that is not a tab — `NavTabs.Dropdown`, most obviously — is
        // wrapped so it does not sit bare inside the tablist. A tablist's
        // children have to be tabs; an unwrapped dropdown toggle in there trips
        // axe's `aria-required-children` and gives screen readers a tab set
        // whose child count does not match its tabs.
        //
        // The wrapper makes the markup valid, not the composition sensible: the
        // dropdown is still outside the tab set, so the arrow keys walk past it
        // and nothing announces it as part of the strip. A tab bar that needs an
        // overflow menu wants `mode="navigation"`, or a `Select` beside it.
        strip.push(
            <div key={key} role="presentation" className="plus-nav-item">
                {child}
            </div>,
        );
    });

    return (
        <TabsContext.Provider value={context}>
            <div
                role="tablist"
                className={`plus-nav-tabs ${alignmentClass(alignment)} ${className}`}
                onKeyDown={onKeyDown}
                {...props}
            >
                {strip}
            </div>
            {panels.has(active) ? (
                // Only the active panel is rendered. Keeping the others behind
                // `display: none` would put every panel's headings in one
                // document at once — colliding ids, and a page outline holding
                // headings the reader cannot see.
                <div
                    role="tabpanel"
                    id={context.panelId(active)}
                    aria-labelledby={context.tabId(active)}
                    // In the tab sequence, so a keyboard user can reach panel
                    // content that holds nothing focusable of its own.
                    tabIndex={0}
                    className="plus-nav-tabs-panel"
                >
                    {panels.get(active)}
                </div>
            ) : null}
        </TabsContext.Provider>
    );
};

NavTabsAsTabs.propTypes = {
    children: PropTypes.node,
    alignment: PropTypes.string,
    className: PropTypes.string,
    defaultActiveKey: PropTypes.any,
    activeKey: PropTypes.any,
    onSelect: PropTypes.func
};

const NavTabs = ({
    children,
    alignment = 'left', // 'left', 'center', 'right', 'justified'
    className = '',
    mode = 'navigation',
    defaultActiveKey,
    activeKey,
    onSelect,
    ...props
}) => {
    if (mode === 'tabs') {
        return (
            <NavTabsAsTabs
                alignment={alignment}
                className={className}
                defaultActiveKey={defaultActiveKey}
                activeKey={activeKey}
                onSelect={onSelect}
                {...props}
            >
                {children}
            </NavTabsAsTabs>
        );
    }

    return (
        <Nav
            variant="tabs"
            className={`plus-nav-tabs ${alignmentClass(alignment)} ${className}`}
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
    /**
     * `navigation` keeps the original markup — a react-bootstrap `Nav` of
     * anchors. `tabs` is the WAI-ARIA tabs pattern: `role="tablist"`, real
     * buttons, roving tabindex and arrow keys. Opt-in, because existing callers
     * use this component as navigation and their markup must not move (#256).
     */
    mode: PropTypes.oneOf(['navigation', 'tabs']),
    defaultActiveKey: PropTypes.any,
    activeKey: PropTypes.any,
    onSelect: PropTypes.func
};

NavTabs.Item = NavTabsItem;
NavTabs.Panel = NavTabsPanel;
NavTabs.Dropdown = NavTabsDropdown;

export default NavTabs;
