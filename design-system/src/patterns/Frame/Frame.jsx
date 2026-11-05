import React, { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { openOverlayCount, subscribeOverlays } from '@/lib/overlay';
import Topbar from '../Topbar';
import { SidebarControlContext } from './SidebarControl';
import { resolveFrameLayout } from './frameLayout';
import './Frame.scss';

/** How long a peek survives the pointer leaving it, so a pass between toggle and panel does not drop it. */
const PEEK_LEAVE_MS = 200;

/**
 * The Frame's own width, in pixels, kept current as it resizes. Fit is measured
 * here, not on the window, so a docs preview narrower or wider than the
 * viewport lays out by the width it really has. Before the first measure (and
 * where nothing has a width, as in a unit test's DOM) it reads the window.
 * @param {React.RefObject<HTMLElement>} ref
 * @returns {number}
 */
const useFrameWidth = (ref) => {
    const windowWidth = () => (typeof window === 'undefined' ? 1440 : window.innerWidth);
    const [width, setWidth] = useState(windowWidth);
    useLayoutEffect(() => {
        const read = () => setWidth(ref.current?.getBoundingClientRect().width || windowWidth());
        read();
        const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(read);
        if (ref.current) ro?.observe(ref.current);
        window.addEventListener('resize', read);
        return () => {
            ro?.disconnect();
            window.removeEventListener('resize', read);
        };
    }, [ref]);
    return width;
};

/**
 * Frame pattern: the app frame, a full-width 32 topbar over a row holding the
 * Sidebar and the Page. The Frame has no seams: the Page runs to the window
 * edges and meets the Sidebar at a hairline.
 *
 * - The frame owns the Sidebar state; the Topbar in the `topbar` slot draws the
 *   one toggle from it (through `SidebarControlContext`). Without a `topbar`,
 *   the frame renders a bare Topbar so the toggle is still there.
 * - What docks is decided by the layout resolver (`./frameLayout`) from the
 *   Frame's own width: from 1024 the Sidebar docks (240, in flow); under 1024
 *   it never docks.
 * - The Topbar spans the full width, pads its end, and ends in a hairline. The
 *   Page starts right under it.
 * - The Page's top-left corner is rounded (`--page-radius`) only while the
 *   Sidebar is docked, switching in the same render as the width change.
 * - Hovering the toggle or the left edge peeks a collapsed Sidebar: it floats
 *   over the Page with a shadow and no Blanket, so the Page does not move. An
 *   outside click, Escape, or the pointer leaving closes the peek.
 * - Clicking the toggle, or pressing Ctrl+[, opens a collapsed or peeking
 *   Sidebar and closes an open one. Opened by hand under 1024 it is an
 *   overlay: it floats over the Page and closes on an outside press.
 * - Opening a modal (or drawer) closes a floating Sidebar (peek or overlay)
 *   and leaves a docked one alone, and while one is open the Sidebar does not
 *   peek. The frame hears it from the shared overlay module (`@/lib/overlay`),
 *   so a page does not wire its modals to the frame. A modal opened from inside
 *   the floating Sidebar hands focus to the toggle when it closes, since its
 *   trigger left with the Sidebar.
 * - Landmarks: the Page is `main`; the Sidebar's `nav` is the navigation.
 * - The Page pads `--page-pad` (24 at every width) and caps its content at
 *   `--content-max-width` (1232), centered, on a 12-column grid with a
 *   16 gutter. Children span all 12 columns unless they set `grid-column`.
 */
const Frame = ({
    id,
    topbar,
    sidebar,
    sidebarDocked,
    width = 'content',
    contentAs: Content = 'main',
    contentClassName = '',
    surfaceDirect = false,
    className = '',
    style,
    children,
    ...props
}) => {
    const frameRef = useRef(null);
    const toggleRef = useRef(null);
    const sidebarRef = useRef(null);
    const leaveTimer = useRef(null);
    const sidebarId = useId();
    const frameWidth = useFrameWidth(frameRef);
    const hasSidebar = Boolean(sidebar);

    // `sidebarDocked` sets the default request; a press on the toggle (or
    // Ctrl+[) overrides it by hand until the prop changes.
    const defaultOpen = sidebarDocked ?? true;
    const [hand, setHand] = useState(null);
    const [peek, setPeek] = useState(false);
    useEffect(() => {
        setHand(null);
    }, [defaultOpen]);

    const layout = useMemo(() => resolveFrameLayout({
        frameWidth,
        sidebar: hand === null ? { open: defaultOpen, setBy: 'default' } : { open: hand, setBy: 'hand' },
        sidebarPeek: peek,
    }), [frameWidth, hand, defaultOpen, peek]);

    const docked = hasSidebar && layout.sidebar === 'docked';
    const peeking = hasSidebar && layout.sidebar === 'peeking';
    const overlay = hasSidebar && layout.sidebar === 'overlay';
    const floating = peeking || overlay;
    const collapsed = hasSidebar && layout.sidebar === 'collapsed';

    const cancelLeave = useCallback(() => {
        if (leaveTimer.current) {
            clearTimeout(leaveTimer.current);
            leaveTimer.current = null;
        }
    }, []);
    useEffect(() => cancelLeave, [cancelLeave]);

    const peekSidebar = useCallback(() => {
        cancelLeave();
        // Under an open modal the Sidebar stays put.
        if (openOverlayCount() > 0) return;
        setPeek(true);
    }, [cancelLeave]);

    const leave = useCallback(() => {
        cancelLeave();
        leaveTimer.current = setTimeout(() => {
            leaveTimer.current = null;
            setPeek(false);
        }, PEEK_LEAVE_MS);
    }, [cancelLeave]);

    /** Closes whatever floats: a peek and an overlay Sidebar. */
    const closeFloating = useCallback(() => {
        cancelLeave();
        setPeek(false);
        setHand((h) => (h === true ? false : h));
    }, [cancelLeave]);

    // The latest resolved state, read by handlers that must not re-bind on every change.
    const stateRef = useRef(layout.sidebar);
    stateRef.current = layout.sidebar;

    const toggle = useCallback(() => {
        cancelLeave();
        setPeek(false);
        setHand(stateRef.current === 'docked' || stateRef.current === 'overlay' ? false : true);
    }, [cancelLeave]);

    // Ctrl+[ toggles the Sidebar.
    useEffect(() => {
        if (!hasSidebar) return undefined;
        const onKeyDown = (e) => {
            if (e.defaultPrevented || !e.ctrlKey || e.altKey || e.metaKey || e.key !== '[') return;
            e.preventDefault();
            toggle();
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [hasSidebar, toggle]);

    // Opening a modal closes a floating Sidebar; a docked one stays. A modal
    // opened from inside the floating Sidebar loses its trigger with it, so
    // once that modal closes, focus goes to the toggle.
    const focusToggleOnClose = useRef(false);
    useEffect(() => subscribeOverlays((event) => {
        // The first overlay of a stack starts afresh; a confirm on top keeps the mark.
        if (event.type === 'open' && event.count === 1) focusToggleOnClose.current = false;
        const floatingNow = stateRef.current === 'peeking' || stateRef.current === 'overlay';
        if (event.type === 'open' && floatingNow) {
            focusToggleOnClose.current = Boolean(sidebarRef.current?.contains(document.activeElement));
            closeFloating();
        } else if (event.type === 'focus-lost' && focusToggleOnClose.current) {
            focusToggleOnClose.current = false;
            toggleRef.current?.focus();
        }
    }), [closeFloating]);

    // A floating Sidebar closes on an outside press or Escape; the toggle and the Sidebar are inside.
    useEffect(() => {
        if (!floating) return undefined;
        const onPointerDown = (e) => {
            if (sidebarRef.current?.contains(e.target) || toggleRef.current?.contains(e.target)) return;
            closeFloating();
        };
        const onKeyDown = (e) => {
            // A control that handled its own Escape (a menu, a field) keeps it,
            // and so does an open modal.
            if (e.key !== 'Escape' || e.defaultPrevented || openOverlayCount() > 0) return;
            closeFloating();
            toggleRef.current?.focus();
        };
        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [floating, closeFloating]);

    const classes = [
        'plus-frame',
        docked ? 'plus-frame--sidebar-docked' : '',
        className,
    ].filter(Boolean).join(' ');

    // A plain box: the `nav` inside the Sidebar is the navigation landmark.
    const sidebarPanel = (isFloating) => (
        <div
            ref={sidebarRef}
            id={sidebarId}
            className={`plus-frame__sidebar plus-frame__sidebar--${isFloating ? 'floating' : 'docked'}`}
            onPointerEnter={isFloating ? cancelLeave : undefined}
            onPointerLeave={isFloating ? leave : undefined}
        >
            {isFloating ? <div className="plus-frame__topbar-space" aria-hidden="true" /> : null}
            {sidebar}
        </div>
    );

    const toggleProps = useMemo(() => ({
        ref: toggleRef,
        'aria-controls': docked || floating ? sidebarId : undefined,
        'aria-keyshortcuts': 'Control+[',
        onClick: toggle,
        onPointerEnter: peekSidebar,
        onPointerLeave: leave,
    }), [docked, floating, sidebarId, toggle, peekSidebar, leave]);

    const control = useMemo(() => (hasSidebar ? {
        sidebar: docked || floating ? 'open' : 'closed',
        docked,
        toggleProps,
    } : null), [hasSidebar, docked, floating, toggleProps]);

    const SurfaceTag = surfaceDirect ? 'main' : 'div';

    return (
        <div id={id} ref={frameRef} className={classes} style={style} {...props}>
            <SidebarControlContext.Provider value={control}>
                <div className="plus-frame__topbar">
                    {topbar ?? (hasSidebar ? <Topbar /> : null)}
                </div>
            </SidebarControlContext.Provider>

            {collapsed ? (
                <div className="plus-frame__edge" aria-hidden="true" onPointerEnter={peekSidebar} />
            ) : null}
            {floating ? sidebarPanel(true) : null}

            <div className="plus-frame__row">
                {docked ? sidebarPanel(false) : null}
                <SurfaceTag className="plus-frame__surface">
                    {surfaceDirect ? children : (
                        <Content
                            className={[
                                'plus-frame__content',
                                `plus-frame__content--${width}`,
                                contentClassName,
                            ].filter(Boolean).join(' ')}
                        >
                            {children}
                        </Content>
                    )}
                </SurfaceTag>
            </div>
        </div>
    );
};

Frame.propTypes = {
    id: PropTypes.string,
    /** The topbar row: a `Topbar`, which draws the Sidebar toggle from the frame's state. Defaults to a bare Topbar when there is a Sidebar. */
    topbar: PropTypes.node,
    /** Sidebar content. Without it there is no Sidebar and no toggle. */
    sidebar: PropTypes.node,
    /** Sets the Sidebar's default request: true opens it, false closes it. Under 1024 it never docks. Unset opens it where it fits. */
    sidebarDocked: PropTypes.bool,
    /** Content cap: content 1232, reading 864 */
    width: PropTypes.oneOf(['content', 'reading']),
    /** Element for the content box. `main` by default, the Page's landmark; pass `div` when the page supplies its own `main`. */
    contentAs: PropTypes.elementType,
    contentClassName: PropTypes.string,
    /** Render children straight into the page, with no content box or grid (full-bleed views). The Page itself is then the `main`. */
    surfaceDirect: PropTypes.bool,
    className: PropTypes.string,
    style: PropTypes.object,
    /** Content slot */
    children: PropTypes.node,
};

export default Frame;
