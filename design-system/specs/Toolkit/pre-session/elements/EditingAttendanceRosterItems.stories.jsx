import React from 'react';
import Button from '../../../../../packages/plus-ds/src/components/Button/Button';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/Editing Attendance Roster Items',
    parameters: {
        layout: 'padded',
    },
};

const RosterItem = ({ name, isLead, removeState, isHovered }) => {
    // Container styles
    const containerStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '320px', // Fixed width for demo
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

    const badgeStyle = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 var(--size-element-pad-x-sm)', // 0 8px
        borderRadius: 'var(--size-element-radius-full)',
        backgroundColor: 'var(--color-info-state-08)',
        color: 'var(--color-info-text)',
        fontSize: '14px',
        lineHeight: '1.571',
    };

    return (
        <div style={containerStyle}>
            <div style={nameStyle}>
                <span className="body2-txt">{name}</span>
                {isLead && (
                    <div style={badgeStyle}>
                        <span>Lead</span>
                    </div>
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
