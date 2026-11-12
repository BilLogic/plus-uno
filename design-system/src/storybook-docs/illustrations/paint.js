/**
 * The illustration kit's whole palette, as a role map. Every drawing paints with
 * these roles and nothing else, so a drawing follows the toolbar's Color mode and
 * Contrast switches. `npm run check:docs-token-literals` fails a raw color,
 * stroke width or corner anywhere in this folder.
 *
 * A role is named for the part it paints (`cardSurface`, `tabSelected`) and maps
 * to exactly the token the real component uses for that part. `ROLES` records the
 * token and the component SCSS that uses it, and `illustration-kit-paint.test.js`
 * fails a role whose token its source no longer names. A real component changing
 * a token therefore turns that test red: update the role here in the same PR.
 *
 * `source: null` marks a drawing device with no component behind it (the browser
 * window's dots, an annotation line).
 *
 * Known approximations (SVG cannot express them, or the kit cannot draw them):
 * - Shadows are real `--ds-shadow-*` tokens on a foreignObject box at the kit's
 *   half scale, so a drawing inside a nested <svg> clips a shadow at the edge of
 *   its half.
 * - ProgressTracker: the neutral current step draws the dot ring without the
 *   brand fill (`trackerCurrentDot`), which only the accented drawing carries,
 *   so a neutral drawing never uses the brand fill.
 * - CountTag: the accent is an outline around the pill, since CountTag has no
 *   brand tone.
 * - Panel: docked, its SCSS has an edge line and no shadow, so the kit draws the
 *   same; floating, Frame's overlay fill and shadow, and no edge line.
 */

/** role: [token, source SCSS relative to design-system/src] */
const ROLES = {
  // Frame and Page
  pageSurface: ['--ds-surface', 'patterns/Frame/Frame.scss'],
  pageEdge: ['--ds-border-surface', 'styles/_surface-edge.scss'],
  frameSunken: ['--ds-surface-sunken', 'patterns/Frame/Frame.scss'],
  frameDivider: ['--ds-border', 'patterns/Frame/Frame.scss'],
  // Sidebar
  sidebarOverlaySurface: ['--ds-surface-overlay', 'patterns/Frame/Frame.scss'],
  sidebarOverlayShadow: ['--ds-shadow-overlay', 'patterns/Frame/Frame.scss'],
  sidebarSelected: ['--ds-background-selected', 'patterns/Sidebar/Sidebar.scss'],
  sidebarIcon: ['--ds-icon-subtle', 'patterns/Sidebar/Sidebar.scss'],
  // Section and Card
  // Only the subtle variant has a surface; the default Section draws none.
  sectionSubtleSurface: ['--ds-surface-sunken', 'patterns/PatternSection/PatternSection.scss'],
  cardSurface: ['--ds-surface-raised', 'patterns/PatternCard/PatternCard.scss'],
  cardShadow: ['--ds-shadow-raised', 'patterns/PatternCard/PatternCard.scss'],
  // Overlays
  popupSurface: ['--ds-surface-overlay', 'components/overlays-and-layering/Popup/Popup.scss'],
  popupShadow: ['--ds-shadow-overlay', 'components/overlays-and-layering/Popup/Popup.scss'],
  // Tooltip: a flat label, no shadow, the fill and text flip with the mode
  tooltipSurface: ['--ds-background-neutral-bold', 'components/overlays-and-layering/Tooltip/Tooltip.scss'],
  tooltipText: ['--ds-text-inverse', 'components/overlays-and-layering/Tooltip/Tooltip.scss'],
  panelSurface: ['--ds-surface-overlay', 'components/layout-and-structure/Panel/Panel.scss'],
  panelEdge: ['--ds-border', 'components/layout-and-structure/Panel/Panel.scss'],
  // A floating Panel (peek or overlay) takes Frame's overlay shadow; a docked one has none.
  panelFloatingShadow: ['--ds-shadow-overlay', 'patterns/Frame/Frame.scss'],
  modalSurface: ['--ds-surface-overlay', 'components/messaging/Modal/Modal.scss'],
  modalShadow: ['--ds-shadow-blocking', 'components/messaging/Modal/Modal.scss'],
  modalDivider: ['--ds-border', 'components/messaging/Modal/Modal.scss'],
  backdrop: ['--ds-blanket', 'patterns/Backdrop/Backdrop.scss'],
  // Placeholder text: the Skeleton component's own bar
  placeholderText: ['--ds-skeleton', 'components/loading/Skeleton/Skeleton.scss'],
  placeholderHeading: ['--ds-skeleton', 'components/loading/Skeleton/Skeleton.scss'],
  // Table row
  rowDivider: ['--ds-border', 'components/text-and-data-display/Table/Table.scss'],
  // Overflow: a part that stays put while content scrolls under it, such as a sticky table header
  overflowShadow: ['--ds-shadow-overflow', 'patterns/PatternTable/PatternTable.scss'],
  rowSelected: ['--ds-background-selected', 'components/text-and-data-display/Table/Table.scss'],
  // Field
  fieldSurface: ['--ds-background-input', 'components/forms-and-inputs/_internal/FieldBox.scss'],
  fieldBorder: ['--ds-border-input', 'components/forms-and-inputs/_internal/FieldBox.scss'],
  fieldBorderInvalid: ['--ds-border-danger', 'components/forms-and-inputs/_internal/FieldBox.scss'],
  fieldMessageDanger: ['--ds-text-danger', 'components/forms-and-inputs/_internal/FieldFrame.scss'],
  // Button
  buttonPrimary: ['--ds-background-brand-bold', 'components/forms-and-inputs/Button/Button.scss'],
  buttonPrimaryText: ['--ds-text-inverse', 'components/forms-and-inputs/Button/Button.scss'],
  buttonDefault: ['--ds-background-neutral-subtle', 'components/forms-and-inputs/Button/Button.scss'],
  buttonDefaultBorder: ['--ds-border-input', 'components/forms-and-inputs/Button/Button.scss'],
  buttonDefaultText: ['--ds-text-subtle', 'components/forms-and-inputs/Button/Button.scss'],
  // Tabs
  tabsDivider: ['--ds-border', 'components/navigation/Tabs/Tabs.scss'],
  tabSelected: ['--ds-border-selected', 'components/navigation/Tabs/Tabs.scss'],
  // Breadcrumb
  breadcrumbSeparator: ['--ds-text-subtlest', 'components/navigation/Breadcrumb/Breadcrumb.scss'],
  // ProgressTracker
  trackerConnector: ['--ds-border', 'components/status-indicators/ProgressTracker/ProgressTracker.scss'],
  trackerDot: ['--ds-icon-subtle', 'components/status-indicators/ProgressTracker/ProgressTracker.scss'],
  trackerVisited: ['--ds-icon-success', 'components/status-indicators/ProgressTracker/ProgressTracker.scss'],
  trackerCurrent: ['--ds-background-selected', 'components/status-indicators/ProgressTracker/ProgressTracker.scss'],
  trackerCurrentDot: ['--ds-background-brand-bold', 'components/status-indicators/ProgressTracker/ProgressTracker.scss'],
  trackerCurrentRing: ['--ds-border-brand', 'components/status-indicators/ProgressTracker/ProgressTracker.scss'],
  // Flag
  flagSurface: ['--ds-surface-overlay', 'components/messaging/Flag/Flag.scss'],
  flagShadow: ['--ds-shadow-overlay', 'components/messaging/Flag/Flag.scss'],
  flagIconNeutral: ['--ds-icon-subtle', 'components/messaging/Flag/Flag.scss'],
  flagIconSuccess: ['--ds-icon-success', 'components/messaging/Flag/Flag.scss'],
  flagIconWarning: ['--ds-icon-warning', 'components/messaging/Flag/Flag.scss'],
  flagIconDanger: ['--ds-icon-danger', 'components/messaging/Flag/Flag.scss'],
  flagIconInfo: ['--ds-icon-information', 'components/messaging/Flag/Flag.scss'],
  // CountTag
  countSurface: ['--ds-background-neutral', 'components/labels/CountTag/CountTag.scss'],
  countText: ['--ds-text', 'components/labels/CountTag/CountTag.scss'],
  // The one accent: it marks the drawing's subject in the brand color.
  accent: ['--ds-background-brand-bold', 'components/forms-and-inputs/Button/Button.scss'],
  // Motion drawings. A chart's axis and gridlines, and its reference line such as the
  // target, take the tokens the charts theme gives them (chartTheme.css neutral-20, neutral-40).
  axis: ['--ds-border', 'dataviz/chartTheme.css'],
  target: ['--ds-border-bold', 'dataviz/chartTheme.css'],
  // A press: the ring the pressed and focused states draw (plus-ring in _state.scss).
  tapRing: ['--ds-border-focused', 'styles/_state.scss'],
  // Drawing devices, no component behind them
  // A plotted series that is not the subject: the data-viz neutral series.
  curve: ['--ds-chart-neutral', null],
  // A path a thing travels: the subtle stroke dividers use.
  trail: ['--ds-border', null],
  // The pointer: body in the text ink, edged in the page surface so it reads on any fill.
  pointer: ['--ds-text', null],
  pointerEdge: ['--ds-surface', null],
  windowDot: ['--ds-background-neutral', null],
  // A blocked-out object in a motion principle figure: a shape, not a component
  shape: ['--ds-background-neutral', null],
  annotation: ['--ds-border-bold', null],
};

/**
 * height role: [height token, source SCSS]. The kit draws it at half (one unit
 * is 2px), and the paint test resolves each token to px and holds the drawn
 * height to it. Only roles whose real component sets a height token are here.
 */
export const HEIGHTS = {
  field: ['--height-250', 'components/forms-and-inputs/_internal/FieldBox.scss', 20],
  button: ['--item-height-md', 'components/forms-and-inputs/Button/Button.scss', 16],
  tab: ['--item-height-md', 'components/navigation/Tabs/Tabs.scss', 16],
  count: ['--label-height-md', 'components/labels/_label-heights.scss', 10],
  tracker: ['--item-height-md', 'components/status-indicators/ProgressTracker/ProgressTracker.scss', 16],
  sidebarRow: ['--item-height-md', 'patterns/Sidebar/Sidebar.scss', 16],
};

/** corner role: [radius token, source SCSS]. Drawn at the kit's half scale. */
const CORNERS = {
  window: ['--radius-0375', null],
  button: ['--button-radius-default', 'components/forms-and-inputs/Button/Button.scss'],
  card: ['--card-radius', 'patterns/PatternCard/PatternCard.scss'],
  section: ['--section-radius', 'patterns/PatternSection/PatternSection.scss'],
  popup: ['--popup-radius', 'components/overlays-and-layering/Popup/Popup.scss'],
  flag: ['--popup-radius', 'components/messaging/Flag/Flag.scss'],
  tooltip: ['--radius-control-sm', 'components/overlays-and-layering/Tooltip/Tooltip.scss'],
  modal: ['--modal-radius', 'components/messaging/Modal/Modal.scss'],
  field: ['--radius-0625', 'components/forms-and-inputs/_internal/FieldBox.scss'],
  sidebarRow: ['--frame-sidebar-row-radius', 'patterns/Sidebar/Sidebar.scss'],
  tab: ['--radius-md', 'components/navigation/Tabs/Tabs.scss'],
  count: ['--radius-sm', 'components/labels/CountTag/CountTag.scss'],
  tracker: ['--radius-control-md', 'components/status-indicators/ProgressTracker/ProgressTracker.scss'],
  cardImage: ['--card-radius-compact', 'patterns/PatternCard/PatternCard.scss'],
  shape: ['--radius-0375', null],
  full: ['--radius-full', 'components/status-indicators/ProgressTracker/ProgressTracker.scss'],
};

export const ROLE_SOURCES = Object.fromEntries(
  [...Object.entries(ROLES), ...Object.entries(CORNERS).map(([k, v]) => [`corner:${k}`, v])].map(([role, [token, source]]) => [
    role,
    { token, source },
  ]),
);

export const PAINT = Object.fromEntries(Object.entries(ROLES).map(([role, [token]]) => [role, `var(${token})`]));

/** A role's real token, at full scale. A foreignObject box scales it by half itself. */
export const CORNER_TOKEN = Object.fromEntries(Object.entries(CORNERS).map(([role, [token]]) => [role, `var(${token})`]));

/** Corners for an SVG shape: the component's radius token, halved (one unit is 2px). */
export const CORNER = {
  none: undefined,
  ...Object.fromEntries(Object.entries(CORNERS).map(([role, [token]]) => [role, `calc(var(${token}) / 2)`])),
};

/** The hairline every outline and divider draws with. */
export const HAIRLINE = { strokeWidth: 'var(--stroke-1)' };

/** A selected tab's underline: the Tabs component's selected-border width, halved. */
export const TAB_UNDERLINE = { strokeWidth: 'var(--border-selected)' };

/**
 * A real-fidelity label. Drawings show at up to twice their viewBox, so the
 * size is the real label size halved: at full width it reads at true size.
 */
export const LABEL_FONT = {
  fontFamily: 'var(--type-family-body)',
  fontWeight: 'var(--type-weight-semibold)',
  fontSize: 'calc(var(--font-size-0875) / 2)',
};
