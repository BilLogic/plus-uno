import React, { useState } from 'react';
import ListGroup from './ListGroup';
import Badge from '../Badge/Badge';

/**
 * ListGroup.Item Component
 * 
 * A unified list item supporting three modes:
 * - **selectable="none"**: Regular clickable/static item (default)
 * - **selectable="single"**: Radio button selection
 * - **selectable="multi"**: Checkbox selection
 * 
 * All modes support size (b1, b2, b3) and state options.
 */
export default {
    title: 'Components/ListGroup/ListItem',
    component: ListGroup.Item,
    tags: ['autodocs'],
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
    }
};

/**
 * Overview
 * Shows all modes and size variants
 */
export const Overview = {
    render: () => {
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '400px' }}>
                {/* Default Mode */}
                <section>
                    <h6 className="h6" style={{ marginBottom: '12px' }}>Default Mode (Navigation)</h6>
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

                {/* Single Select Mode */}
                <section>
                    <h6 className="h6" style={{ marginBottom: '12px' }}>Single Select</h6>
                    <ListGroup>
                        {['opt1', 'opt2', 'opt3'].map((value, i) => (
                            <ListGroup.Item
                                key={value}
                                value={value}
                                label={`Option ${i + 1}`}
                                selectable="single"
                                name="single-demo"
                                selected={singleValue === value}
                                onClick={() => setSingleValue(value)}
                            />
                        ))}
                    </ListGroup>
                </section>

                {/* Multi Select Mode */}
                <section>
                    <h6 className="h6" style={{ marginBottom: '12px' }}>Multi Select</h6>
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

                {/* Size Variants */}
                <section>
                    <h6 className="h6" style={{ marginBottom: '12px' }}>Sizes</h6>
                    <ListGroup>
                        <ListGroup.Item action size="b1">Size B1 (Large)</ListGroup.Item>
                        <ListGroup.Item action size="b2">Size B2 (Default)</ListGroup.Item>
                        <ListGroup.Item action size="b3">Size B3 (Small)</ListGroup.Item>
                    </ListGroup>
                </section>
            </div>
        );
    }
};

/**
 * Interactive
 * Full playground with controls
 */
export const Interactive = {
    render: (args) => {
        const [selected, setSelected] = useState(args.selected);

        const handleClick = (val) => {
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
        // Design
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

        // Content (default mode)
        text: {
            control: 'text',
            if: { arg: 'selectable', eq: 'none' },
            table: { category: 'Content' }
        },
        // Content (selectable mode)
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

        // State
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

        // Visuals
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
        }
    }
};
