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
 * - Hero surfaces: on the hero ground the real edge and shadow roles are too faint for a flat layer,
 *   so it takes a hairline in `illustrationEdge`; a layer with a real shadow (a page, a card, a
 *   popup) reads by that shadow, and the subject takes the accent ring. The primitives that draw
 *   a layer take this inside `HeroGround`; a layer a hero draws by hand sets it itself.
 * - Panel: docked, its SCSS has an edge line and no shadow, so the kit draws the
 *   same; floating, Frame's overlay fill and shadow, and no edge line.
 */

/** role: [token, stylesheet file name, found across the library] */
const ROLES = {
  // Frame and Page
  pageSurface: ['--ds-surface', 'Frame.scss'],
  pageEdge: ['--ds-border-surface', '_surface-edge.scss'],
  frameSunken: ['--ds-surface-sunken', 'Frame.scss'],
  frameDivider: ['--ds-border', 'Frame.scss'],
  // Sidebar
  sidebarOverlaySurface: ['--ds-surface-material-overlay', 'Frame.scss'],
  sidebarOverlayShadow: ['--ds-shadow-overlay', 'Frame.scss'],
  sidebarSelected: ['--ds-background-selected', 'Sidebar.scss'],
  sidebarIcon: ['--ds-icon-subtle', 'Sidebar.scss'],
  // Section and Card
  // A Section draws no surface; a sunken box inside one is a sunken Card.
  cardSurface: ['--ds-surface-raised', '_templates.scss'],
  cardSunken: ['--ds-surface-sunken', '_templates.scss'],
  cardShadow: ['--ds-shadow-raised', '_templates.scss'],
  // Overlays
  popupSurface: ['--ds-surface-overlay', 'Popup.scss'],
  popupShadow: ['--ds-shadow-overlay', 'Popup.scss'],
  // Tooltip: a flat label, no shadow, the fill and text flip with the mode
  tooltipSurface: ['--ds-background-neutral-bold', 'Tooltip.scss'],
  tooltipText: ['--ds-text-inverse', 'Tooltip.scss'],
  panelSurface: ['--ds-surface', 'Panel.scss'],
  panelEdge: ['--ds-border', 'Panel.scss'],
  // A floating Panel (peek or overlay) takes Frame's overlay shadow; a docked one has none.
  panelFloatingShadow: ['--ds-shadow-overlay', 'Frame.scss'],
  modalSurface: ['--ds-surface-material-overlay', 'Dialog.scss'],
  modalShadow: ['--ds-shadow-blocking', '_templates.scss'],
  modalDivider: ['--ds-border', 'Dialog.scss'],
  blanket: ['--ds-blanket', 'Modal.scss'],
  // Material: the overlay fill is `modalSurface`/`sidebarOverlaySurface`; media and control have no
  // component yet, so they are drawn from the token alone.
  materialMedia: ['--ds-surface-material-media', null],
  materialControl: ['--ds-surface-material-control', null],
  materialOverlay: ['--ds-surface-material-overlay', 'Dialog.scss'],
  materialEdge: ['--ds-border-material', 'Dialog.scss'],
  // Placeholder text: the Skeleton component's own bar
  placeholderText: ['--ds-skeleton', 'Skeleton.scss'],
  placeholderHeading: ['--ds-skeleton', 'Skeleton.scss'],
  // Table row
  rowDivider: ['--ds-border', 'components/**/Table.scss'],
  // Overflow: a part that stays put while content scrolls under it, such as a sticky table header
  overflowShadow: ['--ds-shadow-overflow', 'TableShell.scss'],
  rowSelected: ['--ds-background-selected', 'components/**/Table.scss'],
  // Field
  fieldSurface: ['--ds-background-input', 'FieldBox.scss'],
  fieldBorder: ['--ds-border-input', 'FieldBox.scss'],
  fieldBorderInvalid: ['--ds-border-danger', 'FieldBox.scss'],
  // A danger message block: the Banner's danger surface, edged by the invalid field's border.
  dangerSurface: ['--ds-background-danger', 'Banner.scss'],
  fieldMessageDanger: ['--ds-text-danger', 'FieldFrame.scss'],
  // Button
  buttonPrimary: ['--ds-background-brand-bold', 'Button.scss'],
  buttonPrimaryText: ['--ds-text-inverse', 'Button.scss'],
  buttonDefault: ['--ds-background-neutral', 'Button.scss'],
  buttonDefaultText: ['--ds-text', 'Button.scss'],
  buttonSelectedBorder: ['--ds-border-selected', 'Button.scss'],
  // Tabs
  tabsDivider: ['--ds-border', 'Tabs.scss'],
  tabSelected: ['--ds-border-selected', 'Tabs.scss'],
  // Breadcrumb
  breadcrumbSeparator: ['--ds-text-subtlest', 'Breadcrumb.scss'],
  // ProgressTracker
  trackerConnector: ['--ds-border', 'ProgressTracker.scss'],
  trackerDot: ['--ds-icon-subtle', 'ProgressTracker.scss'],
  trackerVisited: ['--ds-icon-success', 'ProgressTracker.scss'],
  trackerCurrent: ['--ds-background-selected', 'ProgressTracker.scss'],
  trackerCurrentDot: ['--ds-background-brand-bold', 'ProgressTracker.scss'],
  trackerCurrentRing: ['--ds-border-brand', 'ProgressTracker.scss'],
  // Flag
  flagSurface: ['--ds-surface-overlay', 'Flag.scss'],
  flagShadow: ['--ds-shadow-overlay', 'Flag.scss'],
  flagIconNeutral: ['--ds-icon-subtle', 'Flag.scss'],
  flagIconSuccess: ['--ds-icon-success', 'Flag.scss'],
  flagIconWarning: ['--ds-icon-warning', 'Flag.scss'],
  flagIconDanger: ['--ds-icon-danger', 'Flag.scss'],
  flagIconInfo: ['--ds-icon-information', 'Flag.scss'],
  // CountTag
  countSurface: ['--ds-background-neutral', 'CountTag.scss'],
  countText: ['--ds-text', 'CountTag.scss'],
  // The one accent: it marks the drawing's subject in the brand color.
  accent: ['--ds-background-brand-bold', 'Button.scss'],
  // Motion drawings. A chart's axis and gridlines, and its reference line such as the
  // target, take the tokens the charts theme gives them (chartTheme.css neutral-20, neutral-40).
  axis: ['--ds-border', 'chartTheme.css'],
  target: ['--ds-border-bold', 'chartTheme.css'],
  // A press: the ring the pressed and focused states draw (plus-ring in _state.scss).
  tapRing: ['--ds-border-focused', '_state.scss'],
  // Drawing devices, no component behind them
  // A plotted series that is not the subject: the data-viz neutral series.
  curve: ['--chart-neutral', null],
  // A path a thing travels: the subtle stroke dividers use.
  trail: ['--ds-border', null],
  // The pointer: body in the text ink, edged in the page surface so it reads on any fill.
  pointer: ['--ds-text', null],
  pointerEdge: ['--ds-surface', null],
  windowDot: ['--ds-background-neutral', null],
  // A blocked-out object in a motion principle figure: a shape, not a component
  shape: ['--ds-background-neutral', null],
  annotation: ['--ds-border-bold', null],
  // The edge of a surface drawn on the hero ground (--ds-surface-sunken), as the approved covers
  // draw it: a hairline in the field border. The real edge roles (`pageEdge` is transparent
  // outside increased contrast, `--ds-border` is 1.1:1 on the ground) vanish at illustration
  // scale. HeroEdges.test.jsx holds it to 1.5:1 (base modes).
  illustrationEdge: ['--ds-border-input', null],
  // The one drawn letterform: the Typography specimen's glyphs, in the text ink.
  glyph: ['--ds-text', null],
  // An icon drawn as an icon (the Iconography set): the Icon component's default subtle ink.
  iconGlyph: ['--ds-icon-subtle', 'Icon.scss'],
  // The palette shown as itself (the Foundations overview's color cell): the darkest brand
  // step closing the ramp (the lighter steps are the accent at reduced opacity), and the
  // neutrals from the ground to the text ink.
  swatchBrandBoldest: ['--ds-background-brand-boldest', null],
  swatchNeutral1: ['--ds-surface-sunken', null],
  swatchNeutral2: ['--ds-background-neutral', null],
  swatchNeutral3: ['--ds-border-bold', null],
  swatchNeutral4: ['--ds-text-subtle', null],
  swatchNeutral5: ['--ds-text', null],
  // Construction kit: Measure brackets, Zone tints, Baseline rules and Columns overlay.
  measureLine: ['--ds-border-accent-magenta', null],
  measureText: ['--ds-text-accent-magenta', null],
  measureSubtleText: ['--ds-text-subtle', null],
  zone: ['--ds-background-accent-magenta-subtler', null],
  baseline: ['--ds-background-accent-magenta-subtler', null],
  columns: ['--ds-background-accent-blue-subtler', null],
};

/**
 * height role: [height token, stylesheet file name found across the library, drawn height]. The kit draws it at half (one unit
 * is 2px), and the paint test resolves each token to px and holds the drawn
 * height to it. Only roles whose real component sets a height token are here.
 */
export const HEIGHTS = {
  field: ['--control-lg', 'FieldBox.scss', 20],
  button: ['--control-md', 'Button.scss', 16],
  tab: ['--control-md', 'Tabs.scss', 16],
  count: ['--label-height-sm', '_label-heights.scss', 8],
  tracker: ['--control-md', 'ProgressTracker.scss', 16],
  sidebarRow: ['--control-md', 'Sidebar.scss', 16],
};

/** corner role: [radius token, stylesheet file name, found across the library]. Drawn at the kit's half scale. */
const CORNERS = {
  window: ['--radius-control-sm', null],
  button: ['--button-radius-default', 'Button.scss'],
  buttonCompact: ['--button-radius-compact', 'Button.scss'],
  buttonSpacious: ['--button-radius-spacious', 'Button.scss'],
  card: ['--card-radius', 'Card.scss'],
  section: ['--card-radius', 'Card.scss'],
  popup: ['--popup-radius', 'Popup.scss'],
  flag: ['--popup-radius', 'Flag.scss'],
  tooltip: ['--radius-control-sm', 'Tooltip.scss'],
  modal: ['--modal-radius', 'Modal.scss'],
  field: ['--radius-control-lg', 'FieldBox.scss'],
  sidebarRow: ['--frame-sidebar-row-radius', 'Sidebar.scss'],
  tab: ['--radius-control-md', 'Tabs.scss'],
  count: ['--radius-md', 'CountTag.scss'],
  tag: ['--radius-md', 'Tag.scss'],
  icon: ['--radius-sm', null],
  tracker: ['--radius-control-md', 'ProgressTracker.scss'],
  cardImage: ['--card-radius', 'Card.scss'],
  shape: ['--radius-control-sm', null],
  full: ['--radius-full', 'ProgressTracker.scss'],
};

export const ROLE_SOURCES = Object.fromEntries(
  [...Object.entries(ROLES), ...Object.entries(CORNERS).map(([k, v]) => [`corner:${k}`, v])].map(([role, [token, source]]) => [
    role,
    { token, source },
  ]),
);

export const PAINT = {
  ...Object.fromEntries(Object.entries(ROLES).map(([role, [token]]) => [role, `var(${token})`])),
  /* docs-literal: the Logo mark's desaturated tile is a mix of two tokens, and no token carries that gray. */ markTile: 'color-mix(in srgb, var(--ds-text) 22%, var(--ds-surface-sunken))',
};

/** A role's real token, at full scale. A foreignObject box scales it by half itself. */
export const CORNER_TOKEN = Object.fromEntries(Object.entries(CORNERS).map(([role, [token]]) => [role, `var(${token})`]));

/** Corners for an SVG shape: the component's radius token, halved (one unit is 2px). */
export const CORNER = {
  none: undefined,
  ...Object.fromEntries(Object.entries(CORNERS).map(([role, [token]]) => [role, `calc(var(${token}) / 2)`])),
};

/** A corner role scaled for 2x or 4x construction close-ups. */
export const scaledCorner = (role, factor) => `calc(${CORNER_TOKEN[role]} * ${factor})`;

/**
 * The hairline every outline and divider draws with. A hero draws one unit as 2px,
 * so `HeroDrawing` sets `--stroke-hairline` to half a stroke and every kit
 * outline inside a hero renders 1 device px; elsewhere docs-rhythm.css leaves it the stroke token.
 */
export const HAIRLINE = { strokeWidth: 'var(--stroke-hairline)' };

/** The hairline a hero sets on its drawing: half a stroke, since one unit is 2px there. */
export const HERO_HAIRLINE = 'calc(var(--border-width-default) / 2)';

/** A selected tab's underline: the Tabs component's selected-border width, halved. */
export const TAB_UNDERLINE = { strokeWidth: 'var(--border-width-selected)' };

/**
 * A real-fidelity label. Drawings show at up to twice their viewBox, so the
 * size is the real label size halved (`--kit-label-drawing-size`, docs-rhythm.css):
 * at full width it reads at true size.
 */
export const LABEL_FONT = {
  fontFamily: 'var(--type-family-body)',
  fontWeight: 'var(--type-weight-semibold)',
  fontSize: 'var(--kit-label-drawing-size)',
};

/**
 * Mono label for construction-kit brackets and zone callouts, at 1:1 scale
 * (`--kit-label-mono-drawing-size`, docs-rhythm.css).
 */
export const MONO_LABEL_FONT = {
  fontFamily: 'var(--type-family-code)',
  fontWeight: 'var(--type-weight-medium)',
  fontSize: 'var(--kit-label-mono-drawing-size)',
};
