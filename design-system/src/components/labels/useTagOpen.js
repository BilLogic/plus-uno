import { useState } from 'react';

/**
 * Open or shut, for a tag whose `menu` opens in a popup, controlled through
 * `isOpen` or not. The tag owns it so the chevron can follow it.
 *
 * A controlled `isOpen` is the parent's: `setOpen` only asks, through
 * `onOpenChange`, and the state stays as it is until the parent changes
 * `isOpen`. Uncontrolled, it asks and then does it.
 *
 * @param {object} options
 * @param {boolean} [options.isOpen] the parent's state, to control it
 * @param {boolean} [options.defaultOpen]
 * @param {(open: boolean) => void} [options.onOpenChange]
 * @returns {{ isOpen: boolean, setOpen: (next: boolean) => void }}
 */
export default function useTagOpen({ isOpen: controlledOpen, defaultOpen = false, onOpenChange }) {
    const controlled = controlledOpen !== undefined;
    const [internalOpen, setInternalOpen] = useState(Boolean(defaultOpen));
    const isOpen = controlled ? Boolean(controlledOpen) : internalOpen;

    const setOpen = (next) => {
        if (next === isOpen) return;
        onOpenChange?.(next);
        if (!controlled) setInternalOpen(next);
    };

    return { isOpen, setOpen };
}
