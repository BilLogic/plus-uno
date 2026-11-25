import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog } from '@base-ui/react/dialog';
import { openOverlayCount, subscribeOverlays } from '@/lib/overlay';
import { useOverlayPresence } from '@/lib/overlayMotion';
import { useMotionReduced } from '@/lib/motionPreference';
import { AreaStage } from '@/lib/navigationMotion';
import { IconButton } from '@/components';
import { PanelHostContext } from '../Panel';
import { SidebarControlContext } from '@/lib/sidebarControl';
import { PanelControlContext } from './PanelControl';
import PanelSplitter from './PanelSplitter';
import { useOwnWidth } from './useOwnWidth';
import { FRAME_LAYOUT, clamp, dockedPanelMax, resolveFrameLayout } from './frameLayout';
import './Frame.scss';

/** How long a peek survives the pointer leaving it, so a pass between toggle and panel does not drop it. */
const PEEK_LEAVE_MS = 200;

/** The sessionStorage key the Panel's width and open state are kept under, for this tab. */
export const PANEL_STORAGE_KEY = 'plus-frame-panel';

const clampPanelWidth = (n) => clamp(n, FRAME_LAYOUT.panelMin, FRAME_LAYOUT.panelMax);

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
const focusLost = (doc) => !doc.activeElement || doc.activeElement === doc.body || !doc.activeElement.isConnected
    || Boolean(doc.activeElement.closest('[inert]'));

/** A toggle that can take focus: on the page, and not inside a Sidebar that is leaving. */
const canFocus = (el) => Boolean(el?.isConnected && !el.closest('[inert]'));

/** The dismiss attempts Base UI reports for the Panel's and the floating Sidebar's dialogs that the Frame acts on. */
const DISMISS_REASONS = new Set(['outside-press', 'escape-key']);

/**
 * Frame template: the app frame, the Sidebar beside the Page (and the Panel).
 * The Page runs the full height, and meets a docked Sidebar at its 1px edge.
 *
 * - The Frame owns the Sidebar state and hands it to the Sidebar through
 *   `SidebarControlContext`. Open, the toggle (`angles-left`) ends the
 *   Sidebar's logo row; closed, the Frame draws it (`bars`) at the Page's top
 *   left, centered on x 32, and the Page's header row (`header`, the
 *   breadcrumb) follows it on the same center line from x 56.
 * - What docks is decided by the layout resolver (`./frameLayout`) from the
 *   Frame's own width: from 1024 the Sidebar docks (240, in flow); under 1024
 *   it never docks.
 * - Docked, the Sidebar sits on the sunken fill with a 1px `--ds-border` on
 *   its Page-facing edge. Floating (a peek, or opened by hand under 1024) it
 *   lies over the Page on `--ds-surface-material-overlay` with `--ds-shadow-overlay`
 *   and no Blanket.
 * - Hovering the left edge peeks a closed Sidebar. An outside press, Escape,
 *   or the pointer leaving closes the peek. Floating, the Sidebar is a
 *   non-modal Base UI `Dialog`: its dismissal and its focus return run there,
 *   and Escape hands focus to the toggle that is left.
 * - Either toggle, or Ctrl+[ (Cmd+[ on a Mac), closes a showing Sidebar and
 *   opens a closed one; focus follows to the toggle that is left.
 * - Opening a modal closes a floating Sidebar and leaves a docked
 *   one alone, and while one is open the Sidebar does not peek. The frame
 *   hears it from the shared overlay module (`@/lib/overlay`), so a page does
 *   not wire its modals to the frame. A modal opened from inside the floating
 *   Sidebar hands focus to the toggle when it closes, since its trigger left
 *   with the Sidebar.
 * - The Panel area (`panel`) is the Frame's right-hand area. Only the AI chat
 *   panel (`panelKind="ai"`, the default) docks beside the Page at a hairline
 *   when the content keeps 720, collapsing a default Sidebar first (and
 *   restoring it when the Panel closes); a Details Panel (`panelKind="details"`)
 *   always floats as an overlay at every width so the Page and Sidebar keep
 *   their full width. As an overlay, either Panel floats over the Page on the
 *   overlay material and shadow, with no Blanket, and a press outside or Escape
 *   closes it. Under 1024 it is an overlay capped at 320, and only one overlay
 *   is open at a time; under 768 it is full width. As an overlay the Panel is
 *   modal: focus moves into it and stays there, the Page and the Sidebar under
 *   it are inert, and closing it hands focus back to what opened it. Docked or
 *   peeking it is not modal and leaves focus where it is. Its open state,
 *   dismissal and focus run on Base UI's `Dialog`, portaled into the Frame's
 *   row so a dock or overlay switch never remounts the Panel's content. Its
 *   splitter resizes it from 320 to 640 (when docked, never past what keeps 720
 *   beside a docked Sidebar) by drag or keys. Width and open state are kept in
 *   sessionStorage. A modal leaves it open. Anything inside the Frame opens it
 *   through `usePanelControl`.
 * - A multi-step task runs in the
 *   Sidebar's inner mode: its steps are the rows, and the Page's footer holds
 *   the task's actions.
 * - Landmarks: the Page is `main`; the Sidebar's `nav` is the navigation; the
 *   Panel is a complementary landmark named by `panelLabel`.
 * - The Page pads `--page-pad` (24 at every width) and caps its content at
 *   `--content-max-width` (1232), centered (`width="full"` lifts the cap, `width="reading"` caps it at 864), on a 12-column grid with a
 *   16 gutter. Children span all 12 columns unless they set `grid-column`.
 */
const Frame = ({
    id,
    areaKey,
    header,
    sidebar,
    sidebarDocked,
    panel,
    panelKind = 'ai',
    panelLabel = 'AI chat',
    panelOpen: panelOpenProp,
    defaultPanelOpen = false,
    onPanelOpenChange,
    panelDefaultWidth = FRAME_LAYOUT.panelDefault,
    panelPeek = false,
    panelStorageKey = PANEL_STORAGE_KEY,
    width = 'default',
    contentAs: Content = 'main',
    contentClassName = '',
    surfaceDirect = false,
    className = '',
    style,
    children,
    ...props
}) => {
    const frameRef = useRef(null);
    const rowRef = useRef(null);
    const toggleRef = useRef(null);
    const closeRef = useRef(null);
    // Set by a toggle press or the shortcut: focus follows to the toggle that is left.
    const refocusToggle = useRef(false);
    const sidebarRef = useRef(null);
    const sidebarHostRef = useRef(null);
    const leaveTimer = useRef(null);
    const sidebarId = useId();
    const panelId = useId();
    const panelRef = useRef(null);
    const panelOpenerRef = useRef(null);
    const panelLeaveTimer = useRef(null);
    const frameWidth = useOwnWidth(frameRef);
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
        panelKind,
    }), [frameWidth, panelWidth, hand, defaultOpen, peek, panelOpen, panelKind]);

    const narrow = frameWidth < FRAME_LAYOUT.dockMin;
    const panelState = layout.panel;
    const panelOverlay = layout.panel === 'overlay';

    const docked = hasSidebar && layout.sidebar === 'docked';
    const peeking = hasSidebar && layout.sidebar === 'peeking';
    const overlay = hasSidebar && layout.sidebar === 'overlay';
    // Peeking or an overlay: the Sidebar floats over the Page instead of taking room.
    const raised = peeking || overlay;
    const collapsed = hasSidebar && layout.sidebar === 'collapsed';

    // Space moves: the Sidebar and the Panel slide on spatial springs while the Page makes room on
    // the same clock. What starts open on mount stays settled; only changes after mount animate.
    // A closing Sidebar stays mounted until its exit finishes (never a timer), inert and out of the
    // accessibility tree, so what it leaves behind is the Page's width.
    const reduced = useMotionReduced();
    const readyRef = useRef(false);
    useEffect(() => { readyRef.current = true; }, []);

    const prevDockedRef = useRef(docked);
    const prevRaisedRef = useRef(raised);
    const dockedEnteringRef = useRef(false);
    const raisedEnteringRef = useRef(false);
    const wasDocked = prevDockedRef.current;
    const wasRaised = prevRaisedRef.current;
    if (docked !== wasDocked) {
        dockedEnteringRef.current = docked && readyRef.current && !wasRaised;
        prevDockedRef.current = docked;
    }
    if (raised !== wasRaised) {
        raisedEnteringRef.current = raised && readyRef.current && !wasDocked;
        prevRaisedRef.current = raised;
    }

    // The docked Sidebar stays mounted for its exit here; the floating one runs on
    // Base UI's `Dialog`, which keeps it mounted until its exit finishes.
    const dockedRef = useRef(null);
    const dockedPresent = useOverlayPresence(docked, dockedRef);

    /** The toggle that shows: the Page's when the Sidebar is closed, else the Sidebar's own. */
    const focusToggle = useCallback(() => {
        const visible = [toggleRef.current, closeRef.current].find(canFocus);
        visible?.focus();
    }, []);

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
        // Under an open modal the Sidebar stays put, and under an overlay Panel too.
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
        refocusToggle.current = true;
        // A peek is showing: the toggle hides it, as it hides a docked Sidebar.
        if (stateRef.current === 'peeking') return;
        const opening = !(stateRef.current === 'docked' || stateRef.current === 'overlay');
        // Under 1024 only one overlay at a time: an overlay Sidebar closes the overlay Panel.
        if (opening && narrowRef.current && panelStateRef.current === 'overlay') setPanelOpen(false);
        setHand(!opening ? false : true);
    }, [cancelLeave, setHand, setPanelOpen]);

    // A peek has no pointer on it once the Sidebar docks or opens as an overlay.
    useEffect(() => {
        if (layout.sidebar === 'docked' || layout.sidebar === 'overlay') setPeek(false);
    }, [layout.sidebar]);

    // Focus follows a toggle press or the shortcut to the toggle that is left.
    useEffect(() => {
        if (!refocusToggle.current) return;
        const visible = [closeRef.current, toggleRef.current].find(canFocus);
        // A floating Sidebar mounts after this runs; its dialog takes focus to its toggle instead.
        if (!visible && layout.sidebar === 'overlay') return;
        refocusToggle.current = false;
        visible?.focus({ preventScroll: true });
    }, [layout.sidebar]);

    // Ctrl+[ (Cmd+[ on a Mac) toggles the Sidebar.
    useEffect(() => {
        if (!hasSidebar) return undefined;
        const onKeyDown = (e) => {
            // Under an open modal the Sidebar stays put, as it does for a peek.
            if (e.defaultPrevented || !(e.ctrlKey || e.metaKey) || e.altKey || e.key !== '[' || openOverlayCount() > 0) return;
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
    // Whether a modal is open: the overlay Panel then lets go of focus so the modal can hold it.
    const [modalOpen, setModalOpen] = useState(() => openOverlayCount() > 0);
    useEffect(() => subscribeOverlays((event) => {
        setModalOpen(event.count > 0);
        // The first overlay of a stack starts afresh; a confirm on top keeps the mark.
        if (event.type === 'open' && event.count === 1) focusToggleOnClose.current = false;
        const raisedNow = stateRef.current === 'peeking' || stateRef.current === 'overlay';
        if (event.type === 'open' && raisedNow) {
            focusToggleOnClose.current = Boolean(sidebarRef.current?.contains(document.activeElement));
            closeRaised();
        } else if (event.type === 'focus-lost' && focusToggleOnClose.current) {
            focusToggleOnClose.current = false;
            focusToggle();
        }
    }), [closeRaised]);

    /**
     * A raised Sidebar is a non-modal Base UI `Dialog`, and the Frame keeps the
     * rules: it closes on a press outside it or on Escape. A press on the
     * Page's toggle (which toggles it itself) leaves it open, and so does an
     * Escape that is an open modal's or that a control in the Sidebar (a menu,
     * a field) already handled. Focus leaving it does not close it.
     */
    const sidebarKeepsOpen = (next, details) => {
        if (next || !DISMISS_REASONS.has(details?.reason) || openOverlayCount() > 0) return true;
        const event = details.event;
        if (details.reason === 'escape-key') return Boolean(event?.defaultPrevented);
        return Boolean(toggleRef.current?.contains(event?.target));
    };
    const handleSidebarOpenChange = (next, details) => {
        if (sidebarKeepsOpen(next, details)) {
            // An attempt the Frame ignores leaves the event alone for anything else listening.
            details?.cancel?.();
            details?.allowPropagation?.();
            return;
        }
        // Escape hands focus to the toggle that is left, even from outside the Sidebar:
        // Base UI skips its return focus once focus has moved out, so the Frame does it.
        if (details.reason === 'escape-key') refocusToggle.current = true;
        closeRaised();
    };

    // Opened by a toggle press or the shortcut, focus goes to the Sidebar's own toggle; a peek takes none.
    const sidebarInitialFocus = useCallback(() => {
        if (!refocusToggle.current) return false;
        refocusToggle.current = false;
        return canFocus(closeRef.current) ? closeRef.current : false;
    }, []);

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

    // An overlay Panel is modal; docked or peeking it is not.
    const panelModal = panelShown && panelOverlay && !panelPeekShown;
    const wasPanelShownRef = useRef(panelShown);
    const panelModalRef = useRef(panelModal);
    panelModalRef.current = panelModal;
    // Only an overlay or a peek is dismissed; a docked Panel closes from its own controls.
    const panelDismissible = panelModal || panelPeekShown;

    /**
     * Base UI reports each attempt to dismiss the Panel's dialog; the Frame
     * keeps the rules. Only an overlay or a peek is dismissed, by a press
     * outside it or by Escape. A press inside an open modal, in
     * a popup drawn outside the Frame, or on a trigger that controls the Panel
     * (which toggles it itself) leaves it open. So does Escape while a modal
     * is open, since that Escape is the modal's, and an Escape a control in
     * the Panel (a menu, a field) already handled.
     */
    const panelKeepsOpen = (next, details) => {
        if (next || !panelDismissible) return true;
        if (!DISMISS_REASONS.has(details?.reason) || openOverlayCount() > 0) return true;
        const event = details.event;
        if (details.reason === 'escape-key') return Boolean(event?.defaultPrevented);
        const target = event?.target;
        if (!frameRef.current?.contains(target) || panelRef.current?.contains(target)) return true;
        return Boolean(target.closest?.(`[aria-controls="${panelId}"]`));
    };
    const handlePanelOpenChange = (next, details) => {
        if (panelKeepsOpen(next, details)) {
            // An attempt the Frame ignores leaves the event alone, so an Escape
            // still reaches the Sidebar's peek and anything else listening.
            details?.cancel?.();
            details?.allowPropagation?.();
            return;
        }
        if (panelPeekShown) setPanelPeeking(false);
        else setPanelOpen(false);
    };

    // A Panel that turns into an overlay while open (the Sidebar opened by
    // hand, a narrower window) takes focus in, as opening it would have.
    const wasPanelModal = useRef(panelModal);
    useEffect(() => {
        const doc = frameRef.current?.ownerDocument ?? document;
        if (panelModal && !wasPanelModal.current && wasPanelShownRef.current
            && !panelRef.current?.contains(doc.activeElement)) {
            panelRef.current?.focus();
        }
        wasPanelModal.current = panelModal;
        wasPanelShownRef.current = panelShown;
    }, [panelModal, panelShown]);

    // Opening moves focus in: an overlay always (to its first control), a
    // docked Panel only when what had focus left the page (a Sidebar that
    // auto-collapsed under it), and a peek never.
    const panelInitialFocus = useCallback(() => {
        if (panelModalRef.current) return true;
        const doc = frameRef.current?.ownerDocument ?? document;
        return panelStateRef.current === 'docked' && focusLost(doc) ? panelRef.current : false;
    }, []);

    // Closing hands focus back to what opened it (or the toggle, if that left
    // the page) when focus was in the Panel or nowhere; focus already moved
    // elsewhere, to the Sidebar toggle say, stays there.
    const panelFinalFocus = useCallback(() => {
        const doc = frameRef.current?.ownerDocument ?? document;
        if (!focusLost(doc) && !panelRef.current?.contains(doc.activeElement)) return false;
        const opener = panelOpenerRef.current;
        return (canFocus(opener) ? opener : [toggleRef.current, closeRef.current].find(canFocus)) ?? false;
    }, []);

    // The splitter's range never lets a resize collapse the Sidebar. Docked,
    // the widest width keeps the content floor beside whatever is docked now.
    // As an overlay AI panel beside a Sidebar docked by default, the narrowest
    // width stays too wide for the Panel to dock alone, which would collapse it.
    // A Details Panel never docks, so it always keeps the full 320..640 range.
    const room = frameWidth - FRAME_LAYOUT.pagePad * 2 - FRAME_LAYOUT.contentFloor;
    const splitterMax = panelKind === 'ai' && panelState === 'docked'
        ? dockedPanelMax({ frameWidth, sidebarDocked: layout.sidebar === 'docked' })
        : FRAME_LAYOUT.panelMax;
    const splitterMin = panelKind === 'ai' && panelState === 'overlay' && layout.sidebar === 'docked' && hand !== true
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

    const lastPanelLook = useRef({ mode: panelKind === 'ai' ? 'docked' : 'overlay', width: panelWidth, narrow });
    const prevPanelLiveRef = useRef(panelPeekShown ? 'peek' : panelState);
    const panelEnteringRef = useRef(false);
    const renderPanel = () => {
        // Closing, the resolver says 'none' and a width of nothing; the Panel keeps its last look for its exit.
        const live = panelPeekShown ? 'peek' : panelState;
        if (live !== prevPanelLiveRef.current) {
            panelEnteringRef.current = live !== 'none' && readyRef.current;
            prevPanelLiveRef.current = live;
        }
        const liveWidth = panelPeekShown
            ? (narrow ? layout.panelWidth : panelWidth)
            : (panelPreview ?? layout.panelWidth);
        if (live !== 'none') lastPanelLook.current = { mode: live, width: liveWidth, narrow };
        const { mode, width, narrow: lookNarrow } = live !== 'none'
            ? { mode: live, width: liveWidth, narrow }
            : lastPanelLook.current;
        // The splitter resizes from 1024 up; under it the Panel is fixed at 320, or full width under 768.
        const resizable = mode !== 'peek' && !lookNarrow;
        return (
            <Dialog.Popup
                ref={panelRef}
                id={panelId}
                // Docked or peeking it is the complementary landmark; as an overlay, a Modal.
                role={panelModal ? 'dialog' : 'complementary'}
                aria-modal={panelModal ? 'true' : undefined}
                aria-label={panelLabel}
                tabIndex={-1}
                initialFocus={panelInitialFocus}
                finalFocus={panelFinalFocus}
                className={`plus-frame__panel plus-frame__panel--${mode}${mode === 'overlay' && lookNarrow ? ' plus-frame__panel--narrow' : ''}`}
                data-entering={panelEnteringRef.current ? 'true' : undefined}
                data-reduced={reduced ? 'true' : undefined}
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
            </Dialog.Popup>
        );
    };

    const classes = [
        'plus-frame',
        docked ? 'plus-frame--sidebar-docked' : '',
        hasSidebar ? 'plus-frame--with-sidebar' : '',
        className,
    ].filter(Boolean).join(' ');

    // A plain box: the `nav` inside the Sidebar is the navigation landmark. A leaving one is only
    // the exit's last frames: it is inert and hidden, and the live Sidebar owns the id and the ref.
    // Floating, it is the popup of a non-modal Base UI `Dialog`, still with no role of its own.
    const sidebarPanel = (isRaised, leaving, entering) => {
        const Box = isRaised ? Dialog.Popup : 'div';
        const dialogProps = isRaised ? { role: undefined, initialFocus: sidebarInitialFocus, finalFocus: false } : {};
        return (
            <Box
                {...dialogProps}
                ref={(el) => {
                    if (!isRaised) dockedRef.current = el;
                    if (!leaving) sidebarRef.current = el;
                }}
                id={leaving ? undefined : sidebarId}
                className={`plus-frame__sidebar plus-frame__sidebar--${isRaised ? 'raised' : 'docked'}`}
                data-entering={!leaving && entering ? 'true' : undefined}
                data-reduced={reduced ? 'true' : undefined}
                data-leaving={leaving && readyRef.current ? 'true' : undefined}
                hidden={leaving && (isRaised ? docked : !readyRef.current) ? true : undefined}
                style={!isRaised && leaving && raised ? { visibility: 'hidden' } : undefined}
                inert={panelModal || leaving}
                aria-hidden={leaving ? true : undefined}
                onPointerEnter={isRaised && !leaving ? cancelLeave : undefined}
                onPointerLeave={isRaised && !leaving ? leave : undefined}
            >
                {sidebar}
            </Box>
        );
    };

    const shortcut = 'Control+[ Meta+[';

    // The Page's toggle, drawn while the Sidebar is closed (or only peeking): it opens it.
    const toggleProps = useMemo(() => ({
        ref: toggleRef,
        'aria-controls': raised ? sidebarId : undefined,
        'aria-keyshortcuts': shortcut,
        onClick: toggle,
    }), [raised, sidebarId, toggle]);

    // The Sidebar's own toggle, at the end of its logo row: it closes it.
    const closeProps = useMemo(() => ({
        ref: closeRef,
        'aria-controls': sidebarId,
        'aria-keyshortcuts': shortcut,
        onClick: toggle,
    }), [sidebarId, toggle]);

    const control = useMemo(() => (hasSidebar ? {
        sidebar: docked || raised ? 'open' : 'closed',
        docked,
        floating: raised,
        toggleProps,
        closeProps,
    } : null), [hasSidebar, docked, raised, toggleProps, closeProps]);

    // The Page's toggle shows whenever the Sidebar is not docked or open over the Page.
    const pageToggle = hasSidebar && !docked && !overlay ? (
        <IconButton
            className="plus-frame__toggle"
            appearance="subtle"
            icon="bars"
            label="Open sidebar"
            tooltip="Open sidebar · Ctrl ["
            aria-expanded={false}
            {...toggleProps}
        />
    ) : null;
    const pageHead = pageToggle || header ? (
        <div className={['plus-frame__head', width === 'reading' ? 'plus-frame__head--reading' : '', pageToggle ? 'plus-frame__head--toggle' : ''].filter(Boolean).join(' ')}>
            {pageToggle}
            {header}
        </div>
    ) : null;

    const SurfaceTag = surfaceDirect ? 'main' : 'div';

    return (
        <div id={id} ref={frameRef} className={classes} style={style} {...props}>
            <PanelControlContext.Provider value={panelControl}>
                <SidebarControlContext.Provider value={control}>
                {collapsed ? (
                    <div className="plus-frame__edge" aria-hidden="true" onPointerEnter={peekSidebar} />
                ) : null}
                {/* The floating Sidebar's place in the tree, so Tab moves from it into the Page. */}
                {hasSidebar ? (
                    <div ref={sidebarHostRef} className="plus-frame__sidebar-host">
                        <Dialog.Root open={raised} onOpenChange={handleSidebarOpenChange} modal={false}>
                            <Dialog.Portal container={sidebarHostRef} className="plus-frame__sidebar-host">
                                {sidebarPanel(true, !raised, raisedEnteringRef.current)}
                            </Dialog.Portal>
                        </Dialog.Root>
                    </div>
                ) : null}

                {hasPanel && panelPeek && !panelOpen && !panelPeekShown ? (
                    <div className="plus-frame__panel-edge" aria-hidden="true" onPointerEnter={peekPanel} />
                ) : null}

                <div ref={rowRef} className="plus-frame__row">
                    {dockedPresent && hasSidebar ? sidebarPanel(false, !docked, dockedEnteringRef.current) : null}
                    {/* With an overlay Panel open the Page is out of reach for keyboards too. */}
                    <SurfaceTag className="plus-frame__surface" inert={panelModal}>
                        {(() => {
                            const body = surfaceDirect ? children : (
                                <Content
                                    className={[
                                        'plus-frame__content',
                                        `plus-frame__content--${width}`,
                                        contentClassName,
                                    ].filter(Boolean).join(' ')}
                                >
                                    {children}
                                </Content>
                            );
                            if (areaKey === undefined) return <>{pageHead}{body}</>;
                            if (pageToggle) return <>{pageHead}<AreaStage areaKey={areaKey}>{body}</AreaStage></>;
                            return <AreaStage areaKey={areaKey}>{pageHead}{body}</AreaStage>;
                        })()}
                    </SurfaceTag>
                </div>
                {/* One place in the tree for every Panel state, so docking or overlaying never remounts its content. */}
                <Dialog.Root
                    open={panelShown || panelPeekShown}
                    onOpenChange={handlePanelOpenChange}
                    // Modal only as an overlay, and only while no modal (or floating Panel) is over it.
                    modal={panelModal && !modalOpen ? 'trap-focus' : false}
                    disablePointerDismissal={!panelDismissible}
                >
                    <Dialog.Portal container={rowRef} className="plus-frame__panel-host">
                        {renderPanel()}
                    </Dialog.Portal>
                </Dialog.Root>
                </SidebarControlContext.Provider>
            </PanelControlContext.Provider>
        </div>
    );
};

Frame.propTypes = {
    id: PropTypes.string,
    /** Current Sidebar area key: changing it fades the old page out on `appearance.fast`, then fades the new page in on `appearance.default`. */
    areaKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    /** The Page's header row, 32 high on the logo row's center line: the breadcrumb. While the Sidebar is closed it follows the toggle.
     * @ds-context Used in: Frame.header (ds guide frame)
     */
    header: PropTypes.node,
    /** Sidebar content. Without it there is no Sidebar and no toggle.
     * @ds-context Used in: Frame.sidebar (ds guide frame)
     */
    sidebar: PropTypes.node,
    /** Sets the Sidebar's default request: true opens it, false closes it. Under 1024 it never docks. Unset opens it where it fits. */
    sidebarDocked: PropTypes.bool,
    /** Panel area content, usually a `PanelContainer` and its parts. Without it there is no Panel.
     * @ds-context Used in: Frame.panel (ds guide frame)
     */
    panel: PropTypes.node,
    /** Whether the Panel is the dockable AI panel (`'ai'`) or a Details Panel (`'details'`), which always floats over the Page with no Blanket. */
    panelKind: PropTypes.oneOf(['ai', 'details']),
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
    /** Content type: default caps the grid at 1232, full has no cap (chat, a board, a wide table), reading caps it at 864. */
    width: PropTypes.oneOf(['default', 'full', 'reading']),
    /** Element for the content box. `main` by default, the Page's landmark; pass `div` when the page supplies its own `main`. */
    contentAs: PropTypes.elementType,
    contentClassName: PropTypes.string,
    /** Render children straight into the page, with no content box or grid (full-bleed views). The Page itself is then the `main`. */
    surfaceDirect: PropTypes.bool,
    className: PropTypes.string,
    style: PropTypes.object,
    /** Content slot
     * @ds-context Used in: Frame.children (ds guide frame)
     */
    children: PropTypes.node,
};

export default Frame;
