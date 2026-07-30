import React, { useState } from 'react';
import OptionChip, { OptionChipGroup } from './OptionChip';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Post-Session/Elements/Option Chip',
    parameters: {
        layout: 'padded',
    },
};

/**
 * Single chip gallery — unselected vs selected.
 */
export const Overview = () => (
    <div style={{ display: 'flex', gap: 'var(--size-element-gap-sm)', flexWrap: 'wrap' }}>
        <OptionChip label="Clear Structure" selected={false} />
        <OptionChip label="Good Pacing" selected />
        <OptionChip label="Other" selected={false} disabled />
    </div>
);

/**
 * Interactive multi-select chip bank (What worked?).
 */
export const Interactive = () => {
    const [selectedIds, setSelectedIds] = useState(['good-pacing', 'smooth-tech']);
    const options = [
        { id: 'good-pacing', label: 'Good Pacing' },
        { id: 'smooth-tech', label: 'Smooth Tech' },
        { id: 'strong-rapport', label: 'Strong Student Rapport' },
        { id: 'clear-structure', label: 'Clear Structure' },
        { id: 'productive-setting', label: 'Productive Setting' },
        { id: 'effective-scaffolding', label: 'Effective Scaffolding' },
        { id: 'strong-teamwork', label: 'Strong Tutor Teamwork' },
        { id: 'other', label: 'Other' },
    ];

    /**
     * @param {string} id
     */
    const handleToggle = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
        );
    };

    return (
        <OptionChipGroup
            options={options}
            selectedIds={selectedIds}
            onToggle={handleToggle}
        />
    );
};
