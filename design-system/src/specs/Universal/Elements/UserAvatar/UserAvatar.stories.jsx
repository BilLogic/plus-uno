/**
 * User Avatar - Universal Element
 * 
 * User avatar with name, role indicator or notification counter, on the
 * design system's UserAvatar.
 */

import React from 'react';
import { expect, within } from 'storybook/test';
import { tokenLength } from '@/storybook-docs/lib/style-probes.js';
import UserAvatar from './UserAvatar';

const rect = (el) => el.getBoundingClientRect();
const token = (name) => tokenLength(document.body, name);

export default {
    title: 'Specs/Universal/Elements/User Avatar',
    component: UserAvatar,
    tags: ['!dev', '!autodocs'],
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
        size: {
            control: { type: 'radio' },
            options: ['md', 'lg'],
            table: { category: 'Design' }
        },
    }
};

/** `size="md"` is 32 high for the topbar; a lead tutor shows "Lead" in place of the counter. */
export const Medium32 = {
    render: () => (
        <div className="d-flex flex-column gap-3">
            <UserAvatar size="md" firstChar="J" name="John Doe" type="lead tutor" />
            <UserAvatar size="md" firstChar="R" name="Regular Tutor" counter counterValue={3} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const [lead, regular] = canvasElement.querySelectorAll('.plus-user-avatar');
        for (const avatar of [lead, regular]) {
            await expect(rect(avatar).height, '32 high').toBeCloseTo(token('--item-height-md'), 0);
            await expect(rect(avatar.querySelector('.plus-user-avatar__initial')).width, 'initial pill')
                .toBeCloseTo(token('--image-sm'), 0);
        }
        await expect(within(lead).getByText('Lead')).toBeVisible();
        await expect(lead.querySelector('.plus-user-avatar__counter'), 'no counter beside the role').toBeNull();
        await expect(within(regular).queryByText('Lead')).toBeNull();
        await expect(within(regular).getByText('3')).toBeVisible();
    },
};

/** At 32 a long name ends in an ellipsis at `--label-max-width`. */
export const LongName = {
    render: () => (
        <UserAvatar size="md" firstChar="M" name="Maximiliana Alexandra Constantinopoulou-Whitfield" type="lead tutor" />
    ),
    play: async ({ canvasElement }) => {
        const name = canvasElement.querySelector('.plus-user-avatar__name');
        await expect(rect(name).width).toBeLessThanOrEqual(token('--label-max-width') + 0.5);
        await expect(name.scrollWidth, 'the name is cut short').toBeGreaterThan(name.clientWidth);
        await expect(name).toHaveAttribute('title', 'Maximiliana Alexandra Constantinopoulou-Whitfield');
    },
};

/** The default `lg` row pads around a 32 pill, for tables. */
export const Large = {
    render: () => <UserAvatar firstChar="J" name="John Doe" counter={false} />,
    play: async ({ canvasElement }) => {
        const avatar = canvasElement.querySelector('.plus-user-avatar');
        await expect(avatar).toHaveClass('plus-user-avatar--lg');
        await expect(rect(avatar.querySelector('.plus-user-avatar__initial')).height).toBeCloseTo(token('--image-md'), 0);
        await expect(rect(avatar).height, 'taller than the 32 topbar size').toBeGreaterThan(token('--item-height-md'));
    },
};
