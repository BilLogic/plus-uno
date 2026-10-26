import { createContext, useContext } from 'react';

/**
 * The sidebar state a Frame hands its Topbar, so the frame owns the
 * state and the topbar draws the one toggle.
 *
 * - `sidebar`: 'open' while docked or floating, 'closed' otherwise.
 * - `docked`: true while the sidebar is in flow beside the surface.
 * - `toggleProps`: the toggle's ref, click and peek handlers, and
 *   `aria-controls`, spread onto the toggle button.
 *
 * Null outside a Frame with a sidebar.
 */
export const SidebarControlContext = createContext(null);

/** @returns {{ sidebar: 'open' | 'closed', docked: boolean, toggleProps: object } | null} */
export const useSidebarControl = () => useContext(SidebarControlContext);
