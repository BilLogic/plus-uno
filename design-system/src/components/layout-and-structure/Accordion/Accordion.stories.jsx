import { withReducedMotion } from '@/storybook-docs/lib/overlay-motion-plays';
import React from 'react';
import { Avatar, Button } from '@/components';
import { webAppSourceSnippets } from '@/storybook-docs/web-app-source-snippets.js';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import Accordion from './Accordion';
import { expectHovered, expectPressed, expectFocusRing } from '@/storybook-docs/lib/button-states.js';
import { probe, px, tokenColor, tokenLength } from '@/storybook-docs/lib/style-probes.js';
import { DemoLabel } from '@/storybook-docs/lib/template-demo';

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
        onClick: {
            storyOnly: true,
            table: { disable: true },
        },
        style: {
            storyOnly: true,
            table: { disable: true },
        },
        // DESIGN
        appearance: {
            control: 'inline-radio',
            options: ['separated', 'grouped'],
            description: 'Separated gives each item its own container; grouped is one bordered box with dividers',
            table: { category: 'Design' }
        },
        flush: {
            control: 'boolean',
            description: 'Grouped look without the outer border, for an accordion inside a card or panel',
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
const groupedSampleItems = sampleItems.map((item) => ({ ...item, header: `${item.header} (grouped)` }));
const flushSampleItems = sampleItems.map((item) => ({ ...item, header: `${item.header} (flush)` }));

const accordionPage = {
    display: 'flex',
    flexDirection: 'column',
    gap: '48px' /* token gap: 48px */,
    maxWidth: '800px' /* token gap: 800px */,
};

function AccordionVariantsDemos() {
    return (
        <>
            <section>
                <p className="body-default" style={{ marginBottom: 'var(--stack-xl)', color: 'var(--ds-text)' }}>
                    Separated accordion: each item is its own container, with one open at a time.
                </p>
                <Accordion items={sampleItems} defaultActiveKey="0" />
            </section>
            <section>
                <p className="body-default" style={{ marginBottom: 'var(--stack-xl)', color: 'var(--ds-text)' }}>
                    Grouped accordion: one bordered box with dividers between items.
                </p>
                <Accordion items={groupedSampleItems} defaultActiveKey="0" appearance="grouped" />
            </section>
            <section>
                <p className="body-default" style={{ marginBottom: 'var(--stack-xl)', color: 'var(--ds-text)' }}>
                    Borderless accordion for seamless integration with surrounding content.
                </p>
                <div style={{ border: 'var(--border-width-default) dashed var(--ds-border)', padding: 0 }}>
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
                <p className="body-default" style={{ marginBottom: 'var(--stack-xl)', color: 'var(--ds-text)' }}>
                    Multiple accordion items can be open simultaneously.
                </p>
                <Accordion items={sampleItems} defaultActiveKey={['0', '1']} alwaysOpen />
            </section>
            <section>
                <DemoLabel>ALL COLLAPSED</DemoLabel>
                <p className="body-default" style={{ marginBottom: 'var(--stack-xl)', color: 'var(--ds-text)' }}>
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
            <p className="body-default" style={{ marginBottom: 'var(--stack-xl)', color: 'var(--ds-text)' }}>
                Individual items can be disabled to prevent interaction.
            </p>
            <Accordion
                items={[
                    { eventKey: '0', header: 'Session notes', body: 'Worked through two-step equations with Maya K. at Lincoln Middle.' },
                    { eventKey: '1', header: 'Parent summary', body: 'Available once your session reflection is submitted.', disabled: true },
                    { eventKey: '2', header: 'Next steps', body: 'Assign two practice sets on solving equations before Thursday.' }
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
            <p className="body-default" style={{ marginBottom: 'var(--stack-xl)', color: 'var(--ds-text)' }}>
                Accordion supports both the <code>items</code> array prop and direct child components.
            </p>
            <Accordion defaultActiveKey="custom-1">
                <Accordion.Item eventKey="custom-1" header="Session plan">
                    <p>Review the warm-up problems and target goal before starting the call.</p>
                    <Button appearance="primary" spacing="compact">
                        Open lesson plan
                    </Button>
                </Accordion.Item>
                <Accordion.Item eventKey="custom-2" header="Warm-up check">
                    <p>Three quick problems on two-step equations to check recall from Tuesday.</p>
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
Styles.play = async ({ canvasElement }) => {
    const trigger = canvasElement.querySelector('.plus-accordion-trigger');
    await expect(px(getComputedStyle(trigger, '::after').fontSize)).toBe(tokenLength(canvasElement, '--icon-sm'));
};

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
const interactiveItems = [
    {
        eventKey: '0',
        header: 'Session notes',
        body: 'Worked through two-step equations with Maya K. and checked three practice problems.'
    },
    {
        eventKey: '1',
        header: 'Goals',
        body: 'Solve equations with variables on both sides without a worked example by Nov 24.'
    },
    {
        eventKey: '2',
        header: 'Materials',
        body: 'Linear equations slide deck and Lincoln Middle Grade 7 practice worksheet.'
    },
    {
        eventKey: '3',
        header: 'Practice sets',
        body: 'Two independent sets assigned for Thursday before the next check-in.'
    },
    {
        eventKey: '4',
        header: 'Attendance',
        body: 'Maya K. joined on time at 3:30 PM ET for the full 45-minute math session.'
    },
    {
        eventKey: '5',
        header: 'Lead tutor note',
        body: 'Good pacing during the warm-up; leave five minutes for the exit ticket.'
    }
];

export const Interactive = (args) => {
    const items = interactiveItems.slice(0, args.itemCount || 3);

    return (
        <div style={{ maxWidth: '800px' /* token gap: 800px */ }}>
            <Accordion
                appearance={args.appearance}
                flush={args.flush}
                alwaysOpen={args.alwaysOpen}
                items={items}
                defaultActiveKey={args.alwaysOpen ? ['0'] : '0'}
            />
        </div>
    );
};

Interactive.args = {
    appearance: 'separated',
    flush: false,
    alwaysOpen: false,
    itemCount: 3
};

/* ------------------------------------------------------------------- states */

const Sections = ({ defaultActiveKey, disabled = false, appearance }) => (
    <div style={{ maxWidth: '520px' }}>
        <Accordion defaultActiveKey={defaultActiveKey} appearance={appearance}>
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
        await expectHovered(canvasElement, trigger(canvasElement), 'subtle', 'accordion trigger');
    },
};

/** Pressed: the neutral subtle pressed ground. */
export const Pressed = {
    render: () => <Sections />,
    play: async ({ canvasElement }) => {
        await expectPressed(canvasElement, trigger(canvasElement), 'subtle', 'accordion trigger');
    },
};

/** Focused: the 2px ring, 2px off the edge; the ground stays put. */
export const Focused = {
    render: () => <Sections />,
    play: async ({ canvasElement }) => {
        await expectFocusRing(canvasElement, trigger(canvasElement), 'accordion trigger');
    },
};

/** Expanded: the header stays plain on the surface, and a press closes it again. */
export const Expanded = {
    render: () => <Sections defaultActiveKey="0" />,
    play: async ({ canvasElement }) => {
        const el = trigger(canvasElement);
        await expect(el).toHaveAttribute('aria-expanded', 'true');
        await expect(getComputedStyle(el).backgroundColor).toBe(tokenColor(canvasElement, '--ds-surface'));
        await userEvent.click(el);
        await expect(el).toHaveAttribute('aria-expanded', 'false');
    },
};

/** Expanded, grouped: the selected ground, and a press closes it again. */
export const ExpandedGrouped = {
    render: () => <Sections defaultActiveKey="0" appearance="grouped" />,
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

/* --------------------------------------------------- separated + summary */

const reflectionStudents = [
    { eventKey: 'maya', name: 'Maya K.', summary: 'Engaged · 2 tags · note added', body: 'Explained each step back before moving on. Two tags: persistence, checking work.' },
    { eventKey: 'jon', name: 'Jon P.', summary: 'Quiet · 1 tag', body: 'Needed a prompt to start the second set; finished it without help.' },
    { eventKey: 'ana', name: 'Ana R.', summary: 'Distracted · no tags yet', body: 'Joined late and left early. Nothing to tag yet.' },
];

const reflectionItems = reflectionStudents.map(({ name, ...item }) => ({
    ...item,
    header: name,
    elemBefore: <Avatar name={name} size={32} />,
}));

/** A reflection student list: an avatar, the name, and one summary line under it. */
export const WithSummary = {
    render: () => (
        <div style={{ maxWidth: '520px' }}>
            <Accordion items={reflectionItems} defaultActiveKey="maya" />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const maya = canvas.getByRole('button', { name: /Maya K\./ });
        await expect(maya).toHaveAttribute('aria-expanded', 'true');
        await expect(within(maya).getByText('Engaged · 2 tags · note added')).toBeVisible();
        const items = canvasElement.querySelectorAll('.plus-accordion-item');
        await expect(items).toHaveLength(3);
        // Each item is its own container with the card radius, and a gap between.
        await expect(getComputedStyle(items[0]).borderTopLeftRadius).toBe(tokenLength(canvasElement, '--card-radius') + 'px');
        const gap = items[1].getBoundingClientRect().top - items[0].getBoundingClientRect().bottom;
        await expect(gap).toBe(tokenLength(canvasElement, '--stack-sm'));
        // The open body starts where the title starts.
        const title = maya.querySelector('.plus-accordion-title');
        const body = canvasElement.querySelector('.plus-accordion-body');
        await expect(Math.round(body.getBoundingClientRect().left + parseFloat(getComputedStyle(body).paddingLeft))).toBe(Math.round(title.getBoundingClientRect().left));
    },
};

/** Open and close by click and by keyboard; each header is one button inside a heading. */
export const OpenCloseByClickAndKeyboard = {
    render: () => (
        <div style={{ maxWidth: '520px' }}>
            <Accordion items={reflectionItems} />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const jon = canvas.getByRole('button', { name: /Jon P\./ });
        await expect(jon.closest('h2, h3, h4, h5, h6')).not.toBeNull();
        await userEvent.click(jon);
        await expect(jon).toHaveAttribute('aria-expanded', 'true');
        await userEvent.click(jon);
        await expect(jon).toHaveAttribute('aria-expanded', 'false');
        jon.focus();
        await userEvent.keyboard('{Enter}');
        await expect(jon).toHaveAttribute('aria-expanded', 'true');
        await userEvent.keyboard(' ');
        await expect(jon).toHaveAttribute('aria-expanded', 'false');
        await userEvent.keyboard('{Tab}');
        await expect(canvas.getByRole('button', { name: /Ana R\./ })).toHaveFocus();
    },
};

/** A long title wraps; a long summary stays on one line and is cut with an ellipsis. */
export const Overflow = {
    render: () => (
        <div style={{ maxWidth: '360px' }}>
            <Accordion
                items={[{
                    eventKey: 'long',
                    header: 'Alexandria Montgomery-Featherstonehaugh, Lincoln Middle School Grade 7 math',
                    summary: 'Engaged throughout the warm-up and the first practice set · 4 tags · note added after the session',
                    elemBefore: <Avatar name="Alexandria Montgomery" size={32} />,
                    body: 'Notes from the session.',
                }]}
            />
        </div>
    ),
    play: async ({ canvasElement }) => {
        const summary = canvasElement.querySelector('.plus-accordion-summary');
        await expect(getComputedStyle(summary).textOverflow).toBe('ellipsis');
        await expect(summary.scrollWidth).toBeGreaterThan(summary.clientWidth);
        const item = canvasElement.querySelector('.plus-accordion-item');
        await expect(canvasElement.querySelector('.plus-accordion-trigger').scrollWidth).toBeLessThanOrEqual(item.clientWidth);
    },
};
