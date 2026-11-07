import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AiMessage, { TypingText } from '.';

afterEach(() => vi.useRealTimers());

describe('AiMessage', () => {
    it('is marked as AI by the small AI icon, named for assistive technology', () => {
        const { container } = render(<AiMessage text="Here is the plan." />);
        const icon = screen.getByRole('img', { name: 'AI' });
        expect(container.firstChild.firstChild).toBe(icon);
        expect(icon).toHaveClass('plus-ai-message__icon');
    });

    it('carries the AI icon while thinking too', () => {
        render(<AiMessage status="thinking" />);
        expect(screen.getByRole('img', { name: 'AI' })).toBeInTheDocument();
    });

    it('shows a finished message as plain text, not busy', () => {
        const { container } = render(<AiMessage text="Here is the plan." />);
        expect(screen.getByText('Here is the plan.')).toBeInTheDocument();
        expect(container.firstChild).not.toHaveAttribute('aria-busy');
        expect(container.querySelector('.plus-ai-message__caret')).toBeNull();
    });

    it('marks a streaming message busy with a caret after the last text', () => {
        const { container } = render(<AiMessage status="streaming" parts={[{ type: 'text', text: 'One' }, { type: 'text', text: 'Two' }]} />);
        expect(container.firstChild).toHaveAttribute('aria-busy', 'true');
        const texts = container.querySelectorAll('.plus-ai-message__text');
        expect(texts[0].querySelector('.plus-ai-message__caret')).toBeNull();
        expect(texts[1].querySelector('.plus-ai-message__caret')).not.toBeNull();
    });

    it('shows only the typing indicator while thinking', () => {
        render(<AiMessage status="thinking" text="hidden" />);
        expect(screen.getByRole('status', { name: 'AI is writing' })).toBeInTheDocument();
        expect(screen.queryByText('hidden')).toBeNull();
    });

    it('hands non-text parts to renderPart', () => {
        render(<AiMessage parts={[{ type: 'text', text: 'See:' }, { type: 'chart', id: 7 }]} renderPart={(p) => <i>chart {p.id}</i>} />);
        expect(screen.getByText('chart 7')).toBeInTheDocument();
    });
});

describe('TypingText', () => {
    it('types out one character per tick, then completes once', () => {
        vi.useFakeTimers();
        const done = vi.fn();
        const { container } = render(<TypingText text="abc" speed={10} onComplete={done} />);
        expect(container.textContent).toBe('');
        act(() => { vi.advanceTimersByTime(20); });
        expect(container.textContent).toBe('ab');
        act(() => { vi.advanceTimersByTime(40); });
        expect(container.textContent).toBe('abc');
        expect(done).toHaveBeenCalledTimes(1);
    });
});

describe('AiMessage sources', () => {
    const sources = [
        { title: 'Session notes, Oct 24', href: '/sessions/1024', type: 'Session' },
        { title: 'Ava Thompson', href: '/students/ava', type: 'Student' },
        { title: 'Attendance report', href: '/reports/attendance', type: 'Report' },
        { title: 'Grade 7 · Math', href: '/classes/g7', type: 'Class' },
        { title: 'Tutor handbook', href: 'https://example.com/handbook' },
    ];

    it('lists the sources under a finished answer as title links with their type', () => {
        render(<AiMessage text="Ava attended 12 sessions." sources={sources.slice(0, 2)} />);
        const list = screen.getByRole('list', { name: 'Sources' });
        const links = within(list).getAllByRole('link');
        expect(links.map((a) => a.getAttribute('href'))).toEqual(['/sessions/1024', '/students/ava']);
        expect(links[0]).toHaveTextContent('Session notes, Oct 24');
        expect(within(list).getByText('Session')).toBeInTheDocument();
    });

    it('shows three and collapses the rest behind a toggle', () => {
        render(<AiMessage text="Here is what I found." sources={sources} />);
        const list = screen.getByRole('list', { name: 'Sources' });
        expect(within(list).getAllByRole('listitem')).toHaveLength(3);
        const more = screen.getByRole('button', { name: 'Show 2 more sources' });
        expect(more).toHaveAttribute('aria-expanded', 'false');
        fireEvent.click(more);
        expect(within(list).getAllByRole('listitem')).toHaveLength(5);
        const fewer = screen.getByRole('button', { name: 'Show fewer sources' });
        expect(fewer).toHaveAttribute('aria-expanded', 'true');
    });

    it('has no toggle with three sources or fewer', () => {
        render(<AiMessage text="x" sources={sources.slice(0, 3)} />);
        expect(screen.queryByRole('button', { name: /sources/ })).toBeNull();
    });

    it('waits for the answer to finish before showing sources', () => {
        render(<AiMessage status="streaming" text="Ava" sources={sources} />);
        expect(screen.queryByRole('list', { name: 'Sources' })).toBeNull();
    });
});
