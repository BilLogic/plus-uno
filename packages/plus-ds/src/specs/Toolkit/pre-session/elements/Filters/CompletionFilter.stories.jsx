import React, { useState } from 'react';
import Dropdown from '../../../../../components/Dropdown/Dropdown';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/Completion Filter',
    component: Dropdown,
    tags: ['!autodocs'],
    parameters: {
        layout: 'padded',
    },
};

const completionOptions = [
    { text: 'Incomplete', value: 'incomplete' },
    { text: 'Completed', value: 'completed' },
    { text: 'Both', value: 'both' },
];

/**
 * Completion Filter Component
 * Dropdown for filtering by completion status
 * Uses semantic tokens:
 * - Dropdown: style="secondary", fill="outline", size="small"
 * - Gap: --size-element-gap-sm (when combined with other filters)
 */
export const CompletionFilter = ({
    initialSelection = 'Incomplete',
    options = completionOptions,
    interactive = true,
    isOpen
}) => {
    const [selected, setSelected] = useState(initialSelection);

    const dropdownItems = options.map(option => ({
        text: option.text,
        selected: selected === option.text,
        onClick: interactive ? () => {
            setSelected(option.text);
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
 * Shows visual states of the Completion Filter
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
            <CompletionFilter initialSelection="Incomplete" interactive={false} />
        </section>

        <section>
            <h6 className="h6 mb-3">Open State (Dropdown Menu)</h6>
            <div style={{ height: '180px' }}>
                <CompletionFilter initialSelection="Incomplete" interactive={false} isOpen={true} />
            </div>
        </section>

        <section>
            <h6 className="h6 mb-3">Different Selections</h6>
            <div style={{ display: 'flex', gap: 'var(--size-element-gap-lg)' }}>
                <div>
                    <p className="body3-txt mb-2" style={{ color: 'var(--color-on-surface-variant)' }}>Incomplete</p>
                    <CompletionFilter initialSelection="Incomplete" interactive={false} />
                </div>
                <div>
                    <p className="body3-txt mb-2" style={{ color: 'var(--color-on-surface-variant)' }}>Completed</p>
                    <CompletionFilter initialSelection="Completed" interactive={false} />
                </div>
                <div>
                    <p className="body3-txt mb-2" style={{ color: 'var(--color-on-surface-variant)' }}>Both</p>
                    <CompletionFilter initialSelection="Both" interactive={false} />
                </div>
            </div>
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
            Select a completion status from the dropdown.
        </p>
        <CompletionFilter />
    </div>
);
