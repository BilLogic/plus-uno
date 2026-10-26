import React from 'react';
import { DocsTable } from './ds-docs-layout.jsx';

/**
 * A comparison table for docs pages: a head row and body rows, each cell a
 * string or a node. Markdown pipe tables do not parse in this MDX setup, so
 * pages pass their rows here.
 *
 * @param {string[]} head - column names
 * @param {React.ReactNode[][]} rows - one array of cells per row
 */
export function SpecTable({ head, rows }) {
    return (
        <DocsTable>
            <thead>
                <tr>
                    {head.map((label) => <th key={label}>{label}</th>)}
                </tr>
            </thead>
            <tbody>
                {rows.map((row, i) => (
                    <tr key={i}>
                        {row.map((cell, j) => <td key={j}>{cell}</td>)}
                    </tr>
                ))}
            </tbody>
        </DocsTable>
    );
}

/** Inline code for a table cell: a token, a prop or a value. */
export const C = ({ children }) => <code>{children}</code>;
