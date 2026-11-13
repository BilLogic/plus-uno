import { ColorHero } from './ColorHero.jsx';
import {
  OverviewHero as FoundationsOverviewHero,
  AccessibilityHero,
  BorderHero,
  ElevationHero,
  GridHero,
  IconographyHero,
  IllustrationsHero,
  LogosHero,
  RadiusHero,
  SpacingHero,
  TokensHero,
  TypographyHero,
} from './FoundationHeroes.jsx';
import {
  PrinciplesHero,
  PhysicsHero,
  TransitionsHero,
  ChoreographyHero,
  PlaygroundHero,
  LibraryHero,
} from './MotionHeroes.jsx';
import {
  OverviewHero,
  CommonActionsHero,
  FormsHero,
  FilteringHero,
  NavigationHero,
  SearchHero,
  IndicatorsHero,
  NotificationsHero,
  DisabledHero,
  EmptyHero,
  ErrorsHero,
  LoadingHero,
  OverflowHero,
  ReadOnlyHero,
} from './PatternHeroes.jsx';
import {
  OverviewHero as TemplatesOverviewHero,
  FrameHero,
  PageHero,
  SectionHero,
  CardHero,
  TableHero,
  FormHero,
  ModalHero,
  PanelHero,
  PopupHero,
} from './TemplateHeroes.jsx';

import { OverviewHero as SoundOverviewHero, WhenToPlayHero, WithMotionHero, SoundsHero, SettingsHero } from './SoundHeroes.jsx';

/**
 * The hero registry: each docs page id (its Storybook id, the title lower-cased
 * and joined with dashes) maps to the drawing that opens it and the one
 * sentence that describes it. The sentence is the hero's accessible name, so it
 * says what the picture shows, in plain words.
 *
 * `npm run check:docs-landing` holds this and the pages together: a covered page
 * with no entry here fails, and so does an entry for a page it does not cover.
 * Keep each entry's key at two spaces and its `description` inside the entry,
 * which is how the check reads it.
 */
export const HEROES = {
  'foundations-basics-overview': {
    Hero: FoundationsOverviewHero,
    description:
      'One screen pulled apart into its foundations: grid, surface and space, content, and the accent.',
  },
  'foundations-basics-accessibility': {
    Hero: AccessibilityHero,
    description:
      'One big button: its focus ring and the target around it.',
  },
  'foundations-visual-border': {
    Hero: BorderHero,
    description:
      'Two surfaces bleed off the edge; only the edge is drawn.',
  },
  'foundations-visual-elevation': {
    Hero: ElevationHero,
    description:
      'The layers lifted apart, light on the left and dark on the right.',
  },
  'foundations-layout-grid': {
    Hero: GridHero,
    description:
      'Column stripes; blocks snap to spans, one in the brand color.',
  },
  'foundations-visual-iconography': {
    Hero: IconographyHero,
    description:
      'One glyph on its keyline grid, neighbors cropped.',
  },
  'foundations-brand-illustrations': {
    Hero: IllustrationsHero,
    description:
      'A fanned stack of heroes; the front shows the house style.',
  },
  'foundations-brand-logos': {
    Hero: LogosHero,
    description:
      'The PLUS mark, desaturated, with its construction drawn exactly on top.',
  },
  'foundations-visual-radius': {
    Hero: RadiusHero,
    description:
      'One corner cropped big, drawn as the circle it comes from.',
  },
  'foundations-layout-spacing': {
    Hero: SpacingHero,
    description:
      'The scale itself: each step a square its own size.',
  },
  'foundations-basics-tokens': {
    Hero: TokensHero,
    description:
      'Chips repeat; one value threads through them.',
  },
  'foundations-visual-typography': {
    Hero: TypographyHero,
    description:
      'Serif and sans on one set of guides: cap height, x-height, and the baseline in the brand color.',
  },
  'foundations-visual-color': {
    Hero: ColorHero,
    description:
      'One card painted by its role tokens, shown in light on the left and dark on the right; the primary button is the subject.',
  },
  'foundations-sound-overview': {
    Hero: SoundOverviewHero,
    description: 'Three sounds as three waveforms; the chime is ringed.',
  },
  'foundations-sound-when-to-play': {
    Hero: WhenToPlayHero,
    description: 'A run of events along one line; only a few make a sound.',
  },
  'foundations-sound-with-motion': {
    Hero: WithMotionHero,
    description: 'Two tracks, motion over sound; the tick where the shape lands is where the sound starts.',
  },
  'foundations-sound-sounds': {
    Hero: SoundsHero,
    description: 'The library as a list: play, waveform, name; one sound playing.',
  },
  'foundations-sound-settings-and-accessibility': {
    Hero: SettingsHero,
    description: 'Sound off, volume down: the person decides.',
  },
  'foundations-motion-principles': {
    Hero: PrinciplesHero,
    description:
      'The four principles as four small scenes: show what changed, always responsive, move like real things, quiet until it counts.',
  },
  'foundations-motion-physics': {
    Hero: PhysicsHero,
    description:
      'One shape drawn at equal time steps, fast at first, then settling past its target and back.',
  },
  'foundations-motion-transitions': {
    Hero: TransitionsHero,
    description:
      'Before and after: a list row becomes a card, and each part moves from where it was to where it lands, all downward, none crossing.',
  },
  'foundations-motion-choreography': {
    Hero: ChoreographyHero,
    description:
      'An editing timeline: an exit, a parent with its children, a burst of three short clips that do not overlap, a late pop and the playhead.',
  },
  'foundations-motion-playground': {
    Hero: PlaygroundHero,
    description:
      'Three dials on the left and the shape they move on the right, drawn as stills settling past the target.',
  },
  'foundations-motion-library': {
    Hero: LibraryHero,
    description:
      'A shelf of named motions as stills, one large and ringed with its neighbors cropped.',
  },
  'patterns-overview': {
    Hero: OverviewHero,
    description:
      'Four situations in four cards: a focused field, a filter menu, an empty state and a notification.',
  },
  'patterns-common-actions': {
    Hero: CommonActionsHero,
    description:
      'The end of a view bar: a More menu open, a default button, and the Primary button ringed.',
  },
  'patterns-forms': {
    Hero: FormsHero,
    description:
      'A form mid-fill with the middle field in focus and its buttons at the end.',
  },
  'patterns-filtering': {
    Hero: FilteringHero,
    description:
      'The filter menu open from the end of the view bar, two options checked.',
  },
  'patterns-navigation': {
    Hero: NavigationHero,
    description:
      'The current item in the sidebar, ringed; the breadcrumb says the same.',
  },
  'patterns-search': {
    Hero: SearchHero,
    description:
      'The search field open with its results below it.',
  },
  'patterns-indicators': {
    Hero: IndicatorsHero,
    description:
      'A status column cropped big; the new status and the count are in the brand color.',
  },
  'patterns-notifications': {
    Hero: NotificationsHero,
    description:
      'Flags stacked at the corner, the newest ringed.',
  },
  'patterns-states-disabled': {
    Hero: DisabledHero,
    description:
      'A Primary button you cannot press yet, with the reason in text beside it.',
  },
  'patterns-states-empty': {
    Hero: EmptyHero,
    description:
      'Nothing yet, and the one action to start.',
  },
  'patterns-states-errors': {
    Hero: ErrorsHero,
    description:
      'What went wrong and where: a message at the top of the section and one invalid field with its own message, in danger red.',
  },
  'patterns-states-loading': {
    Hero: LoadingHero,
    description:
      'Two rows in, the rest still skeletons; the progress line in the brand color.',
  },
  'patterns-states-overflow': {
    Hero: OverflowHero,
    description:
      'The header stays, with its shadow, while the rows scroll under it.',
  },
  'patterns-states-read-only': {
    Hero: ReadOnlyHero,
    description:
      'Values you can read but not edit, ringed as one group.',
  },
  'templates-overview': {
    Hero: TemplatesOverviewHero,
    description:
      'The templates pulled apart: Frame, Page, Section ringed, Modal on top.',
  },
  'templates-frame': {
    Hero: FrameHero,
    description:
      'The app frame: sidebar ringed, top bar, panel.',
  },
  'templates-page': {
    Hero: PageHero,
    description:
      'The page header and its Sections, the page ringed.',
  },
  'templates-section-section': {
    Hero: SectionHero,
    description:
      'Header, view bar, body and side, ringed.',
  },
  'templates-card': {
    Hero: CardHero,
    description:
      'A Section as a card: media, title, one action.',
  },
  'templates-table': {
    Hero: TableHero,
    description:
      'A Section as a table: header, rows, one selected.',
  },
  'templates-form': {
    Hero: FormHero,
    description:
      'Fields in a column, the commit at the end.',
  },
  'templates-modal-modal': {
    Hero: ModalHero,
    description:
      'One task over a Backdrop; the Modal ringed.',
  },
  'templates-panel-panel': {
    Hero: PanelHero,
    description:
      'A full-height layer beside the page, ringed.',
  },
  'templates-popup-popup': {
    Hero: PopupHero,
    description:
      'A Popup opening bottom-end from its trigger at the bar end, 4 below it, ringed.',
  },
};
