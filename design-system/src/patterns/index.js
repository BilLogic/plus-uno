// Patterns: slot-based shells mirroring the Figma slot components.
// Shells own the frame (tokens for bg/radius/elevation/border/spacing);
// consumers fill the slots.

export { default as Surface, SURFACE_LEVELS } from './Surface';
export { default as Frame } from './Frame';
export { useSidebarControl } from './Frame/SidebarControl';
export { default as Topbar } from './Topbar';
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
export { default as PatternSection } from './PatternSection';
export { default as Overlay, OVERLAY_WIDTHS, OVERLAY_HEIGHTS, OVERLAY_SPANS } from './Overlay';
export { default as PatternModal } from './PatternModal';
export { default as PatternTable } from './PatternTable';
