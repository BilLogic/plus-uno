import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ComponentExample, exampleSlug } from '@/storybook-docs/ds-docs-layout.jsx';
import { TypeCard } from '@/storybook-docs/lib/template-page.jsx';
import { DoDontPair } from '@/storybook-docs/ds-docs-layout.jsx';
import { CODE as PAGE_CODE } from './PageCaseCode.js';
import { CODE as POPUP_CODE } from '../Popup/PopupCaseCode.js';
import { CODE as FORM_CODE } from '../Form/FormCaseCode.js';
import { CODE as PANEL_CODE } from '../Panel/PanelCaseCode.js';
import * as PageModule from './Page.jsx';
import Page from './Page.jsx';
import {
    AddInTitleRow,
    AddTwice,
    AreaPageTitleAlone,
    BreadcrumbOnAreaPage,
    HeaderIsTheH1,
    OneLineDescription,
    OneTabSystem,
    ParagraphUnderTitle,
    SectionsAsTitles,
    TwoTabSystems,
} from './PageCases.jsx';

vi.mock('@storybook/addon-docs/blocks', async () => {
    const React = await import('react');
    return {
        Canvas: ({ children, of }) => (
            <div data-testid="mock-canvas">
                {of?.render ? <of.render /> : children}
            </div>
        ),
        Story: ({ of }) => (of?.render ? <of.render /> : null),
        Source: ({ code }) => <pre>{code}</pre>,
        Meta: () => null,
        Title: () => null,
    };
});

const pageMdx = readFileSync(join(__dirname, 'Page.mdx'), 'utf8');

describe('Page live cases', () => {
    it('AddInTitleRow puts Add student once in the title row, while AddTwice duplicates it in PageHeader', () => {
        const r1 = render(<AddInTitleRow />);
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

    it('HeaderIsTheH1 renders a page header and one Section, while SectionsAsTitles has two Sections and no header', () => {
        const r1 = render(<HeaderIsTheH1 />);
        expect(document.querySelectorAll('.plus-page-header')).toHaveLength(1);
        expect(screen.getByRole('heading', { name: 'Students' })).toBeInTheDocument();
        r1.unmount();

        const r2 = render(<SectionsAsTitles />);
        expect(document.querySelectorAll('.plus-page-header')).toHaveLength(0);
        expect(screen.getAllByRole('heading', { name: /^(Students|Sessions)$/ })).toHaveLength(2);
        r2.unmount();
    });

    it('AreaPageTitleAlone has no breadcrumb, while BreadcrumbOnAreaPage adds one', () => {
        const r1 = render(<AreaPageTitleAlone />);
        expect(screen.queryByRole('navigation', { name: 'Breadcrumb' })).toBeNull();
        r1.unmount();

        render(<BreadcrumbOnAreaPage />);
        expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    });

    it('OneLineDescription keeps one short line under the title, while ParagraphUnderTitle runs long', () => {
        const r1 = render(<OneLineDescription />);
        const short = document.querySelector('[data-part="description"]').textContent;
        r1.unmount();

        render(<ParagraphUnderTitle />);
        const long = document.querySelector('[data-part="description"]').textContent;
        expect(short.length).toBeLessThan(80);
        expect(long.length).toBeGreaterThan(160);
    });

    it('TwoTabSystems shows the anti-pattern of two tablists on one page', () => {
        render(<TwoTabSystems />);
        expect(screen.getAllByRole('tablist')).toHaveLength(2);
    });

    it('links Page TypeCard anchors to unique ComponentExample and heading ids in Page.mdx', () => {
        const typeCards = [...pageMdx.matchAll(/<TypeCard\s+[^>]*to="#([^"]+)"[^>]*title="([^"]+)"/g)]
            .map(([, to, title]) => ({ to, title }));
        const exampleTitles = [...pageMdx.matchAll(/<ComponentExample\s+[^>]*title="([^"]+)"/g)]
            .map(([, title]) => title);
        const examplesTab = pageMdx.split('<DocsTab tab="examples">')[1].split('</DocsTab>')[0];
        const headingSlugs = [
            ...exampleTitles.map(exampleSlug),
            ...[...examplesTab.matchAll(new RegExp('^#{2,3}\\s+([^\\n<]+)', 'gm'))].map(([, h]) => exampleSlug(h)),
        ];

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

describe('Show code on live pairs', () => {
    it('every live pair folds its source behind Show code, and each page passes code for every example it makes live', () => {
        render(<DoDontPair doExample={<i />} doCaption="Do" doCode="<a />" dontExample={<i />} dontCaption="Don't" dontCode="<b />" />);
        expect(screen.getAllByText('Show code')).toHaveLength(2);
        const counts = { Page: Object.keys(PAGE_CODE).length, Popup: Object.keys(POPUP_CODE).length, Form: Object.keys(FORM_CODE).length, Panel: Object.keys(PANEL_CODE).length };
        expect(counts).toEqual({ Page: 6, Popup: 8, Form: 2, Panel: 6 });
        [PAGE_CODE, POPUP_CODE, FORM_CODE, PANEL_CODE].forEach((code) => Object.values(code).forEach((src) => expect(src.length).toBeGreaterThan(20)));
    });
});

describe('Page surface', () => {
    it('renders one surface without level, padding, radius, or border modifiers or exports', () => {
        expect(PageModule.PAGE_LEVELS).toBeUndefined();
        expect(PageModule.PAGE_EDGE).toBeUndefined();
        expect(Page.propTypes.level).toBeUndefined();
        expect(Page.propTypes.padding).toBeUndefined();
        expect(Page.propTypes.radius).toBeUndefined();
        expect(Page.propTypes.border).toBeUndefined();

        const { container } = render(
            <Page title="Sessions">
                <p>Body</p>
            </Page>,
        );
        const root = container.firstElementChild;
        expect(root).toHaveClass('plus-template-page');
        expect(root.className).toBe('plus-template-page');
        expect(screen.getByRole('heading', { level: 1, name: 'Sessions' })).toBeInTheDocument();
        expect(screen.getByText('Body')).toBeInTheDocument();
    });
});

describe('Page reference screens', () => {
    const referenceSource = readFileSync(join(__dirname, 'ReferenceScreens.stories.jsx'), 'utf8');

    it('keeps the reference screens out of the sidebar, so Templates/Page is one entry', () => {
        const meta = referenceSource.slice(referenceSource.indexOf('export default'), referenceSource.indexOf('};', referenceSource.indexOf('export default')));
        expect(meta).toContain("'!dev'");
    });

    it('shows both reference screens on the Page docs', () => {
        expect(pageMdx).toContain("import * as ReferenceScreenStories from './ReferenceScreens.stories.jsx'");
        expect(pageMdx).toContain('of={ReferenceScreenStories.ListWithFilters}');
        expect(pageMdx).toContain('of={ReferenceScreenStories.DetailWithPanel}');
    });
});

describe('Page docs match the code', () => {
    const pageScss = readFileSync(join(__dirname, 'Page.scss'), 'utf8');
    const headerScss = readFileSync(join(__dirname, '../../components/layout-and-structure/PageHeader/PageHeader.scss'), 'utf8');
    const sizesTable = pageMdx.split('## Sizes')[1].split('</DocsTable>')[0];

    it('shows the three types live, by Frame width', () => {
        ['TypeDefault', 'TypeFullWidth', 'TypeReading'].forEach((name) => {
            expect(pageMdx).toContain(`<TypeCard of={PageStories.${name}}`);
            expect(pageMdx).toContain(`<ComponentExample of={PageStories.${name}}`);
        });
        expect(pageMdx).not.toMatch(/Two types/);
    });

    it('has no levels section: the Page has one fill and no shadow', () => {
        expect(pageMdx).not.toMatch(/^## Levels/m);
        expect(pageScss).toMatch(/box-shadow:\s*none/);
    });

    it('names in the Sizes table only spacing tokens the styles use', () => {
        const named = [...sizesTable.matchAll(/<code>(--(?:page|stack|section)[a-z-]*)<\/code>/g)].map(([, token]) => token);
        expect(named.length).toBeGreaterThan(0);
        named.forEach((token) => expect(pageScss + headerScss, token).toContain(`var(${token})`));
    });

    it('prints Show code that uses only the public PageHeader, not a docs-only helper', () => {
        Object.entries(PAGE_CODE).forEach(([name, code]) => {
            expect(code, name).not.toContain('DemoPageHeader');
            expect(code, name).not.toMatch(/<PageHeader[^>]*\sdescription=/);
        });
    });
});
