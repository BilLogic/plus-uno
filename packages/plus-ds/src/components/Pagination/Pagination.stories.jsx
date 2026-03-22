import React, { useState } from 'react';
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
        type: {
            control: 'select',
            options: ['icon', 'text'],
            description: 'Pagination type: icon (chevrons) or text (Previous/Next)'
        },
        size: {
            control: 'select',
            options: ['small', 'default', 'large'],
            description: 'Pagination size'
        },
        currentPage: {
            control: 'number',
            description: 'Current active page'
        },
        totalPages: {
            control: 'number',
            description: 'Total number of pages'
        },
        maxVisible: {
            control: 'number',
            description: 'Maximum number of visible page numbers'
        }
    }
};

const Template = (args) => {
    const [page, setPage] = useState(args.currentPage);
    return <Pagination {...args} currentPage={page} onPageChange={setPage} />;
};

const paginationCanvas = { display: 'flex', flexDirection: 'column', gap: '32px', padding: '32px', backgroundColor: 'var(--color-surface-container-lowest, #f8f9fa)' };

function PaginationIconTypeDemos() {
    return (
        <section>
            <h5 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 600, color: 'var(--color-on-surface)' }}>Icon Type</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                    <h6 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 400, color: 'var(--color-on-surface)' }}>Small</h6>
                    <Pagination
                        currentPage={1}
                        totalPages={10}
                        type="icon"
                        size="small"
                        onPageChange={(p) => console.log('Page:', p)}
                    />
                </div>
                <div>
                    <h6 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 400, color: 'var(--color-on-surface)' }}>Medium (Default)</h6>
                    <Pagination
                        currentPage={1}
                        totalPages={10}
                        type="icon"
                        size="default"
                        onPageChange={(p) => console.log('Page:', p)}
                    />
                </div>
                <div>
                    <h6 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 400, color: 'var(--color-on-surface)' }}>Large</h6>
                    <Pagination
                        currentPage={1}
                        totalPages={10}
                        type="icon"
                        size="large"
                        onPageChange={(p) => console.log('Page:', p)}
                    />
                </div>
            </div>
        </section>
    );
}

function PaginationTextTypeDemos() {
    return (
        <section>
            <h5 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 600, color: 'var(--color-on-surface)' }}>Text Type</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                    <h6 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 400, color: 'var(--color-on-surface)' }}>Small</h6>
                    <Pagination
                        currentPage={1}
                        totalPages={10}
                        type="text"
                        size="small"
                        prevText="Previous"
                        nextText="Next"
                        onPageChange={(p) => console.log('Page:', p)}
                    />
                </div>
                <div>
                    <h6 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 400, color: 'var(--color-on-surface)' }}>Medium (Default)</h6>
                    <Pagination
                        currentPage={1}
                        totalPages={10}
                        type="text"
                        size="default"
                        prevText="Previous"
                        nextText="Next"
                        onPageChange={(p) => console.log('Page:', p)}
                    />
                </div>
                <div>
                    <h6 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 400, color: 'var(--color-on-surface)' }}>Large</h6>
                    <Pagination
                        currentPage={1}
                        totalPages={10}
                        type="text"
                        size="large"
                        prevText="Previous"
                        nextText="Next"
                        onPageChange={(p) => console.log('Page:', p)}
                    />
                </div>
            </div>
        </section>
    );
}

function PaginationStatesDemos() {
    return (
        <section>
            <h5 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 600, color: 'var(--color-on-surface)' }}>States</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                    <h6 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 400, color: 'var(--color-on-surface)' }}>First Page (Previous Disabled)</h6>
                    <Pagination
                        currentPage={1}
                        totalPages={10}
                        type="icon"
                        size="default"
                        onPageChange={(p) => console.log('Page:', p)}
                    />
                </div>
                <div>
                    <h6 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 400, color: 'var(--color-on-surface)' }}>Last Page (Next Disabled)</h6>
                    <Pagination
                        currentPage={10}
                        totalPages={10}
                        type="icon"
                        size="default"
                        onPageChange={(p) => console.log('Page:', p)}
                    />
                </div>
                <div>
                    <h6 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 400, color: 'var(--color-on-surface)' }}>Middle Page (Both Enabled)</h6>
                    <Pagination
                        currentPage={5}
                        totalPages={10}
                        type="icon"
                        size="default"
                        onPageChange={(p) => console.log('Page:', p)}
                    />
                </div>
            </div>
        </section>
    );
}

export const IconType = () => (
    <div style={paginationCanvas}>
        <PaginationIconTypeDemos />
    </div>
);

export const TextType = () => (
    <div style={paginationCanvas}>
        <PaginationTextTypeDemos />
    </div>
);

export const States = () => (
    <div style={paginationCanvas}>
        <PaginationStatesDemos />
    </div>
);

export const Overview = () => (
    <div style={paginationCanvas}>
        <PaginationIconTypeDemos />
        <PaginationTextTypeDemos />
        <PaginationStatesDemos />
    </div>
);

/**
 * Interactive - Full controls for testing all props
 */
export const Interactive = Template.bind({});
Interactive.args = {
    currentPage: 5,
    totalPages: 20,
    type: 'icon',
    size: 'default',
    maxVisible: 5
};
