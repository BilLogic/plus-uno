import { createContext, useContext } from 'react';

/**
 * The Panel state a Frame hands everything inside it, so whatever opens the
 * Panel (a button on the Page, a control in the Sidebar, the Panel's own Close)
 * reads and sets one state.
 *
 * - `open`: whether the Panel is open (docked or overlay).
 * - `setOpen(next)`: opens or closes it.
 * - `state`: 'none' | 'docked' | 'overlay', as the layout resolver decided.
 * - `width`: the Panel's width in pixels.
 * - `panelId`: the Panel area's id, for a trigger's `aria-controls`.
 *
 * Null outside a Frame with a `panel`.
 */
export const PanelControlContext = createContext(null);

/** @returns {{ open: boolean, setOpen: (next: boolean) => void, state: 'none' | 'docked' | 'overlay', width: number, panelId: string } | null} */
export const usePanelControl = () => useContext(PanelControlContext);
