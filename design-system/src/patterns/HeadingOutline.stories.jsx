import React from 'react';
import { expect, within } from 'storybook/test';

import { Card, Dropdown, Modal, Popover, Table, Toast } from '@/components';
import { PatternSection, Surface } from '@/patterns';

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
    title: 'Foundations/Patterns/Heading outline',
    tags: ['!dev', '!autodocs'],
};

/** The text style an element draws: size, line height and weight, in px. */
const expectStyle = async (element, name, [size, lineHeight, weight]) => {
    const style = getComputedStyle(element);
    await expect(style.fontSize, `${name} font size`).toBe(`${size}px`);
    await expect(style.lineHeight, `${name} line height`).toBe(`${lineHeight}px`);
    await expect(style.fontWeight, `${name} font weight`).toBe(String(weight));
};

const HEADING_LARGE = [24, 28, 600];
const HEADING_MEDIUM = [20, 24, 600];
const HEADING_SMALL = [16, 20, 600];
const HEADING_XSMALL = [14, 20, 600];
const HEADING_XXSMALL = [12, 16, 600];
const BODY_DEFAULT = [14, 20, 400];

const headingNamed = (canvas, level, name) => canvas.getByRole('heading', { level, name });

/** A page, a section in it, and a subsection in that, each one size smaller. */
export const PageSectionSubsection = () => (
    <Surface title="Sessions">
        <PatternSection title="This week" description="Every session you tutor from Monday to Sunday.">
            <PatternSection title="Monday">
                <p>Two sessions.</p>
            </PatternSection>
        </PatternSection>
    </Surface>
);

PageSectionSubsection.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    await expectStyle(headingNamed(canvas, 1, 'Sessions'), 'page', HEADING_LARGE);
    await expectStyle(headingNamed(canvas, 2, 'This week'), 'section', HEADING_MEDIUM);
    await expectStyle(headingNamed(canvas, 3, 'Monday'), 'subsection', HEADING_SMALL);
    await expectStyle(canvas.getByText('Every session you tutor from Monday to Sunday.'), 'section description', BODY_DEFAULT);
};

/** A card's title is 14 at every level; its tag is one below its section. */
export const CardTitles = () => (
    <Surface title="Sessions">
        <PatternSection title="This week">
            <Card title="Algebra I" subtitle="Two students" body="Thursday at 4:00 PM." />
            <PatternSection title="Monday">
                <Card title="Geometry" subtitle="One student" />
            </PatternSection>
        </PatternSection>
    </Surface>
);

CardTitles.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectStyle(headingNamed(canvas, 3, 'Algebra I'), 'card in a section', HEADING_XSMALL);
    await expectStyle(headingNamed(canvas, 4, 'Geometry'), 'card in a subsection', HEADING_XSMALL);
    await expectStyle(canvas.getByText('Two students'), 'card description', BODY_DEFAULT);
    await expectStyle(canvas.getByText('Thursday at 4:00 PM.'), 'card body', BODY_DEFAULT);
};

/** A modal's title is the dialog's h1 at 20, and names the dialog. */
export const ModalTitle = () => (
    <Modal
        show
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

ModalTitle.play = async () => {
    // The dialog is portaled to the body, outside the canvas.
    const dialog = await within(document.body).findByRole('dialog', { name: 'Edit session' });
    const inside = within(dialog);
    await expectStyle(inside.getByRole('heading', { level: 1, name: 'Edit session' }), 'modal title', HEADING_MEDIUM);
    await expectStyle(inside.getByText('Changes apply to every session in the series.'), 'modal description', BODY_DEFAULT);
    await expectStyle(inside.getByRole('heading', { level: 2, name: 'When' }), 'section in a modal', HEADING_MEDIUM);
};

/** A popup's title and a flag's title are 14. */
export const PopupAndFlagTitles = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-stack-md)', alignItems: 'flex-start' }}>
        <Popover
            title="Session notes"
            triggerType="manual"
            show
            placement="right"
            trigger={<button type="button">Notes</button>}
        >
            Shared with the student.
        </Popover>
        <Toast style="info" title="Session moved" show onClose={() => {}}>Now Thursday at 4:00 PM.</Toast>
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
        <Dropdown
            isOpen
            buttonText="Sort"
            items={[
                { header: true, text: 'Order' },
                { text: 'Newest' },
                { text: 'Oldest' },
            ]}
        />
        <Table headers={['Student', 'Grade']} rows={[['Ana', '7'], ['Ben', '8']]} />
    </div>
);

GroupLabels.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryAllByRole('heading')).toHaveLength(0);
    const group = canvas.getByRole('group', { name: 'Order' });
    await expectStyle(canvas.getByText('Order'), 'menu group label', HEADING_XXSMALL);
    await expect(within(group).getAllByRole('button').map((b) => b.textContent)).toEqual(['Newest', 'Oldest']);
    for (const header of canvas.getAllByRole('columnheader')) {
        await expectStyle(header, `column header ${header.textContent}`, HEADING_XXSMALL);
    }
};
