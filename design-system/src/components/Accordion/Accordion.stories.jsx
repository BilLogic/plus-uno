import React from 'react';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import Accordion from './Accordion';

export default {
    title: 'Components/Accordion',
    component: Accordion,
    tags: ['!dev'],
    parameters: {
        docs: {
            description: {
                component: 'Accordion component for organizing content into collapsible sections. Built on React Bootstrap with custom styling per the design system.'
            }
        }
    },
    argTypes: {
        children: { table: { disable: true } },
        onClick: { table: { disable: true } },
        style: { table: { disable: true } },
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

        // DEVELOPMENT
        defaultActiveKey: {
            table: { disable: true, category: 'Development' }
        },
        activeKey: {
            table: { disable: true, category: 'Development' }
        },
        onSelect: {
            table: { disable: true, category: 'Development' }
        },
        id: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        className: {
            control: false,
            table: { disable: true, category: 'Development' }
        },
        items: {
            table: { disable: true, category: 'Development' }
        },}
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

const accordionPage = { display: 'flex', flexDirection: 'column', gap: '48px', maxWidth: '800px' };

function AccordionVariantsDemos() {
    return (
        <>
            <section>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">DEFAULT ACCORDION</span>
                <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                    Standard accordion with borders and one item open at a time.
                </p>
                <Accordion items={sampleItems} defaultActiveKey="0" />
            </section>
            <section>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">FLUSH ACCORDION</span>
                <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                    Borderless accordion for seamless integration with surrounding content.
                </p>
                <div style={{ border: '1px dashed var(--color-outline-variant)', padding: '0' }}>
                    <Accordion items={sampleItems} defaultActiveKey="0" flush />
                </div>
            </section>
        </>
    );
}

function AccordionBehaviorDemos() {
    return (
        <>
            <section>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">ALWAYS OPEN (MULTIPLE EXPANDED)</span>
                <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                    Multiple accordion items can be open simultaneously.
                </p>
                <Accordion items={sampleItems} defaultActiveKey={['0', '1']} alwaysOpen />
            </section>
            <section>
                <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">ALL COLLAPSED</span>
                <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                    Accordion with no default expanded item.
                </p>
                <Accordion items={sampleItems} />
            </section>
        </>
    );
}

function AccordionInteractionDemos() {
    return (
        <section>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">WITH DISABLED ITEM</span>
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
    );
}

function AccordionContentDemos() {
    return (
        <section>
            <span className="text-[12px] uppercase tracking-wider text-on-surface-variant font-semibold block mb-3">USING CHILDREN (ALTERNATIVE PATTERN)</span>
            <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--color-neutral-text)' }}>
                Accordion supports both the <code>items</code> array prop and direct child components.
            </p>
            <Accordion defaultActiveKey="custom-1">
                <Accordion.Item eventKey="custom-1" header="Custom Header One">
                    <p>This is custom content passed as children.</p>
                    <button className="plus-btn plus-btn--primary plus-btn--filled plus-btn--small" type="button">
                        Action Button
                    </button>
                </Accordion.Item>
                <Accordion.Item eventKey="custom-2" header="Custom Header Two">
                    <p>Another custom content area with more flexibility.</p>
                </Accordion.Item>
            </Accordion>
        </section>
    );
}

export const Styles = () => (
    <div style={accordionPage}>
        <AccordionVariantsDemos />
    </div>
);

export const Behavior = () => (
    <div style={accordionPage}>
        <AccordionBehaviorDemos />
    </div>
);

export const InteractionStates = () => (
    <div style={accordionPage}>
        <AccordionInteractionDemos />
    </div>
);

export const Content = () => (
    <div style={accordionPage}>
        <AccordionContentDemos />
    </div>
);

export const Overview = () => (
    <div style={{ width: '100%' }}>
        <Accordion items={sampleItems} defaultActiveKey="0" />
    </div>
);
Overview.parameters = {
    docs: {
        source: { language: 'html', code: webAppSourceSnippets.accordion }
    }
};

/**
 * Interactive Playground
 * Customize the accordion attributes in real-time.
 */
export const Interactive = (args) => {
    const items = Array.from({ length: args.itemCount || 3 }, (_, i) => ({
        eventKey: String(i),
        header: `Accordion Item #${i + 1}`,
        body: `This is the content for accordion item ${i + 1}. It can contain any content including text, images, or other components.`
    }));

    return (
        <div style={{ maxWidth: '800px' }}>
            <Accordion
                flush={args.flush}
                alwaysOpen={args.alwaysOpen}
                items={items}
                defaultActiveKey={args.alwaysOpen ? ['0'] : '0'}
            />
        </div>
    );
};

Interactive.args = {
    flush: false,
    alwaysOpen: false,
    itemCount: 3
};
