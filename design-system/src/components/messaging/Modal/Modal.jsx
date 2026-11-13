import React, { useId, useLayoutEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog } from '@base-ui/react/dialog';
import Button from '@/components/forms-and-inputs/Button';
import CloseButton from '@/components/forms-and-inputs/CloseButton';
import Skeleton from '@/components/loading/Skeleton';
import { HeadingLevelContext } from '@/lib/headingLevel';
import { useOverlaySlot, reportFocusLost } from '@/lib/overlay';
import Backdrop from '@/patterns/Backdrop';

/** Safe CSS length / custom-property patterns for Modal width. */
const SAFE_WIDTH_RE = /^(?:\d+(?:\.\d+)?(?:px|rem|%)|var\(--[a-zA-Z0-9-]+(?:\s*,\s*[^)]+)?\))$/;

/** The `width` steps, from the screen grid: 6 · 8 · 10 columns plus the modal pad. */
export const MODAL_WIDTHS = ['6-col', '8-col', '10-col'];

/** The screens `MODAL_WIDTH_PX` is read at: 768 and 1024, and 1280, where the grid reaches its cap and the width stops growing. */
export const MODAL_WIDTH_SCREENS = [768, 1024, 1280];

/**
 * Each `width` step in pixels at `MODAL_WIDTH_SCREENS`, as Modal.scss computes
 * it. The docs page shows these; scripts/frame-layer-tokens.test.mjs holds them
 * equal to the `--modal-width-*` tokens.
 */
export const MODAL_WIDTH_PX = {
    '6-col': [384, 512, 640],
    '8-col': [507, 677, 848],
    '10-col': [629, 843, 1056],
};

/**
 * Resolves a fixed `width` to CSS lengths, or `null` for a grid width.
 * Numbers (and numeric strings) become px; allowlisted lengths / CSS vars pass through.
 *
 * @param {number|string|undefined} width
 * @returns {{ width: string, minWidth: string, maxWidth: string } | null}
 */
const resolveModalWidth = (width) => {
    if (width === undefined || width === null || MODAL_WIDTHS.includes(width)) return null;

    const fixed = (length) => ({ width: length, minWidth: length, maxWidth: length });

    if (typeof width === 'number' && Number.isFinite(width)) return fixed(`${width}px`);

    if (typeof width === 'string') {
        const trimmed = width.trim();
        if (/^\d+(\.\d+)?$/.test(trimmed)) return fixed(`${trimmed}px`);
        if (SAFE_WIDTH_RE.test(trimmed)) return fixed(trimmed);
        if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.warn(`[Modal] Rejected unsafe width "${trimmed}"; falling back to the 6-col width.`);
        }
    }

    return null;
};

/**
 * True while an element's content is taller than its box.
 * A body that scrolls has to be a tab stop so a keyboard can scroll it.
 * Takes the element itself, from a callback ref, rather than a ref object:
 * Base UI's portal mounts the dialog after the first layout pass, so a ref
 * read then is still empty and would never be measured.
 */
function useOverflows(el, loading) {
    const [overflows, setOverflows] = useState(false);
    useLayoutEffect(() => {
        if (!el) return undefined;
        const measure = () => setOverflows(el.scrollHeight > el.clientHeight);
        measure();
        if (typeof ResizeObserver === 'undefined') return undefined;
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        if (el.firstElementChild) observer.observe(el.firstElementChild);
        return () => observer.disconnect();
    }, [el, loading]);
    return overflows;
}

/**
 * Modal component for PLUS design system.
 * Universal modal component for creating dialog windows that overlay the main content.
 *
 * It is a real dialog on Base UI's `Dialog`, placed in `Backdrop`: opening it
 * moves focus inside and keeps it there, the page behind is hidden from
 * assistive tech and stops scrolling, Escape and a press on the backdrop close
 * it, and closing returns focus to what had it. It takes a stack slot from the
 * shared overlay module (`@/lib/overlay`): a second Modal stays closed and
 * calls `onClose`.
 *
 * A follow-up about the dialog itself — "discard these edits?" — is best
 * shown in place: the caller swaps `title`, `body` and the footer buttons,
 * driven by its own state. A Modal never opens on another Modal.
 */
const Modal = ({
    id,
    title,
    description,
    body,
    height = 'hug',
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
    width = '6-col',
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
    const [bodyEl, setBodyEl] = useState(null);

    const [placed, trigger] = useOverlaySlot(show && renderAs === 'modal', onClose);
    const visible = renderAs === 'inline' ? show : show && placed;

    const hasFooter = showBottomButtons && Boolean(footer || primaryButton || secondaryButton);
    const bodyOnly = !title && !description && !headerActions && !showBottomButtons;
    const overflows = useOverflows(bodyEl, loading);

    // Base UI asks before it closes: Escape and a press outside the popup
    // (the backdrop) arrive here with their reason, and `keyboard` and
    // `backdrop` decide whether the owner hears them. Staying open is the
    // owner's state not changing, since `open` is controlled. `static` keeps
    // the backdrop but refuses to close on a press there, for a dialog over an
    // in-flight operation a stray click should not abandon.
    const backdropCloses = backdrop !== false && backdrop !== 'static';
    const handleOpenChange = (nextOpen, details) => {
        if (nextOpen || !onClose) return;
        if (details?.reason === 'escape-key' && !keyboard) return;
        if (details?.reason === 'outside-press' && !backdropCloses) return;
        onClose(details?.event);
    };

    // Closing gives focus back to the trigger `useOverlaySlot` captured, so a
    // keyboard user lands where they were. One that has left the page (a
    // parent that removed it while the dialog was open) cannot take it back,
    // so whoever removed it is told.
    const finalFocus = () => {
        const opener = trigger.current;
        if (opener && opener.isConnected && typeof opener.focus === 'function') return opener;
        if (opener) reportFocusLost();
        return false;
    };

    if (renderAs === 'inline' && !visible) return null;

    const classes = [
        'plus-modal',
        'plus-modal-default',
        MODAL_WIDTHS.includes(width) ? `plus-modal-width-${width}` : '',
        `plus-modal-height-${height}`,
        showBottomButtons ? 'plus-modal-with-buttons' : 'plus-modal-no-buttons',
        bodyOnly ? 'plus-modal-body-only' : '',
        className,
    ].filter(Boolean).join(' ');

    const modalStyle = {
        ...(style || {}),
        ...(resolveModalWidth(width) || {}),
    };

    // An inline docs preview draws the same panel as a plain block; a real
    // overlay draws it from Base UI's dialog parts, which own the role, the
    // name and description wiring, focus and dismissal. Base UI leaves
    // `aria-modal` to the caller, so it is set here.
    const isModal = renderAs === 'modal';
    const parts = isModal
        ? {
            Panel: Dialog.Popup,
            Title: Dialog.Title,
            Description: Dialog.Description,
            panelProps: { 'aria-modal': 'true', 'aria-label': !title ? ariaLabel : undefined, finalFocus },
            titleProps: { render: <h1 /> },
        }
        : { Panel: 'div', Title: 'h1', Description: 'div', panelProps: {}, titleProps: {} };
    const { Panel, Title, Description } = parts;

    // A dialog is its own page: its title is the h1, so a section in it opens at
    // h2 whatever section the modal was raised from.
    const panel = (
        <HeadingLevelContext.Provider value={1}>
            <Panel
                id={id}
                className={classes}
                style={modalStyle}
                data-testid={dataTestId}
                {...parts.panelProps}
            >
                {!bodyOnly && (
                    <>
                        <div className="plus-modal-header">
                            {(title || description) && (
                                <div className="plus-modal-heading">
                                    {title && <Title className="plus-modal-title" id={titleId} {...parts.titleProps}>{title}</Title>}
                                    {description && (
                                        <Description className="plus-modal-description" id={descriptionId}>{description}</Description>
                                    )}
                                </div>
                            )}
                            {headerActions && <div className="plus-modal-header-actions">{headerActions}</div>}
                            {showCloseButton && (
                                <CloseButton
                                    label="Close"
                                    isTooltipDisabled
                                    className="plus-modal-close-btn"
                                    onClick={onClose}
                                />
                            )}
                        </div>
                        {dividers && <div className="plus-modal-divider" />}
                    </>
                )}

                <div
                    ref={setBodyEl}
                    className="plus-modal-body"
                    aria-busy={loading || undefined}
                    // A scrolling region must itself be reachable by keyboard
                    // (axe: scrollable-region-focusable) since its content isn't
                    // otherwise guaranteed to contain a focusable element.
                    tabIndex={overflows ? 0 : undefined}
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
            </Panel>
        </HeadingLevelContext.Provider>
    );

    if (!isModal) return panel;

    // The popup is placed in `Backdrop`, which draws the fill and the pad, so a
    // press on the backdrop is a press outside the popup: Base UI's own
    // outside-press dismissal, held back by `backdrop`.
    return (
        <Dialog.Root open={visible} onOpenChange={handleOpenChange}>
            <Dialog.Portal>
                <Backdrop>{panel}</Backdrop>
            </Dialog.Portal>
        </Dialog.Root>
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
    /** The `id` attribute of the dialog panel. */
    id: PropTypes.string,
    /** The dialog's h1, and its accessible name. */
    title: PropTypes.string,
    /** A line under the title, read as the dialog's description. */
    description: PropTypes.node,
    /** The dialog's accessible name when it has no visible `title`. */
    ariaLabel: PropTypes.string,
    /** The main content of the dialog. A string is drawn as body text; a node is drawn as given. `children` is rendered after it. */
    body: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    /** `hug` grows with the content to the screen less 128 and then scrolls its body; `fill` sits at that cap. */
    height: PropTypes.oneOf(['hug', 'fill']),
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
    /** Whether the dialog is open. Controlled by the parent: set it to false in `onClose` to close. */
    show: PropTypes.bool,
    /** `true` (default): a click on the backdrop closes. `static`: the backdrop shows but refuses to close on a click. `false`: no close on a click. */
    backdrop: PropTypes.oneOf([true, false, 'static']),
    /** Escape closes, by default. `false` for a dialog that has to be answered. */
    keyboard: PropTypes.bool,
    /** `modal` (default) opens as a real dialog over the page; `inline` draws the same panel in place as a plain block, for docs previews. */
    renderAs: PropTypes.oneOf(['modal', 'inline']),
    /** The confirming footer button, drawn on the right. Takes `text` (default "Confirm"), `onClick`, `appearance` (default `primary`), `spacing` and `icon`. */
    primaryButton: buttonShape,
    /** The cancelling footer button, drawn left of the primary one. Takes `text` (default "Cancel"), `onClick`, `appearance` (default `default`), `spacing` and `icon`. */
    secondaryButton: buttonShape,
    /** Called when the dialog asks to close: the close button, Escape (unless `keyboard` is false) or a press on the backdrop (unless `backdrop` blocks it). The parent sets `show` to false. */
    onClose: PropTypes.func,
    /**
     * `6-col` · `8-col` · `10-col`: 6 · 8 · 10 columns of the screen grid plus the modal pad. Grows with
     * the screen, never shrinks, ignores the sidebar. A number or a length is a fixed width, kept
     * for the callers that still pass one.
     */
    width: PropTypes.oneOfType([PropTypes.oneOf(MODAL_WIDTHS), PropTypes.number, PropTypes.string]),
    /** Extra class names added to the dialog panel beside the component's own. */
    className: PropTypes.string,
    /** Inline styles for the dialog panel. A fixed `width` is applied after them. */
    style: PropTypes.object,
    /** More content rendered in the body after `body`, for composing the dialog contents directly. */
    children: PropTypes.node,
};

export default Modal;
