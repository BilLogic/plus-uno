import React from 'react';
import { expect, within } from 'storybook/test';

import { DropdownMenu, Modal, Popup, Table, Flag, ButtonItem, Section, Button } from '@/components';
import { PatternCard, PatternSection, Page } from '@/patterns';

/**
 * Headings step down one size per nesting level, and their tags follow the
 * nesting: the page's one h1 is Heading/large 24, a section's h2 is
 * Heading/medium 20, a subsection's h3 is Heading/small 16.
 *
 * Container titles are fixed whatever level they sit at: a modal's is 20 (the
 * dialog's own h1, which names it), and a card's, a popup's and a flag's are
 * 14. A card's title sits over a 14 description, and its tag is one level
 * below its section.
 *
 * Group labels are 12 semibold and are not headings: a menu's label names a
 * group, and a table's labels are column headers.
 */
export default {
    title: 'Templates/Heading outline',
    tags: ['!dev', '!autodocs'],
};

/** The text style an element draws: size, line height and weight, in px. */
const expectStyle = async (element, name, [size, lineHeight, weight]) => {
    const style = getComputedStyle(element);
    await expect(style.fontSize, `${name} font size`).toBe(`${size}px`);
    await expect(style.lineHeight, `${name} line height`).toBe(`${lineHeight}px`);
    await expect(style.fontWeight, `${name} font weight`).toBe(String(weight));
};

const HEADING_LARGE = [24, 28, 500];
const HEADING_MEDIUM = [20, 24, 500];
const HEADING_SMALL = [16, 20, 600];
const HEADING_XSMALL = [14, 20, 600];
const HEADING_XXSMALL = [12, 16, 600];
const BODY_DEFAULT = [14, 20, 400];

const headingNamed = (canvas, level, name) => canvas.getByRole('heading', { level, name });

/** A page, a section in it, and a subsection in that, each one size smaller. */
export const PageSectionSubsection = () => (
    <Page title="Sessions">
        <PatternSection title="This week" description="Every session you tutor from Monday to Sunday.">
            <PatternSection title="Monday">
                <p>Two sessions.</p>
            </PatternSection>
        </PatternSection>
    </Page>
);

PageSectionSubsection.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    await expectStyle(headingNamed(canvas, 1, 'Sessions'), 'page', HEADING_LARGE);
    await expectStyle(headingNamed(canvas, 2, 'This week'), 'section', HEADING_MEDIUM);
    await expectStyle(headingNamed(canvas, 3, 'Monday'), 'subsection', HEADING_SMALL);
    await expectStyle(canvas.getByText('Every session you tutor from Monday to Sunday.'), 'section description', BODY_DEFAULT);
};

/**
 * A card's title is 14 at every level; its tag is one below its section.
 */
export const CardTitles = () => (
    <Page title="Sessions">
        <PatternSection title="This week">
            <PatternCard title="Lincoln Middle" description="Two students" />
            <PatternSection title="Monday">
                <PatternCard title="South High" description="Three students" />
            </PatternSection>
        </PatternSection>
    </Page>
);

CardTitles.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectStyle(headingNamed(canvas, 3, 'Lincoln Middle'), 'card in a section', HEADING_XSMALL);
    await expectStyle(headingNamed(canvas, 4, 'South High'), 'pattern card in a subsection', HEADING_XSMALL);
    await expectStyle(canvas.getByText('Three students'), 'pattern card description', BODY_DEFAULT);
    await expectStyle(canvas.getByText('Two students'), 'card description', BODY_DEFAULT);
};

/** A modal's title is the dialog's h1 at 20, and names the dialog. */
export const ModalTitle = () => (
    <Modal
        show
        renderAs="inline"
        title="Edit session"
        description="Changes apply to every session in the series."
        onClose={() => {}}
        primaryButton={{ text: 'Save' }}
        secondaryButton={{ text: 'Cancel' }}
    >
        <PatternSection title="When">
            <p>Thursdays at 4:00 PM.</p>
        </PatternSection>
    </Modal>
);

ModalTitle.play = async ({ canvasElement }) => {
    // Inline: the modal sits in the canvas, not over the docs page (and is no dialog there).
    const dialog = canvasElement.querySelector('.plus-modal');
    await expect(dialog, 'the modal renders inside the canvas').not.toBeNull();
    const inside = within(dialog);
    await expectStyle(inside.getByRole('heading', { level: 1, name: 'Edit session' }), 'modal title', HEADING_MEDIUM);
    await expectStyle(inside.getByText('Changes apply to every session in the series.'), 'modal description', BODY_DEFAULT);
    await expectStyle(inside.getByRole('heading', { level: 2, name: 'When' }), 'section in a modal', HEADING_MEDIUM);
};

/** A popup's title and a flag's title are 14. */
export const PopupAndFlagTitles = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-stack-md)', alignItems: 'flex-start' }}>
        <Popup
            title="Session notes"
            triggerType="manual"
            show
            placement="right"
            trigger={<Button>Notes</Button>}
        >
            Shared with the student.
        </Popup>
        <Flag title="Session moved" show onDismiss={() => {}}>Now Thursday at 4:00 PM.</Flag>
    </div>
);

PopupAndFlagTitles.play = async ({ canvasElement }) => {
    const body = within(document.body);
    await expectStyle(await body.findByText('Session notes'), 'popup title', HEADING_XSMALL);
    await expectStyle(within(canvasElement).getByText('Session moved'), 'flag title', HEADING_XSMALL);
};

/** Group labels are 12 semibold: a menu group's label, and a table's column headers. */
export const GroupLabels = () => (
    <div style={{ display: 'flex', gap: 'var(--section-stack-lg)', alignItems: 'flex-start' }}>
        <DropdownMenu isOpen trigger={<Button>Sort</Button>}>
            <Section title="Order">
                <ButtonItem onClick={() => {}}>Newest</ButtonItem>
                <ButtonItem onClick={() => {}}>Oldest</ButtonItem>
            </Section>
        </DropdownMenu>
        <Table headers={['Student', 'Grade']} rows={[['Ana', '7'], ['Ben', '8']]} />
    </div>
);

GroupLabels.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await expect(canvas.queryAllByRole('heading')).toHaveLength(0);
    const group = await body.findByRole('group', { name: 'Order' });
    await expectStyle(body.getByText('Order'), 'menu group label', HEADING_XXSMALL);
    await expect(within(group).getAllByRole('menuitem').map((b) => b.textContent)).toEqual(['Newest', 'Oldest']);
    for (const header of canvas.getAllByRole('columnheader')) {
        await expectStyle(header, `column header ${header.textContent}`, HEADING_XXSMALL);
    }
};
