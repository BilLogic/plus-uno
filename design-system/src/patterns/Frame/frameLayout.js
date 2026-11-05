/**
 * Frame layout resolver. One pure function: the Frame's width, the Panel's
 * width, the Sidebar's request, the chat mode and whether a List and detail
 * layout is active go in; the Sidebar state, the Panel state, the content
 * width and whether the split holds come out. Fit is measured from the
 * Frame's own width, never the window.
 *
 * Rules, in order:
 *   1. Under 1024 the Sidebar never docks and the Panel is capped at 320 and
 *      opens as overlay. Under 768 the Panel is full width.
 *   2. A Sidebar opened by hand wins: the Panel goes to overlay if both do
 *      not fit.
 *   3. Otherwise, if both fit at the 720 floor, both dock.
 *   4. Otherwise the Sidebar auto-collapses (restored when the Panel closes)
 *      if that keeps the floor with the Panel docked.
 *   5. Otherwise the Panel goes to overlay.
 *   6. For List and detail the split holds from 960, met by collapsing the
 *      Sidebar first when the Panel is docked.
 */

// Numbers from the Frame spec. sidebarWidth, pagePad and the three Panel widths
// restate `--frame-sidebar-width`, `--page-pad` and `--panel-*-width`;
// frameLayout.test.js reads the token source and fails when they differ.
export const FRAME_LAYOUT = Object.freeze({
    sidebarWidth: 240,
    pagePad: 24,
    contentFloor: 720,
    contentCap: 1232,
    splitFloor: 960,
    dockMin: 1024,
    fullWidthBelow: 768,
    panelMin: 320,
    panelDefault: 400,
    panelMax: 640,
});

const L = FRAME_LAYOUT;
const padTotal = L.pagePad * 2;

/** The one clamp: the Frame, the splitter and the resolver share it. */
export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

/**
 * @param {object} input
 * @param {number} input.frameWidth
 * @param {number} [input.panelWidth] requested Panel width, 320..640
 * @param {{open: boolean, setBy: 'hand' | 'default'}} [input.sidebar]
 * @param {boolean} [input.sidebarPeek] hover on the collapsed Sidebar's toggle
 * @param {'popup' | 'panel' | 'fullscreen'} [input.chatMode]
 * @param {boolean} [input.listDetail]
 * @returns {{
 *   sidebar: 'docked' | 'collapsed' | 'peeking' | 'overlay',
 *   panel: 'none' | 'docked' | 'overlay',
 *   panelWidth: number,
 *   splitHolds: boolean,
 *   blanket: boolean,
 * }}
 */
export function resolveFrameLayout({
    frameWidth,
    panelWidth = L.panelDefault,
    sidebar = { open: true, setBy: 'default' },
    sidebarPeek = false,
    chatMode = 'popup',
    listDetail = false,
}) {
    const narrow = frameWidth < L.dockMin;
    const wantsPanel = chatMode === 'panel';
    const byHand = sidebar.setBy === 'hand';
    const sidebarWants = sidebar.open;

    // Rule 1: Panel width.
    const requestedPanel = clamp(panelWidth, L.panelMin, L.panelMax);
    let effectivePanelWidth = requestedPanel;
    if (frameWidth < L.fullWidthBelow) effectivePanelWidth = frameWidth;
    else if (narrow) effectivePanelWidth = L.panelMin;

    const contentFor = (sidebarDocked, panelDocked) =>
        frameWidth - (sidebarDocked ? L.sidebarWidth : 0) - (panelDocked ? effectivePanelWidth : 0) - padTotal;

    let sidebarState; // 'docked' | 'collapsed' | 'overlay'; 'peeking' is set last
    let panelState = 'none';

    if (narrow) {
        if (wantsPanel) {
            // One overlay at a time: the Panel keeps it.
            panelState = 'overlay';
            sidebarState = 'collapsed';
        } else {
            sidebarState = sidebarWants && byHand ? 'overlay' : 'collapsed';
        }
    } else if (!wantsPanel) {
        sidebarState = sidebarWants ? 'docked' : 'collapsed';
    } else if (!sidebarWants) {
        sidebarState = 'collapsed';
        panelState = contentFor(false, true) >= L.contentFloor ? 'docked' : 'overlay';
    } else if (contentFor(true, true) >= L.contentFloor) {
        // Rule 3.
        sidebarState = 'docked';
        panelState = 'docked';
    } else if (byHand) {
        // Rule 2.
        sidebarState = 'docked';
        panelState = 'overlay';
    } else if (contentFor(false, true) >= L.contentFloor) {
        // Rule 4.
        sidebarState = 'collapsed';
        panelState = 'docked';
    } else {
        // Rule 5.
        sidebarState = 'docked';
        panelState = 'overlay';
    }

    // Rule 6: collapse a default Sidebar to keep the List and detail split.
    if (
        listDetail &&
        panelState === 'docked' &&
        sidebarState === 'docked' &&
        !byHand &&
        contentFor(true, true) < L.splitFloor &&
        contentFor(false, true) >= L.splitFloor
    ) {
        sidebarState = 'collapsed';
    }

    const sidebarDocked = sidebarState === 'docked';
    const panelDocked = panelState === 'docked';
    const rawContent = contentFor(sidebarDocked, panelDocked);

    if (sidebarState === 'collapsed' && sidebarPeek) sidebarState = 'peeking';

    return {
        sidebar: sidebarState,
        panel: panelState,
        panelWidth: effectivePanelWidth,
        splitHolds: listDetail && rawContent >= L.splitFloor,
        // The Blanket belongs to an overlay Panel only: a raised Sidebar has none.
        blanket: panelState === 'overlay',
    };
}
