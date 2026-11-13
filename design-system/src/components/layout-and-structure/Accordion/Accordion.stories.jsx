import { withReducedMotion } from '@/storybook-docs/lib/overlay-motion-plays';
import React from 'react';
import { Button } from '@/components';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import Accordion from './Accordion';
import { expectHovered, expectPressed, expectFocusRing } from '@/storybook-docs/lib/button-states.js';
import { probe, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { DemoLabel } from '@/storybook-docs/lib/pattern-demo';

export default {
    title: 'Components/Layout and structure/Accordion',
    component: Accordion,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Accordion component for organizing content into collapsible sections.'
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
        header: 'Session notes',
        body: 'Worked through two-step equations. Maya explained each step back before moving on.'
    },
    {
        eventKey: '1',
        header: 'Goals',
        body: 'Solve multi-step equations without a worked example by the end of the month.'
    },
    {
        eventKey: '2',
        header: 'Progress',
        body: 'Three of four practice sets finished, up from one last week.'
    }
];

// A second header set for any demo that sits open on the same page as
// another open accordion — a panel's accessible name is its own header, so
// two open panels both titled "Session notes" collide under the
// a11y "landmark-unique" rule even though they belong to different accordions.
const flushSampleItems = sampleItems.map((item) => ({ ...item, header: `${item.header} (flush)` }));

const accordionPage = { display: 'flex', flexDirection: 'column', gap: '48px', maxWidth: '800px' };

function AccordionVariantsDemos() {
    return (
        <>
            <section>
                <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--ds-text)' }}>
                    Standard accordion with borders and one item open at a time.
                </p>
                <Accordion items={sampleItems} defaultActiveKey="0" />
            </section>
            <section>
                <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--ds-text)' }}>
                    Borderless accordion for seamless integration with surrounding content.
                </p>
                <div style={{ border: '1px dashed var(--ds-border)', padding: '0' }}>
                    <Accordion items={flushSampleItems} defaultActiveKey="0" flush />
                </div>
            </section>
        </>
    );
}

function AccordionBehaviorDemos() {
    return (
        <>
            <section>
                <DemoLabel>ALWAYS OPEN (MULTIPLE EXPANDED)</DemoLabel>
                <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--ds-text)' }}>
                    Multiple accordion items can be open simultaneously.
                </p>
                <Accordion items={sampleItems} defaultActiveKey={['0', '1']} alwaysOpen />
            </section>
            <section>
                <DemoLabel>ALL COLLAPSED</DemoLabel>
                <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--ds-text)' }}>
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
            <DemoLabel>WITH DISABLED ITEM</DemoLabel>
            <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--ds-text)' }}>
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
            <DemoLabel>USING CHILDREN (ALTERNATIVE PATTERN)</DemoLabel>
            <p className="plus-body-2" style={{ marginBottom: '16px', color: 'var(--ds-text)' }}>
                Accordion supports both the <code>items</code> array prop and direct child components.
            </p>
            <Accordion defaultActiveKey="custom-1">
                <Accordion.Item eventKey="custom-1" header="Custom Header One">
                    <p>This is custom content passed as children.</p>
                    <Button appearance="primary" spacing="compact">
                        Action Button
                    </Button>
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
        source: { language: 'jsx', code: webAppSourceSnippets.accordion }
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

/* ------------------------------------------------------------------- states */

const Sections = ({ defaultActiveKey, disabled = false }) => (
    <div style={{ maxWidth: '520px' }}>
        <Accordion defaultActiveKey={defaultActiveKey}>
            <Accordion.Item eventKey="0" header="Session notes" disabled={disabled}>
                <p>Notes from the last session.</p>
            </Accordion.Item>
            <Accordion.Item eventKey="1" header="Goals">
                <p>Goals for the next session.</p>
            </Accordion.Item>
        </Accordion>
    </div>
);
const trigger = (canvasElement, name = 'Session notes') => within(canvasElement).getByRole('button', { name });

/** Rest: a closed trigger sits on the surface. */
export const Rest = {
    render: () => <Sections />,
    play: async ({ canvasElement }) => {
        const el = trigger(canvasElement);
        await expect(el).toHaveAttribute('aria-expanded', 'false');
        await expect(getComputedStyle(el).backgroundColor).toBe(tokenColor(canvasElement, '--ds-surface'));
    },
};

/** Hovered: the neutral subtle hovered ground. */
export const Hovered = {
    render: () => <Sections />,
    play: async ({ canvasElement }) => {
        await expectHovered(canvasElement, trigger(canvasElement), 'default', 'accordion trigger');
    },
};

/** Pressed: the neutral subtle pressed ground. */
export const Pressed = {
    render: () => <Sections />,
    play: async ({ canvasElement }) => {
        await expectPressed(canvasElement, trigger(canvasElement), 'default', 'accordion trigger');
    },
};

/** Focused: the 2px ring, 2px off the edge; the ground stays put. */
export const Focused = {
    render: () => <Sections />,
    play: async ({ canvasElement }) => {
        await expectFocusRing(canvasElement, trigger(canvasElement), 'accordion trigger');
    },
};

/** Expanded: the selected ground, and a press closes it again. */
export const Expanded = {
    render: () => <Sections defaultActiveKey="0" />,
    play: async ({ canvasElement }) => {
        const el = trigger(canvasElement);
        await expect(el).toHaveAttribute('aria-expanded', 'true');
        await expect(getComputedStyle(el).backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-selected'));
        await userEvent.click(el);
        await expect(el).toHaveAttribute('aria-expanded', 'false');
    },
};

/** Disabled: dimmed to the disabled opacity, out of the tab order, never opens. */
export const Disabled = {
    render: () => <Sections disabled />,
    play: async ({ canvasElement }) => {
        const el = trigger(canvasElement);
        await expect(el).toBeDisabled();
        const item = el.closest('.plus-accordion-item');
        await expect(getComputedStyle(item).opacity).toBe(probe(canvasElement, 'opacity', 'var(--ds-opacity-disabled)'));
        await userEvent.click(el, { pointerEventsCheck: 0 });
        await expect(el).toHaveAttribute('aria-expanded', 'false');
    },
};

const expansionPlay = async ({ canvasElement }, reduced = false) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Session notes' });
    await userEvent.click(trigger);
    const detail = await canvas.findByText('Notes from the session');
    const panel = detail.closest('.plus-accordion-panel');
    await expect(panel).not.toBeNull();
    await waitFor(() => expect(panel.getBoundingClientRect().height).toBeGreaterThan(0));
    if (reduced) await expect(panel.style.height).toBe('auto');
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(detail.isConnected).toBe(true);
    await waitFor(() => expect(detail.isConnected).toBe(false));
};
export const MotionOpenClose = {
    render: () => <Accordion items={[{ eventKey: 'notes', header: 'Session notes', body: 'Notes from the session' }]} />,
    play: expansionPlay,
};
export const MotionReduced = {
    ...MotionOpenClose,
    decorators: [withReducedMotion],
    play: (context) => expansionPlay(context, true),
};
