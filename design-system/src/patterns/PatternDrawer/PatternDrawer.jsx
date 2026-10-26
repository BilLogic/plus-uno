import React from 'react';
import PropTypes from 'prop-types';
import { HeadingLevelContext } from '@/lib/headingLevel';
import Overlay, { OVERLAY_WIDTHS } from '../Overlay';
import './PatternDrawer.scss';

/** The edges a drawer sits at: `end` (right in a left-to-right page) by default, or `start`. */
export const DRAWER_PLACEMENTS = ['end', 'start'];

/** What can take focus inside the drawer, in DOM order. */
const FOCUSABLE = [
    'a[href]',
    'area[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'iframe',
    '[contenteditable=""]',
    '[contenteditable="true"]',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

const focusablesIn = (el) => Array.from(el.querySelectorAll(FOCUSABLE))
    .filter((node) => !node.closest('[hidden], [inert]'));

/**
 * Drawer pattern for PLUS design system.
 * A full-height panel at the edge of the screen, for a task that needs the
 * page in view: the details of a row, a set of filters, a short edit. It
 * places itself in `Overlay` at that edge, over the same scrim a modal takes.
 * Width is a step of the screen grid (sm · md · lg: 6 · 8 · 10 columns plus
 * the modal pad), the Modal width steps. The title, description and close
 * button follow the Modal rules.
 * Baked-in tokens: the overlay pair (`--ds-surface-overlay` with
 * `--ds-shadow-overlay`), Drawer/pad 16, Drawer/stack-md 16 and Drawer/inline-sm 8, no radius.
 * Mirrors "Pattern/Drawer" in the Figma design system file.
 *
 * It is a real dialog: opening it moves focus inside and Tab cycles there,
 * Escape, the close button and a click on the scrim call `onClose`, and
 * closing returns focus to what had it. An `inline` drawer, drawn in the page
 * flow for docs, leaves focus where it is.
 */
const PatternDrawer = ({
    id,
    open = true,
    title,
    description,
    onClose,
    footer,
    width = 'sm',
    placement = 'end',
    inline = false,
    screenWidth,
    screenHeight,
    className = '',
    style,
    children,
    ...props
}) => {
    const reactId = React.useId();
    const panelRef = React.useRef(null);
    const bodyRef = React.useRef(null);
    const overflows = useOverflows(bodyRef, open);

    // Opening takes focus into the drawer; closing gives it back to what had
    // it, so a keyboard user lands where they were.
    React.useEffect(() => {
        if (!open || inline) return undefined;
        const opener = document.activeElement;
        const panel = panelRef.current;
        const [first] = focusablesIn(panel);
        (first ?? panel).focus();
        return () => {
            if (opener && typeof opener.focus === 'function' && opener.isConnected) opener.focus();
        };
    }, [open, inline]);

    if (!open) return null;

    const classes = [
        'plus-pattern-drawer',
        `plus-pattern-drawer-width-${width}`,
        className,
    ].filter(Boolean).join(' ');

    // The title names the dialog; a caller with no title passes `aria-label`.
    const titleId = `${reactId}-title`;
    const descriptionId = `${reactId}-description`;

    const handleKeyDown = (event) => {
        if (event.key === 'Escape') {
            // An inner control (a menu, a search box) that handled Escape keeps it.
            if (event.defaultPrevented || !onClose) return;
            event.stopPropagation();
            onClose(event);
            return;
        }
        if (event.key !== 'Tab') return;
        const nodes = focusablesIn(panelRef.current);
        if (nodes.length === 0) {
            event.preventDefault();
            return;
        }
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        const active = document.activeElement;
        if (event.shiftKey && (active === first || active === panelRef.current)) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && active === last) {
            event.preventDefault();
            first.focus();
        }
    };

    return (
        <Overlay
            placement={placement}
            inline={inline}
            screenWidth={screenWidth}
            screenHeight={screenHeight}
            onScrimClick={onClose}
        >
            <div
                ref={panelRef}
                id={id}
                className={classes}
                style={style}
                role="dialog"
                aria-modal={inline ? 'false' : 'true'}
                aria-labelledby={title ? titleId : undefined}
                aria-describedby={description ? descriptionId : undefined}
                tabIndex={-1}
                onKeyDown={handleKeyDown}
                {...props}
            >
                <div className="plus-pattern-drawer-header">
                    {(title || description) && (
                        <div className="plus-pattern-drawer-heading">
                            {title && <h1 id={titleId} className="plus-pattern-drawer-title">{title}</h1>}
                            {description && <p id={descriptionId} className="plus-pattern-drawer-description">{description}</p>}
                        </div>
                    )}
                    {onClose && (
                        <button
                            type="button"
                            className="plus-pattern-drawer-close"
                            aria-label="Close"
                            onClick={onClose}
                        >
                            <i className="fa-solid fa-xmark" aria-hidden="true"></i>
                        </button>
                    )}
                </div>
                <HeadingLevelContext.Provider value={1}>
                    {/* A body that scrolls holds no focus of its own, so it becomes a tab stop. */}
                    <div ref={bodyRef} className="plus-pattern-drawer-body" tabIndex={overflows ? 0 : undefined}>{children}</div>
                </HeadingLevelContext.Provider>
                {footer && <div className="plus-pattern-drawer-footer">{footer}</div>}
            </div>
        </Overlay>
    );
};

/** True while an element's content is taller than its box. */
function useOverflows(ref, open) {
    const [overflows, setOverflows] = React.useState(false);
    React.useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        const measure = () => setOverflows(el.scrollHeight > el.clientHeight);
        measure();
        if (typeof ResizeObserver === 'undefined') return undefined;
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        if (el.firstElementChild) observer.observe(el.firstElementChild);
        return () => observer.disconnect();
    }, [ref, open]);
    return overflows;
}

PatternDrawer.propTypes = {
    id: PropTypes.string,
    /** Whether the drawer shows. Closing it returns focus to what had it before it opened. */
    open: PropTypes.bool,
    /** The title in the header row: the dialog's h1, at Heading/medium 20, and its name */
    title: PropTypes.node,
    /** One line under the title, in the subtle text color; it describes the dialog */
    description: PropTypes.node,
    /** Called by the close button, Escape and a click on the scrim; renders the close button */
    onClose: PropTypes.func,
    /** Footer slot, pinned to the bottom edge (typically action buttons, the primary last) */
    footer: PropTypes.node,
    /**
     * `sm` · `md` · `lg`: 6 · 8 · 10 columns of the screen grid plus the drawer pad
     * (384 · 507 · 629 at 768, 512 · 677 · 843 at 1024, 640 · 848 · 1056 at 1440),
     * the Modal width steps. Grows with the screen, never shrinks, ignores the sidebar.
     */
    width: PropTypes.oneOf(OVERLAY_WIDTHS),
    /** `end` (default) holds it at the right edge of a left-to-right page; `start` at the left. */
    placement: PropTypes.oneOf(DRAWER_PLACEMENTS),
    /** Draw in the page flow at a stand-in screen, for docs and previews; focus stays where it is. */
    inline: PropTypes.bool,
    /** Inline only: the stand-in screen width (px), such as 768, 1024 or 1440. */
    screenWidth: PropTypes.number,
    /** Inline only: the stand-in screen height (px); the drawer runs its full height. */
    screenHeight: PropTypes.number,
    className: PropTypes.string,
    style: PropTypes.object,
    /** Body content slot; it scrolls once it outgrows the screen */
    children: PropTypes.node,
};

export default PatternDrawer;
