import React, { useState } from 'react';
import Collapse from './Collapse';
import Card from '@/components/Card/Card';
import Button from '@/components/Button/Button';

export default {
    title: 'Components/Collapse',
    component: Collapse,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Collapse component for showing and hiding content. Supports controlled and uncontrolled modes, custom triggers, and icons.'
            }
        }
    },
    argTypes: {
        // CONTENT
        trigger: {
            control: 'text',
            description: 'Content for the trigger button/link',
            table: { category: 'Content' }
        },
        children: {
            table: { disable: true, category: 'Content' }
        },

        // DESIGN
        icon: {
            control: 'select',
            options: [undefined, 'chevron-down', 'caret-down', 'angle-down', 'plus', 'minus'],
            description: 'Optional icon to display with trigger',
            table: { category: 'Design' }
        },
        iconPosition: {
            control: 'radio',
            options: ['left', 'right'],
            description: 'Position of the icon relative to trigger text',
            table: { category: 'Design' }
        },
        triggerTag: {
            control: 'select',
            options: ['button', 'a', 'div'],
            description: 'HTML element type for the trigger',
            table: { category: 'Design' }
        },

        // BEHAVIOR
        defaultOpen: {
            control: 'boolean',
            description: 'Initial open state (uncontrolled mode)',
            table: { category: 'Behavior' }
        },
        isOpen: {
            control: 'boolean',
            description: 'Controlled open state',
            table: { category: 'Behavior' }
        },
        onToggle: {
            action: 'toggled',
            description: 'Callback when collapse is toggled',
            table: { category: 'Behavior' }
        },

        // DEVELOPMENT
        id: {
            control: 'text',
            description: 'HTML ID attribute (used for accessibility)',
            table: { category: 'Development' }
        },
        className: {
            control: 'text',
            description: 'Additional CSS classes for wrapper',
            table: { category: 'Development' }
        },
        triggerClass: {
            control: 'text',
            description: 'CSS classes for the trigger element',
            table: { category: 'Development' }
        },
        contentClass: {
            control: 'text',
            description: 'CSS classes for the content container',
            table: { category: 'Development' }
        }
    }
};

/**
 * Overview
 * Comprehensive view of Collapse configurations and use cases.
 */
export const Overview = () => {
    const [controlledOpen, setControlledOpen] = useState(false);
    const [open1, setOpen1] = useState(false);
    const [open2, setOpen2] = useState(false);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', maxWidth: '700px' }}>

            {/* 1. Default Uncontrolled */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Default (Uncontrolled)</h6>
                <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                    Basic collapse that manages its own open/closed state internally.
                </p>
                <Collapse
                    id="default-example"
                    trigger="Toggle Content"
                    triggerClass="btn btn-primary"
                    defaultOpen={false}
                >
                    <Card
                        body="Some placeholder content for the collapse component. This panel is hidden by default but revealed when the user activates the relevant trigger."
                        className="mt-2"
                        showBorder
                    />
                </Collapse>
            </section>

            {/* 2. Initially Open */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Initially Open</h6>
                <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                    Collapse that starts in the expanded state using <code>defaultOpen</code>.
                </p>
                <Collapse
                    id="open-example"
                    trigger="Already Expanded"
                    triggerClass="btn btn-secondary"
                    defaultOpen={true}
                >
                    <Card
                        body="This content is visible by default because defaultOpen is set to true."
                        className="mt-2"
                        showBorder
                    />
                </Collapse>
            </section>

            {/* 3. With Icons */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>With Icons</h6>
                <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                    Collapse triggers can include icons positioned left or right.
                </p>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <Collapse
                        trigger="Icon Left"
                        triggerClass="btn btn-outline-primary"
                        icon="chevron-down"
                        iconPosition="left"
                    >
                        <Card body="Content with left icon trigger." className="mt-2" showBorder />
                    </Collapse>

                    <Collapse
                        trigger="Icon Right"
                        triggerClass="btn btn-outline-primary"
                        icon="caret-down"
                        iconPosition="right"
                    >
                        <Card body="Content with right icon trigger." className="mt-2" showBorder />
                    </Collapse>
                </div>
            </section>

            {/* 4. Controlled Mode */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Controlled Mode</h6>
                <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                    External state management using <code>isOpen</code> prop.
                </p>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <Button onClick={() => setControlledOpen(true)} text="Open" style="primary" fill="filled" />
                    <Button onClick={() => setControlledOpen(false)} text="Close" style="secondary" fill="outline" />
                    <Button onClick={() => setControlledOpen(!controlledOpen)} text="Toggle" style="tertiary" fill="ghost" />
                </div>
                <div className={`collapse ${controlledOpen ? 'show' : ''}`}>
                    <Card body="This content is controlled externally." showBorder />
                </div>
            </section>

            {/* 5. Multiple Targets */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Multiple Targets</h6>
                <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                    Control multiple collapse sections independently or simultaneously.
                </p>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <Button onClick={() => setOpen1(!open1)} text="Toggle First" size="sm" />
                    <Button onClick={() => setOpen2(!open2)} text="Toggle Second" size="sm" />
                    <Button onClick={() => { setOpen1(true); setOpen2(true); }} text="Open Both" size="sm" style="secondary" />
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                        <div className={`collapse ${open1 ? 'show' : ''}`}>
                            <Card body="First panel content." showBorder />
                        </div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div className={`collapse ${open2 ? 'show' : ''}`}>
                            <Card body="Second panel content." showBorder />
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. Link Trigger */}
            <section>
                <h6 className="h6" style={{ marginBottom: '16px' }}>Link Trigger</h6>
                <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                    Use an anchor tag as the trigger instead of a button.
                </p>
                <Collapse
                    trigger="Click this link to expand"
                    triggerTag="a"
                    triggerClass="text-primary"
                    icon="angle-down"
                    iconPosition="right"
                >
                    <Card body="Content revealed by clicking the link." className="mt-2" showBorder />
                </Collapse>
            </section>
        </div>
    );
};

/**
 * Interactive Playground
 * Customize collapse attributes in real-time.
 */
export const Interactive = (args) => (
    <div style={{ maxWidth: '600px' }}>
        <Collapse {...args}>
            <Card
                body="This is the collapsible content. It can contain any content including text, images, forms, or other components."
                showBorder
                className="mt-2"
            />
        </Collapse>
    </div>
);

Interactive.args = {
    trigger: 'Toggle Collapse',
    triggerClass: 'btn btn-primary',
    defaultOpen: false,
    icon: 'chevron-down',
    iconPosition: 'right',
    id: 'interactive-collapse'
};
