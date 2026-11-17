import { readFileSync } from 'node:fs';
import { render, screen, within } from '@testing-library/react';
import { expect } from 'vitest';
import { ComponentExample, exampleSlug } from '@/storybook-docs/ds-docs-layout.jsx';
import { TypeCard } from '@/storybook-docs/lib/template-page.jsx';

/**
 * Verifies every `<TypeCard to="#..." title="...">` in `mdxPath` resolves to a
 * unique `<ComponentExample title="...">` heading id on the page, and renders
 * the card links against those targets.
 */
export function expectTypeCardAnchors(mdxPath, count) {
    const mdx = readFileSync(mdxPath, 'utf8');
    const typeCards = [...mdx.matchAll(/<TypeCard\s+[^>]*to="#([^"]+)"[^>]*title="([^"]+)"/g)]
        .map(([, to, title]) => ({ to, title }));
    const exampleTitles = [...mdx.matchAll(/<ComponentExample\s+[^>]*title="([^"]+)"/g)]
        .map(([, title]) => title);
    const examplesTab = mdx.split('<DocsTab tab="examples">')[1].split('</DocsTab>')[0];
    const headingSlugs = [
        ...exampleTitles.map(exampleSlug),
        ...[...examplesTab.matchAll(/^#{2,3}\s+([^\r\n<]+)/gm)].map(([, h]) => exampleSlug(h)),
    ];

    expect(typeCards).toHaveLength(count);
    expect(new Set(headingSlugs).size).toBe(headingSlugs.length);
    typeCards.forEach(({ to }) => expect(headingSlugs).toContain(to));

    const Stub = { render: () => <div /> };
    render(
        <div>
            {typeCards.map(({ to, title }) => (
                <TypeCard key={title} of={Stub} to={`#${to}`} title={title}>{title}</TypeCard>
            ))}
            {exampleTitles.map((title) => (
                <ComponentExample key={title} of={Stub} title={title} description={title} />
            ))}
        </div>,
    );

    for (const { to, title } of typeCards) {
        const exact = new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
        expect(screen.getByRole('link', { name: exact })).toHaveAttribute('href', `#${to}`);
    }
    for (const title of exampleTitles) {
        expect(within(document.body).getByRole('heading', { level: 3, name: title })).toHaveAttribute('id', exampleSlug(title));
    }
}
