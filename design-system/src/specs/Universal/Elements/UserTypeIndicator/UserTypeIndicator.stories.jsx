/**
 * UserTypeIndicator - Universal Element
 *
 * Role indicator pill for the current viewer.
 * Figma Spec: node-id=2370-191400
 */

import React from 'react';
import UserTypeIndicator from './UserTypeIndicator';

export default {
    title: 'Specs/Universal/Elements/User Type Indicator',
    component: UserTypeIndicator,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: `User-role pill with five variants. Each variant is themed with a Status tag appearance so colors, radius, and typography stay in sync with the design system.

| Type | Status tag appearance | Label |
|------|-------------|-------|
| lead tutor | info | Lead |
| regular tutor | info | Tutor |
| tutor supervisors | mastering-content | Super |
| system admin | relationship | Admin |
| type5 | neutral | Demo |`
            }
        }
    }
};

/**
 * Overview
 * Shows all five user-type variants stacked.
 */
export const Overview = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start' }}>
            <UserTypeIndicator type="lead tutor" />
            <UserTypeIndicator type="regular tutor" />
            <UserTypeIndicator type="tutor supervisors" />
            <UserTypeIndicator type="system admin" />
            <UserTypeIndicator type="type5" />
        </div>
    )
};

/**
 * Interactive
 * Pick a user type and spacing inline.
 */
export const Interactive = {
    render: (args) => <UserTypeIndicator {...args} />,
    args: {
        type: 'lead tutor',
        spacing: 'default',
    },
    argTypes: {
        type: {
            control: { type: 'select' },
            options: ['lead tutor', 'regular tutor', 'tutor supervisors', 'system admin', 'type5'],
            table: { category: 'Design' }
        },
        spacing: {
            control: { type: 'select' },
            options: ['default', 'compact', 'spacious'],
            table: { category: 'Design' }
        }
    }
};
