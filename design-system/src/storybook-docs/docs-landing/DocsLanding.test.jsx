import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DocsLanding } from './DocsLanding.jsx';
import { HEROES } from './hero-registry.jsx';

const TOKENS_LINKS = {
    label: 'Tokens',
    items: [
        { title: 'Roles', href: '#foundation-roles' },
        { title: 'Surfaces', href: '#foundation-surfaces' },
    ],
};

const renderColor = (props = {}) =>
    render(
        <DocsLanding
            page="foundations-visual-color"
            eyebrow="Foundation"
            title="Color"
            purpose="Every color is a --ds token named for its job."
            links={TOKENS_LINKS}
            {...props}
        />,
    );

const before = (a, b) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

describe('DocsLanding', () => {
    it('labels a links row "Tokens" when the page passes no label', () => {
        renderColor({ links: { items: TOKENS_LINKS.items } });
        expect(screen.getByRole('navigation', { name: 'Tokens' })).toBeTruthy();
    });

    it('leaves a sibling row (one item current) unlabeled', () => {
        renderColor({ links: { items: [{ title: 'Color', current: true }, { title: 'Type', href: '#t' }] } });
        expect(screen.queryByRole('navigation', { name: 'Tokens' })).toBeNull();
    });

    it('renders eyebrow, one h1, purpose, links and hero, in that order', () => {
        const { container } = renderColor();
        const eyebrow = screen.getByText('Foundation');
        const h1 = screen.getByRole('heading', { level: 1, name: 'Color' });
        const purpose = screen.getByText(/Every color is a/);
        const nav = screen.getByRole('navigation', { name: 'Tokens' });
        const hero = container.querySelector('[data-hero]');

        expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
        expect(before(eyebrow, h1)).toBe(true);
        expect(before(h1, purpose)).toBe(true);
        expect(before(purpose, nav)).toBe(true);
        expect(before(nav, hero)).toBe(true);
    });

    it('names the hero with its registry sentence and draws no text', () => {
        const { container } = renderColor();
        const hero = screen.getByRole('img', { name: HEROES['foundations-visual-color'].description });
        expect(hero).toBe(container.querySelector('[data-hero]'));

        const walker = document.createTreeWalker(hero, NodeFilter.SHOW_TEXT);
        expect(walker.nextNode()).toBeNull();
        expect(hero.querySelector('text, title, tspan')).toBeNull();
    });

    it('splits the Color hero into a light and a dark half, painted by tokens only', () => {
        const { container } = renderColor();
        const hero = container.querySelector('[data-hero]');
        expect(hero.querySelector('[data-color-mode="light"]')).not.toBeNull();
        expect(hero.querySelector('[data-color-mode="dark"]')).not.toBeNull();

        const painted = [...hero.querySelectorAll('[fill], [stroke]')];
        expect(painted.length).toBeGreaterThan(0);
        for (const el of painted) {
            for (const attr of ['fill', 'stroke']) {
                if (el.hasAttribute(attr)) expect(el.getAttribute(attr)).toMatch(/^(?:var\(--ds-[\w-]+\)|none)$/);
            }
        }
        // The one accent, on the primary button, in both halves.
        const accent = painted.filter((el) => el.getAttribute('fill') === 'var(--ds-background-brand-bold)');
        expect(accent).toHaveLength(2);
    });

    it('opens the quick links to their targets', () => {
        renderColor();
        const nav = screen.getByRole('navigation', { name: 'Tokens' });
        expect(within(nav).getByText('Tokens')).toBeInTheDocument();
        expect(within(nav).getByRole('link', { name: 'Roles' })).toHaveAttribute('href', '#foundation-roles');
        expect(within(nav).getByRole('link', { name: 'Surfaces' })).toHaveAttribute('href', '#foundation-surfaces');
    });

    it('marks the current sibling when the links are a group', () => {
        renderColor({
            links: {
                items: [
                    { title: 'Principles', href: '#a' },
                    { title: 'Physics', href: '#b', current: true },
                ],
            },
        });
        expect(screen.getByText('Physics')).toHaveAttribute('aria-current', 'page');
        expect(screen.getByRole('link', { name: 'Principles' })).not.toHaveAttribute('aria-current');
    });

    it('leaves the links row out when a page has none', () => {
        renderColor({ links: undefined });
        expect(screen.queryByRole('navigation')).toBeNull();
    });

    it('builds a section\'s tab strip from the registry and marks the page current', () => {
        render(<DocsLanding page="foundations-motion-physics" section="foundations-motion" eyebrow="Foundation · Motion" title="Physics" purpose="p" />);
        const nav = screen.getByRole('navigation', { name: 'Physics pages' });
        const names = within(nav).getAllByText(/./).map((n) => n.textContent);
        expect(names).toEqual(['Principles', 'Physics', 'Transitions', 'Choreography', 'Library', 'Playground']);
        expect(within(nav).getByText('Physics')).toHaveAttribute('aria-current', 'page');
        expect(within(nav).getByText('Library')).toHaveAttribute('href', '?path=/docs/foundations-motion-library--docs');
    });
});
