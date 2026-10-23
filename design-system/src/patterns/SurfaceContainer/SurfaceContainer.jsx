import React, { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Topbar from '../Topbar';
import { SidebarControlContext } from './SidebarControl';
import './SurfaceContainer.scss';

/** The sidebar docks from Large (1024), the same breakpoint the Layout tokens switch on. */
const DOCK_QUERY = '(min-width: 1024px)';
/** How long a peek survives the pointer leaving it, so a pass between toggle and panel does not drop it. */
const PEEK_LEAVE_MS = 200;

/**
 * Storybook's ResponsiveFrame can name a breakpoint (`data-plus-breakpoint`)
 * for a preview narrower or wider than the docs column; that wins over the
 * viewport for the docked default.
 * @param {Element | null} el
 * @returns {boolean | null} null when no breakpoint is named
 */
const forcedWide = (el) => {
    const bp = el?.closest?.('[data-plus-breakpoint]')?.getAttribute('data-plus-breakpoint');
    if (bp === 'md') return false;
    if (bp === 'lg' || bp === 'xl') return true;
    return null;
};

const viewportWide = () => typeof window !== 'undefined' && window.matchMedia?.(DOCK_QUERY).matches === true;

/**
 * Whether the frame is at Large or wider. Follows the viewport, because the
 * tokens it pairs with (`--layout-pad-left-container`, `--surface-pad`) switch
 * on the viewport.
 * @param {React.RefObject<HTMLElement>} ref
 * @returns {boolean}
 */
const useWide = (ref) => {
    const [wide, setWide] = useState(viewportWide);
    useLayoutEffect(() => {
        const read = () => setWide(forcedWide(ref.current) ?? viewportWide());
        read();
        const mq = window.matchMedia?.(DOCK_QUERY);
        mq?.addEventListener?.('change', read);
        // A docs breakpoint switch changes the frame's width without a remount.
        const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(read);
        if (ref.current) ro?.observe(ref.current);
        return () => {
            mq?.removeEventListener?.('change', read);
            ro?.disconnect();
        };
    }, [ref]);
    return wide;
};

/**
 * Surface container pattern: the app frame. Mirrors the Figma
 * `Pattern/Surface container`: a 32 topbar over a row holding the sidebar and
 * the surface.
 *
 * - The frame owns the sidebar state; the Topbar in the `topbar` slot draws the
 *   one toggle from it (through `SidebarControlContext`). Without a `topbar`,
 *   the frame renders a bare Topbar so the toggle is still there.
 * - The sidebar toggle sits at (8, 8) at every width and never moves.
 * - From 1024 the sidebar docks (240, in flow). Below 1024 it is closed.
 * - Hovering the toggle or the left edge peeks a closed sidebar: it floats over
 *   the page with a shadow and no scrim, so the page does not move. An outside
 *   click, Escape, or the pointer leaving closes the peek.
 * - Clicking the toggle docks a closed or peeking sidebar, at any width, and
 *   closes a docked one. Docked below 1024, the surface is narrower than the
 *   content minimum (720), so the surface scrolls sideways.
 * - The surface pads `--surface-pad` (16 · 16 · 24) and caps its content at
 *   `--layout-max-width-content` (1232), centered, on a 12-column grid with a
 *   16 gutter. Children span all 12 columns unless they set `grid-column`.
 */
const SurfaceContainer = ({
    id,
    topbar,
    sidebar,
    sidebarDocked,
    sidebarLabel = 'Sidebar',
    width = 'content',
    contentAs: Content = 'div',
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
    const wide = useWide(frameRef);
    const hasSidebar = Boolean(sidebar);

    const dockedByDefault = sidebarDocked ?? wide;
    /** 'docked' (in flow), 'closed', or 'peek' (floating over the page). */
    const [state, setState] = useState(dockedByDefault ? 'docked' : 'closed');

    // A breakpoint crossing, or a new `sidebarDocked`, resets to that width's default.
    useEffect(() => {
        setState(dockedByDefault ? 'docked' : 'closed');
    }, [dockedByDefault]);

    const cancelLeave = useCallback(() => {
        if (leaveTimer.current) {
            clearTimeout(leaveTimer.current);
            leaveTimer.current = null;
        }
    }, []);
    useEffect(() => cancelLeave, [cancelLeave]);

    const peek = useCallback(() => {
        cancelLeave();
        setState((s) => (s === 'closed' ? 'peek' : s));
    }, [cancelLeave]);

    const leave = useCallback(() => {
        cancelLeave();
        leaveTimer.current = setTimeout(() => {
            leaveTimer.current = null;
            setState((s) => (s === 'peek' ? 'closed' : s));
        }, PEEK_LEAVE_MS);
    }, [cancelLeave]);

    const toggle = useCallback(() => {
        cancelLeave();
        setState((s) => (s === 'docked' ? 'closed' : 'docked'));
    }, [cancelLeave]);

    // A peek closes on an outside press or Escape; the toggle and the panel are inside.
    useEffect(() => {
        if (state !== 'peek') return undefined;
        const onPointerDown = (e) => {
            if (sidebarRef.current?.contains(e.target) || toggleRef.current?.contains(e.target)) return;
            setState('closed');
        };
        const onKeyDown = (e) => {
            // A control that handled its own Escape (a menu, a field) keeps it.
            if (e.key !== 'Escape' || e.defaultPrevented) return;
            setState('closed');
            toggleRef.current?.focus();
        };
        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [state]);

    const docked = hasSidebar && state === 'docked';
    const peeking = hasSidebar && state === 'peek';

    const classes = [
        'plus-surface-container',
        // The left pad token assumes the width's default; flip it when the user has.
        docked && !wide ? 'plus-surface-container--docked-narrow' : '',
        !docked && wide ? 'plus-surface-container--undocked-wide' : '',
        className,
    ].filter(Boolean).join(' ');

    const sidebarPanel = (floating) => (
        <aside
            ref={sidebarRef}
            id={sidebarId}
            aria-label={sidebarLabel}
            className={`plus-surface-container__sidebar plus-surface-container__sidebar--${floating ? 'floating' : 'docked'}`}
            onPointerEnter={floating ? cancelLeave : undefined}
            onPointerLeave={floating ? leave : undefined}
        >
            {floating ? <div className="plus-surface-container__topbar-space" aria-hidden="true" /> : null}
            {sidebar}
        </aside>
    );

    const toggleProps = useMemo(() => ({
        ref: toggleRef,
        'aria-controls': docked || peeking ? sidebarId : undefined,
        onClick: toggle,
        onPointerEnter: peek,
        onPointerLeave: leave,
    }), [docked, peeking, sidebarId, toggle, peek, leave]);

    const control = useMemo(() => (hasSidebar ? {
        sidebar: docked || peeking ? 'open' : 'closed',
        docked,
        toggleProps,
    } : null), [hasSidebar, docked, peeking, toggleProps]);

    return (
        <div id={id} ref={frameRef} className={classes} style={style} {...props}>
            <SidebarControlContext.Provider value={control}>
                <div className="plus-surface-container__topbar">
                    {topbar ?? (hasSidebar ? <Topbar /> : null)}
                </div>
            </SidebarControlContext.Provider>

            {hasSidebar && state === 'closed' ? (
                <div className="plus-surface-container__edge" aria-hidden="true" onPointerEnter={peek} />
            ) : null}
            {peeking ? sidebarPanel(true) : null}

            <div className="plus-surface-container__row">
                {docked ? sidebarPanel(false) : null}
                <div className="plus-surface-container__surface">
                    {surfaceDirect ? children : (
                        <Content
                            className={[
                                'plus-surface-container__content',
                                `plus-surface-container__content--${width}`,
                                contentClassName,
                            ].filter(Boolean).join(' ')}
                        >
                            {children}
                        </Content>
                    )}
                </div>
            </div>
        </div>
    );
};

SurfaceContainer.propTypes = {
    id: PropTypes.string,
    /** The topbar row: a `Topbar`, which draws the sidebar toggle from the frame's state. Defaults to a bare Topbar when there is a sidebar. */
    topbar: PropTypes.node,
    /** Sidebar content. Without it there is no sidebar and no toggle. */
    sidebar: PropTypes.node,
    /** Overrides the width's default: true docks, false closes. Unset follows the breakpoint. */
    sidebarDocked: PropTypes.bool,
    /** Accessible name of the sidebar region */
    sidebarLabel: PropTypes.string,
    /** Content cap: content 1232, reading 864 */
    width: PropTypes.oneOf(['content', 'reading']),
    /** Element for the content box, e.g. `main` */
    contentAs: PropTypes.elementType,
    contentClassName: PropTypes.string,
    /** Render children straight into the surface, with no content box or grid (full-bleed views) */
    surfaceDirect: PropTypes.bool,
    className: PropTypes.string,
    style: PropTypes.object,
    /** Content slot */
    children: PropTypes.node,
};

export default SurfaceContainer;
