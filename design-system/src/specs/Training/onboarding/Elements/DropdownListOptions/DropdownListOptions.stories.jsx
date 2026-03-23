/**
 * DropdownListOptions - Training Onboarding Element
 * 
 * Dropdown menu with sorting options: name, duration, progress.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=74-121962
 */

import React from 'react';
import DropdownListOptions from './DropdownListOptions';
import './DropdownListOptions.scss';

export default {
    title: 'Specs/Training/Onboarding/Elements/DropdownListOptions',
    component: DropdownListOptions,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Dropdown menu with sorting options: name, duration, progress. Each type shows different sorting criteria and order options. Used in sorting controls for onboarding module lists.'
            }
        }
    },
    argTypes: {
        type: {
            control: { type: 'select' },
            options: ['name', 'duration', 'progress'],
            description: 'Dropdown type determines available order options',
            table: { category: 'Content' }
        },
        onSortChange: {
            action: 'sortChanged',
            table: { category: 'Events' }
        },
        onOrderChange: {
            action: 'orderChanged',
            table: { category: 'Events' }
        }
    }
};

/**
 * Docs
 * Documentation overview of the component
 */
export const Docs = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg, 24px)' }}>
            <h3 className="h3" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>DropdownListOptions</h3>
            <p className="body1-txt" style={{ marginBottom: 'var(--size-section-gap-md, 24px)' }}>
                Dropdown menu showing sorting options. The type prop determines which order options are shown.
            </p>
            <h4 className="h4" style={{ marginBottom: 'var(--size-element-gap-md, 8px)' }}>Types & Order Options</h4>
            <ul className="body2-txt">
                <li><strong>name</strong>: A-Z, Z-A</li>
                <li><strong>duration</strong>: Shortest First, Longest Last</li>
                <li><strong>progress</strong>: Completed First, Completed Last</li>
            </ul>
        </div>
    )
};

/**
 * Overview
 * Shows all dropdown list variants matching Figma design
 */
export const Overview = {
    render: () => (
        <div style={{ 
            padding: 'var(--size-section-pad-y-lg, 24px)',
            backgroundColor: 'var(--color-surface)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-section-gap-md, 24px)'
        }}>
            <section>
                <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>All Types</h6>
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'row', 
                    gap: 'var(--size-section-gap-lg, 32px)',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span className="body3-txt" style={{ fontWeight: '600' }}>Name Sorting</span>
                        <DropdownListOptions type="name" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span className="body3-txt" style={{ fontWeight: '600' }}>Duration Sorting</span>
                        <DropdownListOptions type="duration" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span className="body3-txt" style={{ fontWeight: '600' }}>Progress Sorting</span>
                        <DropdownListOptions type="progress" />
                    </div>
                </div>
            </section>
        </div>
    )
};

/**
 * Interactive
 * Interactive playground with controls
 */
export const Interactive = {
    args: {
        type: 'name'
    },
    render: (args) => (
        <div style={{ 
            padding: 'var(--size-section-pad-y-lg, 24px)', 
            backgroundColor: 'var(--color-surface)' 
        }}>
            <DropdownListOptions {...args} />
        </div>
    )
};
