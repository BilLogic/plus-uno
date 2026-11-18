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
        <PatternSection level="page" title={title} actions={<Button text="Add member" appearance="primary" onClick={onAdd} />}>
            <PatternTable>
                <thead>
                    <tr>
                        <th className="body-sm">Name</th>
                        <th className="body-sm">Role</th>
                        <th className="body-sm">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.name}>
                            <td className="body-lg">{row.name}</td>
                            <td className="body-lg">{row.role}</td>
                            <td className="body-lg">{row.status}</td>
                        </tr>
                    ))}
                </tbody>
            </PatternTable>
        </PatternSection>
    </Frame>
);

export default ListPage;
