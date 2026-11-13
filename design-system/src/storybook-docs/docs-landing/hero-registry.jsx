import { ColorHero } from './ColorHero.jsx';

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
  'foundations-color': {
    Hero: ColorHero,
    description:
      'One card painted by its role tokens, shown in light on the left and dark on the right; the primary button is the subject.',
  },
};
