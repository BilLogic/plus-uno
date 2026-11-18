import React from 'react';
import { Breadcrumb, Button, StaticTable } from '@/components';
import { Frame, PatternSection } from '@/patterns';

const ROWS = [
    { name: 'Jordan Blake', role: 'Tutor', status: 'Active' },
    { name: 'Casey Rivera', role: 'Coach', status: 'Invited' },
];

/**
 * ListPage: the registry's starter page. A Frame with a breadcrumb, and one
 * Section whose header carries the title and the action over a table. Copy it,
 * then replace the rows and the sidebar with the product's own.
 */
const ListPage = ({ title = 'Members', rows = ROWS, sidebar, onAdd }) => (
    <Frame sidebar={sidebar} header={<Breadcrumb items={[{ text: 'Home', href: '/' }, { text: title }]} />}>
        <PatternSection level="page" title={title} actions={<Button text="Add member" appearance="primary" spacing="compact" onClick={onAdd} />}>
            <StaticTable
                headers={['Name', 'Role', 'Status']}
                rows={rows.map((row) => [row.name, row.role, row.status])}
                titleColumn={0}
            />
        </PatternSection>
    </Frame>
);

export default ListPage;
