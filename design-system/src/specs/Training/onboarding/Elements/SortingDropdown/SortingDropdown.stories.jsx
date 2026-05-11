/**
 * SortingDropdown - Training Onboarding Element
 * 
 * Dropdown button with open/closed states for sorting.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=74-121969
 */

import React, { useState } from 'react';
import SortingDropdown from './SortingDropdown';
import './SortingDropdown.scss';
import '../DropdownListOptions/DropdownListOptions.scss';

export default {
    title: 'Specs/Training/Onboarding/Elements/SortingDropdown',
    component: SortingDropdown,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Dropdown button with open/closed states for sorting. When clicked, shows the DropdownListOptions menu. Includes click-outside handling to close the dropdown.'
            }
        }
    },
    argTypes: {
        isOpen: {
            control: 'boolean',
            description: 'Whether dropdown is open',
            table: { category: 'State' }
        },
        sortType: {
            control: { type: 'select' },
            options: ['name', 'duration', 'progress'],
            description: 'Sort type',
            table: { category: 'Content' }
        },
        label: {
            control: 'text',
            description: 'Button label',
            table: { category: 'Content' }
        },
        onToggle: {
            action: 'toggled',
            table: { category: 'Events' }
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
 * Overview
 * Shows both closed and open states matching Figma design
 */
export const Overview = {
    render: () => (
        <div style={{ 
            padding: 'var(--size-section-pad-y-lg, 24px)',
            backgroundColor: 'var(--color-surface)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-section-gap-lg, 32px)',
            minHeight: '400px'
        }}>
            <section>
                <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>Closed State</h6>
                <SortingDropdown isOpen={false} label="Name" sortType="name" />
            </section>

            <section>
                <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>Open State</h6>
                <SortingDropdown isOpen={true} label="Name" sortType="name" onToggle={() => {}} />
            </section>
        </div>
    )
};

/**
 * Interactive
 * Interactive playground with controls
 */
export const Interactive = {
    render: (args) => {
        const [isOpen, setIsOpen] = useState(args.isOpen);
        const [sortType, setSortType] = useState(args.sortType);
        const [label, setLabel] = useState(args.label);

        const handleSortChange = (newSort) => {
            setSortType(newSort);
            setLabel(newSort.charAt(0).toUpperCase() + newSort.slice(1));
        };

        return (
            <div style={{ 
                padding: 'var(--size-section-pad-y-lg, 24px)', 
                backgroundColor: 'var(--color-surface)',
                minHeight: '350px'
            }}>
                <SortingDropdown 
                    isOpen={isOpen}
                    sortType={sortType}
                    label={label}
                    onToggle={setIsOpen}
                    onSortChange={handleSortChange}
                />
            </div>
        );
    },
    args: {
        isOpen: false,
        sortType: 'name',
        label: 'Name'
    }
};
