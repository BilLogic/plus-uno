import React from 'react';
import { createRoot } from 'react-dom/client';
import DocsFab from './DocsFab';

/**
 * Mounts the stack once into the preview's <body>, outside any story, so it
 * stays put as stories change.
 *
 * It is not a manager addon: the manager bundle is built by esbuild with no
 * `.scss` loader or `@/` alias, so the PLUS components cannot load there.
 *
 * Skipped in a nested frame (a ModeFrame story inside the docs) and under tests.
 */
export const mountDocsFab = () => {
    if (typeof window === 'undefined' || window.__PLUS_DOCS_FAB__) return;
    if (window.parent !== window.top) return;
    if (import.meta.env?.MODE === 'test' || import.meta.env?.VITEST) return;
    window.__PLUS_DOCS_FAB__ = true;
    const mount = () => {
        const container = document.createElement('div');
        container.id = 'plus-docs-fab-root';
        document.body.appendChild(container);
        createRoot(container).render(<DocsFab />);
    };
    if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', mount);
    else mount();
};
