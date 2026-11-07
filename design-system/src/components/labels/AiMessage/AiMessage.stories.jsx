import React from 'react';
import { expect, userEvent, within } from 'storybook/test';

import AiMessage, { AI_MESSAGE_STATUSES } from './AiMessage';

/**
 * `AiMessage` -- an assistant reply, in the three states a reply moves through.
 *
 * THE TEST SEAM IS THIS FILE. Each story asserts what a person gets: a finished
 * message reads as text, a streaming one is busy and carries a caret, and the
 * typing indicator announces itself and shows no text.
 */
export default {
    title: 'Components/Labels/AI label/AI message',
    component: AiMessage,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'An assistant reply. Complete is a finished message; streaming is text still arriving, '
                    + 'with a caret; thinking is the typing indicator before any text exists.',
            },
        },
    },
    argTypes: {
        status: { control: 'select', options: AI_MESSAGE_STATUSES },
        text: { control: 'text' },
        typeOut: { control: 'boolean' },
    },
};

const REPLY = 'Novice tutors hold engagement through week six, then it drops.\nVisual representations narrow the gap.';

/** A finished message. */
export const Message = () => <AiMessage text={REPLY} />;

Message.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Novice tutors hold engagement/)).toBeInTheDocument();
    await expect(canvasElement.querySelector('[aria-busy]')).toBeNull();
};

/** Text still arriving: a caret follows the last character and the message is busy. */
export const Streaming = () => <AiMessage status="streaming" text="Novice tutors hold engagement through week" />;

Streaming.play = async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[aria-busy="true"]')).not.toBeNull();
    await expect(canvasElement.querySelector('.plus-ai-message__caret')).not.toBeNull();
};

/** The typing indicator: the assistant has the message and has not started writing. */
export const TypingIndicator = () => <AiMessage status="thinking" />;

TypingIndicator.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('status', { name: 'AI is writing' })).toBeInTheDocument();
    await expect(canvasElement.querySelector('.plus-ai-message__text')).toBeNull();
};

/** A finished reply typed out character by character, as one that has just arrived. */
export const TypedOut = () => <AiMessage typeOut text="Here is what I found in the last twelve weeks." />;

/** A reply that mixes text with another part, which `renderPart` draws. */
export const WithParts = () => (
    <AiMessage
        parts={[
            { type: 'text', text: 'Engagement by week:' },
            { type: 'data', rows: [['Novice', '78%'], ['Experienced', '84%']] },
            { type: 'text', text: 'The gap closes after week eight.' },
        ]}
        renderPart={(part) => (
            <ul style={{ margin: 0 }}>
                {part.rows.map(([name, value]) => <li key={name}>{name}: {value}</li>)}
            </ul>
        )}
    />
);

WithParts.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Novice: 78%')).toBeInTheDocument();
};

export const Interactive = {
    args: { text: REPLY, status: 'complete', typeOut: false },
    render: (args) => <AiMessage {...args} />,
};

const SOURCES = [
    { title: 'Session notes, Oct 24', href: '#session-1024', type: 'Session' },
    { title: 'Ava Thompson', href: '#student-ava', type: 'Student' },
    { title: 'Attendance report', href: '#report-attendance', type: 'Report' },
    { title: 'Grade 7 · Math', href: '#class-g7', type: 'Class' },
    { title: 'Tutor handbook', href: 'https://example.com/handbook', type: 'Guide' },
];

/** What the answer read: title links with their type, folded past three. */
export const WithSources = {
    render: () => <AiMessage text="Ava attended 12 of 14 sessions this term, and her last two were in Grade 7 · Math." sources={SOURCES} />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const list = canvas.getByRole('list', { name: 'Sources' });
        await expect(within(list).getAllByRole('listitem')).toHaveLength(3);
        const toggle = canvas.getByRole('button', { name: 'Show 2 more sources' });
        await userEvent.click(toggle);
        await expect(within(list).getAllByRole('listitem')).toHaveLength(5);
        await expect(canvas.getByRole('button', { name: 'Show fewer sources' })).toHaveAttribute('aria-expanded', 'true');
    },
};
