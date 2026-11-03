import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LinkButton from './LinkButton';
import LinkIconButton from '../LinkIconButton/LinkIconButton';

describe('LinkButton', () => {
    it('renders an anchor that looks like a button', () => {
        render(<LinkButton href="/sessions" text="Sessions" appearance="primary" />);
        const link = screen.getByRole('link', { name: 'Sessions' });
        expect(link).toHaveAttribute('href', '/sessions');
        expect(link).toHaveClass('plus-btn', 'plus-btn--primary');
    });

    it('adds rel when it opens a new tab', () => {
        render(<LinkButton href="https://example.com" target="_blank" text="Docs" />);
        expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute('rel', 'noopener noreferrer');
    });
});

describe('LinkIconButton', () => {
    it('renders an anchor named by its label', () => {
        render(<LinkIconButton href="/help" icon="circle-question" label="Help Center" />);
        const link = screen.getByRole('link', { name: 'Help Center' });
        expect(link).toHaveAttribute('href', '/help');
        expect(link).toHaveClass('plus-btn--icon-only');
    });
});
