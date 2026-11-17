import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ComponentExample, exampleSlug } from '@/storybook-docs/ds-docs-layout.jsx';
import { TypeCard } from '@/storybook-docs/lib/template-page.jsx';
import {
    ModalFooterFullBleedCase,
    ModalFooterInsetCase,
    OnePrimaryCase,
    PageButtonsFarRightCase,
    PageButtonsLeftCase,
    TwoPrimariesCase,
} from './commonActionsDemo.jsx';

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

const commonActionsMdx = readFileSync(join(__dirname, 'CommonActions.mdx'), 'utf8');

describe('CommonActions live cases and links', () => {
    it('OnePrimaryCase renders one primary button and one default button', () => {
        render(<OnePrimaryCase />);
        expect(screen.getByRole('button', { name: 'Save session' }).className).toContain('primary');
        expect(screen.getByRole('button', { name: 'Save draft' }).className).toContain('default');
    });

    it('TwoPrimariesCase renders two competing primary buttons', () => {
        render(<TwoPrimariesCase />);
        expect(screen.getByRole('button', { name: 'Save session' }).className).toContain('primary');
        expect(screen.getByRole('button', { name: 'Save draft' }).className).toContain('primary');
    });

    it('PageButtonsLeftCase and PageButtonsFarRightCase render live page form controls', () => {
        const { unmount } = render(<PageButtonsLeftCase />);
        expect(screen.getByRole('textbox', { name: 'Student' })).toHaveValue('Ana Ruiz');
        expect(screen.getByRole('button', { name: 'Save session' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Cancel' }).className).toContain('subtle');
        unmount();

        render(<PageButtonsFarRightCase />);
        expect(screen.getByRole('textbox', { name: 'Site' })).toHaveValue('Lincoln Middle');
    });

    it('ModalFooterFullBleedCase and ModalFooterInsetCase render live PatternModal footers', () => {
        const { unmount } = render(<ModalFooterFullBleedCase />);
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Save session' })).toBeInTheDocument();
        unmount();

        render(<ModalFooterInsetCase />);
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Discard' })).toBeInTheDocument();
    });

    it('links every TypeCard anchor to a unique ComponentExample heading id in CommonActions.mdx', () => {
        const typeCards = [...commonActionsMdx.matchAll(/<TypeCard\s+[^>]*to="#([^"]+)"[^>]*title="([^"]+)"/g)]
            .map(([, to, title]) => ({ to, title }));
        const exampleTitles = [...commonActionsMdx.matchAll(/<ComponentExample\s+[^>]*title="([^"]+)"/g)]
            .map(([, title]) => title);
        const examplesTab = commonActionsMdx.split('<DocsTab tab="examples">')[1].split('</DocsTab>')[0];
        const headingSlugs = [
            ...exampleTitles.map(exampleSlug),
            ...[...examplesTab.matchAll(/^#{2,3}\s+([^\r\n<]+)/gm)].map(([, h]) => exampleSlug(h)),
        ];

        expect(typeCards).toHaveLength(7);
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
            const exact = new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
            expect(screen.getByRole('link', { name: exact })).toHaveAttribute('href', `#${to}`);
        }
        for (const title of exampleTitles) {
            expect(within(document.body).getByRole('heading', { level: 3, name: title })).toHaveAttribute('id', exampleSlug(title));
        }
    });
});
