import React from 'react';
import { Button, PageHeader, StaticTable } from '@/components';
import { Frame, Page } from '@/templates';

const ROWS = [
    { name: 'Jordan Blake', role: 'Tutor', status: 'Active' },
    { name: 'Casey Rivera', role: 'Coach', status: 'Invited' },
];

/**
 * ListPage: the registry's starter page. A Frame holding a Page whose
 * PageHeader is the h1, with the area's one action beside the title, over a
 * table. An area page has no breadcrumb; that trail appears only after drilling
 * into a record. Copy it, then replace the rows and the sidebar with the
 * product's own.
 */
const ListPage = ({ title = 'Members', rows = ROWS, sidebar, onAdd }) => (
    <Frame sidebar={sidebar}>
        <Page header={<PageHeader title={title} actions={<Button text="Add member" appearance="primary" onClick={onAdd} />} />}>
            <StaticTable
                headers={['Name', 'Role', 'Status']}
                rows={rows.map((row) => [row.name, row.role, row.status])}
                titleColumn={0}
            />
        </Page>
    </Frame>
);

export default ListPage;
