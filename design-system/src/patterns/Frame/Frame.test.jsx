import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ComponentExample } from '@/storybook-docs/ds-docs-layout.jsx';
import { TypeCard } from '@/storybook-docs/lib/template-page.jsx';
import { BarInOrder, BarScrambled } from './FrameCases.jsx';

vi.mock('@storybook/addon-docs/blocks', async () => {
    const React = await import('react');
    return {
        Canvas: ({ children, of }) => (
            <div data-testid="mock-canvas">
                {of?.render ? <of.render /> : children}
            </div>
        ),
        Story: ({ of }) => (of?.render ? <of.render /> : null),
        Meta: () => null,
        Title: () => null,
    };
});

describe('Frame live cases', () => {
    it('BarInOrder renders Back and Next in FooterActions without Cancel', () => {
        render(<BarInOrder />);
        expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull();
    });

    it('BarScrambled renders the anti-pattern Cancel beside Back and Next', () => {
        render(<BarScrambled />);
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
    });

    it('links TypeCard anchors to the matching ComponentExample ids', () => {
        const Stub = { render: () => <div /> };
        render(
            <div>
                <TypeCard of={Stub} to="#default" title="Default">Default frame</TypeCard>
                <TypeCard of={Stub} to="#five-steps-down-the-left" title="Focused">Focused frame</TypeCard>
                <TypeCard of={Stub} to="#bare" title="Bare">Bare frame</TypeCard>
                <ComponentExample of={Stub} title="Default" description="Default" />
                <ComponentExample of={Stub} title="Five steps, down the left" description="Focused" />
                <ComponentExample of={Stub} title="Bare" description="Bare" />
            </div>,
        );

        const linkTo = (label) => screen.getByRole('link', { name: new RegExp(label) }).getAttribute('href');
        expect(linkTo('Default')).toBe('#default');
        expect(linkTo('Focused')).toBe('#five-steps-down-the-left');
        expect(linkTo('Bare')).toBe('#bare');

        const headings = screen.getAllByRole('heading', { level: 3 });
        expect(headings.map((h) => h.id)).toEqual(['default', 'five-steps-down-the-left', 'bare']);
        expect(within(document.body).getByRole('heading', { level: 3, name: 'Default' })).toHaveAttribute('id', 'default');
    });
});
