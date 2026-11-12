/**
 * The motion registry: one row per template, pattern and component, naming its
 * enter, exit and change motion by semantic token (`MOTION_SEMANTICS` in
 * `plan.mjs`, e.g. `spatial.fast`), plus any per-row rule.
 *
 * Filled from the motion docs' Components, Patterns and Templates tables, one
 * row per PR. `check:motion-registry` holds it:
 * every interactive component is a row here or on the allow-list in
 * `scripts/baselines/motion-registry.json`, and every token a row names exists.
 *
 * Row shape:
 *   { name: 'Popup', tier: 'component',   // 'component' | 'pattern' | 'template'
 *     events: {
 *       enter:  { transition: 'Open', spatial: 'spatial.fast', appearance: 'appearance.fast',
 *                 note: 'optional', sound: { token: 'prompt', at: 'land', when: 'optional' } },
 *       exit:   { transition: 'Close', spatial: 'spatial.exit' },
 *       change: { ... },                  // optional
 *       // further named events: success, milestone, rejected, land, blocked, ...
 *     } }
 * Each event's `spatial` and `appearance` are optional but one is required, and
 * each must be a semantic token (or `linear`). `transition`, `note` and `sound`
 * are not read by `check:motion-registry`; `check:sound-registry` owns `sound`.
 * Only `tier: 'component'` rows must be interactive components in the index.
 *
 * @typedef {{token: string, at?: 'land' | 'start', when?: string}} MotionSound
 * @typedef {{transition?: string, spatial?: string, appearance?: string, note?: string, sound?: MotionSound}} MotionEvent
 * @type {{name: string, tier: 'component' | 'pattern' | 'template', events: Record<string, MotionEvent>}[]}
 */
export const MOTION_REGISTRY = [
  // Templates: the page-level moves, from 07-templates. A template page and a component can share a name
  // (Panel, Popup); the page names its tier in `<MotionSection tier="template">`.
  {
    name: 'Frame',
    tier: 'template',
    events: {
      'sidebar-open': { transition: 'Dock and undock a panel', spatial: 'spatial.default', note: 'The Sidebar opens on spatial.default while the Page narrows on the same clock. The Sidebar never moves when the Page changes.' },
      'sidebar-close': { transition: 'Dock and undock a panel', spatial: 'spatial.fast', note: 'It closes on spatial.fast to its edge and leaves nothing behind: no rail.' },
      'panel-dock': { transition: 'Dock and undock a panel', spatial: 'spatial.slow', appearance: 'appearance.fast', note: 'The AI Panel docks on the right and the Page makes room; its content fades in once the page is about 90% done.' },
      'panel-undock': { transition: 'Dock and undock a panel', spatial: 'spatial.default', note: 'It reverses and stays at the edge.' },
      'focused-open': { transition: 'Drill into and climb back out', appearance: 'appearance.default', note: 'Focused opens as a change of frame: the page and the Sidebar fade out together on appearance.fast, then the task fades in, in place. A focused task fades; it does not grow or slide. Bare frames, such as sign-in, do not move.' },
      'focused-close': { transition: 'Drill into and climb back out', appearance: 'appearance.fast', note: 'Close and Cancel reverse the entrance one speed faster: the task fades out, then the page and Sidebar fade back in, asking first in a Modal if anything is unsaved.' },
      step: { transition: 'Step to the next or previous', spatial: 'spatial.default', appearance: 'appearance.fast', note: 'The body slides on the same axis as the step list: up with the steps down the left, across with four or fewer across the top. Step states change in place. Placement is set once, when the task opens, by the longest path the flow can take.' },
    },
  },
  {
    name: 'Page',
    tier: 'template',
    events: {
      title: { transition: 'Scroll to a spot on the page', appearance: 'linear', note: 'The header is scroll-linked: the small title fades in at the end of the Breadcrumb row, its opacity mapped to the next 24 px of scroll. No spring, no timer, no snap when scrolling stops.' },
      anchor: { transition: 'Scroll to a spot on the page', appearance: 'linear', note: 'The actions and the tabs ride up with the page and anchor: the actions at the end of the Breadcrumb row, the tabs under it. One copy of every control. A focused task header just sticks.' },
      'tabs-shadow': { transition: 'Update a value or state', appearance: 'appearance.fast', note: 'The tabs\' shadow appears when they stick, a single moment. In Reduced mode nothing changes: every movement is the person\'s own scroll.' },
    },
  },
  {
    name: 'PatternSection',
    tier: 'template',
    events: {
      'view-bar': { transition: 'Swap content in place', spatial: 'spatial.fast', appearance: 'appearance.fast', note: 'Title row: nothing moves. The selected pill\'s fill and the format switch\'s indicator glide while the content swaps in place. Search and the Filter count grow to the left.' },
      'side-open': { transition: 'Expand and collapse', spatial: 'spatial.default', note: 'The side opens and collapses as a section. Below 960 it hides with no animation.' },
      'side-close': { transition: 'Expand and collapse', spatial: 'spatial.default', note: 'Collapses back the same way. Below 960 the side is gone in the same frame, with no animation.' },
      detail: { transition: 'Open and close an overlay', spatial: 'spatial.default', appearance: 'appearance.default', note: 'A quick look is an overlay; promoted to its record page it grows from the Panel itself.' },
      body: { transition: 'Load content', spatial: 'spatial.fast', appearance: 'appearance.fast', note: 'Content loads on arrival; add or remove, reorder and swap content as it changes.' },
      footer: { transition: 'Step to the next or previous', spatial: 'spatial.default', note: 'Paging is Step.' },
    },
  },
  {
    name: 'PatternCard',
    tier: 'template',
    events: {
      change: { transition: 'Update a value or state', appearance: 'appearance.fast', note: 'It changes color on hover and press like a Button. Opening a clickable card is Drill.' },
      milestone: { transition: 'Opening a page', spatial: 'spatial.default', note: 'The one card in a milestone page entrance is Expressive and leaves by the exit rules.' },
    },
  },
  {
    name: 'PatternTable',
    tier: 'template',
    events: {
      selection: { transition: 'Update a value or state', appearance: 'appearance.fast', note: 'Ticking a row turns the head row into the bulk bar: labels cross-fade, same row, same height, nothing slides. Selected rows take the selected fill. The view bar above never moves.' },
    },
  },
  {
    name: 'PatternModal',
    tier: 'template',
    events: {
      enter: { transition: 'Open and close an overlay', spatial: 'spatial.default', appearance: 'appearance.default', note: 'Scales from 96% and fades in; the Blanket dims on appearance.default. It opens only from something the person did, and focus moves to its first input as the motion starts.' },
      exit: { transition: 'Open and close an overlay', spatial: 'spatial.fast', appearance: 'appearance.fast', note: 'Leaves at 98%, fading.' },
      swap: { transition: 'Swap content in place', appearance: 'appearance.fast', note: 'One Modal at a time: a confirm replaces the content in place, never a second Modal.' },
      rejected: { transition: 'Call attention', spatial: 'spatial.fast', note: 'A blocked submit shakes it once; never in reduced motion.' },
    },
  },
  {
    name: 'Backdrop',
    tier: 'template',
    events: {
      enter: { transition: 'Open and close an overlay', appearance: 'appearance.default', note: 'The Blanket dims on the same fade as the layer it sits under.' },
      exit: { transition: 'Open and close an overlay', appearance: 'appearance.fast', note: 'It fades with the layer; a docked Panel never has one.' },
    },
  },
  {
    name: 'PatternDrawer',
    tier: 'template',
    events: {
      enter: { transition: 'Open and close an overlay', spatial: 'spatial.slow', note: 'Slides from its edge; only the Blanket fades, the Drawer itself never does.' },
      exit: { transition: 'Open and close an overlay', spatial: 'spatial.default', note: 'Slides back to the same edge and stays there.' },
    },
  },
  {
    name: 'Panel',
    tier: 'template',
    events: {
      'docked-enter': { transition: 'Dock and undock a panel', spatial: 'spatial.slow', appearance: 'appearance.fast', note: 'The AI Panel slides in from its edge while the page makes room; its content fades in once the page is about 90% done. A docked Panel never has a Backdrop.' },
      'docked-exit': { transition: 'Dock and undock a panel', spatial: 'spatial.default', note: 'Reverses and stays at the edge.' },
      'floating-enter': { transition: 'Dock and undock a panel', spatial: 'spatial.default', note: 'Details and the Inbox slide in from their edge over the page; the Inbox grows out of the Sidebar from the left. A quick look promoted to its record grows from the Panel itself.' },
      'floating-exit': { transition: 'Dock and undock a panel', spatial: 'spatial.fast', note: 'Reverses.' },
      'narrow-enter': { transition: 'Open and close an overlay', spatial: 'spatial.slow', note: 'At narrow widths it slides over with a Blanket, like an edge layer.' },
      'narrow-exit': { transition: 'Open and close an overlay', spatial: 'spatial.default', note: 'The same way back.' },
    },
  },
  {
    name: 'Popup',
    tier: 'template',
    events: {
      enter: { transition: 'Open and close an overlay', spatial: 'spatial.fast', appearance: 'appearance.fast', note: 'Clips open from the trigger\'s corner on the side it is aligned to. From the keyboard it opens with no animation.' },
      exit: { transition: 'Open and close an overlay', appearance: 'appearance.fast', note: 'Fades.' },
    },
  },
  {
    name: 'Form',
    tier: 'template',
    events: {
      focus: { transition: 'Update a value or state', appearance: 'appearance.fast', note: 'A form in a page, a Panel or a Modal moves by its container; a form in steps is Frame, focused. A field\'s border changes color on focus; the focus ring never animates. Field motion is in Patterns, Forms.' },
      error: { transition: 'Call attention', spatial: 'spatial.fast', appearance: 'appearance.fast', note: 'An error on leaving a field makes room, then fades in; it fades and the room closes once the field is fixed.' },
    },
  },
  // Patterns: how a pattern composes transitions, from 06-patterns. One row per Patterns page; check:motion-registry requires it.
  {
    name: 'Filtering',
    tier: 'pattern',
    events: {
      'menu-open': { transition: 'Open and close an overlay', spatial: 'spatial.fast', note: 'A filter menu clips open from the Filter icon\'s top-right corner; its right edge stays on the icon\'s.' },
      'menu-close': { transition: 'Open and close an overlay', appearance: 'appearance.fast', note: 'A filter menu fades closed.' },
      'count-first': { transition: 'Update a value or state', spatial: 'spatial.fast', appearance: 'appearance.fast', note: 'The first filter widens the Filter button to the left, right edge fixed, and the count fades in. A quick FilterButton\'s count hugs the label the same way. Below 960 a filter side hides with no animation: the Filter icon is back with its count in the same frame.' },
      'count-change': { transition: 'Update a value or state', appearance: 'appearance.fast', note: 'The Filter count grows to the left; a changed number fades to its new value.' },
      reset: { transition: 'Update a value or state', spatial: 'spatial.fast', appearance: 'appearance.fast', note: 'The count fades out, then the icon narrows back.' },
      search: { transition: 'Update a value or state', spatial: 'spatial.fast', note: 'Search grows to the left, right edge fixed, so the pills and the primary never move. Escape, or an empty blur, shrinks it back the same way; fast stays fast on exit.' },
      chip: { transition: 'Add or remove an item', spatial: 'spatial.fast', appearance: 'appearance.fast', note: 'A chip being added or removed is Add or remove.' },
      results: { transition: 'Swap content in place', appearance: 'appearance.fast', note: 'The results swap in place, a clean fade, once per Apply. Typing in Search filters the list the same way.' },
      'results-load': { transition: 'Load content', appearance: 'appearance.fast', note: 'When the fetch is slow, the results are Load.' },
    },
  },
  {
    name: 'Common actions',
    tier: 'pattern',
    events: {
      selection: { transition: 'Update a value or state', appearance: 'appearance.fast', note: 'Ticking a row turns the table\'s head row into the bulk bar: the labels cross-fade, same row, same height, nothing slides. The selected rows take the selected fill and the count fades to each new value. Clearing the rows, or the select-all checkbox, reverses it. The view bar above never moves.' },
      confirm: { transition: 'Open and close an overlay', appearance: 'appearance.fast', note: 'A destructive action opens a Modal. Confirm fades it and carries on: the row\'s status changes color, and a Flag confirms.' },
      cancel: { transition: 'Open and close an overlay', spatial: 'spatial.fast', appearance: 'appearance.fast', note: 'Cancel reverses the Modal\'s entrance one speed faster.' },
      undo: { transition: 'Add or remove an item', spatial: 'spatial.fast', appearance: 'appearance.fast', note: 'Keep and Undo sit beside the change, tinted, until the person moves on. Undo reverses the Add or remove that made the change.' },
    },
  },
  {
    name: 'Forms',
    tier: 'pattern',
    events: {
      focus: { transition: 'Update a value or state', appearance: 'appearance.fast', note: 'Border color on appearance.fast. The focus ring never animates.' },
      error: { transition: 'Call attention', spatial: 'spatial.fast', appearance: 'appearance.fast', note: 'An error on leaving a field makes room on spatial.fast, then fades in; it fades and the room closes once the field is fixed.' },
      blocked: { transition: 'Call attention', spatial: 'spatial.fast', note: 'A blocked submit shakes the Modal, or the field with its own button, once. Never bigger on repeat; never in Reduced mode.' },
      failed: { transition: 'Call attention', spatial: 'spatial.fast', appearance: 'appearance.fast', note: 'When the system failed, a message makes room at the top of the Modal or form, then fades in. No shake: the person did nothing wrong. A page-level error is a one-line summary that makes room at the top; focus goes to the first error.' },
      steps: { transition: 'Step to the next or previous', appearance: 'appearance.fast', note: 'Step states change in place.' },
      saving: { transition: 'Update a value or state', appearance: 'appearance.fast', note: 'The button keeps its width: its label fades out, a Spinner fades in, and the same button confirms when done.' },
    },
  },
  {
    name: 'Errors',
    tier: 'pattern',
    events: {
      appear: { transition: 'Call attention', appearance: 'appearance.fast', note: 'Once; the message carries the meaning.' },
      field: { transition: 'Add or remove an item', spatial: 'spatial.fast', appearance: 'appearance.fast', note: 'A field error makes room on spatial.fast, then fades in on appearance.fast; it reverses once fixed.' },
      blocked: { transition: 'Call attention', spatial: 'spatial.fast', note: 'A blocked submit shakes once, a spring per Physics; never in Reduced mode.' },
      failed: { transition: 'Call attention', spatial: 'spatial.fast', appearance: 'appearance.fast', note: 'A system failure makes room at the top, then fades in. No shake.' },
    },
  },
  {
    name: 'Disabled',
    tier: 'pattern',
    events: {
      change: { transition: 'Update a value or state', appearance: 'appearance.fast', note: 'No motion; the state is color.' },
    },
  },
  {
    name: 'Read-only',
    tier: 'pattern',
    events: {
      change: { transition: 'Update a value or state', appearance: 'appearance.fast', note: 'No motion; the state is color.' },
    },
  },
  {
    name: 'Popup',
    tier: 'component',
    events: {
      enter: {
        transition: 'Open',
        spatial: 'spatial.fast',
        appearance: 'appearance.fast',
        note: "Clips open from the trigger's corner on the side it is aligned to. From the keyboard it opens with no animation.",
      },
      exit: {
        transition: 'Close',
        spatial: 'spatial.exit',
        appearance: 'appearance.fast',
        note: 'The clip folds back to the same corner while it fades. Under reduced motion it is the fade alone.',
      },
    },
  },
  {
    name: 'Button',
    tier: 'component',
    events: {
      change: { transition: 'Update a value or state', appearance: 'appearance.fast', note: 'Hover and press change color, 90% by about 110 ms.' },
    },
  },
  {
    name: 'IconButton',
    tier: 'component',
    events: {
      change: { transition: 'Update a value or state', appearance: 'appearance.fast', note: 'Hover and press change color, 90% by about 110 ms.' },
    },
  },
  {
    name: 'LinkButton',
    tier: 'component',
    events: {
      change: { transition: 'Update a value or state', appearance: 'appearance.fast', note: 'Hover and press change color, 90% by about 110 ms.' },
    },
  },
  {
    name: 'LinkIconButton',
    tier: 'component',
    events: {
      change: { transition: 'Update a value or state', appearance: 'appearance.fast', note: 'Hover and press change color, 90% by about 110 ms.' },
    },
  },
  {
    name: 'CloseButton',
    tier: 'component',
    events: {
      change: { transition: 'Update a value or state', appearance: 'appearance.fast', note: 'Hover and press change color, 90% by about 110 ms.' },
    },
  },
  {
    name: 'VerticalButton',
    tier: 'component',
    events: {
      change: { transition: 'Update a value or state', appearance: 'appearance.fast', note: 'Hover and press change color, 90% by about 110 ms.' },
    },
  },
  {
    name: 'SplitButton',
    tier: 'component',
    events: {
      change: { transition: 'Update a value or state', appearance: 'appearance.fast', note: 'As Button; its menu is a Popup.' },
      enter: { transition: 'Open and close an overlay', spatial: 'spatial.fast', appearance: 'appearance.fast', note: 'The menu clips open from its trigger.' },
      exit: { transition: 'Open and close an overlay', appearance: 'appearance.fast', note: 'The menu fades.' },
    },
  },
  {
    name: 'Checkbox',
    tier: 'component',
    events: {
      change: { transition: 'Update a value or state', appearance: 'appearance.fast', note: 'Mark and fill change color.' },
    },
  },
  {
    name: 'Radio',
    tier: 'component',
    events: {
      change: { transition: 'Update a value or state', appearance: 'appearance.fast', note: 'Mark and fill change color.' },
    },
  },
  {
    name: 'RadioGroup',
    tier: 'component',
    events: {
      change: { transition: 'Update a value or state', appearance: 'appearance.fast', note: 'Mark and fill change color.' },
    },
  },
  {
    name: 'ChoiceGrid',
    tier: 'component',
    events: {
      change: { transition: 'Update a value or state', appearance: 'appearance.fast', note: 'Mark and fill change color.' },
    },
  },
  {
    name: 'Toggle',
    tier: 'component',
    events: {
      change: { transition: 'Update a value or state', spatial: 'spatial.fast', appearance: 'appearance.fast', note: 'Color carries the feedback; the thumb follows.' },
    },
  },
  {
    name: 'TextField',
    tier: 'component',
    events: {
      change: { transition: 'Update a value or state', spatial: 'spatial.fast', appearance: 'appearance.fast', note: 'Border color changes on focus and error. An error message makes room, then fades in; it fades, then the room closes, once the field is fixed.' },
    },
  },
  {
    name: 'TextArea',
    tier: 'component',
    events: {
      change: { transition: 'Update a value or state', spatial: 'spatial.fast', appearance: 'appearance.fast', note: 'Border color changes on focus and error. An error message makes room, then fades in; it fades, then the room closes, once the field is fixed.' },
    },
  },
  {
    name: 'Range',
    tier: 'component',
    events: {
      change: { transition: 'Update a value or state', spatial: 'spatial.fast', appearance: 'linear', note: "The thumb follows the pointer; on release it settles on a spring that starts from the hand's speed." },
    },
  },
  {
    name: 'Link',
    tier: 'component',
    events: {
      change: { transition: 'Update a value or state', appearance: 'appearance.fast', note: 'Color only, on the fast fade.' },
    },
  },
  {
    name: 'Rating',
    tier: 'component',
    events: {
      change: { transition: 'Update a value or state', appearance: 'appearance.fast', note: 'Stars fill as a color change, staggered 20 ms.' },
    },
  },
  {
    name: 'Tabs',
    tier: 'component',
    events: {
      change: { transition: 'Switch views', spatial: 'spatial.fast', note: 'The indicator glides; both tab bodies slide together toward the chosen tab, no fade. Pill views: the fill glides and the content swaps in place.' },
    },
  },
  {
    name: 'FilterButton',
    tier: 'component',
    events: {
      change: { transition: 'Update a value or state', spatial: 'spatial.fast', appearance: 'appearance.fast', note: 'The count hugs the label: the button widens, the number fades in.' },
    },
  },
  {
    name: 'DropdownMenu',
    tier: 'component',
    events: {
      enter: { transition: 'Open and close an overlay', spatial: 'spatial.fast', appearance: 'appearance.fast', note: "Clips open from the trigger's corner on the side it is aligned to." },
      exit: { transition: 'Open and close an overlay', appearance: 'appearance.fast', note: 'Fades. The exit is the fade.' },
    },
  },
  {
    name: 'Select',
    tier: 'component',
    events: {
      enter: { transition: 'Open and close an overlay', spatial: 'spatial.fast', appearance: 'appearance.fast', note: "Clips open from the trigger's corner on the side it is aligned to." },
      exit: { transition: 'Open and close an overlay', appearance: 'appearance.fast', note: 'Fades. The exit is the fade.' },
    },
  },
  {
    name: 'FilterMenu',
    tier: 'component',
    events: {
      enter: { transition: 'Open and close an overlay', spatial: 'spatial.fast', appearance: 'appearance.fast', note: "Clips open from the trigger's corner on the side it is aligned to." },
      exit: { transition: 'Open and close an overlay', appearance: 'appearance.fast', note: 'Fades. The exit is the fade.' },
    },
  },
  {
    name: 'PopupSelect',
    tier: 'component',
    events: {
      enter: { transition: 'Open and close an overlay', spatial: 'spatial.fast', appearance: 'appearance.fast', note: "Clips open from the trigger's corner on the side it is aligned to." },
      exit: { transition: 'Open and close an overlay', appearance: 'appearance.fast', note: 'Fades. The exit is the fade.' },
    },
  },
  {
    name: 'Tooltip',
    tier: 'component',
    events: {
      enter: { transition: 'Open and close an overlay', appearance: 'appearance.fast', note: 'Fade only, after 250 ms. A second Tooltip soon after shows at once.' },
      exit: { transition: 'Open and close an overlay', appearance: 'appearance.fast', note: 'Fades 100 ms after the pointer leaves.' },
    },
  },
  {
    name: 'Modal',
    tier: 'component',
    events: {
      enter: { transition: 'Open and close an overlay', spatial: 'spatial.default', appearance: 'appearance.default', note: 'Scales from 96% while it fades in; the Backdrop dims on the same fade.' },
      exit: { transition: 'Open and close an overlay', spatial: 'spatial.fast', appearance: 'appearance.fast', note: 'Scales to 98% while it fades.' },
      rejected: { transition: 'Call attention', spatial: 'spatial.fast', note: 'A blocked submit shakes it once; never in reduced motion.' },
    },
  },
  {
    name: 'Panel',
    tier: 'component',
    events: {
      enter: { transition: 'Dock and undock a panel', spatial: 'spatial.slow', note: 'Docked: slides in while the page resizes. Floating: spatial.default over the page. Narrow: slides over with a Backdrop.' },
      exit: { transition: 'Dock and undock a panel', spatial: 'spatial.default', note: 'Floating panels leave on spatial.fast.' },
    },
  },
  {
    name: 'Sidebar',
    tier: 'component',
    events: {
      enter: { transition: 'Dock and undock a panel', spatial: 'spatial.default', note: 'Slides in from its edge while the Page narrows on the same clock; the Page toggle fades out.' },
      exit: { transition: 'Dock and undock a panel', spatial: 'spatial.fast', note: 'Slides out to its edge and leaves nothing behind; the Page widens and its toggle fades in.' },
    },
  },
  {
    name: 'Breadcrumb',
    tier: 'component',
    events: {
      enter: { transition: 'Drill into and climb back out', spatial: 'spatial.fast', note: 'Arrives with its page, one level longer; its row opens from its seam once, at Drill depth 1.' },
      exit: { transition: 'Drill into and climb back out', appearance: 'appearance.fast', note: 'Leaves with its page.' },
    },
  },
  {
    name: 'PageHeader',
    tier: 'component',
    events: {
      change: { transition: 'Scroll to a spot on the page', appearance: 'linear', note: 'The small title fades over 24 px of scroll; actions and tabs travel up and pin. It follows the scroll one to one.' },
    },
  },
  {
    name: 'Flag',
    tier: 'component',
    events: {
      enter: { transition: 'Open and close an overlay', spatial: 'spatial.default', appearance: 'appearance.default', note: 'Slides in from the top-right corner.' },
      exit: { transition: 'Open and close an overlay', spatial: 'spatial.exit', note: 'Leaves by the exit rules.' },
      change: { transition: 'Add or remove an item', spatial: 'spatial.default', note: 'The stack closes up when one leaves.' },
    },
  },
  {
    name: 'SectionMessage',
    tier: 'component',
    events: {
      enter: { transition: 'Add or remove an item', spatial: 'spatial.fast', appearance: 'appearance.fast', note: 'Makes room, then fades in.' },
      exit: { transition: 'Add or remove an item', spatial: 'spatial.fast', appearance: 'appearance.fast', note: 'Fades, then the room closes.' },
    },
  },
  {
    name: 'InlineMessage',
    tier: 'component',
    events: {
      enter: { transition: 'Add or remove an item', spatial: 'spatial.fast', appearance: 'appearance.fast', note: 'Makes room, then fades in.' },
      exit: { transition: 'Add or remove an item', spatial: 'spatial.fast', appearance: 'appearance.fast', note: 'Fades, then the room closes.' },
    },
  },
  {
    name: 'Banner',
    tier: 'component',
    events: {
      enter: { transition: 'Add or remove an item', spatial: 'spatial.default', appearance: 'appearance.default', note: 'Pushes the page down, then fades in.' },
      exit: { transition: 'Add or remove an item', spatial: 'spatial.fast', appearance: 'appearance.fast', note: 'Fades, then the page closes the gap.' },
    },
  },
  {
    name: 'Spotlight',
    tier: 'component',
    events: {
      enter: { transition: 'Open and close an overlay', spatial: 'spatial.default', note: 'Each coachmark step is Step.' },
      exit: { transition: 'Open and close an overlay', appearance: 'appearance.fast', note: 'Fades.' },
    },
  },
  {
    name: 'Accordion',
    tier: 'component',
    events: {
      change: { transition: 'Expand and collapse', spatial: 'spatial.fast', note: 'Height and chevron move together, opening down from the header and collapsing back into it. A section uses spatial.default; closing is one speed faster.' },
    },
  },
  {
    name: 'Calendar',
    tier: 'component',
    events: {
      enter: { transition: 'Open and close an overlay', spatial: 'spatial.fast', appearance: 'appearance.fast', note: 'Opens as a Popup.' },
      exit: { transition: 'Open and close an overlay', appearance: 'appearance.fast', note: 'Fades.' },
      change: { transition: 'Step to the next or previous', spatial: 'spatial.default', note: 'A month change slides the grid flat.' },
    },
  },
  {
    name: 'DatePicker',
    tier: 'component',
    events: {
      enter: { transition: 'Open and close an overlay', spatial: 'spatial.fast', appearance: 'appearance.fast', note: 'Opens as a Popup.' },
      exit: { transition: 'Open and close an overlay', appearance: 'appearance.fast', note: 'Fades.' },
      change: { transition: 'Step to the next or previous', spatial: 'spatial.default', note: 'A month change slides the grid flat.' },
    },
  },
  {
    name: 'DateTimePicker',
    tier: 'component',
    events: {
      enter: { transition: 'Open and close an overlay', spatial: 'spatial.fast', appearance: 'appearance.fast', note: 'Opens as a Popup.' },
      exit: { transition: 'Open and close an overlay', appearance: 'appearance.fast', note: 'Fades.' },
      change: { transition: 'Step to the next or previous', spatial: 'spatial.default', note: 'A month change slides the grid flat.' },
    },
  },
  {
    name: 'TimePicker',
    tier: 'component',
    events: {
      enter: { transition: 'Open and close an overlay', spatial: 'spatial.fast', appearance: 'appearance.fast', note: 'Opens as a Popup.' },
      exit: { transition: 'Open and close an overlay', appearance: 'appearance.fast', note: 'Fades.' },
      change: { transition: 'Step to the next or previous', spatial: 'spatial.default', note: 'A month change slides the grid flat.' },
    },
  },
  {
    name: 'Cascader',
    tier: 'component',
    events: {
      enter: { transition: 'Open and close an overlay', spatial: 'spatial.fast', appearance: 'appearance.fast', note: 'Opens as a Popup.' },
      exit: { transition: 'Open and close an overlay', appearance: 'appearance.fast', note: 'Fades.' },
      change: { transition: 'Expand and collapse', spatial: 'spatial.fast', note: 'Columns and branches expand.' },
    },
  },
  {
    name: 'TreeSelect',
    tier: 'component',
    events: {
      enter: { transition: 'Open and close an overlay', spatial: 'spatial.fast', appearance: 'appearance.fast', note: 'Opens as a Popup.' },
      exit: { transition: 'Open and close an overlay', appearance: 'appearance.fast', note: 'Fades.' },
      change: { transition: 'Expand and collapse', spatial: 'spatial.fast', note: 'Columns and branches expand.' },
    },
  },
  {
    name: 'InlineEdit',
    tier: 'component',
    events: {
      change: { transition: 'Swap content in place', appearance: 'appearance.fast', note: 'Read and edit states swap in place.' },
      rejected: { transition: 'Call attention', spatial: 'spatial.fast', note: 'A blocked save shakes the field and its button once.' },
    },
  },
  {
    name: 'InlineEditableTextfield',
    tier: 'component',
    events: {
      change: { transition: 'Swap content in place', appearance: 'appearance.fast', note: 'Read and edit states swap in place.' },
      rejected: { transition: 'Call attention', spatial: 'spatial.fast', note: 'A blocked save shakes the field and its button once.' },
    },
  },
  {
    name: 'Pagination',
    tier: 'component',
    events: {
      change: { transition: 'Step to the next or previous', spatial: 'spatial.default', note: 'A page change is Step.' },
    },
  },
  {
    name: 'Table',
    tier: 'component',
    events: {
      change: { transition: 'Add or remove an item', spatial: 'spatial.fast', appearance: 'appearance.fast', note: 'Rows are added, removed and reordered; sort is Reorder, a filter is Swap content. Ticking rows cross-fades the head row into the bulk bar, same height, nothing slides.' },
    },
  },
  {
    name: 'TagInput',
    tier: 'component',
    events: {
      change: { transition: 'Add or remove an item', spatial: 'spatial.fast', appearance: 'appearance.fast', note: 'A chip is added or removed.' },
    },
  },
  {
    name: 'FileUpload',
    tier: 'component',
    events: {
      change: { transition: 'Update a value or state', appearance: 'appearance.fast', note: 'The drag-over highlight.' },
      progress: { transition: 'Load content', appearance: 'linear', note: 'Progress fills with the work.' },
    },
  },
  {
    name: 'Carousel',
    tier: 'component',
    events: {
      change: { transition: 'Step to the next or previous', spatial: 'spatial.default', note: 'No autoplay by default; if it plays, it has a visible pause.' },
    },
  },
  {
    name: 'PromptStarters',
    tier: 'component',
    events: {
      enter: { transition: 'Swap content in place', appearance: 'appearance.fast', note: 'Fade in place, staggered; picking one fills the composer.' },
    },
  },
  {
    name: 'Suggestion',
    tier: 'component',
    events: {
      enter: { transition: 'Swap content in place', appearance: 'appearance.fast', note: 'Fades in place.' },
      exit: { transition: 'Add or remove an item', spatial: 'spatial.fast', appearance: 'appearance.fast', note: 'Accepting folds it away; dismissing fades.' },
    },
  },
  {
    name: 'AiMessage',
    tier: 'component',
    events: {
      change: { transition: 'Load content', appearance: 'appearance.fast', note: 'Sources fade in place 20 ms apart, each tied to real work; the answer streams in chunks with no fade.' },
    },
  },
  {
    name: 'PromptInput',
    tier: 'component',
    events: {
      change: { transition: 'Update a value or state', appearance: 'appearance.fast', note: 'Send becomes Stop at once while the AI writes.' },
    },
  },
  {
    name: 'GenerativeBorder',
    tier: 'component',
    events: {
      change: { transition: 'Load content', appearance: 'linear', note: 'Its light travels while the AI drafts and stops when done.' },
      pulse: { transition: 'Load content', appearance: 'loop', note: 'A pulse uses the loop.' },
    },
  },
  {
    name: 'Skeleton',
    tier: 'component',
    events: {
      change: { transition: 'Load content', appearance: 'linear', note: 'Shimmer from top-left to bottom-right; content fades in over it.' },
    },
  },
  {
    name: 'Spinner',
    tier: 'component',
    events: {
      change: { transition: 'Load content', appearance: 'linear', note: 'Turns while work runs and stops the moment it stops. A static label in reduced motion.' },
    },
  },
  {
    name: 'ProgressBar',
    tier: 'component',
    events: {
      change: { transition: 'Load content', appearance: 'linear', note: 'Fills with the work, never ahead of it.' },
    },
  },
  {
    name: 'ProgressTracker',
    tier: 'component',
    events: {
      change: { transition: 'Update a value or state', appearance: 'appearance.fast', note: 'Step states change in place: the step left becomes visited, the next current.' },
    },
  },
  {
    name: 'ProgressIndicator',
    tier: 'component',
    events: {
      change: { transition: 'Update a value or state', appearance: 'appearance.fast', note: 'Step states change in place: the step left becomes visited, the next current.' },
    },
  },
];
