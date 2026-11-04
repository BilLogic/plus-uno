import React, { useEffect, useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import Pagination from './Pagination';

export default {
    title: 'Components/Navigation/Pagination',
    component: Pagination,
    tags: ['!dev', '!autodocs'],
    parameters: {
        changelog: [
            { date: '2026-11-04', kind: 'changed', summary: 'Pages and the Previous and Next controls are buttons, exposed as Pagination.Page and Pagination.Navigator, on named tokens. Spacing is default (32) or compact (24). The ellipsis is hidden from assistive technology and a disabled Navigator keeps its tab stop with aria-disabled.' },
            { date: '2026-10-24', kind: 'changed', summary: 'A pressed page is the secondary 12 step and the current page the 16. Keyboard focus is the 2px focus ring inside the page with no fill; a pointer focus draws none.' },
        ],
        docs: {
            description: {
                component: 'Pagination for moving through paginated content: a Navigator to each side of a window of Page parts, on named tokens. Pages are buttons; the current one carries aria-current.'
            }
        }
    },
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        navigator: {
            control: 'select',
            options: ['icon', 'text'],
            description: 'Previous and Next as a caret (icon) or as their labels (text)',
            table: { category: 'Content' }
        },
        spacing: {
            control: 'select',
            options: ['default', 'compact'],
            description: 'Row height: default is 32, compact is 24',
            table: { category: 'Design' }
        },
        currentPage: {
            control: 'number',
            description: 'Current active page',
            table: { category: 'Behavior' }
        },
        totalPages: {
            control: 'number',
            description: 'Total number of pages',
            table: { category: 'Content' }
        },
        max: {
            control: 'number',
            description: 'Maximum number of visible page numbers',
            table: { category: 'Layout' }
        },
        id: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' }
        }
    }
};

const Template = (args) => {
    const [page, setPage] = useState(args.currentPage);

    useEffect(() => {
        setPage(args.currentPage);
    }, [args.currentPage]);

    return <Pagination {...args} currentPage={page} onPageChange={setPage} />;
};

const paginationCanvas = { display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px', backgroundColor: 'var(--ds-surface)' };
const contentVariantCard = {
    padding: '12px',
    border: '1px solid var(--color-outline-variant)',
    borderRadius: '12px',
    background: 'var(--ds-surface-container)',
};

function PaginationContentDemos() {
    return (
        <>
            <section>
                <div style={contentVariantCard}>
                    <Pagination
                        currentPage={5}
                        totalPages={10}
                        navigator="icon"
                        spacing="default"
                        label="Icon pagination example"
                        onPageChange={(p) => console.log('Page:', p)}
                    />
                </div>
            </section>
            <section style={{ marginTop: '24px' }}>
                <div style={contentVariantCard}>
                    <Pagination
                        currentPage={5}
                        totalPages={10}
                        navigator="text"
                        spacing="default"
                        previousLabel="Previous"
                        nextLabel="Next"
                        label="Text pagination example"
                        onPageChange={(p) => console.log('Page:', p)}
                    />
                </div>
            </section>
        </>
    );
}

function PaginationSpacingDemos() {
    return (
        <>
            <section>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">ICON NAVIGATOR SPACINGS</span>
                <p className="body2-txt" style={{ marginBottom: '12px', color: 'var(--ds-text-subtle)' }}>
                    Default and compact icon pagination.
                </p>
                <div style={contentVariantCard}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <Pagination currentPage={1} totalPages={10} navigator="icon" spacing="compact" label="Icon pagination, compact" onPageChange={(p) => console.log('Page:', p)} />
                        <Pagination currentPage={1} totalPages={10} navigator="icon" spacing="default" label="Icon pagination, default spacing" onPageChange={(p) => console.log('Page:', p)} />
                    </div>
                </div>
            </section>
            <section>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">TEXT NAVIGATOR SPACINGS</span>
                <p className="body2-txt" style={{ marginBottom: '12px', color: 'var(--ds-text-subtle)' }}>
                    Default and compact text pagination with Previous and Next labels.
                </p>
                <div style={contentVariantCard}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <Pagination currentPage={1} totalPages={10} navigator="text" spacing="compact" previousLabel="Previous" nextLabel="Next" label="Text pagination, compact" onPageChange={(p) => console.log('Page:', p)} />
                        <Pagination currentPage={1} totalPages={10} navigator="text" spacing="default" previousLabel="Previous" nextLabel="Next" label="Text pagination, default spacing" onPageChange={(p) => console.log('Page:', p)} />
                    </div>
                </div>
            </section>
        </>
    );
}

function PaginationInteractionStatesDemos() {
    return (
        <>
            <section>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">FIRST PAGE</span>
                <p className="body2-txt" style={{ marginBottom: '12px', color: 'var(--ds-text-subtle)' }}>
                    Previous control is disabled at the first page.
                </p>
                <div style={contentVariantCard}>
                    <Pagination
                        currentPage={1}
                        totalPages={10}
                        navigator="icon"
                        spacing="default"
                        label="First page pagination example"
                        onPageChange={(p) => console.log('Page:', p)}
                    />
                </div>
            </section>
            <section>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">LAST PAGE</span>
                <p className="body2-txt" style={{ marginBottom: '12px', color: 'var(--ds-text-subtle)' }}>
                    Next control is disabled at the last page.
                </p>
                <div style={contentVariantCard}>
                    <Pagination
                        currentPage={10}
                        totalPages={10}
                        navigator="icon"
                        spacing="default"
                        label="Last page pagination example"
                        onPageChange={(p) => console.log('Page:', p)}
                    />
                </div>
            </section>
            <section>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">MIDDLE PAGE</span>
                <p className="body2-txt" style={{ marginBottom: '12px', color: 'var(--ds-text-subtle)' }}>
                    Both previous and next controls are enabled.
                </p>
                <div style={contentVariantCard}>
                    <Pagination
                        currentPage={5}
                        totalPages={10}
                        navigator="icon"
                        spacing="default"
                        label="Middle page pagination example"
                        onPageChange={(p) => console.log('Page:', p)}
                    />
                </div>
            </section>
        </>
    );
}

export const Content = () => (
    <div style={paginationCanvas}>
        <PaginationContentDemos />
    </div>
);

export const Spacing = () => (
    <div style={paginationCanvas}>
        <PaginationSpacingDemos />
    </div>
);

export const InteractionStates = () => (
    <div style={paginationCanvas}>
        <PaginationInteractionStatesDemos />
    </div>
);

const paginationPlaygroundArgs = {
    currentPage: 5,
    totalPages: 10,
    navigator: 'icon',
    spacing: 'default',
    max: 5
};

export const Overview = Template.bind({});
Overview.args = { ...paginationPlaygroundArgs };
Overview.parameters = {
    docs: {
        source: { language: 'jsx', code: webAppSourceSnippets.pagination }
    }
};

/**
 * Interactive - Full controls for testing all props
 */
export const Interactive = Template.bind({});
Interactive.args = { ...paginationPlaygroundArgs };

/**
 * The accessibility contract: every part is a named button, the current page
 * says so, a disabled Navigator keeps its tab stop and does nothing, and the
 * ellipsis is hidden from assistive technology.
 */
export const Accessibility = () => (
    <div style={paginationCanvas}>
        <Pagination currentPage={1} totalPages={12} label="Sessions pages" onPageChange={fn()} />
    </div>
);
Accessibility.args = {};
Accessibility.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole('navigation', { name: 'Sessions pages' });
    const current = within(nav).getByRole('button', { name: 'Page 1' });
    await expect(current).toHaveAttribute('aria-current', 'page');

    const previous = within(nav).getByRole('button', { name: 'Previous' });
    await expect(previous).toHaveAttribute('aria-disabled', 'true');
    await expect(nav.querySelector('.plus-pagination__gap').closest('li')).toHaveAttribute('aria-hidden', 'true');

    // Keyboard: Tab reaches the disabled Navigator, then Page 1; Enter moves on.
    await userEvent.tab();
    await expect(previous).toHaveFocus();
    await userEvent.tab();
    await expect(current).toHaveFocus();
    await userEvent.tab();
    const two = within(nav).getByRole('button', { name: 'Page 2' });
    await expect(two).toHaveFocus();
};
