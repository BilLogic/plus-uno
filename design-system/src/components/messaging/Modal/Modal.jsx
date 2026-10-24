import React, { createContext, useContext, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import BootstrapModal from 'react-bootstrap/Modal';
import Button from '@/components/actions/Button';
import Skeleton from '@/components/status-and-loading/Skeleton';
import { HeadingLevelContext } from '@/lib/headingLevel';
import { openOverlay, reportFocusLost } from '@/lib/overlayStack';

/** Safe CSS length / custom-property patterns for Modal width. */
const SAFE_WIDTH_RE = /^(?:\d+(?:\.\d+)?(?:px|rem|%)|var\(--[a-zA-Z0-9-]+(?:\s*,\s*[^)]+)?\))$/;

/** The widths from the screen grid: 6 · 8 · 10 columns plus the modal pad. */
const GRID_WIDTHS = ['sm', 'md', 'lg'];

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
 * The overlay a modal sits in, for a modal raised from inside it.
 *
 * A nested confirm mounts into the first modal's overlay rather than beside
 * it, so its scrim and dialog reuse the 500 / 510 layers inside the first
 * modal's own layer and cover it. Beside it, the second scrim (500) would sit
 * under the first modal (510).
 */
const OverlayContext = createContext(null);

/**
 * Takes a place in the document's overlay stack while `active`.
 *
 * Opening one tells the app frame, which closes a floating sidebar. A third
 * overlay gets no place: it stays closed and calls `onRefused`, so its owner's
 * state says closed too and the trigger works again once there is room. The
 * element that had focus is kept, so a trigger that left the page with the
 * sidebar can be reported once the modal has closed.
 *
 * A layout effect, so the place is taken before the first paint and the modal
 * does not flash closed.
 *
 * @param {boolean} active
 * @param {() => void} [onRefused]
 * @returns {[boolean, React.MutableRefObject<Element | null>]} whether it has a place, and its trigger
 */
function useOverlayPlace(active, onRefused) {
    const [placed, setPlaced] = useState(false);
    const trigger = useRef(null);
    const refused = useRef(onRefused);
    refused.current = onRefused;
    useLayoutEffect(() => {
        if (!active) return undefined;
        trigger.current = typeof document === 'undefined' ? null : document.activeElement;
        const handle = openOverlay();
        if (!handle) {
            refused.current?.();
            return undefined;
        }
        setPlaced(true);
        return () => {
            handle.release();
            setPlaced(false);
        };
    }, [active]);
    return [placed, trigger];
}

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
 * Note: This component is wrapped in a react-bootstrap Modal under the hood to handle
 * automatic overlay creation, backdrop clicking, and centering.
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
    centered = true,
    renderAs = 'modal',
    container,
    manager,
    enforceFocus,
    autoFocus,
    restoreFocus,
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
     * A DIALOG WITHOUT A NAME. react-bootstrap renders `role="dialog"
     * aria-modal="true"` and nothing else, so a screen reader announced
     * "dialog" and stopped. The title is the dialog's h1 and names it; the
     * description describes it.
     *
     * `useId` rather than a counter or the caller's `id`: the id has to be
     * unique per instance and stable across renders, and `id` is optional on
     * this component.
     */
    const titleId = useId();
    const descriptionId = useId();
    const panelRef = useRef(null);
    const bodyRef = useRef(null);

    const parent = useContext(OverlayContext);
    // A modal raised from a modal waits for that modal's place, so when both
    // mount open the outer one takes its place first.
    const [placed, trigger] = useOverlayPlace(
        show && renderAs === 'modal' && (parent ? parent.placed : true),
        onClose,
    );
    const visible = renderAs === 'inline' ? show : show && placed;
    const overlay = useMemo(() => ({
        placed: renderAs === 'inline' ? (parent ? parent.placed : true) : placed,
        element: () => panelRef.current?.closest('.modal') ?? null,
    }), [renderAs, parent, placed]);
    // Focus goes back to the trigger on close; one that has left the page
    // cannot take it, so whoever removed it is told.
    const onExited = () => {
        if (trigger.current && !trigger.current.isConnected) reportFocusLost();
        trigger.current = null;
    };

    const scrollable = type === 'scrollable';
    const hasFooter = showBottomButtons && Boolean(footer || primaryButton || secondaryButton);
    const bodyOnly = !title && !description && !headerActions && !showBottomButtons;
    const overflows = useOverflows(bodyRef, visible, loading);

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
    const modalContent = (
        <HeadingLevelContext.Provider value={1}>
            <div id={id} ref={panelRef} className={classes} style={modalStyle} data-testid={dataTestId}>
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
                                            style={secondaryButton.style || 'secondary'}
                                            fill={secondaryButton.fill || 'tonal'}
                                            size={secondaryButton.size || 'medium'}
                                            onClick={secondaryButton.onClick}
                                            leadingVisual={secondaryButton.icon}
                                            className="plus-modal-button plus-modal-button-secondary"
                                        />
                                    )}
                                    {primaryButton && (
                                        <Button
                                            text={primaryButton.text || 'Confirm'}
                                            style={primaryButton.style || 'primary'}
                                            fill={primaryButton.fill || 'filled'}
                                            size={primaryButton.size || 'medium'}
                                            onClick={primaryButton.onClick}
                                            leadingVisual={primaryButton.icon}
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
        return modalContent;
    }

    return (
        <OverlayContext.Provider value={overlay}>
            <BootstrapModal
                show={visible}
                onHide={onClose}
                onExited={onExited}
                backdrop={backdrop}
                keyboard={keyboard}
                centered={centered}
                container={container ?? (parent ? parent.element : undefined)}
                manager={manager}
                enforceFocus={enforceFocus}
                autoFocus={autoFocus}
                restoreFocus={restoreFocus}
                className="plus-modal-overlay"
                backdropClassName="plus-modal-scrim"
                contentClassName="plus-bootstrap-modal-content-reset"
                dialogClassName="plus-bootstrap-modal-dialog-reset"
                aria-labelledby={title ? titleId : undefined}
                aria-describedby={description ? descriptionId : undefined}
                aria-label={title ? undefined : ariaLabel}
            >
                {modalContent}
            </BootstrapModal>
        </OverlayContext.Provider>
    );
};

const buttonShape = PropTypes.shape({
    text: PropTypes.string,
    onClick: PropTypes.func,
    style: PropTypes.string,
    fill: PropTypes.string,
    size: PropTypes.string,
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
    backdrop: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
    keyboard: PropTypes.bool,
    centered: PropTypes.bool,
    renderAs: PropTypes.oneOf(['modal', 'inline']),
    container: PropTypes.any,
    manager: PropTypes.any,
    enforceFocus: PropTypes.bool,
    autoFocus: PropTypes.bool,
    restoreFocus: PropTypes.bool,
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
