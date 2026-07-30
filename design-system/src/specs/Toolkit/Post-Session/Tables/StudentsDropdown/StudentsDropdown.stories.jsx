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
    title: 'Specs/Toolkit/Post-Session/Tables/Students Dropdown',
    component: StudentsDropdown,
    parameters: { layout: 'padded' },
};

/** Empty field. */
export const Empty = {
    render: () => {
        const [ids, setIds] = useState([]);
        return <StudentsDropdown students={SAMPLE} selectedIds={ids} onChange={setIds} />;
    },
};

/** Filled with three students (Figma Fill=Filled). */
export const Filled = {
    render: () => {
        const [ids, setIds] = useState(['kiera', 'baxter', 'milo']);
        return <StudentsDropdown students={SAMPLE} selectedIds={ids} onChange={setIds} />;
    },
};
