import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

// Module paths rather than the barrels, so the rest stays light.
import Card from './Card';
import DropdownMenu from '@/components/forms-and-inputs/DropdownMenu';
import { ButtonItem, Section as MenuSection } from '@/lib/menu';
import PageHeader from '@/components/layout-and-structure/PageHeader';
import Sidebar from '@/components/navigation/Sidebar';
import { Dialog, StaticTable } from '@/components';
import Modal from './Modal';
import Section from './Section';
import Page from './Page';

/**
 * Heading tags follow nesting: one h1 per page, sections h2, subsections h3,
 * and a container's title one level below the section it sits in. A dialog is
 * its own page: its title is an h1 and names it. Group labels are not headings.
 *
 * The sizes each level draws are asserted in the browser, in the
 * `Templates/Heading outline` stories; this file holds the tags.
 */
const outline = () => screen.queryAllByRole('heading').map((h) => [h.tagName.toLowerCase(), h.textContent]);

describe('the page outline', () => {
    it('steps one level per nesting: page h1, section h2, subsection h3', () => {
        render(
            <Page title="Sessions">
                <Section title="This week">
                    <Section title="Monday">
                        <p>Two sessions.</p>
                    </Section>
                </Section>
            </Page>,
        );
        expect(outline()).toEqual([['h1', 'Sessions'], ['h2', 'This week'], ['h3', 'Monday']]);
    });

    it('keeps the level through a section with no title', () => {
        render(
            <Page title="Sessions">
                <Section>
                    <Card title="Wrapped" />
                </Section>
            </Page>,
        );
        expect(outline()).toEqual([['h1', 'Sessions'], ['h2', 'Wrapped']]);
    });

    it('titles a card one level below its section', () => {
        render(
            <Page title="Sessions">
                <Card title="On the page" />
                <Section title="This week">
                    <Card title="In a section" description="Two students" />
                    <Section title="Monday">
                        <Card title="In a subsection" />
                    </Section>
                </Section>
            </Page>,
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

    it('places a Page with PageHeader at h1 and sections inside it at h2', () => {
        render(
            <Page header={<PageHeader title="Sessions" />}>
                <Section title="This week">
                    <Card title="Monday" />
                </Section>
            </Page>,
        );
        expect(outline()).toEqual([['h1', 'Sessions'], ['h2', 'This week'], ['h3', 'Monday']]);
    });
});

describe('a dialog', () => {
    it('is named by its h1 title, and a section inside it is an h2', () => {
        render(
            <Modal show title="Edit session" description="Changes apply to the series." onClose={() => {}}>
                <Section title="When">
                    <Card title="Monday" />
                </Section>
            </Modal>,
        );
        const dialog = screen.getByRole('dialog', { name: 'Edit session' });
        const headings = within(dialog).getAllByRole('heading').map((h) => [h.tagName.toLowerCase(), h.textContent]);
        expect(headings).toEqual([['h1', 'Edit session'], ['h2', 'When'], ['h3', 'Monday']]);
    });

    it('is the same for the Dialog component', () => {
        render(<Dialog title="Delete file" onClose={() => {}}>Gone for good.</Dialog>);
        expect(screen.getByRole('heading', { name: 'Delete file' }).tagName).toBe('H1');
    });

    it('steps a PageHeader with titleAs="h2" below the dialog title', () => {
        render(
            <Modal show title="Edit session" onClose={() => {}}>
                <PageHeader title="Details" titleAs="h2" />
            </Modal>,
        );
        const dialog = screen.getByRole('dialog', { name: 'Edit session' });
        const headings = within(dialog).getAllByRole('heading').map((h) => [h.tagName.toLowerCase(), h.textContent]);
        expect(headings).toEqual([['h1', 'Edit session'], ['h2', 'Details']]);
    });
});

describe('group labels', () => {
    it('name a menu group and are not headings', () => {
        render(
            <DropdownMenu isOpen trigger={<button type="button">Sort</button>}>
                <MenuSection title="Order">
                    <ButtonItem onClick={() => {}}>Newest</ButtonItem>
                    <ButtonItem onClick={() => {}}>Oldest</ButtonItem>
                </MenuSection>
                <MenuSection title="Group by">
                    <ButtonItem onClick={() => {}}>Tutor</ButtonItem>
                </MenuSection>
            </DropdownMenu>,
        );
        expect(screen.queryAllByRole('heading')).toEqual([]);
        const order = screen.getByRole('group', { name: 'Order' });
        expect(within(order).getAllByRole('menuitem').map((b) => b.textContent)).toEqual(['Newest', 'Oldest']);
        const groupBy = screen.getByRole('group', { name: 'Group by' });
        expect(within(groupBy).getAllByRole('menuitem').map((b) => b.textContent)).toEqual(['Tutor']);
        // The label is a label, not a control.
        expect(screen.queryByRole('button', { name: 'Order' })).toBeNull();
    });

    it('label a table column as a column header', () => {
        render(<StaticTable headers={['Student', 'Grade']} rows={[['Ana', '7']]} />);
        expect(screen.getAllByRole('columnheader').map((th) => [th.textContent, th.getAttribute('scope')]))
            .toEqual([['Student', 'col'], ['Grade', 'col']]);
        expect(screen.queryAllByRole('heading')).toEqual([]);
    });
});

describe('the sidebar', () => {
    it('names each section a group, and its label is not a heading', () => {
        render(<Sidebar />);
        const training = screen.getByRole('group', { name: 'Training' });
        expect(within(training).getByRole('button', { name: /Lessons/ })).toBeTruthy();
        expect(screen.getByRole('group', { name: 'Toolkit' })).toBeTruthy();
        expect(screen.queryAllByRole('heading')).toEqual([]);
    });
});
