import fs from 'node:fs';
import path from 'node:path';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LiveAnatomy, TypeCard } from '@/storybook-docs/lib/template-page.jsx';
import PatternSection, { SectionToolbar } from './PatternSection';
import * as Cases from './PatternSectionCases.jsx';

/**
 * The Section pattern follows the Figma Section: no fill and no pad of its
 * own, a `_Section header` of five types, a body laid out single, split or
 * as subsections, an optional footer, a toolbar, and a loading header. Sizes and colors are asserted in the browser,
 * in the `Templates/Section` stories; this file holds structure.
 */
const section = (container) => container.querySelector('section');

describe('PatternSection', () => {
    it('has no fill and no pad by default', () => {
        const { container } = render(<PatternSection title="Sessions">Body</PatternSection>);
        const cls = section(container).className;
        expect(cls).not.toMatch(/plus-pattern-section-pad-/);
        expect(cls).not.toMatch(/plus-pattern-section-bg-/);
    });

    describe('fill', () => {
        it('takes a subtle fill on request, and none otherwise', () => {
            const { container, rerender } = render(<PatternSection title="Flag" fill="subtle">Body</PatternSection>);
            expect(section(container).className).toContain('plus-pattern-section-fill-subtle');
            rerender(<PatternSection title="Flag">Body</PatternSection>);
            expect(section(container).className).not.toMatch(/plus-pattern-section-fill-/);
        });
    });

    describe('header types', () => {
        it('infers `tabs` from the tabs slot and puts the tabs row under the title row', () => {
            const { container } = render(
                <PatternSection title="Next session" tabs={<div data-testid="tabs" />}>Body</PatternSection>,
            );
            const header = container.querySelector('.plus-pattern-section-header');
            expect(header.className).toContain('plus-pattern-section-header--tabs');
            expect(within(header).getByTestId('tabs').closest('.plus-pattern-section-tabs')).not.toBeNull();
        });

        it('puts "Add view" at the end of the tabs row when `onAddView` is set', () => {
            const onAddView = vi.fn();
            render(<PatternSection title="Students" tabs={<div />} onAddView={onAddView}>Body</PatternSection>);
            screen.getByRole('button', { name: 'Add view' }).click();
            expect(onAddView).toHaveBeenCalledOnce();
        });

        it('infers `toolbar` from the toolbar slot', () => {
            const { container } = render(
                <PatternSection title="Students" toolbar={<SectionToolbar count="48 students" />}>Body</PatternSection>,
            );
            expect(container.querySelector('.plus-pattern-section-header').className).toContain('plus-pattern-section-header--toolbar');
            expect(screen.getByText('48 students')).toBeInTheDocument();
        });

        it('`tabs-only` keeps the title as a heading but hides it visually', () => {
            render(
                <PatternSection type="tabs-only" title="Students" tabs={<div data-testid="tabs" />} actions={<button type="button">Add</button>}>
                    Body
                </PatternSection>,
            );
            const heading = screen.getByRole('heading', { name: 'Students' });
            expect(heading.closest('.visually-hidden')).not.toBeNull();
            expect(screen.queryByRole('button', { name: 'Add' })).toBeNull();
        });

        it('`custom` swaps title and description for the header slot and keeps the title as a hidden name', () => {
            render(
                <PatternSection title="This week" description="Not shown" header={<p>Week of October 20</p>}>
                    Body
                </PatternSection>,
            );
            expect(screen.getByText('Week of October 20')).toBeInTheDocument();
            expect(screen.getByRole('heading', { name: 'This week' }).closest('.visually-hidden')).not.toBeNull();
            expect(screen.queryByText('Not shown')).toBeNull();
        });
    });

    describe('loading', () => {
        it('swaps the header for skeleton bars and marks the section busy', () => {
            const { container } = render(
                <PatternSection title="Sessions" description="This week" loading>
                    Body
                </PatternSection>,
            );
            expect(section(container)).toHaveAttribute('aria-busy', 'true');
            expect(container.querySelectorAll('.plus-pattern-section-skeleton .plus-skeleton')).toHaveLength(2);
            // The heading stays, visually hidden, so the busy section keeps its title.
            expect(screen.getByRole('heading', { name: 'Sessions' }).closest('.visually-hidden')).not.toBeNull();
            expect(screen.queryByText('This week')).toBeNull();
            expect(screen.getByText('Body')).toBeInTheDocument();
        });

        it('draws the skeleton before a title has arrived', () => {
            const { container } = render(<PatternSection loading>Body</PatternSection>);
            expect(container.querySelectorAll('.plus-pattern-section-skeleton .plus-skeleton')).toHaveLength(2);
        });

        it('adds a bar for the bottom row, and on tabs-only draws only that bar', () => {
            const { container, rerender } = render(<PatternSection title="S" tabs={<div />} loading>Body</PatternSection>);
            expect(container.querySelectorAll('.plus-pattern-section-skeleton .plus-skeleton')).toHaveLength(3);
            rerender(<PatternSection type="tabs-only" title="S" tabs={<div />} loading>Body</PatternSection>);
            expect(container.querySelectorAll('.plus-pattern-section-skeleton .plus-skeleton')).toHaveLength(1);
        });
    });

    describe('layout', () => {
        it('single by default: the content slot alone', () => {
            const { container } = render(<PatternSection title="S">Body</PatternSection>);
            expect(container.querySelector('.plus-pattern-section-content').className).toContain('plus-pattern-section-content--single');
        });

        it('split puts the side slot beside the content', () => {
            const { container } = render(
                <PatternSection title="S" layout="split" side={<p>Tutor on call</p>}>
                    <p>Upcoming</p>
                </PatternSection>,
            );
            const body = container.querySelector('.plus-pattern-section-content--split');
            expect(within(body.querySelector('.plus-pattern-section-main')).getByText('Upcoming')).toBeInTheDocument();
            expect(within(body.querySelector('.plus-pattern-section-side')).getByText('Tutor on call')).toBeInTheDocument();
        });

        it('subsections stack the nested sections as h3s under the h2', () => {
            const { container } = render(
                <PatternSection title="Settings" layout="subsections">
                    <PatternSection title="Profile">A</PatternSection>
                    <PatternSection title="Notifications">B</PatternSection>
                </PatternSection>,
            );
            expect(container.querySelector('.plus-pattern-section-content--subsections')).not.toBeNull();
            const tags = screen.getAllByRole('heading').map((h) => [h.tagName.toLowerCase(), h.textContent]);
            expect(tags).toEqual([['h2', 'Settings'], ['h3', 'Profile'], ['h3', 'Notifications']]);
        });

        it('renders the footer after the body', () => {
            const { container } = render(
                <PatternSection title="S" footer={<a href="#all">View all</a>}>Body</PatternSection>,
            );
            const parts = [...section(container).children].map((el) => el.className.split(' ')[0]);
            expect(parts).toEqual(['plus-pattern-section-header', 'plus-pattern-section-content', 'plus-pattern-section-footer']);
        });
    });
});

describe('SectionToolbar', () => {
    it('search, filters, count, then actions at the end', () => {
        const { container } = render(
            <SectionToolbar
                search={<input aria-label="Search students" />}
                filters={<button type="button">Status</button>}
                count="48 students"
                actions={<button type="button">Export</button>}
            />,
        );
        const toolbar = container.firstChild;
        const start = toolbar.querySelector('.plus-section-toolbar__start');
        expect(within(start).getByRole('textbox', { name: 'Search students' })).toBeInTheDocument();
        expect(within(start).getByRole('button', { name: 'Status' })).toBeInTheDocument();
        expect(within(start).getByText('48 students')).toBeInTheDocument();
        expect(within(toolbar.querySelector('.plus-section-toolbar__actions')).getByRole('button', { name: 'Export' })).toBeInTheDocument();
    });

    it('is reachable as PatternSection.Toolbar', () => {
        expect(PatternSection.Toolbar).toBe(SectionToolbar);
    });

    it('announces the count politely', () => {
        render(<SectionToolbar count="12 of 48 students" />);
        expect(screen.getByRole('status')).toHaveTextContent('12 of 48 students');
    });
});

describe('PatternSection named', () => {
    it('is a region named by its title only when asked', () => {
        const { unmount } = render(<PatternSection title="Flag 1" named>Body</PatternSection>);
        expect(screen.getByRole('region', { name: 'Flag 1' })).toBeInTheDocument();
        unmount();
        render(<PatternSection title="Flag 1">Body</PatternSection>);
        expect(screen.queryByRole('region')).toBeNull();
    });
});

describe('Template docs live examples', () => {
    it('TypeCard links to a same-page #anchor or a cross-page docs route', () => {
        const { rerender } = render(
            <TypeCard thumb={<div>Thumb</div>} title="List" to="#list">The view bar alone.</TypeCard>,
        );
        expect(screen.getByRole('link', { name: 'List' })).toHaveAttribute('href', '#list');

        rerender(
            <TypeCard thumb={<div>Thumb</div>} title="Frame" to="templates-frame">The shell.</TypeCard>,
        );
        expect(screen.getByRole('link', { name: 'Frame' })).toHaveAttribute('href', '?path=/docs/templates-frame--docs');
    });

    it('every TypeCard in PatternSection.mdx links to a live ComponentExample on the page', () => {
        const mdx = fs.readFileSync(path.join(__dirname, 'PatternSection.mdx'), 'utf8');
        const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        const exampleSlugs = new Set(
            [...mdx.matchAll(/<ComponentExample\b[^>]*?\btitle="([^"]+)"/g)].map((m) => slug(m[1])),
        );
        const cards = [...mdx.matchAll(/<TypeCard\b([^>]*?)>/g)].map((m) => m[1]);
        expect(cards.length).toBeGreaterThanOrEqual(16);
        for (const attrs of cards) {
            const to = /\bto="([^"]+)"/.exec(attrs)?.[1];
            expect(to, `TypeCard missing to="#...": ${attrs}`).toMatch(/^#[a-z0-9-]+$/);
            expect(exampleSlugs.has(to.slice(1)), `no ComponentExample for ${to}`).toBe(true);
        }
    });

    it('LiveAnatomy renders a non-inert, focusable story with non-interactive markers', () => {
        const { container } = render(
            <LiveAnatomy
                title="Section anatomy"
                parts={[{ selector: '[data-part="header"]', label: 'Header' }]}
            >
                <div data-part="header">
                    <button type="button">Add students</button>
                </div>
            </LiveAnatomy>,
        );
        expect(container.querySelector('[inert]')).toBeNull();
        const button = screen.getByRole('button', { name: 'Add students' });
        expect(button.closest('[aria-hidden="true"]')).toBeNull();
        button.focus();
        expect(button).toHaveFocus();
    });

    it('PatternSectionCases render real PLUS components for every do/dont pair', () => {
        for (const [name, Case] of Object.entries(Cases)) {
            const { container, unmount } = render(<Case />);
            expect(
                container.querySelector('.plus-pattern-section, .plus-pattern-card'),
                `${name} renders a real PatternSection or PatternCard`,
            ).not.toBeNull();
            unmount();
        }
    });
});

