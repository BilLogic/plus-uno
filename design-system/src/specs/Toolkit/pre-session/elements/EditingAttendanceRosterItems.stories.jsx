import React from 'react';
import Button from '../../../../components/Button/Button';
import Badge from '../../../../components/Badge';

export default {
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
        padding: 'var(--size-element-pad-y-sm) var(--size-element-pad-x-sm)', // 4px 8px
        backgroundColor: isHovered ? 'var(--color-surface-container-highest)' : 'transparent',
        borderRadius: 'var(--size-element-radius-md)',
        cursor: 'default',
        // Ensure consistent height/vertical rhythm
        minHeight: '32px'
    };

    const nameStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--size-element-gap-sm)', // 8px
        flex: 1,
    };

    return (
        <div style={containerStyle}>
            <div style={nameStyle}>
                <span className="body2-txt">{name}</span>
                {isLead && (
                    <Badge text="Lead" style="info" size="b3" />
                )}
            </div>

            {(removeState === 'text' || removeState === 'button') && (
                <Button
                    text="Remove"
                    size="small"
                    style="danger"
                    fill={removeState === 'button' ? 'tonal' : 'ghost'}
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
