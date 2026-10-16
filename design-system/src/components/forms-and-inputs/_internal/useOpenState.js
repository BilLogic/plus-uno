import { useEffect, useRef, useState } from 'react';

/**
 * Open or shut, for a popup a field owns, controlled through `open` or not.
 *
 * A controlled `open` is the parent's: `openList` and `closeList` only ask,
 * through `onOpenChange`, and the state stays as it is until the parent
 * changes `open`. Uncontrolled, they ask and then do it.
 *
 * `onOpen` and `onClose` are the work opening and closing does, whoever
 * opened it: they run when an uncontrolled popup opens or closes, and when a
 * controlled `open` changes. The latest ones run, so they need not be stable.
 *
 * @param {object} options
 * @param {boolean} [options.open] the parent's state, to control it
 * @param {boolean} [options.defaultOpen]
 * @param {(open: boolean) => void} [options.onOpenChange]
 * @param {boolean} options.enabled false: `openList` does nothing
 * @param {() => void} [options.onOpen]
 * @param {() => void} [options.onClose]
 */
export default function useOpenState({ open, defaultOpen = false, onOpenChange, enabled, onOpen, onClose }) {
    const controlled = open !== undefined;
    const [internalOpen, setInternalOpen] = useState(Boolean(defaultOpen));
    const isOpen = controlled ? Boolean(open) : internalOpen;

    const work = useRef({ onOpen, onClose });
    work.current = { onOpen, onClose };

    const openList = () => {
        if (!enabled || isOpen) return;
        if (onOpenChange) onOpenChange(true);
        if (controlled) return;
        work.current.onOpen?.();
        setInternalOpen(true);
    };

    const closeList = () => {
        if (!isOpen) return;
        if (onOpenChange) onOpenChange(false);
        if (controlled) return;
        setInternalOpen(false);
        work.current.onClose?.();
    };

    // A controlled `open` that changes runs the same opening and closing work.
    const lastOpen = useRef(isOpen);
    useEffect(() => {
        const was = lastOpen.current;
        lastOpen.current = isOpen;
        if (!controlled || was === isOpen) return;
        if (isOpen) work.current.onOpen?.(); else work.current.onClose?.();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    return { isOpen, openList, closeList };
}
