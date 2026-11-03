import React, { useEffect, useState } from 'react';
import { RefTable } from '@/storybook-docs/foundation-blocks.jsx';

/**
 * The Foundation docs scaffold: the chrome every Foundations page shares, so a
 * page file holds only its content. A page is, in order, a hero, a contents
 * list, its sections (Overview first, Related last), an ADS parity table and
 * Accessibility. Every block styles itself with `--ds-*` and pattern tokens,
 * so a page follows the toolbar's Color mode and Contrast switches.
 */

const SECTION_ATTR = 'data-foundation-section';

const linkStyle = { font: 'var(--body-default)', color: 'var(--ds-link)', textDecoration: 'underline' };

/** A text link that opens in a new tab, for pages outside Storybook. */
export const FoundationLink = ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer" style={linkStyle}>
        {children}
        <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" style={{ marginInlineStart: 'var(--element-inline-sm)', fontSize: 'var(--icon-sm)' }} />
    </a>
);

/**
 * Kind label, title, one-line summary, and the link to the matching page on
 * atlassian.design. The title is the page's one `h1`, so a page does not also
 * render `<Title />`.
 */
export const FoundationHero = ({ title, summary, adsHref, adsLabel = 'ADS documentation' }) => (
    <header
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--section-stack-sm)',
            marginBlockEnd: 'var(--section-stack-lg)',
        }}
    >
        <span style={{ font: 'var(--heading-xxsmall)', color: 'var(--ds-text-subtle)' }}>Foundation</span>
        <h1 style={{ margin: 0, font: 'var(--heading-xlarge)', color: 'var(--ds-text)' }}>{title}</h1>
        <div style={{ margin: 0, font: 'var(--body-large)', color: 'var(--ds-text-subtle)', maxWidth: '64ch' }}>{summary}</div>
        {adsHref && (
            <div>
                <FoundationLink href={adsHref}>{adsLabel}</FoundationLink>
            </div>
        )}
    </header>
);

/**
 * "Contents": one link per section of the page, read from the sections
 * themselves so the list can never fall behind them.
 */
export const FoundationContents = () => {
    const [items, setItems] = useState([]);
    useEffect(() => {
        setItems(
            [...document.querySelectorAll(`[${SECTION_ATTR}]`)].map((el) => ({
                id: el.id,
                title: el.getAttribute(SECTION_ATTR),
            })),
        );
    }, []);
    return (
        <nav aria-label="Contents" style={{ marginBlockEnd: 'var(--section-stack-lg)' }}>
            <h2 style={{ margin: 0, marginBlockEnd: 'var(--element-stack-md)', font: 'var(--heading-xsmall)', color: 'var(--ds-text)' }}>
                Contents
            </h2>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: 'var(--element-stack-md) var(--section-stack-md)' }}>
                {items.map((item) => (
                    <li key={item.id}>
                        <a href={`#${item.id}`} style={linkStyle}>{item.title}</a>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

const slug = (title) => title.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** One section of a Foundation page: an anchored `h2` over its content. */
export const FoundationSection = ({ title, id = slug(title), children }) => (
    <section
        id={`foundation-${id}`}
        {...{ [SECTION_ATTR]: title }}
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--section-stack-md)',
            marginBlockEnd: 'var(--section-stack-lg)',
        }}
    >
        <h2 style={{ margin: 0, font: 'var(--heading-large)', color: 'var(--ds-text)' }}>{title}</h2>
        {children}
    </section>
);

/** A sub-heading inside a section. */
export const FoundationSubsection = ({ title, children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-stack-sm)' }}>
        <h3 style={{ margin: 0, font: 'var(--heading-medium)', color: 'var(--ds-text)' }}>{title}</h3>
        {children}
    </div>
);

const BANNER_TONES = {
    information: { fill: 'var(--ds-background-information-subtler)', icon: 'var(--ds-icon-information)', glyph: 'fa-circle-info' },
    warning: { fill: 'var(--ds-background-warning-subtler)', icon: 'var(--ds-icon-warning)', glyph: 'fa-triangle-exclamation' },
};

/**
 * A Banner in the page: a filled panel with a leading icon and no colored
 * edge. Its tone comes from the fill and the icon alone.
 */
export const FoundationBanner = ({ title, appearance = 'information', children }) => {
    const t = BANNER_TONES[appearance];
    return (
        <aside
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--element-inline-lg)',
                padding: 'var(--card-pad-sm)',
                borderRadius: 'var(--element-radius-lg)',
                background: t.fill,
                color: 'var(--ds-text)',
                font: 'var(--body-default)',
            }}
        >
            <i className={`fa-solid ${t.glyph}`} aria-hidden="true" style={{ fontSize: 'var(--icon-md)', color: t.icon }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--element-stack-sm)', minWidth: 0 }}>
                {title && <strong style={{ font: 'var(--heading-small)' }}>{title}</strong>}
                <div>{children}</div>
            </div>
        </aside>
    );
};

/** The ADS parity table: where PLUS follows Atlassian and where it differs. */
export const AdsParity = ({ rows }) => (
    <RefTable head={['Topic', 'ADS', 'PLUS', 'Why it differs']} rows={rows} />
);

/** Related pages, last on the page. Each item is `{ title, description, href }`. */
export const FoundationRelated = ({ items }) => (
    <ul
        style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(var(--card-min-width-sm), 1fr))',
            gap: 'var(--layout-gutter)',
        }}
    >
        {items.map((item) => (
            <li key={item.title}>
                <a
                    href={item.href}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--card-stack-sm)',
                        height: '100%',
                        boxSizing: 'border-box',
                        padding: 'var(--card-pad-sm)',
                        borderRadius: 'var(--card-radius)',
                        background: 'var(--ds-surface-raised)',
                        boxShadow: 'var(--ds-shadow-raised)',
                        color: 'var(--ds-text)',
                        textDecoration: 'none',
                    }}
                >
                    <span style={{ font: 'var(--heading-xsmall)' }}>{item.title}</span>
                    <span style={{ font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>{item.description}</span>
                </a>
            </li>
        ))}
    </ul>
);

/** A specimen frame: examples drawn from live tokens on the sunken ground. */
export const FoundationExample = ({ caption, children }) => (
    <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--element-stack-md)' }}>
        <div
            style={{
                padding: 'var(--card-pad-lg)',
                borderRadius: 'var(--card-radius)',
                background: 'var(--ds-surface-sunken)',
                color: 'var(--ds-text)',
                font: 'var(--body-default)',
            }}
        >
            {children}
        </div>
        {caption && <figcaption style={{ font: 'var(--body-small)', color: 'var(--ds-text-subtle)' }}>{caption}</figcaption>}
    </figure>
);

/** Prose with paragraph rhythm, for sections written as sentences. */
export const FoundationProse = ({ children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-stack-sm)', font: 'var(--body-default)', color: 'var(--ds-text)', maxWidth: '72ch' }}>
        {children}
    </div>
);

/**
 * A row of token swatches. Each item is `{ token, label?, text? }`: the swatch
 * fills with the token as the page resolves it, and `text` names the
 * foreground token drawn on it. Nothing here restates a value by hand.
 */
export const TokenSwatches = ({ items, min = 'var(--card-min-width-sm)' }) => (
    <ul
        style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fill, minmax(${min}, 1fr))`,
            gap: 'var(--element-stack-md)',
        }}
    >
        {items.map((item) => (
            <li key={item.token} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--element-stack-sm)' }}>
                <span
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: 'var(--item-height-md)',
                        borderRadius: 'var(--element-radius-lg)',
                        background: `var(${item.token})`,
                        color: item.text ? `var(${item.text})` : 'var(--ds-text)',
                        font: 'var(--body-default)',
                        boxShadow: 'inset 0 0 0 var(--border-default) var(--ds-border)',
                    }}
                >
                    {item.sample ?? 'Aa'}
                </span>
                <span style={{ font: 'var(--body-small)', color: 'var(--ds-text-subtle)', wordBreak: 'break-word' }}>
                    {item.label ?? item.token}
                </span>
            </li>
        ))}
    </ul>
);
