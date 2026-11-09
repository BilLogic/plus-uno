// Patterns: slot-based shells mirroring the Figma slot components.
// Shells own the frame (tokens for bg/radius/elevation/border/spacing);
// consumers fill the slots.

export { default as Page, PAGE_LEVELS } from './Page';
export { default as Frame } from './Frame';
export { default as PageLayout } from './PageLayout';
export { useSidebarControl } from './Frame/SidebarControl';
export { usePanelControl } from './Frame/PanelControl';
export { PANEL_STORAGE_KEY } from './Frame';
export {
    default as PatternSidebar,
    useOpenTabs,
    clearOpenTabs,
    createOpenTabsStore,
    getOpenTabsStore,
    OpenTabsProvider,
    OPEN_TABS_STORAGE_KEY,
    SIDEBAR_RECENT_TABS,
} from './Sidebar';
export { default as PatternCard } from './PatternCard';
export { default as PatternSection, SECTION_DETAIL_FLOOR, sectionDetailView } from './PatternSection';
export { default as AiChat, useAiChat, AI_CHAT_MODES, AI_CHAT_STORAGE_KEY, AI_CHAT_FULLSCREEN_BELOW, AI_CHAT_DISCLAIMER } from './AiChat';
export { default as Blanket, BLANKET_WIDTHS, BLANKET_HEIGHTS, BLANKET_SPANS, BLANKET_PLACEMENTS } from './Blanket';
export { default as PatternDrawer, DRAWER_PLACEMENTS } from './PatternDrawer';
export { default as PatternModal } from './PatternModal';
export { default as PatternTable } from './PatternTable';
