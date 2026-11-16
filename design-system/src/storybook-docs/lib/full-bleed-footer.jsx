import { FooterActions } from '@/components';

/**
 * Computes the 4 equal tracks and their spans inside a rendered FooterActions
 * container, accounting for CSS zoom or transform scale.
 */
export const footerTracks = (footerEl) => {
    const box = footerEl.getBoundingClientRect();
    const style = getComputedStyle(footerEl);
    const scale = footerEl.offsetWidth > 0 ? box.width / footerEl.offsetWidth : 1;
    const gap = (parseFloat(style.columnGap) || 0) * scale;
    const trackWidth = (box.width - 3 * gap) / 4;
    const track = (n) => {
        const left = box.left + (n - 1) * (trackWidth + gap);
        return { left, right: left + trackWidth, width: trackWidth };
    };
    const span = (start, end = start) => {
        const first = track(start);
        const last = track(end);
        return { left: first.left, right: last.right, width: last.right - first.left };
    };
    return { box, gap, trackWidth, track, span };
};

export { FooterActions };
export const FooterCells = FooterActions;
