import React, { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { openOverlayCount, subscribeOverlays } from '@/lib/overlay';
import { PanelHostContext } from '@/components';
import Topbar from '../Topbar';
import { SidebarControlContext } from './SidebarControl';
import { PanelControlContext } from './PanelControl';
import PanelSplitter from './PanelSplitter';
import { FRAME_LAYOUT, resolveFrameLayout } from './frameLayout';
import './Frame.scss';

/** How long a peek survives the pointer leaving it, so a pass between toggle and panel does not drop it. */
const PEEK_LEAVE_MS = 200;

/** The sessionStorage key the Panel's width and open state are kept under, for this tab. */
export const PANEL_STORAGE_KEY = 'plus-frame-panel';

const clampPanelWidth = (n) => Math.min(FRAME_LAYOUT.panelMax, Math.max(FRAME_LAYOUT.panelMin, n));

/** The Panel's remembered `{ open, width }`, or null where there is none or no storage. */
const readPanelMemory = (key) => {
    if (!key || typeof window === 'undefined') return null;
    try {
        const memory = JSON.parse(window.sessionStorage.getItem(key));
        return memory && typeof memory === 'object' ? memory : null;
    } catch {
        return null;
    }
};

const writePanelMemory = (key, memory) => {
    if (!key || typeof window === 'undefined') return;
    try {
        window.sessionStorage.setItem(key, JSON.stringify(memory));
    } catch {
        // Storage full or blocked: the Panel still works, it just forgets.
    }
};

/** Whether focus has nowhere to be: on the body, or on an element that left the page. */
const focusLost = (doc) => !doc.activeElement || doc.activeElement === doc.body || !doc.activeElement.isConnected;

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
 * - The Panel area (`panel`) is the Frame's right-hand area, under the
 *   Topbar. The resolver docks it beside the Page at a hairline when the
 *   content keeps 720, collapsing a default Sidebar first (and restoring it
 *   when the Panel closes); otherwise it opens over the Page on a Blanket that
 *   covers the Page and the Sidebar but not the Topbar, and a press outside or
 *   Escape closes it. Under 1024 it is an overlay capped at 320, and only one
 *   overlay is open at a time; under 768 it is full width. Its splitter
 *   resizes it from 320 to 640 (never past what keeps 720 beside a docked
 *   Sidebar) by drag or keys. Width and open state are kept in
 *   sessionStorage. A modal leaves it open. Anything inside the Frame opens
 *   it through `usePanelControl`.
 * - Landmarks: the Page is `main`; the Sidebar's `nav` is the navigation; the
 *   Panel is a complementary landmark named by `panelLabel`.
 * - The Page pads `--page-pad` (24 at every width) and caps its content at
 *   `--content-max-width` (1232), centered, on a 12-column grid with a
 *   16 gutter. Children span all 12 columns unless they set `grid-column`.
 */
const Frame = ({
    id,
    topbar,
    sidebar,
    sidebarDocked,
    panel,
    panelLabel = 'AI chat',
    panelOpen: panelOpenProp,
    defaultPanelOpen = false,
    onPanelOpenChange,
    panelDefaultWidth = FRAME_LAYOUT.panelDefault,
    panelPeek = false,
    panelStorageKey = PANEL_STORAGE_KEY,
    listDetail = false,
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
    const panelId = useId();
    const panelRef = useRef(null);
    const panelOpenerRef = useRef(null);
    const panelLeaveTimer = useRef(null);
    const frameWidth = useFrameWidth(frameRef);
    const hasSidebar = Boolean(sidebar);
    const hasPanel = Boolean(panel);

    // The Panel's open state and width, remembered for the tab in sessionStorage.
    const [panelMemory] = useState(() => readPanelMemory(panelStorageKey));
    const [panelOpenState, setPanelOpenState] = useState(() => (
        typeof panelMemory?.open === 'boolean' ? panelMemory.open : defaultPanelOpen
    ));
    const panelOpen = hasPanel && (panelOpenProp ?? panelOpenState);
    const [panelWidth, setPanelWidth] = useState(() => clampPanelWidth(
        Number.isFinite(panelMemory?.width) ? panelMemory.width : panelDefaultWidth,
    ));
    // The width a splitter drag draws, past the limits while it resists; null when settled.
    const [panelPreview, setPanelPreview] = useState(null);
    const [panelPeeking, setPanelPeeking] = useState(false);

    // A controlled Panel's open state belongs to its owner, so only the width is kept for it.
    const panelControlled = panelOpenProp !== undefined;
    useEffect(() => {
        if (!hasPanel) return;
        writePanelMemory(panelStorageKey, panelControlled ? { width: panelWidth } : { open: panelOpen, width: panelWidth });
    }, [hasPanel, panelStorageKey, panelControlled, panelOpen, panelWidth]);

    // `sidebarDocked` sets the default request; a press on the toggle (or
    // Ctrl+[) overrides it by hand until the prop changes.
    const defaultOpen = sidebarDocked ?? true;
    // The hand choice is stamped with the default it was made against, so a new
    // `sidebarDocked` drops it in the same render rather than one paint later.
    const [handChoice, setHandChoice] = useState({ open: null, against: defaultOpen });
    const hand = handChoice.against === defaultOpen ? handChoice.open : null;
    const setHand = useCallback((next) => {
        setHandChoice((h) => ({ open: typeof next === 'function' ? next(h.open) : next, against: defaultOpen }));
    }, [defaultOpen]);
    const [peek, setPeek] = useState(false);

    const layout = useMemo(() => resolveFrameLayout({
        frameWidth,
        panelWidth,
        sidebar: hand === null ? { open: defaultOpen, setBy: 'default' } : { open: hand, setBy: 'hand' },
        sidebarPeek: peek,
        chatMode: panelOpen ? 'panel' : 'popup',
        listDetail,
    }), [frameWidth, panelWidth, hand, defaultOpen, peek, panelOpen, listDetail]);

    const narrow = frameWidth < FRAME_LAYOUT.dockMin;
    const panelState = layout.panel;
    const panelOverlay = panelState === 'overlay';

    const docked = hasSidebar && layout.sidebar === 'docked';
    const peeking = hasSidebar && layout.sidebar === 'peeking';
    const overlay = hasSidebar && layout.sidebar === 'overlay';
    // Peeking or an overlay: the Sidebar floats over the Page instead of taking room.
    const raised = peeking || overlay;
    const collapsed = hasSidebar && layout.sidebar === 'collapsed';

    const cancelLeave = useCallback(() => {
        if (leaveTimer.current) {
            clearTimeout(leaveTimer.current);
            leaveTimer.current = null;
        }
    }, []);
    useEffect(() => cancelLeave, [cancelLeave]);

    // The latest Panel state, read by handlers that must not re-bind on every change.
    const panelStateRef = useRef(panelState);
    panelStateRef.current = panelState;
    const narrowRef = useRef(narrow);
    narrowRef.current = narrow;

    const peekSidebar = useCallback(() => {
        cancelLeave();
        // Under an open modal the Sidebar stays put, and under an overlay Panel's Blanket too.
        if (openOverlayCount() > 0 || panelStateRef.current === 'overlay') return;
        setPeek(true);
    }, [cancelLeave]);

    const leave = useCallback(() => {
        cancelLeave();
        leaveTimer.current = setTimeout(() => {
            leaveTimer.current = null;
            setPeek(false);
        }, PEEK_LEAVE_MS);
    }, [cancelLeave]);

    /**
     * Closes what is raised over the Page: a peek and an overlay Sidebar. An
     * overlay opened by hand returns to the default request rather than
     * counting as a choice to keep it shut, so widening the Frame still docks it.
     */
    const closeRaised = useCallback(() => {
        cancelLeave();
        setPeek(false);
        setHand((h) => (h === true ? null : h));
    }, [cancelLeave, setHand]);

    // The latest resolved state, read by handlers that must not re-bind on every change.
    const stateRef = useRef(layout.sidebar);
    stateRef.current = layout.sidebar;

    const setPanelOpen = useCallback((next) => {
        const doc = frameRef.current?.ownerDocument ?? document;
        if (next) {
            const active = doc.activeElement;
            panelOpenerRef.current = active && active !== doc.body && !panelRef.current?.contains(active) ? active : null;
            // Under 1024 only one overlay at a time: an overlay Sidebar gives way to the Panel.
            if (narrowRef.current) setHand((h) => (h === true ? null : h));
        }
        setPanelPeeking(false);
        if (panelOpenProp === undefined) setPanelOpenState(next);
        onPanelOpenChange?.(next);
    }, [panelOpenProp, onPanelOpenChange, setHand]);

    const toggle = useCallback(() => {
        cancelLeave();
        setPeek(false);
        const opening = !(stateRef.current === 'docked' || stateRef.current === 'overlay');
        // Under 1024 only one overlay at a time: an overlay Sidebar closes the overlay Panel.
        if (opening && narrowRef.current && panelStateRef.current === 'overlay') setPanelOpen(false);
        setHand(!opening ? false : true);
    }, [cancelLeave, setHand, setPanelOpen]);

    // A peek has no pointer on it once the Sidebar docks or opens as an overlay.
    useEffect(() => {
        if (layout.sidebar === 'docked' || layout.sidebar === 'overlay') setPeek(false);
    }, [layout.sidebar]);

    // Ctrl+[ toggles the Sidebar.
    useEffect(() => {
        if (!hasSidebar) return undefined;
        const onKeyDown = (e) => {
            // Under an open modal the Sidebar stays put, as it does for a peek.
            if (e.defaultPrevented || !e.ctrlKey || e.altKey || e.metaKey || e.key !== '[' || openOverlayCount() > 0) return;
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
        const raisedNow = stateRef.current === 'peeking' || stateRef.current === 'overlay';
        if (event.type === 'open' && raisedNow) {
            focusToggleOnClose.current = Boolean(sidebarRef.current?.contains(document.activeElement));
            closeRaised();
        } else if (event.type === 'focus-lost' && focusToggleOnClose.current) {
            focusToggleOnClose.current = false;
            toggleRef.current?.focus();
        }
    }), [closeRaised]);

    // A raised Sidebar closes on an outside press or Escape; the toggle and the Sidebar are inside.
    useEffect(() => {
        if (!raised) return undefined;
        const onPointerDown = (e) => {
            if (sidebarRef.current?.contains(e.target) || toggleRef.current?.contains(e.target)) return;
            closeRaised();
        };
        const onKeyDown = (e) => {
            // A control that handled its own Escape (a menu, a field) keeps it,
            // and so does an open modal.
            if (e.key !== 'Escape' || e.defaultPrevented || openOverlayCount() > 0) return;
            closeRaised();
            toggleRef.current?.focus();
        };
        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [raised, closeRaised]);

    /* ------------------------------------------------------------- panel */

    const panelShown = panelOpen && panelState !== 'none';
    const panelPeekShown = hasPanel && panelPeek && !panelOpen && panelPeeking;

    const cancelPanelLeave = useCallback(() => {
        if (panelLeaveTimer.current) {
            clearTimeout(panelLeaveTimer.current);
            panelLeaveTimer.current = null;
        }
    }, []);
    useEffect(() => cancelPanelLeave, [cancelPanelLeave]);

    const peekPanel = useCallback(() => {
        cancelPanelLeave();
        if (openOverlayCount() > 0) return;
        setPanelPeeking(true);
    }, [cancelPanelLeave]);

    const leavePanel = useCallback(() => {
        cancelPanelLeave();
        panelLeaveTimer.current = setTimeout(() => {
            panelLeaveTimer.current = null;
            setPanelPeeking(false);
        }, PEEK_LEAVE_MS);
    }, [cancelPanelLeave]);

    // Opening the Panel moves focus into it when what had focus left the page
    // (a Sidebar that auto-collapsed under it); closing it hands focus back to
    // what opened it.
    const wasPanelShown = useRef(panelShown);
    useEffect(() => {
        const doc = frameRef.current?.ownerDocument ?? document;
        if (panelShown && !wasPanelShown.current && focusLost(doc)) panelRef.current?.focus();
        if (!panelShown && wasPanelShown.current && focusLost(doc)) {
            const opener = panelOpenerRef.current;
            (opener?.isConnected ? opener : toggleRef.current)?.focus();
        }
        wasPanelShown.current = panelShown;
    }, [panelShown]);

    // An overlay Panel closes on a press outside it in the Frame (the Blanket
    // or the Topbar) or on Escape. Presses inside an open modal, or in a popup
    // drawn outside the Frame, leave it open.
    useEffect(() => {
        if (!(panelShown && panelOverlay) && !panelPeekShown) return undefined;
        const close = () => (panelPeekShown ? setPanelPeeking(false) : setPanelOpen(false));
        const onPointerDown = (e) => {
            if (openOverlayCount() > 0) return;
            if (!frameRef.current?.contains(e.target) || panelRef.current?.contains(e.target)) return;
            // A trigger that controls the Panel (in the Topbar, say) toggles it itself.
            if (e.target.closest?.(`[aria-controls="${panelId}"]`)) return;
            close();
        };
        const onKeyDown = (e) => {
            if (e.key !== 'Escape' || e.defaultPrevented || openOverlayCount() > 0) return;
            close();
        };
        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [panelShown, panelOverlay, panelPeekShown, setPanelOpen, panelId]);

    // The splitter's range never lets a resize collapse the Sidebar. Docked,
    // the widest width keeps the content floor beside whatever is docked now.
    // As an overlay beside a Sidebar docked by default, the narrowest width
    // stays too wide for the Panel to dock alone, which would collapse it.
    const room = frameWidth - FRAME_LAYOUT.pagePad * 2 - FRAME_LAYOUT.contentFloor;
    const splitterMax = panelState === 'docked'
        ? clampPanelWidth(room - (layout.sidebar === 'docked' ? FRAME_LAYOUT.sidebarWidth : 0))
        : FRAME_LAYOUT.panelMax;
    const splitterMin = panelState === 'overlay' && layout.sidebar === 'docked' && hand !== true
        ? clampPanelWidth(room + 1)
        : FRAME_LAYOUT.panelMin;
    const commitPanelWidth = useCallback((next) => setPanelWidth(clampPanelWidth(next)), []);

    const panelControl = useMemo(() => (hasPanel ? {
        open: panelOpen,
        setOpen: setPanelOpen,
        state: panelOpen ? panelState : 'none',
        width: layout.panelWidth,
        panelId,
    } : null), [hasPanel, panelOpen, setPanelOpen, panelState, layout.panelWidth, panelId]);

    const renderPanel = () => {
        const mode = panelPeekShown ? 'peek' : panelState;
        const width = panelPeekShown
            ? (narrow ? layout.panelWidth : panelWidth)
            : (panelPreview ?? layout.panelWidth);
        // The splitter resizes from 1024 up; under it the Panel is fixed at 320, or full width under 768.
        const resizable = !panelPeekShown && !narrow;
        return (
            <aside
                ref={panelRef}
                id={panelId}
                aria-label={panelLabel}
                tabIndex={-1}
                className={`plus-frame__panel plus-frame__panel--${mode}`}
                style={{ '--frame-panel-width': `${width}px` }}
                onPointerEnter={panelPeekShown ? cancelPanelLeave : undefined}
                onPointerLeave={panelPeekShown ? leavePanel : undefined}
            >
                {resizable ? (
                    <PanelSplitter
                        width={panelWidth}
                        min={splitterMin}
                        max={Math.max(splitterMin, splitterMax)}
                        controls={panelId}
                        onCommit={commitPanelWidth}
                        onPreview={setPanelPreview}
                    />
                ) : null}
                <PanelHostContext.Provider value>
                    {panel}
                </PanelHostContext.Provider>
            </aside>
        );
    };

    const classes = [
        'plus-frame',
        docked ? 'plus-frame--sidebar-docked' : '',
        className,
    ].filter(Boolean).join(' ');

    // A plain box: the `nav` inside the Sidebar is the navigation landmark.
    const sidebarPanel = (isRaised) => (
        <div
            ref={sidebarRef}
            id={sidebarId}
            className={`plus-frame__sidebar plus-frame__sidebar--${isRaised ? 'raised' : 'docked'}`}
            onPointerEnter={isRaised ? cancelLeave : undefined}
            onPointerLeave={isRaised ? leave : undefined}
        >
            {isRaised ? <div className="plus-frame__topbar-space" aria-hidden="true" /> : null}
            {sidebar}
        </div>
    );

    const toggleProps = useMemo(() => ({
        ref: toggleRef,
        'aria-controls': docked || raised ? sidebarId : undefined,
        'aria-keyshortcuts': 'Control+[',
        onClick: toggle,
        onPointerEnter: peekSidebar,
        onPointerLeave: leave,
    }), [docked, raised, sidebarId, toggle, peekSidebar, leave]);

    const control = useMemo(() => (hasSidebar ? {
        sidebar: docked || raised ? 'open' : 'closed',
        docked,
        toggleProps,
    } : null), [hasSidebar, docked, raised, toggleProps]);

    const SurfaceTag = surfaceDirect ? 'main' : 'div';

    return (
        <div id={id} ref={frameRef} className={classes} style={style} {...props}>
            <PanelControlContext.Provider value={panelControl}>
                <SidebarControlContext.Provider value={control}>
                    <div className="plus-frame__topbar">
                        {topbar ?? (hasSidebar ? <Topbar /> : null)}
                    </div>
                </SidebarControlContext.Provider>

                {collapsed ? (
                    <div className="plus-frame__edge" aria-hidden="true" onPointerEnter={peekSidebar} />
                ) : null}
                {raised ? sidebarPanel(true) : null}

                {/* Covers the Page and the Sidebar, never the Topbar. A press on it closes the Panel. */}
                {panelShown && panelOverlay ? <div className="plus-frame__blanket" aria-hidden="true" /> : null}
                {hasPanel && panelPeek && !panelOpen && !panelPeekShown ? (
                    <div className="plus-frame__panel-edge" aria-hidden="true" onPointerEnter={peekPanel} />
                ) : null}

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
                    {/* One place in the tree for every Panel state, so docking or overlaying never remounts its content. */}
                    {panelShown || panelPeekShown ? renderPanel() : null}
                </div>
            </PanelControlContext.Provider>
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
    /** Panel area content, usually a `PanelContainer` and its parts. Without it there is no Panel. */
    panel: PropTypes.node,
    /** The Panel's complementary landmark name, named for its content. */
    panelLabel: PropTypes.string,
    /** Controlled open state. Leave unset to let the Frame keep it (and remember it for the tab). */
    panelOpen: PropTypes.bool,
    /** Uncontrolled: whether the Panel starts open when the tab has nothing remembered. */
    defaultPanelOpen: PropTypes.bool,
    /** Called with the next open state whenever the Panel opens or closes. */
    onPanelOpenChange: PropTypes.func,
    /** The width (px) the Panel opens at when the tab has nothing remembered: 320 to 640, default 400. */
    panelDefaultWidth: PropTypes.number,
    /** Hovering the Frame's right edge peeks a closed Panel over the Page, with no Blanket. Off by default. */
    panelPeek: PropTypes.bool,
    /** The sessionStorage key the Panel's width and open state are kept under; null keeps nothing. */
    panelStorageKey: PropTypes.string,
    /** A List and detail layout is on the Page: the Sidebar collapses first to keep the 960 split. */
    listDetail: PropTypes.bool,
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
