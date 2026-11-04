import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/forms-and-inputs/Button';
import Skeleton from '@/components/loading/Skeleton';
import { HeadingLevelContext } from '@/lib/headingLevel';
import { useOverlaySlot, reportFocusLost } from '@/lib/overlay';
import Blanket from '@/patterns/Blanket';

/** Safe CSS length / custom-property patterns for Modal width. */
const SAFE_WIDTH_RE = /^(?:\d+(?:\.\d+)?(?:px|rem|%)|var\(--[a-zA-Z0-9-]+(?:\s*,\s*[^)]+)?\))$/;

/** The widths from the screen grid: 6 · 8 · 10 columns plus the modal pad. */
const GRID_WIDTHS = ['sm', 'md', 'lg'];

/** What can take focus inside the dialog, in DOM order. */
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
 * Resolves a fixed `width` to CSS lengths, or `null` for a grid width.
 * Numbers (and numeric strings) become px; allowlisted lengths / CSS vars pass through.
 *
 * @param {number|string|undefined} width
 * @returns {{ width: string, minWidth: string, maxWidth: string } | null}
 */
const resolveModalWidth = (width) => {
    if (width === undefined || width === null || GRID_WIDTHS.includes(width)) return null;

    const fixed = (length) => ({ width: length, minWidth: length, maxWidth: length });

    if (typeof width === 'number' && Number.isFinite(width)) return fixed(`${width}px`);

    if (typeof width === 'string') {
        const trimmed = width.trim();
        if (/^\d+(\.\d+)?$/.test(trimmed)) return fixed(`${trimmed}px`);
        if (SAFE_WIDTH_RE.test(trimmed)) return fixed(trimmed);
        if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.warn(`[Modal] Rejected unsafe width "${trimmed}"; falling back to the sm width.`);
        }
    }

    return null;
};

/**
 * True while an element's content is taller than its box.
 * A body that scrolls has to be a tab stop so a keyboard can scroll it.
 */
function useOverflows(ref, show, loading) {
    const [overflows, setOverflows] = useState(false);
    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        const measure = () => setOverflows(el.scrollHeight > el.clientHeight);
        measure();
        if (typeof ResizeObserver === 'undefined') return undefined;
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        if (el.firstElementChild) observer.observe(el.firstElementChild);
        return () => observer.disconnect();
    }, [ref, show, loading]);
    return overflows;
}

/**
 * Modal component for PLUS design system.
 * Universal modal component for creating dialog windows that overlay the main content.
 *
 * It is a real dialog, placed in `Blanket`: opening it moves focus inside and
 * Tab cycles there, Escape and a click on the blanket close it, and closing
 * returns focus to what had it. It takes a stack slot from the shared overlay
 * module (`@/lib/overlay`) alongside `PatternDrawer`: at most two stack, a
 * third stays closed and calls `onClose`.
 *
 * A follow-up that needs confirming — "delete this?" — does not stack a
 * second Modal: the caller swaps `title`, `body` and the footer buttons in
 * place, driven by its own state. One dialog is open at a time.
 */
const Modal = ({
    id,
    title,
    description,
    body,
    height = 'hug',
    type = 'default',
    showBottomButtons = true,
    showCloseButton = true,
    headerActions,
    footer,
    dividers = false,
    loading = false,
    primaryButton,
    secondaryButton,
    show = false,
    onClose,
    backdrop = true,
    keyboard = true,
    renderAs = 'modal',
    paddingSize,
    gapSize,
    radiusSize,
    width = 'sm',
    className = '',
    style,
    children,
    ariaLabel,
    'data-testid': dataTestId,
}) => {
    /*
     * A DIALOG WITHOUT A NAME. A `div role="dialog"` with nothing else makes a
     * screen reader announce "dialog" and stop. The title is the dialog's h1
     * and names it; the description describes it.
     *
     * `useId` rather than a counter or the caller's `id`: the id has to be
     * unique per instance and stable across renders, and `id` is optional on
     * this component.
     */
    const titleId = useId();
    const descriptionId = useId();
    const panelRef = useRef(null);
    const bodyRef = useRef(null);

    const [placed, trigger] = useOverlaySlot(show && renderAs === 'modal', onClose);
    const visible = renderAs === 'inline' ? show : show && placed;

    const scrollable = type === 'scrollable';
    const hasFooter = showBottomButtons && Boolean(footer || primaryButton || secondaryButton);
    const bodyOnly = !title && !description && !headerActions && !showBottomButtons;
    const overflows = useOverflows(bodyRef, visible, loading);

    // A real overlay (not an inline docs preview) takes focus into the
    // dialog on open. A follow-up confirmation swaps `title`/`body`/the
    // footer buttons in place rather than mounting new content, so the
    // focused button stays the same element and keeps its focus.
    const isRealOverlay = visible && renderAs === 'modal';
    useEffect(() => {
        if (!isRealOverlay) return;
        const panel = panelRef.current;
        const [first] = focusablesIn(panel);
        (first ?? panel)?.focus();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isRealOverlay]);

    // Closing gives focus back to the trigger `useOverlaySlot` captured, so a
    // keyboard user lands where they were. One that has left the page (a
    // parent that removed it while the dialog was open) cannot take it back,
    // so whoever removed it is told.
    useEffect(() => {
        if (!isRealOverlay) return undefined;
        return () => {
            const opener = trigger.current;
            if (opener && typeof opener.focus === 'function' && opener.isConnected) {
                opener.focus();
            } else if (opener && !opener.isConnected) {
                reportFocusLost();
            }
        };
    }, [isRealOverlay, trigger]);

    const handleKeyDown = (event) => {
        if (event.key === 'Escape') {
            if (!keyboard || event.defaultPrevented || !onClose) return;
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
        const panel = panelRef.current;
        if (active !== panel && !nodes.includes(active)) {
            event.preventDefault();
            (event.shiftKey ? last : first).focus();
        } else if (event.shiftKey && (active === first || active === panel)) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && active === last) {
            event.preventDefault();
            first.focus();
        }
    };

    if (!visible) return null;

    const classes = [
        'plus-modal',
        scrollable ? 'plus-modal-scrollable' : 'plus-modal-default',
        GRID_WIDTHS.includes(width) ? `plus-modal-width-${width}` : '',
        `plus-modal-height-${height}`,
        paddingSize ? `plus-modal-pad-${paddingSize}` : '',
        gapSize ? `plus-modal-gap-${gapSize}` : '',
        radiusSize ? `plus-modal-radius-${radiusSize}` : '',
        showBottomButtons ? 'plus-modal-with-buttons' : 'plus-modal-no-buttons',
        bodyOnly ? 'plus-modal-body-only' : '',
        className,
    ].filter(Boolean).join(' ');

    const modalStyle = {
        ...(style || {}),
        ...(resolveModalWidth(width) || {}),
    };

    // A dialog is its own page: its title is the h1, so a section in it opens at
    // h2 whatever section the modal was raised from.
    const panel = (
        <HeadingLevelContext.Provider value={1}>
            <div
                id={id}
                ref={panelRef}
                className={classes}
                style={modalStyle}
                data-testid={dataTestId}
                role={renderAs === 'modal' ? 'dialog' : undefined}
                aria-modal={renderAs === 'modal' ? 'true' : undefined}
                aria-labelledby={renderAs === 'modal' && title ? titleId : undefined}
                aria-describedby={renderAs === 'modal' && description ? descriptionId : undefined}
                aria-label={renderAs === 'modal' && !title ? ariaLabel : undefined}
                tabIndex={renderAs === 'modal' ? -1 : undefined}
                onKeyDown={renderAs === 'modal' ? handleKeyDown : undefined}
            >
                {!bodyOnly && (
                    <>
                        <div className="plus-modal-header">
                            {(title || description) && (
                                <div className="plus-modal-heading">
                                    {title && <h1 className="plus-modal-title" id={titleId}>{title}</h1>}
                                    {description && (
                                        <div className="plus-modal-description" id={descriptionId}>{description}</div>
                                    )}
                                </div>
                            )}
                            {headerActions && <div className="plus-modal-header-actions">{headerActions}</div>}
                            {showCloseButton && (
                                <button
                                    type="button"
                                    className="plus-modal-close-btn"
                                    aria-label="Close modal"
                                    onClick={onClose}
                                >
                                    <i className="fa-solid fa-xmark" aria-hidden="true" />
                                </button>
                            )}
                        </div>
                        {dividers && <div className="plus-modal-divider" />}
                    </>
                )}

                <div
                    ref={bodyRef}
                    className={`plus-modal-body ${scrollable ? 'plus-modal-body-scrollable' : ''}`}
                    aria-busy={loading || undefined}
                    // A scrolling region must itself be reachable by keyboard
                    // (axe: scrollable-region-focusable) since its content isn't
                    // otherwise guaranteed to contain a focusable element.
                    tabIndex={scrollable || overflows ? 0 : undefined}
                >
                    {loading ? (
                        <div className="plus-modal-skeleton">
                            <Skeleton shape="rect" width="100%" height={20} radius="element-radius-md" />
                            <Skeleton shape="rect" width="100%" height={20} radius="element-radius-md" />
                            <Skeleton shape="rect" width="60%" height={20} radius="element-radius-md" />
                        </div>
                    ) : (
                        <div className="plus-modal-content">
                            {body && (typeof body === 'string' ? <div className="plus-modal-body-text">{body}</div> : body)}
                            {children}
                        </div>
                    )}
                    {scrollable && (
                        <div className="plus-modal-scrollbar">
                            <div className="plus-modal-scrollbar-icon">
                                <i className="fas fa-caret-up" />
                            </div>
                            <div className="plus-modal-scrollbar-track">
                                <div className="plus-modal-scrollbar-bar" />
                            </div>
                            <div className="plus-modal-scrollbar-icon">
                                <i className="fas fa-caret-down" />
                            </div>
                        </div>
                    )}
                </div>

                {hasFooter && (
                    <>
                        {dividers && <div className="plus-modal-divider" />}
                        <div className="plus-modal-footer">
                            {footer || (
                                <div className="plus-modal-button-row">
                                    {secondaryButton && (
                                        <Button
                                            text={secondaryButton.text || 'Cancel'}
                                            appearance={secondaryButton.appearance || 'default'}
                                            spacing={secondaryButton.spacing}
                                            onClick={secondaryButton.onClick}
                                            iconBefore={secondaryButton.icon}
                                            className="plus-modal-button plus-modal-button-secondary"
                                        />
                                    )}
                                    {primaryButton && (
                                        <Button
                                            text={primaryButton.text || 'Confirm'}
                                            appearance={primaryButton.appearance || 'primary'}
                                            spacing={primaryButton.spacing}
                                            onClick={primaryButton.onClick}
                                            iconBefore={primaryButton.icon}
                                            className="plus-modal-button plus-modal-button-primary"
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </HeadingLevelContext.Provider>
    );

    if (renderAs === 'inline') {
        return panel;
    }

    // `static` keeps the blanket but refuses to close on a click there, for a
    // dialog over an in-flight operation a stray click should not abandon.
    const blanketCloses = backdrop !== false && backdrop !== 'static';

    return (
        <Blanket onBlanketClick={blanketCloses ? onClose : undefined}>
            {panel}
        </Blanket>
    );
};

const buttonShape = PropTypes.shape({
    text: PropTypes.string,
    onClick: PropTypes.func,
    appearance: PropTypes.string,
    spacing: PropTypes.string,
    icon: PropTypes.string,
    iconPosition: PropTypes.string,
});

Modal.propTypes = {
    id: PropTypes.string,
    /** The dialog's h1, and its accessible name. */
    title: PropTypes.string,
    /** A line under the title, read as the dialog's description. */
    description: PropTypes.node,
    /** The dialog's accessible name when it has no visible `title`. */
    ariaLabel: PropTypes.string,
    body: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    /** `hug` grows with the content to the screen less 128 and then scrolls its body; `fill` sits at that cap. */
    height: PropTypes.oneOf(['hug', 'fill']),
    /** Deprecated: `scrollable` draws the old fixed 226 box. Use `height`. */
    type: PropTypes.oneOf(['default', 'scrollable']),
    /** Show the footer: `footer`, or the secondary and primary buttons. */
    showBottomButtons: PropTypes.bool,
    /** The header's close button. Off for a dialog that has to be answered. */
    showCloseButton: PropTypes.bool,
    /** Icon buttons in the header, before the close button. */
    headerActions: PropTypes.node,
    /** Custom footer actions in place of the two buttons, aligned right. */
    footer: PropTypes.node,
    /** A rule under the header and over the footer. */
    dividers: PropTypes.bool,
    /** Skeleton bars in place of the body while its content loads. */
    loading: PropTypes.bool,
    show: PropTypes.bool,
    /** `true` (default): a click on the blanket closes. `static`: the blanket shows but refuses to close on a click. `false`: no close on a click. */
    backdrop: PropTypes.oneOf([true, false, 'static']),
    /** Escape closes, by default. `false` for a dialog that has to be answered. */
    keyboard: PropTypes.bool,
    renderAs: PropTypes.oneOf(['modal', 'inline']),
    primaryButton: buttonShape,
    secondaryButton: buttonShape,
    onClose: PropTypes.func,
    /** Deprecated: the old Modal/pad-* tokens. The modal pads Modal/pad 16. */
    paddingSize: PropTypes.oneOf(['sm', 'md', 'lg']),
    /** Deprecated: the old Modal/gap-* tokens. The modal stacks Modal/stack-md 16. */
    gapSize: PropTypes.oneOf(['sm', 'md', 'lg']),
    /** Deprecated: the old Modal/radius-* tokens. The modal's radius is Modal/radius 12. */
    radiusSize: PropTypes.oneOf(['sm', 'md', 'lg']),
    /**
     * `sm` · `md` · `lg`: 6 · 8 · 10 columns of the screen grid plus the modal pad. Grows with
     * the screen, never shrinks, ignores the sidebar. A number or a length is a fixed width, kept
     * for the callers that still pass one.
     */
    width: PropTypes.oneOfType([PropTypes.oneOf(GRID_WIDTHS), PropTypes.number, PropTypes.string]),
    className: PropTypes.string,
    style: PropTypes.object,
    children: PropTypes.node,
};

export default Modal;
