// Templates: the coded shells a page, a section, a card, a table or an overlay
// is built from. Shells own the frame (tokens for bg/radius/elevation/border/
// spacing); consumers fill the slots.

export { default as Frame, PANEL_STORAGE_KEY } from './Frame';
export { usePanelControl } from './Frame/PanelControl';
export { default as Page } from './Page';
export { default as Section, SECTION_DETAIL_FLOOR } from './Section';
export { default as Card } from './Card';
export { default as Table, TABLE_KINDS } from './Table';
export { default as Modal, MODAL_WIDTHS, MODAL_WIDTH_PX, MODAL_WIDTH_SCREENS, MODAL_HEIGHTS } from './Modal';
export {
    default as Panel,
    PanelActionGroup,
    PanelBackAction,
    PanelBody,
    PanelCloseAction,
    PanelContainer,
    PanelDisclaimer,
    PanelDownAction,
    PanelFooter,
    PanelHeader,
    PanelHostContext,
    PanelMoreAction,
    PanelNewTabAction,
    PanelProvider,
    PanelSubheader,
    PanelUpAction,
    PanelViewSwitcher,
    usePanelManager,
} from './Panel';
export { Popup } from '@/components';
export { default as AiChat, useAiChat, AI_CHAT_MODES, AI_CHAT_STORAGE_KEY, AI_CHAT_FULLSCREEN_BELOW, AI_CHAT_DISCLAIMER } from './AiChat';
export { useSidebarControl } from '@/lib/sidebarControl';

// Template motion helpers (Transitions & Choreography)
export {
    AreaStage,
    DrillStack,
    useDrillStack,
    SlideViews,
    StepStage,
    scrollToSpot,
    callAttention,
} from '../lib/navigationMotion';
export { SwapInPlace } from '../lib/swapMotion';
export { LoadThenReveal, LoadRevealSlot } from '../lib/loadRevealMotion';
export { PresenceSlot } from '../lib/listMotion';
export { useMotionReduced } from '../lib/motionPreference';
export { SPRINGS } from '../tokens/ladder/springs.generated';
