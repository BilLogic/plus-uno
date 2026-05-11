import React, { useEffect, useState } from 'react';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import Pagination from './Pagination';

export default {
    title: 'Components/Pagination',
    component: Pagination,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: 'Pagination component for navigating through paginated content. Built on Bootstrap 4.6.2 with PLUS design token customizations. Pixel-accurate implementation matching Figma design exactly.'
            }
        }
    },
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        type: {
            control: 'select',
            options: ['icon', 'text'],
            description: 'Pagination type: icon (chevrons) or text (Previous/Next)',
            table: { category: 'Content' }
        },
        size: {
            control: 'select',
            options: ['small', 'default', 'large'],
            description: 'Pagination size',
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
        maxVisible: {
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

const paginationCanvas = { display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px', backgroundColor: 'var(--color-surface-container-lowest, #f8f9fa)' };
const contentVariantCard = {
    padding: '12px',
    border: '1px solid var(--color-outline-variant)',
    borderRadius: '12px',
    background: 'var(--color-surface-container-low)',
};

function PaginationContentDemos() {
    return (
        <>
            <section>
                <div style={contentVariantCard}>
                    <Pagination
                        currentPage={5}
                        totalPages={10}
                        type="icon"
                        size="default"
                        onPageChange={(p) => console.log('Page:', p)}
                    />
                </div>
            </section>
            <section style={{ marginTop: '24px' }}>
                <div style={contentVariantCard}>
                    <Pagination
                        currentPage={5}
                        totalPages={10}
                        type="text"
                        size="default"
                        prevText="Previous"
                        nextText="Next"
                        onPageChange={(p) => console.log('Page:', p)}
                    />
                </div>
            </section>
        </>
    );
}

function PaginationSizesDemos() {
    return (
        <>
            <section>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">ICON TYPE SIZES</span>
                <p className="body2-txt" style={{ marginBottom: '12px', color: 'var(--color-on-surface-variant)' }}>
                    Small, default, and large icon pagination.
                </p>
                <div style={contentVariantCard}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <Pagination currentPage={1} totalPages={10} type="icon" size="small" onPageChange={(p) => console.log('Page:', p)} />
                        <Pagination currentPage={1} totalPages={10} type="icon" size="default" onPageChange={(p) => console.log('Page:', p)} />
                        <Pagination currentPage={1} totalPages={10} type="icon" size="large" onPageChange={(p) => console.log('Page:', p)} />
                    </div>
                </div>
            </section>
            <section>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">TEXT TYPE SIZES</span>
                <p className="body2-txt" style={{ marginBottom: '12px', color: 'var(--color-on-surface-variant)' }}>
                    Small, default, and large text pagination with Previous/Next labels.
                </p>
                <div style={contentVariantCard}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <Pagination currentPage={1} totalPages={10} type="text" size="small" prevText="Previous" nextText="Next" onPageChange={(p) => console.log('Page:', p)} />
                        <Pagination currentPage={1} totalPages={10} type="text" size="default" prevText="Previous" nextText="Next" onPageChange={(p) => console.log('Page:', p)} />
                        <Pagination currentPage={1} totalPages={10} type="text" size="large" prevText="Previous" nextText="Next" onPageChange={(p) => console.log('Page:', p)} />
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
                <p className="body2-txt" style={{ marginBottom: '12px', color: 'var(--color-on-surface-variant)' }}>
                    Previous control is disabled at the first page.
                </p>
                <div style={contentVariantCard}>
                    <Pagination
                        currentPage={1}
                        totalPages={10}
                        type="icon"
                        size="default"
                        onPageChange={(p) => console.log('Page:', p)}
                    />
                </div>
            </section>
            <section>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">LAST PAGE</span>
                <p className="body2-txt" style={{ marginBottom: '12px', color: 'var(--color-on-surface-variant)' }}>
                    Next control is disabled at the last page.
                </p>
                <div style={contentVariantCard}>
                    <Pagination
                        currentPage={10}
                        totalPages={10}
                        type="icon"
                        size="default"
                        onPageChange={(p) => console.log('Page:', p)}
                    />
                </div>
            </section>
            <section>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">MIDDLE PAGE</span>
                <p className="body2-txt" style={{ marginBottom: '12px', color: 'var(--color-on-surface-variant)' }}>
                    Both previous and next controls are enabled.
                </p>
                <div style={contentVariantCard}>
                    <Pagination
                        currentPage={5}
                        totalPages={10}
                        type="icon"
                        size="default"
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

export const Sizes = () => (
    <div style={paginationCanvas}>
        <PaginationSizesDemos />
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
    type: 'icon',
    size: 'default',
    maxVisible: 5
};

export const Overview = Template.bind({});
Overview.args = { ...paginationPlaygroundArgs };
Overview.parameters = {
    docs: {
        source: { language: 'html', code: webAppSourceSnippets.pagination }
    }
};

/**
 * Interactive - Full controls for testing all props
 */
export const Interactive = Template.bind({});
Interactive.args = { ...paginationPlaygroundArgs };
