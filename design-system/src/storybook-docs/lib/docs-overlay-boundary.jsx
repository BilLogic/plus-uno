import React, { useLayoutEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { OverlayContainer } from '@/lib/overlay';

/** Below this zoom an example would turn illegible; it scrolls sideways at this zoom instead. */
export const MIN_FIT_ZOOM = 0.5;

/**
 * How an example `natural` wide fits a preview `available` wide: the CSS zoom
 * that fits it, never above 1 and never below `MIN_FIT_ZOOM`.
 *
 * @returns {number} the zoom, 1 when it already fits
 */
export const fitZoom = (natural, available) => {
    if (!(natural > 0) || !(available > 0) || natural <= available + 1) return 1;
    return Math.max(MIN_FIT_ZOOM, available / natural);
};

/**
 * Wraps an inline docs story so floating overlays (Spotlight, Popup, Tooltip,
 * DropdownMenu, FilterMenu, PopupSelect) portal into the example's own canvas
 * and keep their requested side instead of flipping across page prose when the
 * canvas sits near or below the viewport fold.
 *
 * With `fit`, an example wider than its preview is zoomed to the preview's
 * width, so the reader sees all of it. CSS `zoom` scales layout as well as
 * paint, so hit-testing and overlay positioning stay correct.
 */
export function DocsOverlayBoundary({ disablePointerEvents = false, fit = true, children }) {
    const [node, setNode] = useState(null);
    const [scaled, setScaled] = useState(null);
    const boundary = node ? (node.closest('.docs-story > *:first-child') ?? node) : null;

    useLayoutEffect(() => {
        const host = node?.parentElement;
        if (!fit || !host) return undefined;
        const read = () => {
            const { width, zoom } = node.style;
            node.style.width = '';
            node.style.zoom = '';
            const natural = node.scrollWidth;
            node.style.width = width;
            node.style.zoom = zoom;
            const z = fitZoom(natural, host.clientWidth);
            setScaled((prev) => {
                if (z === 1) return null;
                if (prev && prev.zoom === z && prev.width === natural) return prev;
                return { zoom: z, width: natural };
            });
        };
        read();
        if (typeof ResizeObserver === 'undefined') return undefined;
        const observer = new ResizeObserver(read);
        observer.observe(host);
        [...node.children].forEach((child) => observer.observe(child));
        return () => observer.disconnect();
    }, [node, fit]);

    return (
        <div
            ref={setNode}
            data-docs-overlay-container=""
            data-docs-fit={scaled ? String(Math.round(scaled.zoom * 100) / 100) : undefined}
            style={{
                position: 'relative',
                ...(scaled ? { width: scaled.width, zoom: scaled.zoom } : undefined),
                ...(disablePointerEvents ? { pointerEvents: 'none' } : undefined),
            }}
        >
            <OverlayContainer container={node} boundary={boundary}>
                {children}
            </OverlayContainer>
        </div>
    );
}

DocsOverlayBoundary.propTypes = {
    disablePointerEvents: PropTypes.bool,
    /** Zoom an example wider than its preview down to the preview's width. Off with `parameters.docs.fit: false`. */
    fit: PropTypes.bool,
    children: PropTypes.node,
};
