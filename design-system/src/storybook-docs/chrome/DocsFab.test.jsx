import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DocsFab, { MARKETPLACE_HREF, BLUEPRINT_HREF } from './DocsFab';

describe('DocsFab', () => {
    it('links Prototype Marketplace to Notion in a new tab', () => {
        render(<DocsFab />);
        const link = screen.getByRole('link', { name: 'Prototype Marketplace' });
        expect(link).toHaveAttribute('href', MARKETPLACE_HREF);
        expect(link.getAttribute('href')).toMatch(/^https:\/\/app\.notion\.com\//);
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
        expect(link).toHaveClass('plus-btn--circle');
    });

    it('links Uno Blueprint to /blueprint/ with its logo', () => {
        const { container } = render(<DocsFab />);
        const link = screen.getByRole('link', { name: 'Uno Blueprint' });
        expect(link).toHaveAttribute('href', BLUEPRINT_HREF);
        expect(BLUEPRINT_HREF).toBe('/blueprint/');
        expect(link).toHaveClass('plus-btn--circle');
        // The stack lives in the preview frame; Blueprint must replace the whole page.
        expect(link).toHaveAttribute('target', '_top');
        expect(container.querySelector('img')).toHaveAttribute('src', '/uno-bot/logos/uno-blueprint.png');
    });

    it('uses the default 32px spacing and the Tooltip in place of a native title', () => {
        render(<DocsFab />);
        for (const link of screen.getAllByRole('link')) {
            expect(link).not.toHaveClass('plus-btn--compact');
            expect(link).not.toHaveAttribute('title');
        }
    });

    it('stacks Marketplace above Blueprint with nothing above for the AI agent', () => {
        render(<DocsFab />);
        const names = screen.getAllByRole('link').map((l) => l.getAttribute('aria-label'));
        expect(names).toEqual(['Prototype Marketplace', 'Uno Blueprint']);
    });

    it('renders the aiAgent slot above Marketplace', () => {
        render(<DocsFab aiAgent={<button type="button">AI</button>} />);
        const nav = screen.getByRole('navigation', { name: 'Prototype links' });
        expect(nav.firstElementChild).toHaveTextContent('AI');
    });
});
