import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AgentAvatar from '.';

describe('AgentAvatar', () => {
    it('is one image with the label as its name', () => {
        render(<AgentAvatar label="PLUS AI" />);
        expect(screen.getByRole('img', { name: 'PLUS AI' })).toBeInTheDocument();
    });

    it('shows the sparkles glyph, hidden from assistive technology, when there is no picture', () => {
        const { container } = render(<AgentAvatar label="PLUS AI" />);
        expect(container.querySelector('.fa-wand-magic-sparkles')).toHaveAttribute('aria-hidden', 'true');
    });

    it('shows the picture when it loads, and the glyph when it fails', () => {
        const { container } = render(<AgentAvatar label="PLUS AI" src="agent.png" />);
        const img = container.querySelector('img');
        expect(img).toHaveAttribute('alt', '');
        expect(container.querySelector('.fa-wand-magic-sparkles')).toBeNull();
        fireEvent.error(img);
        expect(container.querySelector('img')).toBeNull();
        expect(container.querySelector('.fa-wand-magic-sparkles')).not.toBeNull();
    });

    it('gives a new picture a new chance after a failure', () => {
        const { container, rerender } = render(<AgentAvatar label="PLUS AI" src="a.png" />);
        fireEvent.error(container.querySelector('img'));
        rerender(<AgentAvatar label="PLUS AI" src="b.png" />);
        expect(container.querySelector('img')).toHaveAttribute('src', 'b.png');
    });

    it('carries its size class and falls back to 32', () => {
        const { container, rerender } = render(<AgentAvatar label="A" size={48} />);
        expect(container.firstChild).toHaveClass('plus-agent-avatar--48');
        rerender(<AgentAvatar label="A" size={20} />);
        expect(container.firstChild).toHaveClass('plus-agent-avatar--32');
    });

    it('keeps its own role and name when a caller passes others', () => {
        render(<AgentAvatar label="PLUS AI" role="presentation" aria-label="Other" />);
        expect(screen.getByRole('img', { name: 'PLUS AI' })).toBeInTheDocument();
    });
});
