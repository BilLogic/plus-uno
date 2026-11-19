import React from 'react';
import { expect } from 'storybook/test';
import {
    Breadcrumb,
    Button,
    Radio,
    TextField,
} from '@/components';
import { Page, Card, Section } from '@/templates';
import { Do, Dont, DoDont, RingDemo } from '@/storybook-docs/foundation-blocks.jsx';
import { InAppFrame } from '@/storybook-docs/lib/template-demo';

/**
 * Specimens for Foundations / Visual / Border: live PLUS fields, focus rings,
 * dividers, app frame edges, and selection outlines.
 */
export default {
    title: 'Foundations/Visual/Border',
    tags: ['!dev', '!autodocs'],
    parameters: { layout: 'padded' },
};

const captionStyle = { font: 'var(--body-sm)', color: 'var(--ds-text-subtle)' };
const labelStyle = { color: 'var(--ds-text)', font: 'var(--body-sm)' };
const fieldStackStyle = { display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)', width: '100%' };

/** Width paired with color across field states. */
export const PairWidthWithColor = {
    render: () => (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(var(--card-min-width-sm), 1fr))',
                gap: 'var(--stack-xl)',
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
                <TextField id="border-pair-default" label="Session" defaultValue="Lincoln Middle" />
                <span style={captionStyle}>Default: Border/default + color/border/input</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
                <TextField
                    id="border-pair-invalid"
                    label="Session"
                    defaultValue="Lincoln Middle"
                    isInvalid
                    errorMessage="Validation message"
                />
                <span style={captionStyle}>Invalid: Border/default + color/border/danger</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
                <div style={fieldStackStyle}>
                    <span aria-hidden="true" style={labelStyle}>Session</span>
                    <RingDemo style={{ borderRadius: 'var(--radius-control-lg)', width: '100%' }}>
                        <TextField id="border-pair-focused" label="Session" isLabelHidden defaultValue="Lincoln Middle" />
                    </RingDemo>
                </div>
                <span style={captionStyle}>Focused: Border/focused + color/border/focused</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
                <TextField id="border-pair-disabled" label="Session" defaultValue="Lincoln Middle" isDisabled />
                <span style={captionStyle}>Disabled: Border/default + color/border/disabled</span>
            </div>
        </div>
    ),
    play: async ({ canvas }) => {
        await expect(canvas.getAllByRole('textbox', { name: 'Session' })).toHaveLength(4);
    },
};

/** Focus ring outside a button and a field, leaving the control fill unchanged. */
export const FocusRingShowcase = {
    render: () => (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 'var(--stack-xl) var(--inline-xl)', padding: 'var(--pad-x-md)' }}>
            <RingDemo style={{ borderRadius: 'var(--radius-control-md)' }}>
                <Button text="Button" appearance="primary" />
            </RingDemo>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)', minWidth: 'var(--field-width-md)' }}>
                <span aria-hidden="true" style={labelStyle}>School</span>
                <RingDemo style={{ borderRadius: 'var(--radius-control-lg)', width: '100%' }}>
                    <TextField id="border-focus-school" label="School" isLabelHidden placeholder="Lincoln Middle" />
                </RingDemo>
            </div>
        </div>
    ),
    play: async ({ canvas }) => {
        await expect(canvas.getByRole('button', { name: 'Button' })).toBeInTheDocument();
        await expect(canvas.getByRole('textbox', { name: 'School' })).toBeInTheDocument();
    },
};

/** Focus is a ring outside the field, never a fill across it. */
export const FocusRingDoDont = {
    render: () => (
        <DoDont>
            <Do caption="The field keeps its fill and gains the ring."><TheFieldKeepsDoFigure /></Do>
            <Dont caption="A filled field reads as selected and hides what is typed."><AFilledFieldDontFigure /></Dont>
        </DoDont>
    ),
    play: async ({ canvas }) => {
        const inputs = canvas.getAllByRole('textbox', { name: 'Session' });
        await expect(inputs).toHaveLength(2);
    },
};

/** Space separates items inside a group; a 1 px divider separates two groups or two controls. */
export const Dividers = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-xl)' }}>
            <Card>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-xl)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                        <span style={{ font: 'var(--heading-xs)', color: 'var(--ds-text)' }}>Upcoming sessions</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--inline-md)' }}>
                            <Button appearance="default" text="Grade 6 math" />
                            <Button appearance="default" text="Grade 7 algebra" />
                        </div>
                    </div>
                    <hr
                        style={{
                            border: 0,
                            borderBlockStart: 'var(--border-width-default) solid var(--ds-border)',
                            margin: 0,
                            width: '100%',
                        }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                        <span style={{ font: 'var(--heading-xs)', color: 'var(--ds-text)' }}>Past sessions</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--inline-md)' }}>
                            <Button appearance="subtle" text="Oct 24 review" />
                            <Button appearance="subtle" text="Oct 20 check-in" />
                        </div>
                    </div>
                </div>
            </Card>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--inline-md)', height: 'var(--control-md)' }}>
                <Button appearance="subtle" text="Day" isSelected />
                <span
                    aria-hidden="true"
                    style={{ alignSelf: 'stretch', borderInlineStart: 'var(--border-width-default) solid var(--ds-border)' }}
                />
                <Button appearance="subtle" text="Week" />
            </div>
        </div>
    ),
    play: async ({ canvas }) => {
        await expect(canvas.getByRole('separator')).toBeInTheDocument();
        await expect(canvas.getByRole('button', { name: 'Day' })).toBeInTheDocument();
        await expect(canvas.getByRole('button', { name: 'Week' })).toBeInTheDocument();
    },
};

/** Docked sidebar carries one 1 px border on its page edge; the page header carries none. */
export const SidebarEdges = {
    render: () => (
        <DoDont>
            <Do caption="One hairline on the sidebar edge.">
                <InAppFrame
                    height="var(--height-2000)"
                    panelStorageKey={null}
                    breadcrumbs={[{ text: 'Home', href: '#home' }, { text: 'Sessions' }]}
                >
                    <Page>
                        <Section title="Upcoming sessions" />
                    </Page>
                </InAppFrame>
            </Do>
            <Dont caption="A line under the page header adds a second edge the Frame does not use."><ALineUnderDontFigure /></Dont>
        </DoDont>
    ),
    play: async ({ canvas }) => {
        await expect(canvas.getAllByRole('heading', { name: 'Upcoming sessions' })).toHaveLength(2);
    },
};

/** Selection wraps the whole shape with the 2 px selected border, never a single-edge stripe. */
export const WholeSelectionOutline = {
    render: () => (
        <DoDont>
            <Do caption="The 2 px outline wraps the whole row.">
                <Radio
                    appearance="tile"
                    name="border-whole-do"
                    value="lincoln"
                    label="Lincoln Middle"
                    description="Tuesdays, 4:30 PM"
                    defaultChecked
                />
            </Do>
            <Dont caption="A colored stripe on one edge marks nothing the system recognizes; use the full outline, a fill or an icon."><AColoredStripeDontFigure /></Dont>
        </DoDont>
    ),
    play: async ({ canvas }) => {
        const radios = canvas.getAllByRole('radio', { name: /Lincoln Middle/ });
        await expect(radios).toHaveLength(2);
        await expect(radios[0]).toBeChecked();
        await expect(radios[1]).toBeChecked();
    },
};

/** Resting controls keep Border/default; Border/selected is reserved for selection. */
export const SelectedWidthOnlyForSelection = {
    render: () => (
        <DoDont>
            <Do caption="Resting rows and cards keep Border/default.">
                <Radio
                    appearance="tile"
                    name="border-rest-do"
                    value="lincoln"
                    label="Lincoln Middle"
                    description="Tuesdays, 4:30 PM"
                />
            </Do>
            <Dont caption="The 2 px width on a resting row reads as selected, so users cannot tell what is chosen."><The2PxDontFigure /></Dont>
        </DoDont>
    ),
    play: async ({ canvas }) => {
        const radios = canvas.getAllByRole('radio', { name: /Lincoln Middle/ });
        await expect(radios).toHaveLength(2);
        await expect(radios[0]).not.toBeChecked();
        await expect(radios[1]).not.toBeChecked();
    },
};

const TheFieldKeepsDoFigure = () => (
    <>
        <div style={fieldStackStyle}>
            <span aria-hidden="true" style={labelStyle}>Session</span>
            <RingDemo style={{ borderRadius: 'var(--radius-control-lg)', width: '100%' }}>
                <TextField id="border-ring-do" label="Session" isLabelHidden defaultValue="Lincoln Middle Thursday" />
            </RingDemo>
        </div>
    </>
);

const AFilledFieldDontFigure = () => (
    <>
        <div style={fieldStackStyle}>
            <span aria-hidden="true" style={labelStyle}>Session</span>
            <div
                style={{
                    width: '100%',
                    '--ds-background-input': 'var(--ds-background-brand-bold)',
                    '--ds-border-input': 'var(--ds-border-brand)',
                    '--ds-text': 'var(--ds-text-inverse)',
                }}
            >
                <TextField id="border-ring-dont" label="Session" isLabelHidden defaultValue="Lincoln Middle Thursday" />
            </div>
        </div>
    </>
);

const ALineUnderDontFigure = () => (
    <>
        <InAppFrame
            height="var(--height-2000)"
            panelStorageKey={null}
            contentAs="div"
            header={(
                <div
                    style={{
                        flex: 1,
                        borderBlockEnd: 'var(--border-width-default) solid var(--ds-border)',
                        paddingBlockEnd: 'var(--stack-sm)',
                    }}
                >
                    <Breadcrumb items={[{ text: 'Home', href: '#home' }, { text: 'Sessions' }]} label="Example breadcrumb" />
                </div>
            )}
        >
            <Page>
                <Section title="Upcoming sessions" />
            </Page>
        </InAppFrame>
    </>
);

const AColoredStripeDontFigure = () => (
    <>
        <Radio
            appearance="tile"
            name="border-whole-dont"
            value="lincoln"
            label="Lincoln Middle"
            description="Tuesdays, 4:30 PM"
            defaultChecked
            style={{
                borderWidth: 'var(--border-width-default)',
                borderColor: 'var(--ds-border)',
                borderInlineStartWidth: 'var(--border-width-selected)',
                borderInlineStartColor: 'var(--ds-border-selected)',
            }}
        />
    </>
);

const The2PxDontFigure = () => (
    <>
        <Radio
            appearance="tile"
            name="border-rest-dont"
            value="lincoln"
            label="Lincoln Middle"
            description="Tuesdays, 4:30 PM"
            style={{
                borderWidth: 'var(--border-width-selected)',
                borderColor: 'var(--ds-border-selected)',
            }}
        />
    </>
);
