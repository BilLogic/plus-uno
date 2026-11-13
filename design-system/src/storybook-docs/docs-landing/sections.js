/**
 * The tab strips of the docs sections that have one: Motion and Sound. A page
 * names its section, and `DocsLanding` builds the strip from here, so the order
 * and the labels live in one place. `page` is the page's id, which is also its
 * hero key and the tail of its Storybook docs path.
 */
const strip = (pages) => pages.map(([page, title]) => ({ page, title, href: `?path=/docs/${page}--docs` }));

export const SECTIONS = {
    'foundations-motion': strip([
        ['foundations-motion-principles', 'Principles'],
        ['foundations-motion-physics', 'Physics'],
        ['foundations-motion-transitions', 'Transitions'],
        ['foundations-motion-choreography', 'Choreography'],
        ['foundations-motion-playground', 'Playground'],
        ['foundations-motion-library', 'Library'],
    ]),
    'foundations-sound': strip([
        ['foundations-sound-overview', 'Overview'],
        ['foundations-sound-when-to-play', 'When to play'],
        ['foundations-sound-with-motion', 'With motion'],
        ['foundations-sound-sounds', 'Sounds'],
        ['foundations-sound-settings-and-accessibility', 'Settings and accessibility'],
    ]),
};

/** The section's links with `current` set on `page`; undefined for an unknown section. */
export const sectionLinks = (section, page) =>
    SECTIONS[section]?.map(({ title, href, page: id }) => ({ title, href, ...(id === page && { current: true }) }));
