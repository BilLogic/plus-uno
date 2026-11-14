import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { OverlayContainer } from '@/lib/overlay';

/**
 * Wraps an inline docs story so floating overlays (Spotlight, Popup, Tooltip,
 * DropdownMenu, FilterMenu, PopupSelect) portal into the example's own canvas
 * and keep their requested side instead of flipping across page prose when the
 * canvas sits near or below the viewport fold.
 */
export function DocsOverlayBoundary({ disablePointerEvents = false, children }) {
    const [node, setNode] = useState(null);
    const boundary = node ? (node.closest('.docs-story > *:first-child') ?? node) : null;
    return (
        <div
            ref={setNode}
            data-docs-overlay-container=""
            style={{
                position: 'relative',
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
    children: PropTypes.node,
};
