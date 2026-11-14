/**
 * The tab strips of the docs sections that have one: Motion, Sound and Tokens. A page
 * names its section, and `DocsLanding` builds the strip from here, so the order
 * and the labels live in one place. `page` is the page's id, which is also its
 * hero key and the tail of its Storybook docs path.
 */
const strip = (pages) => pages.map(([page, title]) => ({ page, title, href: `?path=/docs/${page}--docs` }));

export const SECTIONS = {
    'foundations-motion': strip([
        ['foundations-expression-motion-principles', 'Principles'],
        ['foundations-expression-motion-physics', 'Physics'],
        ['foundations-expression-motion-transitions', 'Transitions'],
        ['foundations-expression-motion-choreography', 'Choreography'],
        ['foundations-expression-motion-library', 'Library'],
        ['foundations-expression-motion-playground', 'Playground'],
    ]),
    'foundations-tokens': strip([
        ['foundations-tokens-color', 'Color'],
        ['foundations-tokens-typography', 'Typography'],
        ['foundations-tokens-spacing-and-size', 'Spacing and size'],
        ['foundations-tokens-elevation-and-layers', 'Elevation and layers'],
        ['foundations-tokens-motion', 'Motion'],
        ['foundations-tokens-library', 'Library'],
    ]),
    'foundations-sound': strip([
        ['foundations-expression-sound-overview', 'Overview'],
        ['foundations-expression-sound-when-to-play', 'When to play'],
        ['foundations-expression-sound-with-motion', 'With motion'],
        ['foundations-expression-sound-sounds', 'Sounds'],
        ['foundations-expression-sound-settings-and-accessibility', 'Settings and accessibility'],
    ]),
};

/** The section's links with `current` set on `page`; undefined for an unknown section. */
export const sectionLinks = (section, page) =>
    SECTIONS[section]?.map(({ title, href, page: id }) => ({ title, href, ...(id === page && { current: true }) }));
