/**
 * Sidebar Tab - Universal Element
 * 
 * Sidebar navigation tab with states for universal organisms.
 */

import React from 'react';
import SidebarTab from '../../../../components/SidebarTab/SidebarTab';

export default {
    title: 'Specs/Universal/Elements/SidebarTab',
    component: SidebarTab,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Sidebar navigation tab component for universal navigation patterns.'
            }
        }
    }
};

/**
 * Overview
 * Shows all sidebar tab states and configurations
 */
export const Overview = {
    render: () => {
        const states = ['enabled', 'hover', 'selected', 'disabled', 'focus'];
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '300px' }}>
                <section>
                    <h6 className="h6" style={{ marginBottom: '16px' }}>All States</h6>
                    <div className="d-flex flex-column gap-2">
                        {states.map((state) => (
                            <SidebarTab
                                key={state}
                                text={`${state.charAt(0).toUpperCase() + state.slice(1)} State`}
                                icon="icons"
                                state={state}
                                leadingVisual={true}
                            />
                        ))}
                    </div>
                </section>

                <section>
                    <h6 className="h6" style={{ marginBottom: '16px' }}>With Trailing Visual</h6>
                    <SidebarTab
                        text="With Both Icons"
                        icon="home"
                        state="enabled"
                        leadingVisual={true}
                        trailingVisual={true}
                    />
                </section>
            </div>
        );
    }
};

/**
 * Interactive
 * Interactive playground with controls
 */
export const Interactive = {
    render: (args) => (
        <div className="p-4" style={{ backgroundColor: 'var(--color-surface)', maxWidth: '300px' }}>
            <SidebarTab {...args} />
        </div>
    ),
    args: {
        text: 'Tab Title',
        icon: 'icons',
        state: 'enabled',
        leadingVisual: true,
        trailingVisual: false,
    },
    argTypes: {
        text: {
            control: 'text',
            table: { category: 'Content' }
        },
        icon: {
            control: 'text',
            table: { category: 'Content' }
        },
        state: {
            control: { type: 'select' },
            options: ['enabled', 'hover', 'selected', 'disabled', 'focus'],
            table: { category: 'State' }
        },
        leadingVisual: {
            control: 'boolean',
            table: { category: 'Design' }
        },
        trailingVisual: {
            control: 'boolean',
            table: { category: 'Design' }
        },
    }
};
