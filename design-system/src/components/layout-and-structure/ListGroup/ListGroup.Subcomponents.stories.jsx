import React from 'react';
import ListGroup from './ListGroup';
import Badge from '@/components/labels/Badge/Badge';

export default {
    title: 'Components/Layout and structure/List group',
    component: ListGroup.Item,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: `A list item for navigation, actions or content. Picking a value is the option list's job, not this item's.

### Size Options
- \`b1\`: Body 1 - largest
- \`b2\` (default): Body 2 - medium  
- \`b3\`: Body 3 - smallest`
            }
        }
    },
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
        id: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        onFocus: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        onBlur: {
            control: false,
            table: { disable: true, category: 'Development' }
        }
    }
};

const col = { display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '400px' };

function ListGroupItemContentDemo() {
    return (
        <section>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">NAVIGATION LAYOUT</span>
            <ListGroup>
                <ListGroup.Item action>
                    <i className="fas fa-home me-3" style={{ color: 'var(--color-primary)' }} />
                    <span className="flex-grow-1">Home</span>
                </ListGroup.Item>
                <ListGroup.Item action active>
                    <i className="fas fa-user me-3" style={{ color: 'var(--color-primary)' }} />
                    <span className="flex-grow-1">Profile</span>
                    <Badge style="primary" size="b3">New</Badge>
                </ListGroup.Item>
                <ListGroup.Item action disabled>
                    <i className="fas fa-lock me-3" />
                    <span className="flex-grow-1">Disabled</span>
                </ListGroup.Item>
            </ListGroup>
        </section>
    );
}

function ListGroupItemSizesDemo() {
    return (
        <section>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">SIZES</span>
            <ListGroup>
                <ListGroup.Item action size="b1">Size B1 (Large)</ListGroup.Item>
                <ListGroup.Item action size="b2">Size B2 (Default)</ListGroup.Item>
                <ListGroup.Item action size="b3">Size B3 (Small)</ListGroup.Item>
            </ListGroup>
        </section>
    );
}

export const ListItemContent = () => (
    <div style={col}>
        <ListGroupItemContentDemo />
    </div>
);

export const ListItemSizes = () => (
    <div style={col}>
        <ListGroupItemSizesDemo />
    </div>
);

export const ListItemOverview = () => (
    <div style={col}>
        <ListGroupItemContentDemo />
        <ListGroupItemSizesDemo />
    </div>
);
ListItemOverview.parameters = {
    docs: {
        disable: true
    }
};

export const ListItemInteractive = {
    render: (args) => {
        const { text, showLeadingIcon, leadingIcon, showCounter, counterValue, counterStyle, ...itemArgs } = args;
        return (
            <ListGroup style={{ maxWidth: '400px' }}>
                <ListGroup.Item {...itemArgs}>
                    {showLeadingIcon && (
                        <i className={`fas fa-${leadingIcon} me-3`} style={{ color: 'var(--color-primary)' }} />
                    )}
                    <span className="flex-grow-1">{text}</span>
                    {showCounter && (
                        <Badge style={counterStyle} size={args.size}>{counterValue}</Badge>
                    )}
                </ListGroup.Item>
            </ListGroup>
        );
    },
    args: {
        text: 'List Item',
        size: 'b2',
        active: false,
        disabled: false,
        action: true,
        showLeadingIcon: true,
        leadingIcon: 'star',
        showCounter: false,
        counterValue: '5',
        counterStyle: 'primary'
    },
    argTypes: {
        size: {
            control: { type: 'select' },
            options: ['b1', 'b2', 'b3'],
            table: { category: 'Design' }
        },
        text: {
            control: 'text',
            table: { category: 'Content' }
        },
        active: {
            control: 'boolean',
            table: { category: 'State' }
        },
        disabled: {
            control: 'boolean',
            table: { category: 'State' }
        },
        action: {
            control: 'boolean',
            table: { category: 'Behavior' }
        },
        showLeadingIcon: {
            control: 'boolean',
            table: { category: 'Visuals' }
        },
        leadingIcon: {
            control: { type: 'select' },
            options: ['star', 'home', 'user', 'cog', 'inbox', 'heart', 'folder'],
            if: { arg: 'showLeadingIcon' },
            table: { category: 'Visuals' }
        },
        showCounter: {
            control: 'boolean',
            table: { category: 'Visuals' }
        },
        counterValue: {
            control: 'text',
            if: { arg: 'showCounter' },
            table: { category: 'Visuals' }
        },
        counterStyle: {
            control: { type: 'select' },
            options: ['primary', 'secondary', 'success', 'danger', 'warning', 'info'],
            if: { arg: 'showCounter' },
            table: { category: 'Visuals' }
        },
        id: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        onFocus: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        onBlur: {
            control: false,
            table: { disable: true, category: 'Development' }
        }
    }
};
