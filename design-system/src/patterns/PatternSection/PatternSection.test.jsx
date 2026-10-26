import { render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PatternSection, { SectionToolbar, resetPatternSectionWarnings } from './PatternSection';

/**
 * The Section pattern follows the Figma Section: no fill and no pad of its
 * own, a `_Section header` of five types, a body laid out single, split or
 * as subsections, an optional footer, a toolbar with a default and a selected
 * state, and a loading header. Sizes and colors are asserted in the browser,
 * in the `Foundations/Patterns/Section` stories; this file holds structure.
 */
const section = (container) => container.querySelector('section');

describe('PatternSection', () => {
    let warn;
    beforeEach(() => {
        resetPatternSectionWarnings();
        warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });
    afterEach(() => warn.mockRestore());

    it('has no fill and no pad by default', () => {
        const { container } = render(<PatternSection title="Sessions">Body</PatternSection>);
        const cls = section(container).className;
        expect(cls).not.toMatch(/plus-pattern-section-pad-/);
        expect(cls).not.toMatch(/plus-pattern-section-bg-/);
        expect(warn).not.toHaveBeenCalled();
    });

    describe('deprecated props', () => {
        it('keeps `padding` and `background` working', () => {
            const { container } = render(
                <PatternSection title="Sessions" padding="sm" background="container">Body</PatternSection>,
            );
            const cls = section(container).className;
            expect(cls).toContain('plus-pattern-section-pad-sm');
            expect(cls).toContain('plus-pattern-section-bg-container');
        });

        it('warns once per prop, however many sections pass it', () => {
            render(
                <>
                    <PatternSection padding="sm">One</PatternSection>
                    <PatternSection padding="md">Two</PatternSection>
                    <PatternSection background="container">Three</PatternSection>
                </>,
            );
            const messages = warn.mock.calls.map(([m]) => m);
            expect(messages.filter((m) => m.includes('`padding`'))).toHaveLength(1);
            expect(messages.filter((m) => m.includes('`background`'))).toHaveLength(1);
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
    it('default state: search, filters, count, then actions at the end', () => {
        const { container } = render(
            <SectionToolbar
                search={<input aria-label="Search students" />}
                filters={<button type="button">Status</button>}
                count="48 students"
                actions={<button type="button">Export</button>}
            />,
        );
        const toolbar = container.firstChild;
        expect(toolbar.className).toContain('plus-section-toolbar--default');
        const start = toolbar.querySelector('.plus-section-toolbar__start');
        expect(within(start).getByRole('textbox', { name: 'Search students' })).toBeInTheDocument();
        expect(within(start).getByRole('button', { name: 'Status' })).toBeInTheDocument();
        expect(within(start).getByText('48 students')).toBeInTheDocument();
        expect(within(toolbar.querySelector('.plus-section-toolbar__actions')).getByRole('button', { name: 'Export' })).toBeInTheDocument();
    });

    it('selected state: the selection, bulk actions and Clear, announced politely', () => {
        const onClear = vi.fn();
        const { container } = render(
            <SectionToolbar
                state="selected"
                selection="3 selected"
                bulkActions={<button type="button">Assign tutor</button>}
                actions={<button type="button">Export</button>}
                search={<input aria-label="Search" />}
                onClear={onClear}
            />,
        );
        expect(container.firstChild.className).toContain('plus-section-toolbar--selected');
        expect(screen.getByText('3 selected')).toHaveAttribute('aria-live', 'polite');
        expect(screen.getByRole('button', { name: 'Assign tutor' })).toBeInTheDocument();
        // The default state's parts give way to the bulk bar.
        expect(screen.queryByRole('button', { name: 'Export' })).toBeNull();
        expect(screen.queryByRole('textbox')).toBeNull();
        screen.getByRole('button', { name: 'Clear' }).click();
        expect(onClear).toHaveBeenCalledOnce();
    });

    it('is reachable as PatternSection.Toolbar', () => {
        expect(PatternSection.Toolbar).toBe(SectionToolbar);
    });
});
