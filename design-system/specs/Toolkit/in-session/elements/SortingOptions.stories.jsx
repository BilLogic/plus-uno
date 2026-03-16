import React, { useState } from 'react';
import Dropdown from '../../../../../packages/plus-ds/src/components/Dropdown/Dropdown';

export default {
    title: 'Specs/Toolkit/In-Session/Elements/Sorting Options',
    component: Dropdown,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: 'Sorting Options dropdown with dynamic ordering logic and 8 specific states.'
            }
        }
    },
};

// Data structure for the sorting logic
const SORT_CONFIG = {
    name: {
        label: 'Name',
        orders: [
            { id: 'az', label: 'A-Z' },
            { id: 'za', label: 'Z-A' }
        ]
    },
    status: {
        label: 'Status',
        orders: [
            { id: 'needs_motivation', label: '"Needs Motivation" First' },
            { id: 'doing_well', label: '"Doing Well" First' }
        ]
    },
    bookmark: {
        label: 'Bookmark',
        listLabel: 'Bookmarked',
        orders: [
            { id: 'bookmarked_first', label: 'Bookmarked First' },
            { id: 'bookmarked_last', label: 'Bookmarked Last' }
        ]
    },
    progress: {
        label: 'Progress',
        orders: [
            { id: 'goal_not_met', label: 'Goal Not Met First' },
            { id: 'goal_met', label: 'Goal Met First' }
        ]
    }
};

const SortingOptions = ({
    initialOpen = false,
    initialSort = 'name',
    initialOrder = 'az',
    isInteractive = false
}) => {
    const [activeSort, setActiveSort] = useState(initialSort);
    const [activeOrder, setActiveOrder] = useState(initialOrder);
    const [isOpen, setIsOpen] = useState(initialOpen);

    const handleSortChange = (sortKey) => {
        if (!isInteractive) return;
        setActiveSort(sortKey);
        const defaultOrder = SORT_CONFIG[sortKey].orders[0].id;
        setActiveOrder(defaultOrder);
    };

    const handleOrderChange = (orderId) => {
        if (!isInteractive) return;
        setActiveOrder(orderId);
        setIsOpen(false);
    };

    const currentLabel = SORT_CONFIG[activeSort].label;

    // Construct items array for Dropdown
    const sortKeys = Object.keys(SORT_CONFIG);
    const lastSortKey = sortKeys[sortKeys.length - 1];

    const items = [
        // Sort By Section
        { label: 'Sort by', header: true },
        ...sortKeys.map(key => ({
            label: SORT_CONFIG[key].listLabel || SORT_CONFIG[key].label,
            selected: activeSort === key,
            onClick: () => handleSortChange(key),
            // Attach divider to the last item of this section to avoid creating an empty button for a standalone divider
            divider: key === lastSortKey
        })),

        // Order Section
        { label: 'Order', header: true },
        ...SORT_CONFIG[activeSort].orders.map(order => ({
            label: order.label,
            selected: activeOrder === order.id,
            onClick: () => handleOrderChange(order.id)
        }))
    ];

    return (
        <Dropdown
            buttonText={currentLabel}
            items={items}
            style="secondary"
            fill={(isInteractive ? isOpen : initialOpen) ? "tonal" : "ghost"} // User Feedback: Open state = Pressed (Tonal), Closed = Text (Ghost)
            isOpen={isInteractive ? isOpen : initialOpen}
            onToggle={(val) => isInteractive && setIsOpen(val)}
        />
    );
};

export const Overview = () => (
    <div className="d-flex flex-column" style={{ gap: 'var(--size-element-gap-lg)', paddingBottom: '400px' }}>
        {/* Closed States Row */}
        <section>
            <h6 className="h6 mb-4 text-muted">Closed States</h6>
            <div className="d-flex align-items-start flex-wrap" style={{ gap: 'var(--size-element-gap-md)' }}>
                <div>
                    <h6 className="text-muted mb-2" style={{ fontSize: '12px' }}>Name</h6>
                    <SortingOptions initialOpen={false} initialSort="name" />
                </div>
                <div>
                    <h6 className="text-muted mb-2" style={{ fontSize: '12px' }}>Status</h6>
                    <SortingOptions initialOpen={false} initialSort="status" />
                </div>
                <div>
                    <h6 className="text-muted mb-2" style={{ fontSize: '12px' }}>Bookmark</h6>
                    <SortingOptions initialOpen={false} initialSort="bookmark" />
                </div>
                <div>
                    <h6 className="text-muted mb-2" style={{ fontSize: '12px' }}>Progress</h6>
                    <SortingOptions initialOpen={false} initialSort="progress" />
                </div>
            </div>
        </section>

        {/* Open States Row - Added large margin-bottom to individual items to reserve space for absolute menu */}
        <section style={{ marginTop: 'var(--size-element-gap-lg)' }}>
            <h6 className="h6 mb-4 text-muted">Open States</h6>
            <div className="d-flex align-items-start flex-wrap" style={{ gap: 'var(--size-element-gap-md)' }}> {/* User Feedback: Use element gap tokens */}
                <div style={{ paddingBottom: '320px', minWidth: '250px' }}> {/* Increased min-width */}
                    <h6 className="text-muted mb-2" style={{ fontSize: '12px' }}>Name (Expanded)</h6>
                    <SortingOptions initialOpen={true} initialSort="name" initialOrder="az" />
                </div>

                <div style={{ paddingBottom: '320px', minWidth: '250px' }}>
                    <h6 className="text-muted mb-2" style={{ fontSize: '12px' }}>Status (Expanded)</h6>
                    <SortingOptions initialOpen={true} initialSort="status" initialOrder="doing_well" />
                </div>

                <div style={{ paddingBottom: '320px', minWidth: '250px' }}>
                    <h6 className="text-muted mb-2" style={{ fontSize: '12px' }}>Bookmark (Expanded)</h6>
                    <SortingOptions initialOpen={true} initialSort="bookmark" initialOrder="bookmarked_first" />
                </div>

                <div style={{ paddingBottom: '320px', minWidth: '250px' }}>
                    <h6 className="text-muted mb-2" style={{ fontSize: '12px' }}>Progress (Expanded)</h6>
                    <SortingOptions initialOpen={true} initialSort="progress" initialOrder="goal_not_met" />
                </div>
            </div>
        </section>
    </div>
);

export const Interactive = () => (
    <div className="border rounded" style={{ padding: 'var(--size-card-pad-y-lg)', minHeight: '500px' }}>
        <h6 className="h6 mb-3">Interactive Demo</h6>
        <p className="mb-3 text-muted" style={{ fontSize: '14px' }}>
            Using Design System <code>Dropdown</code> component.
        </p>
        <div style={{ display: 'flex', gap: '20px' }}>
            <SortingOptions isInteractive={true} initialSort="name" />
        </div>
    </div>
);
