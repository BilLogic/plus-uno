import React, { useState } from 'react';
import Dropdown from '../../../../../../packages/plus-ds/src/components/Dropdown/Dropdown';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/Site Filter',
    component: Dropdown,
    tags: ['!autodocs'],
    parameters: {
        layout: 'padded',
    },
};

const defaultSchools = [
    { text: 'All schools', value: 'all' },
    { text: 'School #1', value: 'school_1' },
    { text: 'School #2', value: 'school_2' },
    { text: 'School #3', value: 'school_3' },
    { text: 'School #4', value: 'school_4' },
];

/**
 * Site Filter Component
 * Dropdown for filtering by school/site
 * Uses semantic tokens:
 * - Dropdown: style="secondary", fill="outline", size="default"
 * - Gap: --size-element-gap-sm (when combined with other filters)
 */
export const SiteFilter = ({
    initialSelection = 'All schools',
    schools = defaultSchools,
    interactive = true,
    isOpen
}) => {
    const [selected, setSelected] = useState(initialSelection);

    const dropdownItems = schools.map(school => ({
        text: school.text,
        selected: selected === school.text,
        onClick: interactive ? () => {
            setSelected(school.text);
        } : undefined
    }));

    return (
        <Dropdown
            buttonText={selected}
            items={dropdownItems}
            style="secondary"
            fill="outline"
            size="small"
            isOpen={isOpen}
        />
    );
};

/**
 * Overview - All States
 * Shows visual states of the Site Filter
 */
export const Overview = () => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-section-gap-lg)'
        }}
    >
        <section>
            <h6 className="h6 mb-3">Default State (Closed)</h6>
            <SiteFilter initialSelection="All schools" interactive={false} />
        </section>

        <section>
            <h6 className="h6 mb-3">Open State (Dropdown Menu)</h6>
            <div style={{ height: '220px' }}>
                <SiteFilter initialSelection="All schools" interactive={false} isOpen={true} />
            </div>
        </section>

        <section>
            <h6 className="h6 mb-3">Selected School</h6>
            <SiteFilter initialSelection="School #2" interactive={false} />
        </section>
    </div>
);

/**
 * Interactive Demo
 * Allows user to interact with the filter
 */
export const Interactive = () => (
    <div>
        <h6 className="h6 mb-3">Interactive Demo</h6>
        <p className="body2-txt mb-4">
            Select a school from the dropdown.
        </p>
        <SiteFilter />
    </div>
);
