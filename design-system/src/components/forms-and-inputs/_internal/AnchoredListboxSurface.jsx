import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { useBoundedOverlay } from '@/lib/overlay';
import { useMotionReduced } from '@/lib/motionPreference';
import { useKeyboardOpen, useOverlayPresence } from '@/lib/overlayMotion';
import { popupLayerOf, useAnchoredPopup } from './anchorPlacement';
import './Listbox.scss';

/** Field-popup placement, layer and exit lifecycle; an unanchored list stays inline. */
export default function AnchoredListboxSurface({
    open,
    anchorRef,
    align = 'left',
    onClose,
    surfaceRef,
    preserveFieldFocus = false,
    className = '',
    style,
    children,
    ...props
}) {
    const ownRef = useRef(null);
    const ref = surfaceRef ?? ownRef;
    const bounded = useBoundedOverlay({ fromNode: anchorRef?.current });
    const reduced = useMotionReduced();
    const keyboard = useKeyboardOpen(open);
    const present = useOverlayPresence(open, ref);
    const place = useAnchoredPopup({
        open: present, anchorRef, popupRef: ref, align,
        onClose: open ? onClose : undefined,
        bounded,
    });

    if (!present) return null;
    const surface = (
        <div
            {...props}
            ref={ref}
            className={['plus-listbox', anchorRef ? 'plus-listbox--floating' : '', className].filter(Boolean).join(' ')}
            data-reduced={reduced ? 'true' : undefined}
            data-instant={keyboard ? 'keyboard' : undefined}
            data-ending-style={!open ? '' : undefined}
            aria-hidden={!open ? true : undefined}
            inert={!open ? true : undefined}
            data-side={place?.placement ?? 'bottom'}
            data-align={place?.side ?? 'start'}
            data-placement={anchorRef ? place?.placement ?? 'bottom' : undefined}
            style={anchorRef ? {
                position: bounded ? 'absolute' : undefined,
                top: place?.top ?? 0,
                left: place?.left ?? 0,
                minWidth: place?.minWidth,
                '--plus-listbox-viewport-width': place?.maxWidth === undefined ? undefined : `${place.maxWidth}px`,
                visibility: place ? undefined : 'hidden',
                ...style,
            } : style}
            onMouseDown={preserveFieldFocus && anchorRef ? (event) => event.preventDefault() : undefined}
        >
            {children}
        </div>
    );
    return anchorRef ? createPortal(surface, bounded?.container ?? popupLayerOf(anchorRef)) : surface;
}
