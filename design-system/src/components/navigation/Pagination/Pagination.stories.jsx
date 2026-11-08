import React, { useEffect, useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { expectGroundUnder } from '@/storybook-docs/lib/label-states.js';
import { expectInk, expectInsetRing } from '@/storybook-docs/lib/navigation-states.js';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import Pagination from './Pagination';

export default {
    title: 'Components/Navigation/Pagination',
    component: Pagination,
    tags: ['!dev', '!autodocs'],
    parameters: {
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

const paginationCanvas = { display: 'flex', flexDirection: 'column', gap: 'var(--card-stack-md)', padding: 'var(--card-stack-md)', backgroundColor: 'var(--ds-surface)' };
const contentVariantCard = {
    padding: 'var(--pad-x-md)',
    border: 'var(--border-default) solid var(--ds-border)',
    borderRadius: 'var(--radius-lg)',
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
            <section style={{ marginTop: 'var(--card-stack-md)' }}>
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
                <span className="uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">ICON NAVIGATOR SPACINGS</span>
                <p className="body-default" style={{ marginBottom: 'var(--stack-lg)', color: 'var(--ds-text-subtle)' }}>
                    Default and compact icon pagination.
                </p>
                <div style={contentVariantCard}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pad-x-lg)' }}>
                        <Pagination currentPage={1} totalPages={10} navigator="icon" spacing="compact" label="Icon pagination, compact" onPageChange={(p) => console.log('Page:', p)} />
                        <Pagination currentPage={1} totalPages={10} navigator="icon" spacing="default" label="Icon pagination, default spacing" onPageChange={(p) => console.log('Page:', p)} />
                    </div>
                </div>
            </section>
            <section>
                <span className="uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">TEXT NAVIGATOR SPACINGS</span>
                <p className="body-default" style={{ marginBottom: 'var(--stack-lg)', color: 'var(--ds-text-subtle)' }}>
                    Default and compact text pagination with Previous and Next labels.
                </p>
                <div style={contentVariantCard}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pad-x-lg)' }}>
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
                <span className="uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">FIRST PAGE</span>
                <p className="body-default" style={{ marginBottom: 'var(--stack-lg)', color: 'var(--ds-text-subtle)' }}>
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
                <span className="uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">LAST PAGE</span>
                <p className="body-default" style={{ marginBottom: 'var(--stack-lg)', color: 'var(--ds-text-subtle)' }}>
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
                <span className="uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">MIDDLE PAGE</span>
                <p className="body-default" style={{ marginBottom: 'var(--stack-lg)', color: 'var(--ds-text-subtle)' }}>
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

/* ------------------------------------------------------------------- states */

const onDisabledChange = fn();
const StatePages = () => <Pagination currentPage={1} totalPages={8} label="State pages" onPageChange={onDisabledChange} />;
const pageOf = (canvasElement, name) => within(canvasElement).getByRole('button', { name });

/** Rest: pages in subtle ink on the surface; the current page is named by aria-current. */
export const Rest = {
    render: () => <StatePages />,
    play: async ({ canvasElement }) => {
        const two = pageOf(canvasElement, 'Page 2');
        await expectInk(canvasElement, two, undefined, '--ds-text-subtle', 'page');
        await expectGroundUnder(canvasElement, two, undefined, '--ds-surface', 'page');
        await expect(pageOf(canvasElement, 'Page 1')).toHaveAttribute('aria-current', 'page');
    },
};

/** Hovered: the subtle neutral hovered fill on a page and an enabled Navigator. */
export const Hovered = {
    render: () => <StatePages />,
    play: async ({ canvasElement }) => {
        await expectGroundUnder(canvasElement, pageOf(canvasElement, 'Page 2'), ':hover', '--ds-background-neutral-subtle-hovered', 'page');
        await expectGroundUnder(canvasElement, pageOf(canvasElement, 'Next'), ':hover', '--ds-background-neutral-subtle-hovered', 'Next');
    },
};

/** Pressed: the subtle neutral pressed fill. */
export const Pressed = {
    render: () => <StatePages />,
    play: async ({ canvasElement }) => {
        await expectGroundUnder(canvasElement, pageOf(canvasElement, 'Page 2'), ':active', '--ds-background-neutral-subtle-pressed', 'page');
        await expectGroundUnder(canvasElement, pageOf(canvasElement, 'Next'), ':active', '--ds-background-neutral-subtle-pressed', 'Next');
    },
};

/** Focused: the 2px ring inside the segment, so a neighbor never covers it. */
export const Focused = {
    render: () => <StatePages />,
    play: async ({ canvasElement }) => {
        await expectInsetRing(canvasElement, pageOf(canvasElement, 'Page 2'), 'page');
        await expectInsetRing(canvasElement, pageOf(canvasElement, 'Next'), 'Next');
    },
};

/** Current: the selected fill and ink, semibold, and no hover step of its own. */
export const Current = {
    render: () => <StatePages />,
    play: async ({ canvasElement }) => {
        const one = pageOf(canvasElement, 'Page 1');
        await expectGroundUnder(canvasElement, one, undefined, '--ds-background-selected', 'current page');
        await expectInk(canvasElement, one, undefined, '--ds-text-selected', 'current page');
        await expect(getComputedStyle(one).fontWeight).toBe('600');
        await expectGroundUnder(canvasElement, one, ':hover', '--ds-background-selected', 'hovered current page');
    },
};

/** Disabled: Previous on the first page keeps its tab stop, takes the disabled ground and ink, and does nothing. */
export const Disabled = {
    render: () => <StatePages />,
    play: async ({ canvasElement }) => {
        const previous = pageOf(canvasElement, 'Previous');
        await expect(previous).toHaveAttribute('aria-disabled', 'true');
        await expectGroundUnder(canvasElement, previous, undefined, '--ds-background-disabled', 'Previous');
        await expectInk(canvasElement, previous, undefined, '--ds-text-disabled', 'Previous');
        await expect(getComputedStyle(previous).pointerEvents, 'a pointer never reaches it').toBe('none');
        previous.focus();
        onDisabledChange.mockClear();
        await userEvent.keyboard('{Enter}');
        await expect(onDisabledChange, 'a disabled Previous does nothing').not.toHaveBeenCalled();
    },
};
