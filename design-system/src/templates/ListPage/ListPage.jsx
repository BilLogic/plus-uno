import React from 'react';
import { Breadcrumb, Button } from '@/components';
import { Frame, PatternSection, PatternTable } from '@/patterns';

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
            <PatternTable>
                <thead>
                    <tr>
                        <th className="body-small">Name</th>
                        <th className="body-small">Role</th>
                        <th className="body-small">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.name}>
                            <td className="body-large">{row.name}</td>
                            <td className="body-large">{row.role}</td>
                            <td className="body-large">{row.status}</td>
                        </tr>
                    ))}
                </tbody>
            </PatternTable>
        </PatternSection>
    </Frame>
);

export default ListPage;
