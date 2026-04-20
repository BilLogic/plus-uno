/**
 * User Avatar - Universal Element
 * 
 * User avatar component with name and notification counter.
 */

import React from 'react';
import UserAvatar from './UserAvatar';

export default {
    title: 'Specs/Universal/Elements/UserAvatar',
    component: UserAvatar,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'User avatar component displaying user initial, name, and optional notification counter.'
            }
        }
    }
};

/**
 * Overview
 * Shows all user avatar types and states
 */
export const Overview = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>All User Types</h6>
                <div className="d-flex flex-column gap-3">
                    <UserAvatar firstChar="R" name="Regular Tutor" type="regular tutor" counter counterValue={3} />
                    <UserAvatar firstChar="L" name="Lead Tutor" type="lead tutor" counter counterValue={5} />
                    <UserAvatar firstChar="A" name="Admin User" type="admin" counter counterValue={1} />
                </div>
            </section>

            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>States</h6>
                <div className="d-flex flex-column gap-3">
                    <UserAvatar firstChar="J" name="Enabled State" state="enabled" counter counterValue={2} />
                    <UserAvatar firstChar="J" name="Hover State" state="hover" counter counterValue={2} />
                </div>
            </section>

            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Without Counter</h6>
                <UserAvatar firstChar="J" name="John Doe" counter={false} />
            </section>
        </div>
    )
};

/**
 * Interactive
 * Interactive playground with controls
 */
export const Interactive = {
    render: (args) => (
        <div className="p-4">
            <UserAvatar {...args} />
        </div>
    ),
    args: {
        firstChar: 'J',
        name: 'John Doe',
        counter: true,
        counterValue: 2,
        state: 'enabled',
        type: 'regular tutor',
    },
    argTypes: {
        firstChar: {
            control: 'text',
            table: { category: 'Content' }
        },
        name: {
            control: 'text',
            table: { category: 'Content' }
        },
        counter: {
            control: 'boolean',
            table: { category: 'Content' }
        },
        counterValue: {
            control: 'number',
            if: { arg: 'counter' },
            table: { category: 'Content' }
        },
        state: {
            control: { type: 'radio' },
            options: ['enabled', 'hover'],
            table: { category: 'State' }
        },
        type: {
            control: { type: 'select' },
            options: ['regular tutor', 'lead tutor', 'admin'],
            table: { category: 'Design' }
        },
    }
};
