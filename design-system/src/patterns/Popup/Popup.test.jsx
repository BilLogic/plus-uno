import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ComponentExample, exampleSlug } from '@/storybook-docs/ds-docs-layout.jsx';
import { TypeCard } from '@/storybook-docs/lib/template-page.jsx';
import {
    AsWideAsTrigger,
    AtCap,
    EndAligned,
    FieldsInModalCase,
    FormInPopupCase,
    NarrowerThanTrigger,
    OneFlatMenu,
    PopupBesidePopup,
    StartAlignedAtEnd,
    WiderThanCap,
} from './PopupCases.jsx';

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

const popupMdx = readFileSync(join(__dirname, 'Popup.mdx'), 'utf8');

describe('Popup live cases and docs links', () => {
    it('renders FieldsInModalCase with a Dialog and Discard/Save footer', () => {
        render(<FieldsInModalCase />);
        expect(screen.getByRole('heading', { name: 'Add session' })).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: 'Student' })).toHaveValue('Ana Ruiz');
        expect(screen.getByRole('button', { name: 'Discard' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });

    it('renders FormInPopupCase with an open Popup containing a field and Cancel/Save buttons', () => {
        render(<FormInPopupCase />);
        expect(screen.getByRole('textbox', { name: 'Student' })).toHaveValue('Ana Ruiz');
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });

    it('renders EndAligned and StartAlignedAtEnd as an open menu off the More trigger', async () => {
        for (const Case of [EndAligned, StartAlignedAtEnd]) {
            const { unmount } = render(<Case />);
            expect(screen.getByRole('button', { name: 'More' })).toBeInTheDocument();
            expect(await screen.findByRole('menuitem', { name: 'Reschedule' })).toBeInTheDocument();
            unmount();
        }
    });

    it('renders the width cases as an open Popup off a trigger', async () => {
        for (const Case of [AsWideAsTrigger, NarrowerThanTrigger, AtCap, WiderThanCap]) {
            const { unmount } = render(<Case />);
            expect(await screen.findByText(/Notes stay with the session/)).toBeInTheDocument();
            unmount();
        }
    });

    it('renders OneFlatMenu as one open menu', async () => {
        render(<OneFlatMenu />);
        expect(await screen.findByRole('menuitem', { name: 'Export notes' })).toBeInTheDocument();
    });

    it('renders PopupBesidePopup as an open menu with a second Popup open beside it', async () => {
        render(<PopupBesidePopup />);
        expect(await screen.findByRole('menuitem', { name: 'Reschedule' })).toBeInTheDocument();
        expect(await screen.findByText('Choose a format.')).toBeInTheDocument();
    });

    it('links TypeCard anchors to unique ComponentExample and heading ids in Popup.mdx', () => {
        const typeCards = [...popupMdx.matchAll(/<TypeCard\s+[^>]*to="#([^"]+)"[^>]*title="([^"]+)"/g)]
            .map(([, to, title]) => ({ to, title }));
        const exampleTitles = [...popupMdx.matchAll(/<ComponentExample\s+[^>]*title="([^"]+)"/g)]
            .map(([, title]) => title);
        const examplesTab = popupMdx.split('<DocsTab tab="examples">')[1].split('</DocsTab>')[0];
        const headingSlugs = [
            ...exampleTitles.map(exampleSlug),
            ...[...examplesTab.matchAll(new RegExp('^#{2,3}\\s+([^\\n<]+)', 'gm'))].map(([, h]) => exampleSlug(h)),
        ];

        expect(typeCards).toHaveLength(6);
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
            expect(screen.getByRole('link', { name: title })).toHaveAttribute('href', `#${to}`);
        }
        for (const title of exampleTitles) {
            expect(within(document.body).getByRole('heading', { level: 3, name: title })).toHaveAttribute('id', exampleSlug(title));
        }
    });
});
