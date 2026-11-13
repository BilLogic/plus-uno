import { createContext, useContext, useSyncExternalStore } from 'react';

/** A local preference for previews; product surfaces follow the live OS setting. */
export const MotionPreferenceContext = createContext(undefined);
const query = '(prefers-reduced-motion: reduce)';
const snapshot = () => typeof window !== 'undefined' && (window.matchMedia?.(query)?.matches ?? false);
const subscribe = (notify) => {
    if (!window.matchMedia) return () => {};
    const media = window.matchMedia(query);
    media.addEventListener('change', notify);
    return () => media.removeEventListener('change', notify);
};
export function useMotionReduced() {
    const local = useContext(MotionPreferenceContext);
    const system = useSyncExternalStore(subscribe, snapshot, () => false);
    return local ?? system;
}
