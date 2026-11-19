import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { Dialog, DIALOG_HEIGHTS, DIALOG_WIDTH_PX, DIALOG_WIDTH_SCREENS, DIALOG_WIDTHS } from '@/components';
import { useMotionReduced } from '@/lib/motionPreference';
import { useOverlaySlot, reportFocusLost } from '@/lib/overlay';
import { useOverlayOrigin, useOverlayPresence } from '@/lib/overlayMotion';
import Blanket from './Blanket';
import './Modal.scss';

/** The Dialog's `width` steps, screens, `height` modes and pixel table, which the Modal shares. */
export const MODAL_WIDTHS = DIALOG_WIDTHS;
export const MODAL_WIDTH_SCREENS = DIALOG_WIDTH_SCREENS;
export const MODAL_HEIGHTS = DIALOG_HEIGHTS;
export const MODAL_WIDTH_PX = DIALOG_WIDTH_PX;

/**
 * Modal template (`@/templates`): a Dialog on a Blanket with modal behavior on
 * `@base-ui/react` Dialog (portal, focus trap, Escape, scroll lock, and the
 * blanket-press rule). One Modal is open at a time (`useOverlaySlot`).
 *
 * `inline` renders the Blanket + Dialog in flow for docs previews and static
 * stages without a portal, focus trap, Escape handling or scroll lock.
 */
const Modal = ({
    show = false,
    blanket = true,
    keyboard = true,
    inline = false,
    screenWidth,
    screenHeight,
    onClose,
    className = '',
    children,
    // The defaults the Dialog already has, named here so the generated docs show them.
    width = '6-col',
    height = 'hug',
    showCloseButton = true,
    showBottomButtons = true,
    dividers = false,
    loading = false,
    ...dialogProps
}) => {
    const reduced = useMotionReduced();
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    const slotOpen = !inline && show;
    const [placed, triggerRef] = useOverlaySlot(slotOpen, () => onCloseRef.current?.());
    const visible = inline ? show : (show && placed);

    const panelRef = useRef(null);
    const present = useOverlayPresence(visible, panelRef);
    useOverlayOrigin(visible, panelRef);

    // Base UI captures focus before opening and returns it to the trigger on close.
    // A modal opened from a floating sidebar hands focus back to the sidebar toggle
    // since the trigger unmounts as the sidebar closes.
    const sidebarFocusFallback = useRef(null);
    const wasVisible = useRef(false);
    useEffect(() => {
        if (inline) return;
        if (visible && !wasVisible.current) {
            const active = triggerRef.current;
            const inFloatingSidebar = Boolean(active?.closest?.('.plus-sidebar--floating'));
            sidebarFocusFallback.current = inFloatingSidebar ? document.querySelector('.plus-frame__sidebar-toggle') : null;
        } else if (!visible && wasVisible.current) {
            if (triggerRef.current && !triggerRef.current.isConnected) {
                reportFocusLost();
            }
        }
        wasVisible.current = visible;
    }, [visible, inline, triggerRef]);

    const finalFocus = () => {
        if (sidebarFocusFallback.current?.isConnected) return sidebarFocusFallback.current;
        if (triggerRef.current?.isConnected) return triggerRef.current;
        return undefined;
    };

    const blanketCloses = blanket !== false && blanket !== 'static';
    const handleOpenChange = (nextOpen, details) => {
        if (nextOpen) return;
        if (details?.reason === 'escape-key' && !keyboard) return;
        if (details?.reason === 'outside-press' && !blanketCloses) return;
        onClose?.(details?.event);
    };

    const modalClassName = ['plus-modal', className].filter(Boolean).join(' ');

    const panelProps = { ...dialogProps, width, height, showCloseButton, showBottomButtons, dividers, loading, onClose, className: modalClassName };

    if (inline) {
        if (!present && !visible) return null;
        return (
            <Blanket
                show={visible}
                inline
                screenWidth={screenWidth}
                screenHeight={screenHeight}
                onBlanketClick={blanketCloses ? onClose : undefined}
            >
                <Dialog
                    {...panelProps}
                    ref={panelRef}
                    role="dialog"
                    aria-modal="false"
                    data-reduced={reduced ? 'true' : undefined}
                    data-ending-style={!visible ? '' : undefined}
                >
                    {children}
                </Dialog>
            </Blanket>
        );
    }

    return (
        <BaseDialog.Root open={visible} onOpenChange={handleOpenChange}>
            <BaseDialog.Portal>
                <Blanket show={visible}>
                    <BaseDialog.Popup
                        ref={panelRef}
                        aria-modal="true"
                        data-reduced={reduced ? 'true' : undefined}
                        finalFocus={finalFocus}
                        render={(popupProps) => (
                            <Dialog {...popupProps} {...panelProps}>
                                {children}
                            </Dialog>
                        )}
                    />
                </Blanket>
            </BaseDialog.Portal>
        </BaseDialog.Root>
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

const tabShape = PropTypes.shape({
    key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    label: PropTypes.node.isRequired,
    content: PropTypes.node.isRequired,
    disabled: PropTypes.bool,
});

// Written out in full, with literal enums: the generated docs read propTypes and defaults from this file, so a spread or an imported list would drop them from the Modal page.
Modal.propTypes = {
    /** The `id` attribute of the dialog panel. */
    id: PropTypes.string,
    /** The dialog's h1, and its accessible name.
     * @ds-context Used in: Modal.title (ds guide modal)
     */
    title: PropTypes.node,
    /** A line under the title, read as the dialog's description.
     * @ds-context Used in: Modal.description (ds guide modal)
     */
    description: PropTypes.node,
    /** The dialog's accessible name when it has no visible `title` or uses a custom `header`. */
    ariaLabel: PropTypes.string,
    /** Custom header slot replacing the title row (title and close button), so the caller owns both and names the dialog with `ariaLabel`.
     * @ds-context Used in: Modal.header (ds guide modal)
     */
    header: PropTypes.node,
    /** Icon buttons in the header, before the close button.
     * @ds-context Used in: Modal.headerActions (ds guide modal)
     */
    headerActions: PropTypes.node,
    /** The header's close button. Off for a dialog that has to be answered. */
    showCloseButton: PropTypes.bool,
    /** Tab group under the title (`{ key, label, content, disabled? }`). The body becomes the tab panel and shows the selected tab's `content`. */
    tabs: PropTypes.arrayOf(tabShape),
    /** Selected tab's key when controlled; update from `onTabChange`. */
    activeTab: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    /** Initial tab key when uncontrolled; defaults to the first enabled tab. */
    defaultActiveTab: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    /** Called with the key of the selected tab. */
    onTabChange: PropTypes.func,
    /** The main content of the dialog. A string is drawn as body text; a node is drawn as given. `children` is rendered after it. */
    body: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    /** `hug` grows with the content to the cap and then scrolls its body; `fill` sits at that cap. */
    height: PropTypes.oneOf(['hug', 'fill']),
    /** Show the footer: `footer`, or the secondary and primary buttons. */
    showBottomButtons: PropTypes.bool,
    /** Custom footer content in place of the built-in pair, such as a three-button or leading-text FooterActions layout.
     * @ds-context Used in: Modal.footer (ds guide modal)
     */
    footer: PropTypes.node,
    /** The confirming footer button, drawn on the right. Takes `text` (default "Confirm"), `onClick`, `appearance` (default `primary`), `spacing` and `icon`. */
    primaryButton: buttonShape,
    /** The secondary footer button, drawn in the left half when a primary button is also given. Takes `text` (default "Discard"), `onClick`, `appearance` (default `default`), `spacing` and `icon`. */
    secondaryButton: buttonShape,
    /** A rule under the header and over the footer. */
    dividers: PropTypes.bool,
    /** Skeleton bars in place of the body while its content loads. */
    loading: PropTypes.bool,
    /** Whether the modal is open. Controlled by the parent: set it to false in `onClose` to close. */
    show: PropTypes.bool,
    /** `true` (default): a press on the Blanket closes. `static` or `false`: the Blanket shows but refuses to close on a press. */
    blanket: PropTypes.oneOf([true, false, 'static']),
    /** Escape closes by default. `false` for a dialog that has to be answered. */
    keyboard: PropTypes.bool,
    /** Renders Blanket and Dialog inline in flow for docs previews and mockups, without portal, focus trap, Escape or scroll lock. */
    inline: PropTypes.bool,
    /** Stand-in screen width when `inline` is true. */
    screenWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    /** Stand-in screen height when `inline` is true. */
    screenHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    /** Called when the modal asks to close: Close button, Escape (unless `keyboard` is false) or a press on the Blanket (unless `blanket` blocks it). */
    onClose: PropTypes.func,
    /** `4-col` · `6-col` · `8-col` · `10-col`: 4 · 6 · 8 · 10 columns of the screen grid plus the modal pad. */
    width: PropTypes.oneOfType([PropTypes.oneOf(['4-col', '6-col', '8-col', '10-col']), PropTypes.number, PropTypes.string]),
    /** Extra class names added to the dialog panel. */
    className: PropTypes.string,
    /** Inline styles for the dialog panel. */
    style: PropTypes.object,
    /** More content rendered in the body after `body`.
     * @ds-context Used in: Modal.children (ds guide modal)
     */
    children: PropTypes.node,
};

export default Modal;
