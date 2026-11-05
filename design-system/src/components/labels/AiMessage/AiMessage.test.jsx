import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AiMessage, { TypingText } from '.';

afterEach(() => vi.useRealTimers());

describe('AiMessage', () => {
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
