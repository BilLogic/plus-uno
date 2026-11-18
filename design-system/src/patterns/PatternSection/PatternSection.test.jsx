import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ComponentExample } from '@/storybook-docs/ds-docs-layout.jsx';
import { LiveAnatomy, TypeCard } from '@/storybook-docs/lib/template-page.jsx';
import PatternSection, { SectionToolbar } from './PatternSection';
import * as Cases from './PatternSectionCases.jsx';

vi.mock('@storybook/addon-docs/blocks', () => ({
    ArgTypes: () => null,
    Canvas: () => <div data-testid="docs-canvas" />,
    Controls: () => null,
    Source: () => null,
    Stories: () => null,
    Story: () => <div data-testid="docs-story" />,
    useOf: () => ({}),
}));

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

    describe('spacing', () => {
        it('puts the default step on the Section, and each other step on request', () => {
            const { container, rerender } = render(<PatternSection title="Flag">Body</PatternSection>);
            expect(section(container).className).toContain('plus-pattern-section-spacing-default');
            rerender(<PatternSection title="Flag" spacing="compact">Body</PatternSection>);
            expect(section(container).className).toContain('plus-pattern-section-spacing-compact');
            rerender(<PatternSection title="Flag" spacing="spacious">Body</PatternSection>);
            expect(section(container).className).toContain('plus-pattern-section-spacing-spacious');
        });

        it('takes no fill prop: a padded box with a fill is a Card', () => {
            const removed = { fill: 'subtle' };
            const { container } = render(<PatternSection title="Flag" {...removed}>Body</PatternSection>);
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
    it('TypeCard links both thumbnail and title without a duplicate tab stop, resolving to ComponentExample', () => {
        const { container } = render(
            <div>
                <TypeCard thumb={<div>Thumb</div>} title="List" to="#list">The view bar alone.</TypeCard>
                <TypeCard thumb={<div>Thumb</div>} title="View bar, one view" to="#view-bar-one-view">One pill.</TypeCard>
                <TypeCard thumb={<div>Thumb</div>} title="Frame" to="templates-frame">The shell.</TypeCard>
                <ComponentExample of={{}} title="List" description="The view bar alone." />
                <ComponentExample of={{}} title="View bar, one view" description="One pill." />
            </div>,
        );

        const listLink = screen.getByRole('link', { name: 'List' });
        expect(listLink).toHaveAttribute('href', '#list');
        expect(screen.getByRole('link', { name: 'Frame' })).toHaveAttribute('href', '?path=/docs/templates-frame--docs');
        expect(screen.getAllByRole('link')).toHaveLength(3);

        const thumbs = container.querySelectorAll('[data-type-thumb]');
        expect(thumbs[0].tagName).toBe('A');
        expect(thumbs[0]).toHaveAttribute('href', '#list');
        expect(thumbs[0]).toHaveAttribute('tabindex', '-1');
        expect(thumbs[0]).toHaveAttribute('aria-hidden', 'true');

        for (const href of ['#list', '#view-bar-one-view']) {
            const target = container.querySelector(href);
            expect(target).not.toBeNull();
            expect(target.tagName).toBe('H3');
        }

        const ids = [...container.querySelectorAll('[id]')].map((el) => el.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('LiveAnatomy stays scaled and inert by default, and goes live and focusable when opted in', () => {
        const parts = [{ selector: '[data-part="header"]', label: 'Header' }];
        const { container, rerender } = render(
            <LiveAnatomy width={960} title="Section anatomy" parts={parts}>
                <div data-part="header">
                    <button type="button">Add students</button>
                </div>
            </LiveAnatomy>,
        );
        expect(screen.getByRole('img', { name: /Section anatomy/ })).toBeInTheDocument();
        expect(container.querySelector('[inert]')).not.toBeNull();

        rerender(
            <LiveAnatomy live title="Section anatomy" parts={parts}>
                <div data-part="header">
                    <button type="button">Add students</button>
                </div>
            </LiveAnatomy>,
        );
        expect(screen.queryByRole('img', { name: /Section anatomy/ })).toBeNull();
        expect(container.querySelector('[inert]')).toBeNull();
        const button = screen.getByRole('button', { name: 'Add students' });
        expect(button.closest('[aria-hidden="true"]')).toBeNull();
        button.focus();
        expect(button).toHaveFocus();
    });

    it('PatternSectionCases render real PLUS components for every do/dont pair', () => {
        const r1 = render(<Cases.CardStandsAlone />);
        expect(screen.getByRole('heading', { name: 'Upcoming session' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Join session' })).toBeInTheDocument();
        r1.unmount();

        const r2 = render(<Cases.SectionRepeatsCard />);
        expect(screen.getAllByRole('heading', { name: 'Upcoming session' })).toHaveLength(2);
        expect(screen.getByRole('button', { name: 'Join session' })).toBeInTheDocument();
        r2.unmount();

        const r3 = render(<Cases.ActionsInTitleRow />);
        expect(screen.getByRole('heading', { name: 'Students' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Add students' })).toBeInTheDocument();
        r3.unmount();

        const r3b = render(<Cases.TitleRowAboveHeaderRows />);
        expect(screen.getByRole('heading', { name: 'Students' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'All students' })).toBeInTheDocument();
        r3b.unmount();

        const r3c = render(<Cases.TitleInViewsRow />);
        expect(screen.queryByRole('heading', { name: 'Students' }), 'the title sits in the views row, not in a heading').toBeNull();
        expect(screen.getByRole('tab', { name: 'All students' })).toBeInTheDocument();
        r3c.unmount();

        const r4 = render(<Cases.ActionsInTwoHomes />);
        expect(screen.getByRole('heading', { name: 'Students' })).toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: 'Add students' })).toHaveLength(2);
        r4.unmount();

        const r5 = render(<Cases.RightSideInOrder />);
        expect(screen.getByRole('heading', { name: 'Sessions' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Status: All' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'New session' })).toBeInTheDocument();
        r5.unmount();

        const r6 = render(<Cases.RightSideCrowded />);
        expect(screen.getByRole('heading', { name: 'Sessions' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'New session' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument();
        r6.unmount();

        const r7 = render(<Cases.CardOwnsSave />);
        expect(screen.getByRole('heading', { name: 'Contact details' })).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: 'Guardian name' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'View all' })).toBeInTheDocument();
        r7.unmount();

        const r8 = render(<Cases.FooterCommits />);
        expect(screen.getByRole('heading', { name: 'Contact details' })).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: 'Guardian name' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
        r8.unmount();
    });
});

describe('PatternSection header rows', () => {
    const filters = [
        { key: 'status', label: 'Status', text: 'Upcoming' },
        { key: 'group', label: 'Group', text: 'All' },
        { key: 'date', label: 'Date', text: 'All time' },
    ];
    const rows = (container) => [...container.querySelectorAll('.plus-section-rows > .plus-section-row')];

    it('draws views and the format switch in row 2, Search and filters in row 3', () => {
        const { container } = render(
            <PatternSection
                title="Sessions"
                views={<div data-testid="views" />}
                format={<div data-testid="format" />}
                search={<div data-testid="search" />}
                filters={filters}
            >
                Body
            </PatternSection>,
        );
        const [row2, row3] = rows(container);
        expect(within(row2).getByTestId('views')).toBeInTheDocument();
        expect(within(row2).getByTestId('format')).toBeInTheDocument();
        expect(within(row3).getByTestId('search')).toBeInTheDocument();
        expect(within(row3).getByRole('button', { name: 'Status: Upcoming' })).toBeInTheDocument();
    });

    it('drops row 2 without views and moves the format switch to the end of row 3', () => {
        const { container } = render(
            <PatternSection title="Students" format={<div data-testid="format" />} search={<div />} filters={filters}>Body</PatternSection>,
        );
        const found = rows(container);
        expect(found).toHaveLength(1);
        expect(within(found[0]).getByTestId('format')).toBeInTheDocument();
    });

    it('drops row 3 when there is nothing to search or filter', () => {
        const { container } = render(<PatternSection title="Reflections" views={<div />}>Body</PatternSection>);
        expect(rows(container)).toHaveLength(1);
    });

    it('ends row 3 with the count and Clear all once a filter is applied', () => {
        const onClearAll = vi.fn();
        const applied = filters.map((f, i) => ({ ...f, isSelected: i < 2 }));
        render(<PatternSection title="Sessions" search={<div />} filters={applied} count="3 of 12" onClearAll={onClearAll}>Body</PatternSection>);
        expect(screen.getByText('3 of 12')).toBeInTheDocument();
        screen.getByRole('button', { name: 'Clear all' }).click();
        expect(onClearAll).toHaveBeenCalled();
    });

    it('shows no count or Clear all while nothing is applied', () => {
        render(<PatternSection title="Sessions" search={<div />} filters={filters} count="12 of 12" onClearAll={() => {}}>Body</PatternSection>);
        expect(screen.queryByRole('button', { name: 'Clear all' })).toBeNull();
    });

    it('shows three filters and folds the rest into More filters with a count', () => {
        const many = [...filters, { key: 'grade', label: 'Grade', text: 'All' }, { key: 'tutor', label: 'Tutor', text: 'Any' }];
        render(<PatternSection title="Sessions" search={<div />} filters={many}>Body</PatternSection>);
        expect(screen.getByRole('button', { name: 'Date: All time' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Grade: All' })).toBeNull();
        expect(screen.getByRole('button', { name: /More filters/ })).toHaveTextContent('2');
    });

    it('hands a filter entry\'s trigger to its menu, so the same button opens it', () => {
        const menu = vi.fn((trigger) => <div data-testid="menu-wrap">{trigger}</div>);
        render(<PatternSection title="Sessions" search={<div />} filters={[{ key: 'status', label: 'Status', text: 'Upcoming', isSelected: true, menu }]}>Body</PatternSection>);
        const trigger = screen.getByRole('button', { name: 'Status: Upcoming' });
        expect(menu).toHaveBeenCalled();
        expect(screen.getByTestId('menu-wrap')).toContainElement(trigger);
        expect(trigger).toHaveAttribute('aria-pressed', 'true');
    });

    it('keeps the count and Clear all under 768', () => {
        const before = window.innerWidth;
        window.innerWidth = 600;
        try {
            const applied = filters.map((f, i) => ({ ...f, isSelected: i === 0 }));
            render(<PatternSection title="Sessions" search={<div />} filters={applied} count="3 of 12" onClearAll={() => {}}>Body</PatternSection>);
            expect(screen.getByText('3 of 12')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Clear all' })).toBeInTheDocument();
        } finally {
            window.innerWidth = before;
        }
    });

    it('folds the triggers into one Filter button with the applied count under 768', () => {
        const before = window.innerWidth;
        window.innerWidth = 600;
        try {
            const applied = filters.map((f, i) => ({ ...f, isSelected: i === 0 }));
            render(<PatternSection title="Sessions" search={<div data-testid="search" />} filters={applied}>Body</PatternSection>);
            expect(screen.queryByRole('button', { name: 'Status: Upcoming' })).toBeNull();
            expect(screen.getByRole('button', { name: /^Filter/ })).toHaveTextContent('1');
        } finally {
            window.innerWidth = before;
        }
    });
});
