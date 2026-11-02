import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import PromptStarters from '.';

const starters = [
    { id: 'plan', label: 'Plan a session', text: 'Plan a 30 minute session on fractions for a 4th grader.' },
    { id: 'recap', label: 'Recap last session' },
];

describe('PromptStarters', () => {
    it('is a named group of prompt suggestions', () => {
        render(<PromptStarters label="Suggested prompts" starters={starters} />);
        const group = screen.getByRole('group', { name: 'Suggested prompts' });
        expect(group.querySelectorAll('button')).toHaveLength(2);
        expect(screen.getByRole('button', { name: 'Plan a session, suggested' })).toBeInTheDocument();
    });

    it('hands the pressed starter to onSelect, and does nothing else', async () => {
        const onSelect = vi.fn();
        render(<PromptStarters label="Suggested prompts" starters={starters} onSelect={onSelect} />);
        await userEvent.click(screen.getByRole('button', { name: 'Plan a session, suggested' }));
        expect(onSelect).toHaveBeenCalledExactlyOnceWith(starters[0]);
    });

    it('renders nothing when there are no starters', () => {
        const { container } = render(<PromptStarters label="Suggested prompts" starters={[]} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('keeps its own role and name when a caller passes others', () => {
        render(<PromptStarters label="Suggested prompts" starters={starters} role="list" aria-label="Other" />);
        expect(screen.getByRole('group', { name: 'Suggested prompts' })).toBeInTheDocument();
    });
});
