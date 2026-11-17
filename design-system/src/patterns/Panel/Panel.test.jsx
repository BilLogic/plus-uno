import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ComponentExample } from '@/storybook-docs/ds-docs-layout.jsx';
import { TypeCard } from '@/storybook-docs/lib/template-page.jsx';
import { ReadingNoFooter, ReadingWithFooter } from './PanelCases.jsx';

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

describe('Panel live cases', () => {
    it('ReadingNoFooter renders header and body with no footer button', () => {
        render(<ReadingNoFooter />);
        expect(screen.getByRole('heading', { name: 'Ben Okafor · Thu 5:00 PM' })).toBeInTheDocument();
        expect(screen.getByText(/Math · 60 minutes/)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Done' })).toBeNull();
    });

    it('ReadingWithFooter shows the anti-pattern Done button in the footer while reading', () => {
        render(<ReadingWithFooter />);
        expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
    });

    it('links Panel TypeCard anchors to the matching ComponentExample ids', () => {
        const Stub = { render: () => <div /> };
        render(
            <div>
                <TypeCard of={Stub} to="#details" title="Details">Details</TypeCard>
                <TypeCard of={Stub} to="#notifications" title="Notifications">Notifications</TypeCard>
                <ComponentExample of={Stub} title="Details" description="Details" />
                <ComponentExample of={Stub} title="Notifications" description="Notifications" />
            </div>,
        );
        expect(screen.getByRole('link', { name: /Details/ })).toHaveAttribute('href', '#details');
        expect(screen.getByRole('link', { name: /Notifications/ })).toHaveAttribute('href', '#notifications');
        expect(within(document.body).getByRole('heading', { level: 3, name: 'Details' })).toHaveAttribute('id', 'details');
        expect(within(document.body).getByRole('heading', { level: 3, name: 'Notifications' })).toHaveAttribute('id', 'notifications');
    });
});
