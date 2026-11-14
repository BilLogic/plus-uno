import React from 'react';
import { DocsTable } from '@/storybook-docs/ds-docs-layout.jsx';

import pkg from '../../../../package.json';

/** One row per package PLUS builds on. `pkg` is the name in `package.json`, whose pin is the version shown; a row without one says where its version comes from. */
export const TECH_STACK = [
    { name: 'Base UI', pkg: '@base-ui/react', usedFor: 'Headless behavior for interactive components', wrappedBy: 'Popup, Tooltip, Modal, Tabs, Checkbox, Radio, Radio group, Choice grid, Toggle, Range, Rating, Accordion, Dropdown menu, Fieldset, Spotlight', id: 'tech-stack-base-ui' },
    { name: 'Font Awesome Free', version: '7.2.0', usedFor: 'Icon glyphs', wrappedBy: 'Icon', id: 'tech-stack-font-awesome' },
    { name: 'Highcharts', pkg: 'highcharts', usedFor: 'Chart rendering (non-commercial license)', wrappedBy: 'Data visualizations chart components, via highcharts-react-official', id: 'tech-stack-highcharts' },
    { name: 'Motion', pkg: 'motion', usedFor: 'Interruptible spring presence and height transitions', wrappedBy: 'Flag, Accordion, TreeSelect, TreeTable', id: 'tech-stack-motion' },
    { name: 'Pragmatic drag and drop', pkg: '@atlaskit/pragmatic-drag-and-drop', usedFor: 'Drag and drop', wrappedBy: 'No component yet' },
];

export const versionOf = (row) => row.version ?? pkg.dependencies[row.pkg];

export const TechStackTable = () => (
    <DocsTable>
        <thead>
            <tr>
                <th scope="col">Package</th>
                <th scope="col">Version</th>
                <th scope="col">Used for</th>
                <th scope="col">Wrapped by</th>
            </tr>
        </thead>
        <tbody>
            {TECH_STACK.map((row) => (
                <tr key={row.name}>
                    <td>
                        {row.id ? <a href={`?path=/docs/${row.id}--docs`}>{row.name}</a> : row.name}
                    </td>
                    <td>{versionOf(row)}</td>
                    <td>{row.usedFor}</td>
                    <td>{row.wrappedBy}</td>
                </tr>
            ))}
        </tbody>
    </DocsTable>
);
