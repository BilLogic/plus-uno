import React from 'react';
import Accordion from './Accordion';

export default {
    title: 'Components/Accordion',
    component: Accordion,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Accordion component for organizing content into collapsible sections. Built on React Bootstrap with custom styling per the design system.'
            }
        }
    },
    argTypes: {
        // DESIGN
        flush: {
            control: 'boolean',
            description: 'Remove borders for seamless/flush appearance',
            table: { category: 'Design' }
        },

        // CONTENT
        itemCount: {
            control: { type: 'range', min: 1, max: 6, step: 1 },
            description: 'Number of accordion items',
            table: { category: 'Content' }
        },

        // BEHAVIOR
        alwaysOpen: {
            control: 'boolean',
            description: 'Allow multiple items to be open simultaneously',
            table: { category: 'Behavior' }
        },
        defaultActiveKey: {
            control: 'text',
            description: 'Initially expanded item key (or comma-separated keys for alwaysOpen)',
            table: { category: 'Behavior' }
        },

        // DEVELOPMENT
        id: {
            control: 'text',
            description: 'HTML ID attribute',
            table: { category: 'Development' }
        },
        className: {
            control: 'text',
            description: 'Additional CSS classes',
            table: { category: 'Development' }
        },
        items: {
            table: { disable: true, category: 'Development' }
        },
        children: {
            table: { disable: true, category: 'Development' }
        }
    }
};

// Sample accordion content
const sampleItems = [
    {
        eventKey: '0',
        header: 'Accordion Item #1',
        body: 'This is the first accordion item\'s content. It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element.'
    },
    {
        eventKey: '1',
        header: 'Accordion Item #2',
        body: 'This is the second accordion item\'s content. Clicking on the header will toggle its visibility.'
    },
    {
        eventKey: '2',
        header: 'Accordion Item #3',
        body: 'This is the third accordion item\'s content. You can have as many items as needed.'
    }
];

/**
 * Overview
 * Comprehensive view of Accordion configurations matching Figma specifications.
 */
export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', maxWidth: '800px' }}>

        {/* 1. Default Accordion */}
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Default Accordion</h6>
            <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                Standard accordion with borders and one item open at a time.
            </p>
            <Accordion
                items={sampleItems}
                defaultActiveKey="0"
            />
        </section>

        {/* 2. Flush Accordion */}
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Flush Accordion</h6>
            <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                Borderless accordion for seamless integration with surrounding content.
            </p>
            <div style={{ border: '1px dashed var(--color-outline-variant)', padding: '0' }}>
                <Accordion
                    items={sampleItems}
                    defaultActiveKey="0"
                    flush
                />
            </div>
        </section>

        {/* 3. Always Open */}
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Always Open (Multiple Expanded)</h6>
            <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                Multiple accordion items can be open simultaneously.
            </p>
            <Accordion
                items={sampleItems}
                defaultActiveKey={['0', '1']}
                alwaysOpen
            />
        </section>

        {/* 4. All Collapsed */}
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>All Collapsed</h6>
            <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                Accordion with no default expanded item.
            </p>
            <Accordion items={sampleItems} />
        </section>

        {/* 5. With Disabled Item */}
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>With Disabled Item</h6>
            <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                Individual items can be disabled to prevent interaction.
            </p>
            <Accordion
                items={[
                    { eventKey: '0', header: 'Active Item', body: 'This item is active and clickable.' },
                    { eventKey: '1', header: 'Disabled Item', body: 'This content is not accessible.', disabled: true },
                    { eventKey: '2', header: 'Another Active Item', body: 'This item is also active.' }
                ]}
                defaultActiveKey="0"
            />
        </section>

        {/* 6. Using Children Pattern */}
        <section>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Using Children (Alternative Pattern)</h6>
            <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                Accordion supports both the <code>items</code> array prop and direct child components.
            </p>
            <Accordion defaultActiveKey="custom-1">
                <Accordion.Item eventKey="custom-1" header="Custom Header One">
                    <p>This is custom content passed as children.</p>
                    <button className="plus-btn plus-btn--primary plus-btn--filled plus-btn--small">
                        Action Button
                    </button>
                </Accordion.Item>
                <Accordion.Item eventKey="custom-2" header="Custom Header Two">
                    <p>Another custom content area with more flexibility.</p>
                </Accordion.Item>
            </Accordion>
        </section>
    </div>
);

/**
 * Interactive Playground
 * Customize the accordion attributes in real-time.
 */
export const Interactive = (args) => {
    // Generate items based on itemCount
    const items = Array.from({ length: args.itemCount || 3 }, (_, i) => ({
        eventKey: String(i),
        header: `Accordion Item #${i + 1}`,
        body: `This is the content for accordion item ${i + 1}. It can contain any content including text, images, or other components.`
    }));

    // Parse defaultActiveKey if it contains comma-separated values
    const activeKey = args.defaultActiveKey?.includes(',')
        ? args.defaultActiveKey.split(',').map(k => k.trim())
        : args.defaultActiveKey;

    return (
        <div style={{ maxWidth: '800px' }}>
            <Accordion
                {...args}
                items={items}
                defaultActiveKey={activeKey}
            />
        </div>
    );
};

Interactive.args = {
    flush: false,
    alwaysOpen: false,
    itemCount: 3,
    defaultActiveKey: '0'
};
