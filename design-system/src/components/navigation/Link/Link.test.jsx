import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Link from './Link';

describe('Link', () => {
    it('renders an anchor with the given href', () => {
        render(<Link href="/plan">Plan</Link>);
        expect(screen.getByRole('link', { name: 'Plan' })).toHaveAttribute('href', '/plan');
    });

    it('opens in a new tab when isOpenInNewWindow is set, with a safe rel', () => {
        render(<Link href="https://example.com" isOpenInNewWindow>External</Link>);
        const link = screen.getByRole('link', { name: /External/ });
        expect(link).toHaveAttribute('target', '_blank');
        expect(link.getAttribute('rel')).toContain('noopener');
    });

    it('lets a caller override target and rel', () => {
        render(<Link href="/x" target="_self" rel="author">X</Link>);
        const link = screen.getByRole('link', { name: 'X' });
        expect(link).toHaveAttribute('target', '_self');
        expect(link).toHaveAttribute('rel', 'author');
    });
});
