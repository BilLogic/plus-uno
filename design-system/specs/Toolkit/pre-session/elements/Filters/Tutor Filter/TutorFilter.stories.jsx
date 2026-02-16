import React, { useState } from 'react';
import Dropdown from '../../../../../../../packages/plus-ds/src/components/Dropdown/Dropdown';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/Tutor Filter',
    component: Dropdown,
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
    },
};

// Tutor options for the filter dropdown
const tutorItems = [
    { text: 'All tutors', selected: true },
    { text: 'Elijah Booker' },
    { text: 'Willow Klein' },
    { text: 'Elias Thorne' },
    { text: 'Brynn Barajas' },
];

/**
 * Reusable Tutor Filter Component
 * For use in pages and other compositions
 */
export const TutorFilter = ({ value = 'All tutors', onChange }) => {
    const items = [
        { text: 'All tutors', selected: value === 'All tutors', onClick: () => onChange?.('All tutors') },
        { text: 'Elijah Booker', selected: value === 'Elijah Booker', onClick: () => onChange?.('Elijah Booker') },
        { text: 'Willow Klein', selected: value === 'Willow Klein', onClick: () => onChange?.('Willow Klein') },
        { text: 'Elias Thorne', selected: value === 'Elias Thorne', onClick: () => onChange?.('Elias Thorne') },
        { text: 'Brynn Barajas', selected: value === 'Brynn Barajas', onClick: () => onChange?.('Brynn Barajas') },
    ];
    return (
        <Dropdown
            buttonText={value}
            items={items}
            size="small"
            fill="outline"
            style="secondary"
        />
    );
};

/**
 * Overview - All States
 * Shows all visual states of the Tutor Filter dropdown
 * 
 * Uses design system Dropdown component with:
 * - size="small" for compact filter button
 * - fill="outline" for outlined button style
 * - style="secondary" for secondary color
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
            <h6 className="h6 mb-3">Closed State (All Tutors)</h6>
            <p className="body3-txt mb-3" style={{ color: 'var(--color-on-surface-variant)' }}>
                The filter dropdown in its default closed state showing "All tutors".
            </p>
            <Dropdown
                buttonText="All tutors"
                items={tutorItems}
                size="small"
                fill="outline"
                style="secondary"
            />
        </section>

        <section>
            <h6 className="h6 mb-3">Open State</h6>
            <p className="body3-txt mb-3" style={{ color: 'var(--color-on-surface-variant)' }}>
                The filter dropdown in its open state showing the list of tutors.
            </p>
            <Dropdown
                buttonText="All tutors"
                items={tutorItems}
                size="small"
                fill="outline"
                style="secondary"
                isOpen={true}
            />
        </section>

        <section style={{ marginTop: 'var(--size-section-gap-xl)' }}>
            <h6 className="h6 mb-3">Specific Tutor Selected</h6>
            <p className="body3-txt mb-3" style={{ color: 'var(--color-on-surface-variant)' }}>
                The filter dropdown with a specific tutor selected.
            </p>
            <Dropdown
                buttonText="Elijah Booker"
                items={[
                    { text: 'All tutors' },
                    { text: 'Elijah Booker', selected: true },
                    { text: 'Willow Klein' },
                    { text: 'Elias Thorne' },
                    { text: 'Brynn Barajas' },
                ]}
                size="small"
                fill="outline"
                style="secondary"
            />
        </section>
    </div>
);

/**
 * Interactive Demo
 * Allows user to interact with the tutor filter
 */
export const Interactive = () => {
    const [selectedTutor, setSelectedTutor] = useState('All tutors');

    const handleSelect = (tutorName) => {
        setSelectedTutor(tutorName);
    };

    const interactiveItems = [
        { text: 'All tutors', selected: selectedTutor === 'All tutors', onClick: () => handleSelect('All tutors') },
        { text: 'Elijah Booker', selected: selectedTutor === 'Elijah Booker', onClick: () => handleSelect('Elijah Booker') },
        { text: 'Willow Klein', selected: selectedTutor === 'Willow Klein', onClick: () => handleSelect('Willow Klein') },
        { text: 'Elias Thorne', selected: selectedTutor === 'Elias Thorne', onClick: () => handleSelect('Elias Thorne') },
        { text: 'Brynn Barajas', selected: selectedTutor === 'Brynn Barajas', onClick: () => handleSelect('Brynn Barajas') },
    ];

    return (
        <div>
            <h6 className="h6 mb-3">Interactive Demo</h6>
            <p className="body2-txt mb-4">
                Use the dropdown to filter tutors. Click on a tutor name to select it.
            </p>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--size-ele-gap-md)'
                }}
            >
                <Dropdown
                    buttonText={selectedTutor}
                    items={interactiveItems}
                    size="small"
                    fill="outline"
                    style="secondary"
                />
                <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                    Currently filtering by: <strong style={{ color: 'var(--color-on-surface)' }}>
                        {selectedTutor}
                    </strong>
                </p>
            </div>
        </div>
    );
};
