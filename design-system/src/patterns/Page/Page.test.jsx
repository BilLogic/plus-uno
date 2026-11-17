import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ComponentExample } from '@/storybook-docs/ds-docs-layout.jsx';
import { TypeCard } from '@/storybook-docs/lib/template-page.jsx';
import { AddInViewBar, AddTwice, OneTabSystem, TwoTabSystems } from './PageCases.jsx';

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

describe('Page live cases', () => {
    it('AddInViewBar puts Add student once in the view bar, while AddTwice duplicates it in PageHeader', () => {
        const r1 = render(<AddInViewBar />);
        expect(screen.getAllByRole('button', { name: 'Add student' })).toHaveLength(1);
        r1.unmount();

        const r2 = render(<AddTwice />);
        expect(screen.getAllByRole('button', { name: 'Add student' })).toHaveLength(2);
        r2.unmount();
    });

    it('OneTabSystem uses one tablist and switches Status via PopupSelect and page tabs', () => {
        render(<OneTabSystem />);
        expect(screen.getAllByRole('tablist')).toHaveLength(1);
        expect(screen.getByRole('button', { name: 'Status: Upcoming' })).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Status: Upcoming' }));
        fireEvent.click(screen.getByRole('option', { name: 'Past' }));
        expect(screen.getByRole('button', { name: 'Status: Past' })).toBeInTheDocument();
        expect(screen.getByRole('cell', { name: 'Two-step equations' })).toBeInTheDocument();

        fireEvent.click(screen.getByRole('tab', { name: 'Overview' }));
        expect(screen.getByText('Lincoln Middle · Grade 8')).toBeInTheDocument();
    });

    it('TwoTabSystems shows the anti-pattern of two tablists on one page', () => {
        render(<TwoTabSystems />);
        expect(screen.getAllByRole('tablist')).toHaveLength(2);
    });

    it('links Page TypeCard anchors to the matching ComponentExample ids', () => {
        const Stub = { render: () => <div /> };
        render(
            <div>
                <TypeCard of={Stub} to="#default" title="Default">Default</TypeCard>
                <TypeCard of={Stub} to="#full-width" title="Full width">Full width</TypeCard>
                <ComponentExample of={Stub} title="Default" description="Default" />
                <ComponentExample of={Stub} title="Full width" description="Full width" />
            </div>,
        );
        expect(screen.getByRole('link', { name: /Default/ })).toHaveAttribute('href', '#default');
        expect(screen.getByRole('link', { name: /Full width/ })).toHaveAttribute('href', '#full-width');
        expect(within(document.body).getByRole('heading', { level: 3, name: 'Default' })).toHaveAttribute('id', 'default');
        expect(within(document.body).getByRole('heading', { level: 3, name: 'Full width' })).toHaveAttribute('id', 'full-width');
    });
});
