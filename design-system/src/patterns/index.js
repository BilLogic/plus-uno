// Patterns: slot-based shells mirroring the Figma slot components.
// Shells own the frame (tokens for bg/radius/elevation/border/spacing);
// consumers fill the slots.

export { default as Page } from './Page';
export { default as Frame } from './Frame';
export { useSidebarControl } from './Frame/SidebarControl';
export { usePanelControl } from './Frame/PanelControl';
export { PANEL_STORAGE_KEY } from './Frame';
export { default as PatternCard } from './PatternCard';
export { default as PatternSection, SECTION_DETAIL_FLOOR } from './PatternSection';
export { default as AiChat, useAiChat, AI_CHAT_MODES, AI_CHAT_STORAGE_KEY, AI_CHAT_FULLSCREEN_BELOW, AI_CHAT_DISCLAIMER } from './AiChat';
export { default as Modal, MODAL_WIDTHS, MODAL_WIDTH_PX, MODAL_WIDTH_SCREENS, MODAL_HEIGHTS } from './Modal';
export { default as Table, TABLE_KINDS } from './Table';

// Template and pattern motion helpers (Transitions & Choreography)
export {
    AreaStage,
    DrillStack,
    useDrillStack,
    SlideViews,
    StepStage,
    FocusedFrameSwitch,
    scrollToSpot,
    callAttention,
} from '../lib/navigationMotion';
export { SwapInPlace } from '../lib/swapMotion';
export { LoadThenReveal, LoadRevealSlot } from '../lib/loadRevealMotion';
export { PresenceSlot } from '../lib/listMotion';
export { useMotionReduced } from '../lib/motionPreference';
export { SPRINGS } from '../tokens/ladder/springs.generated';

