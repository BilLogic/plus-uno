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
  VoiceAndToneHero,
  LanguageHero,
  MessagesHero,
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
  'foundations-overview': {
    Hero: FoundationsOverviewHero,
    description:
      'The foundations side by side, sized by weight: color, type, grid and space, elevation, icons, motion.',
  },
  'foundations-accessibility': {
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
      'A set of different icons in one style, each on its own tile.',
  },
  'foundations-brand-illustrations': {
    Hero: IllustrationsHero,
    description:
      'A fanned stack of heroes; the front shows the house style.',
  },
  'foundations-brand-content-voice-and-tone': {
    Hero: VoiceAndToneHero,
    description:
      'Two speech bubbles in a conversation; the reply in the brand color.',
  },
  'foundations-brand-content-language': {
    Hero: LanguageHero,
    description:
      'A short card of text, its action line picked out in the brand color.',
  },
  'foundations-brand-content-messages': {
    Hero: MessagesHero,
    description:
      'A message card: an icon and title, a body, and one action in the brand color.',
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
  'foundations-tokens-color': {
    Hero: ColorHero,
    description:
      'One card painted by its role tokens, shown in light on the left and dark on the right; the primary button is the subject.',
  },
  'foundations-tokens-typography': {
    Hero: TypographyHero,
    description:
      'Serif and sans on one set of guides: cap height, x-height, and the baseline in the brand color.',
  },
  'foundations-tokens-spacing-and-size': {
    Hero: SpacingHero,
    description:
      'The scale itself: each step a square its own size.',
  },
  'foundations-tokens-elevation-and-layers': {
    Hero: ElevationHero,
    description:
      'The layers lifted apart, light on the left and dark on the right.',
  },
  'foundations-tokens-motion': {
    Hero: PhysicsHero,
    description:
      'One shape drawn at equal time steps, fast at first, then settling past its target and back.',
  },
  'foundations-tokens-library': { Hero: TokensHero, description: 'Every token in one list, found by name or by filter.' },
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
  'foundations-expression-sound-overview': {
    Hero: SoundOverviewHero,
    description: 'Three sounds as three waveforms; the chime is ringed.',
  },
  'foundations-expression-sound-when-to-play': {
    Hero: WhenToPlayHero,
    description: 'A run of events along one line; only a few make a sound.',
  },
  'foundations-expression-sound-with-motion': {
    Hero: WithMotionHero,
    description: 'Two tracks, motion over sound; the tick where the shape lands is where the sound starts.',
  },
  'foundations-expression-sound-sounds': {
    Hero: SoundsHero,
    description: 'The library as a list: play, waveform, name; one sound playing.',
  },
  'foundations-expression-sound-settings-and-accessibility': {
    Hero: SettingsHero,
    description: 'Sound off, volume down: the person decides.',
  },
  'foundations-expression-motion-principles': {
    Hero: PrinciplesHero,
    description:
      'The four principles as four small scenes: always responsive, build understanding, lead with empathy, cut the noise.',
  },
  'foundations-expression-motion-physics': {
    Hero: PhysicsHero,
    description:
      'One shape drawn at equal time steps, fast at first, then settling past its target and back.',
  },
  'foundations-expression-motion-transitions': {
    Hero: TransitionsHero,
    description:
      'Before and after: a list row becomes a card, and each part moves from where it was to where it lands, all downward, none crossing.',
  },
  'foundations-expression-motion-choreography': {
    Hero: ChoreographyHero,
    description:
      'An editing timeline: an exit, a parent with its children, a burst of three short clips that do not overlap, a late pop and the playhead.',
  },
  'foundations-expression-motion-playground': {
    Hero: PlaygroundHero,
    description:
      'Three dials on the left and the shape they move on the right, drawn as stills settling past the target.',
  },
  'foundations-expression-motion-library': {
    Hero: LibraryHero,
    description:
      'A shelf of named motions as stills, one large and ringed with its neighbors cropped.',
  },
  'patterns-overview': {
    Hero: OverviewHero,
    description:
      'Real moments, sized by scope: Filtering big, a Flag wide, a Spinner and a badge small.',
  },
  'patterns-common-actions': {
    Hero: CommonActionsHero,
    description:
      'The button group itself: the secondary Default button and the Primary, ringed.',
  },
  'patterns-forms': {
    Hero: FormsHero,
    description:
      'A form mid-fill with the middle field in focus and its buttons at the end.',
  },
  'patterns-filtering': {
    Hero: FilteringHero,
    description:
      'A view bar with two filter buttons; Grade has picks and is open, its menu below it with two options checked.',
  },
  'patterns-navigation': {
    Hero: NavigationHero,
    description:
      'The current item in the sidebar, ringed; the breadcrumb says the same.',
  },
  'patterns-search': {
    Hero: SearchHero,
    description:
      'The search field, focused with a word typed, and its results open under it.',
  },
  'patterns-indicators': {
    Hero: IndicatorsHero,
    description:
      'Three status tags, the new one ringed; counts and a change beneath them.',
  },
  'patterns-notifications': {
    Hero: NotificationsHero,
    description:
      'One Flag, whole where it lands and ringed; the one before it peeks out behind.',
  },
  'patterns-states-disabled': {
    Hero: DisabledHero,
    description:
      'A settings card: two rows faded because they cannot be used yet, the Primary faded with the pointer refusing it, and the reason in words.',
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
      'The app exploded into its templates: the Frame, the Sidebar and Page, a Section, its rows (one selected) in front.',
  },
  'templates-frame': {
    Hero: FrameHero,
    description:
      'The app frame ringed whole: the docked Sidebar, the Page and a docked Panel.',
  },
  'templates-page': {
    Hero: PageHero,
    description:
      'The page header and its Sections; the Page ringed beside the docked Sidebar.',
  },
  'templates-section': {
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
  'templates-modal': {
    Hero: ModalHero,
    description:
      'One task over a Backdrop; the Modal ringed.',
  },
  'templates-panel': {
    Hero: PanelHero,
    description:
      'A full-height layer beside the page, ringed.',
  },
  'templates-popup': {
    Hero: PopupHero,
    description:
      'A Popup opening bottom-end from its trigger at the bar end, 4 below it, ringed.',
  },
};
