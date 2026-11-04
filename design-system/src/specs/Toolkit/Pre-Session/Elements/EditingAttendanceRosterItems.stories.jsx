import React from 'react';
import Button from '@/components/forms-and-inputs/Button/Button';
import StatusTag from '@/components/labels/StatusTag';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Pre-Session/Elements/Editing Attendance Roster Items',
    parameters: {
        layout: 'padded',
    },
};

export const RosterItem = ({ name, isLead, removeState, isHovered }) => {
    // Container styles
    const containerStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: 'var(--space-025) var(--pad-x-sm)', // 4px 8px
        backgroundColor: isHovered ? 'var(--ds-background-neutral-subtle-hovered)' : 'transparent',
        borderRadius: 'var(--radius-md)',
        cursor: 'default',
        // Ensure consistent height/vertical rhythm
        minHeight: '32px'
    };

    const nameStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--stack-md)', // 8px
        flex: 1,
    };

    return (
        <div style={containerStyle}>
            <div style={nameStyle}>
                <span className="body2-txt">{name}</span>
                {isLead && (
                    <StatusTag appearance="info">Lead</StatusTag>
                )}
            </div>

            {(removeState === 'text' || removeState === 'button') && (
                <Button
                    text="Remove"
                    spacing="compact"
                    appearance="subtle" isSelected={removeState === 'button'}
                    onClick={() => console.log('Remove clicked')}
                />
            )}
        </div>
    );
};

// Single Overview Story to show all states
export const Overview = () => (
    <div className="d-flex flex-column" style={{ gap: 'var(--size-section-gap-lg)', padding: 'var(--size-section-pad-y-sm)' }}>
        <h6 className="h6 mb-3">Roster Item States</h6>

        {/* State 1: Default */}
        <RosterItem name="Ben Green" />

        {/* State 2: Hover */}
        <RosterItem
            name="Ben Green"
            isHovered={true}
            removeState="text"
        />

        {/* State 3: Lead (Default) */}
        <RosterItem
            name="Ben Green"
            isLead={true}
        />

        {/* State 4: Lead (Hover) */}
        <RosterItem
            name="Ben Green"
            isLead={true}
            isHovered={true}
            removeState="text"
        />

        {/* State 5: Remove Button (Default) */}
        <RosterItem
            name="Ben Green"
            removeState="button"
        />

        {/* State 6: Remove Button (Hover) */}
        <RosterItem
            name="Ben Green"
            isHovered={true}
            removeState="button"
        />
    </div>
);

// Prop Types for Storybook controls
Overview.args = {};
Overview.parameters = {
    controls: { hideNoControlsWarning: true },
};
