import React from 'react';
import { HEROES } from './hero-registry.jsx';

/**
 * The opener every Foundations, Templates and Patterns docs page shares: an
 * eyebrow, the page's one `h1`, its purpose, one row of quick links and a hero
 * picture, in that order. A page drops it at the top and fills the props; the
 * hero is chosen by `page` from the hero registry, so no drawing is pasted into
 * MDX. It replaces `FoundationHero` and Storybook's `<Title />`, so a page does
 * not also render those.
 *
 * - `page`: the page's id, which picks the hero.
 * - `eyebrow`: the layer, then the group when the page has one (`Foundation`).
 * - `purpose`: the page's lead, unchanged, at most two lines.
 * - `links`: `{ label, items }` for a labeled list (`Tokens`, `Uses`), or
 *   `{ items }` alone for the siblings of a group, where an item with
 *   `current: true` is the page you are on. An item is `{ title, href }`.
 *
 * Spacing is set by role in `docs-rhythm.css`: stack-sm under the eyebrow and
 * title, section-stack-md before the links and the hero, page-stack-lg after
 * the hero.
 */
export const DocsLanding = ({ page, eyebrow, title, purpose, links }) => {
    const entry = HEROES[page];
    const Hero = entry?.Hero;
    return (
        <div className="sb-docs-landing" data-docs-landing={page}>
            <header className="sb-docs-header">
                <span className="sb-docs-landing__eyebrow">{eyebrow}</span>
                <h1 className="sb-docs-landing__title">{title}</h1>
                <div className="sb-docs-landing__purpose sb-docs-measure">{purpose}</div>
            </header>
            {links?.items?.length > 0 && <LandingLinks label={links.label} items={links.items} title={title} />}
            {Hero && (
                <div role="img" aria-label={entry.description} className="sb-docs-hero" data-hero={page}>
                    <Hero />
                </div>
            )}
        </div>
    );
};

/** One row: the label (when the list has one), then a link per item. */
const LandingLinks = ({ label, items, title }) => (
    <nav aria-label={label ?? `${title} pages`} className="sb-docs-landing__links">
        {label && <span className="sb-docs-landing__links-label">{label}</span>}
        {items.map((item) =>
            item.current ? (
                <span key={item.title} className="sb-docs-landing__link sb-docs-landing__link--current" aria-current="page">
                    {item.title}
                </span>
            ) : (
                <a key={item.title} className="sb-docs-landing__link" href={item.href}>
                    {item.title}
                </a>
            ),
        )}
    </nav>
);
