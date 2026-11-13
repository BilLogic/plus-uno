import React from 'react';

import pkg from '../../../../package.json';

/** One row per package PLUS builds on. `pkg` is the name in `package.json`, whose pin is the version shown; a row without one says where its version comes from. */
export const TECH_STACK = [
    { name: 'Base UI', pkg: '@base-ui/react', usedFor: 'Behavior of every interactive component', wrappedBy: 'Popup, Tooltip, Modal, Tabs, Checkbox, Radio, Toggle, Range, Accordion', id: 'tech-stack-base-ui' },
    { name: 'Font Awesome Free', version: '7.2.0 (stylesheet link in .storybook/preview-head.html)', usedFor: 'Icon glyphs', wrappedBy: 'Icon', id: 'tech-stack-font-awesome' },
    { name: 'Highcharts', pkg: 'highcharts', usedFor: 'Drawing the charts, on non-commercial terms', wrappedBy: 'The Data visualizations charts, through highcharts-react-official', id: 'tech-stack-highcharts' },
    { name: 'Motion', pkg: 'motion', usedFor: 'The interruptible spring for one component', wrappedBy: 'Flag', id: 'tech-stack-motion' },
    { name: 'Pragmatic drag and drop', pkg: '@atlaskit/pragmatic-drag-and-drop', usedFor: 'Drag and drop (ADR-046)', wrappedBy: 'No component yet', id: 'tech-stack-pragmatic-drag-and-drop' },
];

export const versionOf = (row) => row.version ?? pkg.dependencies[row.pkg];

export const TechStackTable = () => (
    <table className="sb-ds-doc-table">
        <thead>
            <tr>
                <th>Package</th>
                <th>Version</th>
                <th>Used for</th>
                <th>Wrapped by</th>
            </tr>
        </thead>
        <tbody>
            {TECH_STACK.map((row) => (
                <tr key={row.name}>
                    <td>
                        <a href={`?path=/docs/${row.id}--docs`}>{row.name}</a>
                    </td>
                    <td>{versionOf(row)}</td>
                    <td>{row.usedFor}</td>
                    <td>{row.wrappedBy}</td>
                </tr>
            ))}
        </tbody>
    </table>
);
