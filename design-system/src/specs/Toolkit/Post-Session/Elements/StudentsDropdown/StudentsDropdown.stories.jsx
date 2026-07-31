import React, { useState } from 'react';
import StudentsDropdown from './StudentsDropdown';

const SAMPLE = [
    { id: 'kiera', name: 'Kiera Wintervale' },
    { id: 'baxter', name: 'Baxter Ellington' },
    { id: 'milo', name: 'Milo Thorne' },
    { id: 'jose', name: 'Jose Garcia' },
    { id: 'myles', name: 'Myles Washington' },
    { id: 'michael', name: 'Michael Barcia' },
];

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Post-Session/Elements/Students Dropdown',
    parameters: { layout: 'padded' },
};

/**
 * Single docs canvas — Empty / Filled / Open are interactive in one story (no subpages).
 */
export const Overview = {
    render: function StudentsDropdownOverview() {
        const [ids, setIds] = useState(['kiera', 'baxter', 'milo']);
        return (
            <div style={{ maxWidth: '480px', minHeight: '280px' }}>
                <StudentsDropdown students={SAMPLE} selectedIds={ids} onChange={setIds} />
            </div>
        );
    },
};
