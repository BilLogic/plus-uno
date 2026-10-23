import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
// Module paths rather than the barrels: the components barrel pulls in the
// chart library, which does not load in jsdom.
import Card from '@/components/layout-and-structure/Card';
import Dropdown from '@/components/forms-and-inputs/Dropdown';
import Modal from '@/components/messaging/Modal';
import Table from '@/components/_internal/Table';
import PatternModal from './PatternModal';
import PatternSection from './PatternSection';
import Surface from './Surface';

/**
 * Heading tags follow nesting: one h1 per page, sections h2, subsections h3,
 * and a container's title one level below the section it sits in. A dialog is
 * its own page: its title is an h1 and names it. Group labels are not headings.
 *
 * The sizes each level draws are asserted in the browser, in the
 * `Foundations/Patterns/Heading outline` stories; this file holds the tags.
 */
const outline = () => screen.queryAllByRole('heading').map((h) => [h.tagName.toLowerCase(), h.textContent]);

describe('the page outline', () => {
    it('steps one level per nesting: page h1, section h2, subsection h3', () => {
        render(
            <Surface title="Sessions">
                <PatternSection title="This week">
                    <PatternSection title="Monday">
                        <p>Two sessions.</p>
                    </PatternSection>
                </PatternSection>
            </Surface>,
        );
        expect(outline()).toEqual([['h1', 'Sessions'], ['h2', 'This week'], ['h3', 'Monday']]);
    });

    it('titles a card one level below its section', () => {
        render(
            <Surface title="Sessions">
                <Card title="On the page" />
                <PatternSection title="This week">
                    <Card title="In a section" subtitle="Two students" />
                    <PatternSection title="Monday">
                        <Card title="In a subsection" />
                    </PatternSection>
                </PatternSection>
            </Surface>,
        );
        expect(outline()).toEqual([
            ['h1', 'Sessions'],
            ['h2', 'On the page'],
            ['h2', 'This week'],
            ['h3', 'In a section'],
            ['h3', 'Monday'],
            ['h4', 'In a subsection'],
        ]);
    });
});

describe('a dialog', () => {
    it('is named by its h1 title, and a section inside it is an h2', () => {
        render(
            <Modal show title="Edit session" description="Changes apply to the series." onClose={() => {}}>
                <PatternSection title="When">
                    <Card title="Monday" />
                </PatternSection>
            </Modal>,
        );
        const dialog = screen.getByRole('dialog', { name: 'Edit session' });
        const headings = within(dialog).getAllByRole('heading').map((h) => [h.tagName.toLowerCase(), h.textContent]);
        expect(headings).toEqual([['h1', 'Edit session'], ['h2', 'When'], ['h3', 'Monday']]);
    });

    it('is the same for the inline modal pattern', () => {
        render(<PatternModal title="Delete file" onClose={() => {}}>Gone for good.</PatternModal>);
        const dialog = screen.getByRole('dialog', { name: 'Delete file' });
        expect(within(dialog).getByRole('heading', { name: 'Delete file' }).tagName).toBe('H1');
    });
});

describe('group labels', () => {
    it('name a menu group and are not headings', () => {
        render(
            <Dropdown
                isOpen
                buttonText="Sort"
                items={[
                    { header: true, text: 'Order' },
                    { text: 'Newest' },
                    { text: 'Oldest' },
                    { header: true, text: 'Group by' },
                    { text: 'Tutor' },
                ]}
            />,
        );
        expect(screen.queryAllByRole('heading')).toEqual([]);
        const order = screen.getByRole('group', { name: 'Order' });
        expect(within(order).getAllByRole('button').map((b) => b.textContent)).toEqual(['Newest', 'Oldest']);
        const groupBy = screen.getByRole('group', { name: 'Group by' });
        expect(within(groupBy).getAllByRole('button').map((b) => b.textContent)).toEqual(['Tutor']);
        // The label is a label, not a control.
        expect(screen.queryByRole('button', { name: 'Order' })).toBeNull();
    });

    it('label a table column as a column header', () => {
        render(<Table headers={['Student', 'Grade']} rows={[['Ana', '7']]} />);
        expect(screen.getAllByRole('columnheader').map((th) => [th.textContent, th.getAttribute('scope')]))
            .toEqual([['Student', 'col'], ['Grade', 'col']]);
        expect(screen.queryAllByRole('heading')).toEqual([]);
    });
});
