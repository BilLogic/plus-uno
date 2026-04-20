import React, { useState } from 'react';
import ListGroup from './ListGroup';
import Badge from '../Badge/Badge';

export default {
    title: 'Components/ListGroup',
    component: ListGroup.Item,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: `A flexible list item for navigation, display, or selection.

| Mode | Prop | Use Case |
|------|------|----------|
| Default | \`selectable="none"\` | Navigation, menus, clickable items |
| Single Select | \`selectable="single"\` | Radio-style selection |
| Multi Select | \`selectable="multi"\` | Checkbox-style selection |

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

function ListGroupItemVariantsDemos() {
    const [singleValue, setSingleValue] = useState('opt1');
    const [multiValues, setMultiValues] = useState(['opt1', 'opt3']);

    const handleMultiToggle = (value) => {
        setMultiValues(prev =>
            prev.includes(value)
                ? prev.filter(v => v !== value)
                : [...prev, value]
        );
    };

    return (
        <>
            <section>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">SINGLE SELECT</span>
                <ListGroup>
                    {['opt1', 'opt2', 'opt3'].map((value, i) => (
                        <ListGroup.Item
                            key={value}
                            value={value}
                            label={`Option ${i + 1}`}
                            selectable="single"
                            name="single-demo-docs"
                            selected={singleValue === value}
                            onClick={() => setSingleValue(value)}
                        />
                    ))}
                </ListGroup>
            </section>
            <section>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">MULTI SELECT</span>
                <ListGroup>
                    {['opt1', 'opt2', 'opt3'].map((value, i) => (
                        <ListGroup.Item
                            key={value}
                            value={value}
                            label={`Option ${i + 1}`}
                            selectable="multi"
                            selected={multiValues.includes(value)}
                            onClick={() => handleMultiToggle(value)}
                        />
                    ))}
                </ListGroup>
            </section>
        </>
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

export const ListItemSelectionModes = () => (
    <div style={col}>
        <ListGroupItemVariantsDemos />
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
        <ListGroupItemVariantsDemos />
        <ListGroupItemSizesDemo />
    </div>
);

export const ListItemInteractive = {
    render: (args) => {
        const [selected, setSelected] = useState(args.selected);

        const handleClick = () => {
            if (args.selectable !== 'none') {
                setSelected(!selected);
            }
        };

        return (
            <ListGroup style={{ maxWidth: '400px' }}>
                <ListGroup.Item
                    {...args}
                    selected={selected}
                    onClick={handleClick}
                >
                    {args.selectable === 'none' && (
                        <>
                            {args.showLeadingIcon && (
                                <i className={`fas fa-${args.leadingIcon} me-3`} style={{ color: 'var(--color-primary)' }} />
                            )}
                            <span className="flex-grow-1">{args.text}</span>
                            {args.showCounter && (
                                <Badge style={args.counterStyle} size={args.size}>{args.counterValue}</Badge>
                            )}
                        </>
                    )}
                </ListGroup.Item>
            </ListGroup>
        );
    },
    args: {
        text: 'List Item',
        label: 'Option Label',
        value: 'option-1',
        size: 'b2',
        selectable: 'none',
        active: false,
        selected: false,
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
        selectable: {
            control: { type: 'select' },
            options: ['none', 'single', 'multi'],
            description: 'Selection mode',
            table: { category: 'Design' }
        },
        text: {
            control: 'text',
            if: { arg: 'selectable', eq: 'none' },
            table: { category: 'Content' }
        },
        label: {
            control: 'text',
            if: { arg: 'selectable', neq: 'none' },
            table: { category: 'Content' }
        },
        value: {
            control: 'text',
            if: { arg: 'selectable', neq: 'none' },
            table: { category: 'Content' }
        },
        active: {
            control: 'boolean',
            if: { arg: 'selectable', eq: 'none' },
            table: { category: 'State' }
        },
        selected: {
            control: 'boolean',
            if: { arg: 'selectable', neq: 'none' },
            table: { category: 'State' }
        },
        disabled: {
            control: 'boolean',
            table: { category: 'State' }
        },
        action: {
            control: 'boolean',
            if: { arg: 'selectable', eq: 'none' },
            table: { category: 'Behavior' }
        },
        showLeadingIcon: {
            control: 'boolean',
            if: { arg: 'selectable', eq: 'none' },
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
            if: { arg: 'selectable', eq: 'none' },
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
