import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ComponentExample, exampleSlug } from '@/storybook-docs/ds-docs-layout.jsx';
import { TypeCard } from '@/storybook-docs/lib/template-page.jsx';
import { EditInModal, EditInPanel, OneColumnFields, TwoColumnFields } from './FormCases.jsx';

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

const formMdx = readFileSync(join(__dirname, 'Form.mdx'), 'utf8');

describe('Form live cases', () => {
    it('EditInPanel keeps the rows beside the edit, while EditInModal covers them with a Blanket', () => {
        const r1 = render(<EditInPanel />);
        expect(screen.getByRole('heading', { name: 'Ana Ruiz' })).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: /Student/ })).toHaveValue('Ana Ruiz');
        expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
        expect(screen.getByText('Sessions')).toBeInTheDocument();
        expect(document.querySelector('.plus-template-blanket')).toBeNull();
        r1.unmount();

        render(<EditInModal />);
        expect(screen.getByRole('textbox', { name: /Student/ })).toHaveValue('Ana Ruiz');
        expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
        expect(document.querySelector('.plus-template-blanket')).not.toBeNull();
    });

    it('OneColumnFields renders Session fields in one column with date and time paired', () => {
        render(<OneColumnFields />);
        expect(screen.getByRole('textbox', { name: /Student/ })).toHaveValue('Ana Ruiz');
        expect(screen.getByRole('textbox', { name: /Session date/ })).toHaveValue('Thu, Oct 24');
        expect(screen.getByRole('textbox', { name: /Start time/ })).toHaveValue('4:00 PM');
    });

    it('TwoColumnFields renders unrelated fields across two columns', () => {
        render(<TwoColumnFields />);
        expect(screen.getByRole('textbox', { name: /Student/ })).toHaveValue('Ana Ruiz');
        expect(screen.getByRole('textbox', { name: /Subject/ })).toHaveValue('Algebra B');
        expect(screen.getByRole('textbox', { name: /Notes/ })).toHaveValue('Worked through fractions');
    });

    it('links TypeCard anchors to unique ComponentExample and heading ids in Form.mdx', () => {
        const typeCards = [...formMdx.matchAll(/<TypeCard\s+[^>]*to="#([^"]+)"[^>]*title="([^"]+)"/g)]
            .map(([, to, title]) => ({ to, title }));
        const exampleTitles = [...formMdx.matchAll(/<ComponentExample\s+[^>]*title="([^"]+)"/g)]
            .map(([, title]) => title);
        const examplesTab = formMdx.split('<DocsTab tab="examples">')[1].split('</DocsTab>')[0];
        const headingSlugs = [
            ...exampleTitles.map(exampleSlug),
            ...[...examplesTab.matchAll(new RegExp('^#{2,3}\\s+([^\\n<]+)', 'gm'))].map(([, h]) => exampleSlug(h)),
        ];

        expect(typeCards).toHaveLength(4);
        expect(new Set(headingSlugs).size).toBe(headingSlugs.length);
        typeCards.forEach(({ to }) => expect(headingSlugs).toContain(to));

        const Stub = { render: () => <div /> };
        render(
            <div>
                {typeCards.map(({ to, title }) => (
                    <TypeCard key={title} of={Stub} to={`#${to}`} title={title}>{title}</TypeCard>
                ))}
                {exampleTitles.map((title) => (
                    <ComponentExample key={title} of={Stub} title={title} description={title} />
                ))}
            </div>,
        );

        for (const { to, title } of typeCards) {
            expect(screen.getByRole('link', { name: new RegExp(title) })).toHaveAttribute('href', `#${to}`);
        }
        for (const title of exampleTitles) {
            expect(within(document.body).getByRole('heading', { level: 3, name: title })).toHaveAttribute('id', exampleSlug(title));
        }
    });
});
