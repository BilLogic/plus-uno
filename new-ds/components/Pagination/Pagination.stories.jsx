import React, { useState } from 'react';
import Pagination from './Pagination';

export default {
    title: 'Components/Pagination',
    component: Pagination,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Pagination component for navigating through paginated content. Built on Bootstrap 4.6.2 with PLUS design token customizations.'
            }
        }
    },
    argTypes: {
        type: {
            control: 'select',
            options: ['icon', 'text'],
            description: 'Pagination type'
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
        }
    }
};

const Template = (args) => {
    const [page, setPage] = useState(args.currentPage);
    return <Pagination {...args} currentPage={page} onPageChange={setPage} />;
};

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <section>
            <h5>Icon Type (Default)</h5>
            <Pagination
                currentPage={5}
                totalPages={10}
                type="icon"
                onPageChange={(p) => console.log('Page:', p)}
            />
        </section>

        <section>
            <h5>Text Type</h5>
            <Pagination
                currentPage={5}
                totalPages={10}
                type="text"
                prevText="Previous"
                nextText="Next"
                onPageChange={(p) => console.log('Page:', p)}
            />
        </section>

        <section>
            <h5>Sizes</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Pagination
                    currentPage={3}
                    totalPages={5}
                    size="small"
                />
                <Pagination
                    currentPage={3}
                    totalPages={5}
                    size="default"
                />
                <Pagination
                    currentPage={3}
                    totalPages={5}
                    size="large"
                />
            </div>
        </section>

        <section>
            <h5>States (First/Last Disabled)</h5>
            <Pagination
                currentPage={1}
                totalPages={5}
                type="icon"
            />
            <br />
            <Pagination
                currentPage={5}
                totalPages={5}
                type="icon"
            />
        </section>
    </div>
);

export const Interactive = Template.bind({});
Interactive.args = {
    currentPage: 5,
    totalPages: 20,
    type: 'icon',
    size: 'default',
    maxVisible: 5
};
