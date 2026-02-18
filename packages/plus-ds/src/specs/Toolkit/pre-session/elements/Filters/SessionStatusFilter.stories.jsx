import React, { useState } from 'react';
import Dropdown from '../../../../../components/Dropdown/Dropdown';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/Session Status Filter',
    component: Dropdown,
    tags: ['!autodocs'],
    parameters: {
        layout: 'padded',
    },
};

const defaultStatuses = [
    { text: 'All status', value: 'all', counter: 20 },
    { text: 'In progress', value: 'in-progress', counter: 20 },
    { text: 'Starting soon', value: 'starting-soon', counter: 20 },
    { text: 'Scheduled', value: 'scheduled', counter: 20 },
    { text: 'Cancelled', value: 'cancelled', counter: 20 },
    { text: 'Completed', value: 'completed', counter: 20 },
];

/**
 * Session Status Filter Component
 * Dropdown for filtering by session status
 * Uses semantic tokens:
 * - Dropdown: style="secondary", fill="outline", size="small"
 * - Counter badges shown beside each option
 * - Gap: --size-element-gap-sm (when combined with other filters)
 */
export const SessionStatusFilter = ({
    initialSelection = 'All status',
    statuses = defaultStatuses,
    interactive = true,
    isOpen,
    showCounts = true
}) => {
    const [selected, setSelected] = useState(initialSelection);

    const dropdownItems = statuses.map(status => ({
        text: status.text,
        counter: showCounts ? status.counter : undefined,
        selected: selected === status.text,
        onClick: interactive ? () => {
            setSelected(status.text);
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
 * Shows visual states of the Session Status Filter
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
            <SessionStatusFilter initialSelection="All status" interactive={false} />
        </section>

        <section>
            <h6 className="h6 mb-3">Open State (Dropdown Menu with Counts)</h6>
            <div style={{ height: '280px' }}>
                <SessionStatusFilter initialSelection="All status" interactive={false} isOpen={true} />
            </div>
        </section>

        <section>
            <h6 className="h6 mb-3">Selected Status - In Progress</h6>
            <SessionStatusFilter initialSelection="In progress" interactive={false} />
        </section>

        <section>
            <h6 className="h6 mb-3">Selected Status - Completed</h6>
            <SessionStatusFilter initialSelection="Completed" interactive={false} />
        </section>

        <section>
            <h6 className="h6 mb-3">Selected Status - Cancelled</h6>
            <SessionStatusFilter initialSelection="Cancelled" interactive={false} />
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
            Select a session status from the dropdown to filter sessions.
        </p>
        <SessionStatusFilter />
    </div>
);
