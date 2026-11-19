// Templates: the coded shells a page, a section, a card, a table or an overlay
// is built from. Each is the same component the `@/patterns` barrel exports,
// under its template name, so either import reaches one implementation.

export { default as Frame, PANEL_STORAGE_KEY } from '../patterns/Frame';
export { usePanelControl } from '../patterns/Frame/PanelControl';
export { default as Page } from '../patterns/Page';
export { default as Section, SECTION_DETAIL_FLOOR } from '../patterns/PatternSection';
export { default as Card } from '../patterns/PatternCard';
export { default as Table, TABLE_KINDS } from '../patterns/Table';
export { default as Modal, MODAL_WIDTHS, MODAL_WIDTH_PX, MODAL_WIDTH_SCREENS, MODAL_HEIGHTS } from '../patterns/Modal';
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
} from '../patterns/Panel';
export { Popup } from '@/components';
