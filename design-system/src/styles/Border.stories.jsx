import React from 'react';
import { expect, userEvent } from 'storybook/test';
import {
    Button,
    ButtonGroup,
    Radio,
    RadioGroup,
    StaticTable,
    TextField,
} from '@/components';
import { Page, PatternCard, PatternSection } from '@/patterns';
import { Do, Dont, DoDont, RingDemo } from '@/storybook-docs/foundation-blocks.jsx';
import { InAppFrame } from '@/storybook-docs/lib/pattern-demo.jsx';

export default {
    title: 'Foundations/Visual/Border',
    tags: ['!dev', '!autodocs'],
};

const caption = { font: 'var(--body-sm)', color: 'var(--ds-text-subtle)' };

/** Pair width and color tokens by role across field states. */
export const PairWidthWithColor = {
    render: () => (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(var(--card-min-width-sm), 1fr))', gap: 'var(--grid-gutter)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                <TextField id="border-pair-default" label="Session topic" defaultValue="Fractions and unit rates" />
                <span style={caption}>Default: Border/default + color/border/input</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                <TextField
                    id="border-pair-invalid"
                    label="Session topic"
                    defaultValue="Math"
                    isInvalid
                    errorMessage="Name the unit or topic."
                />
                <span style={caption}>Invalid: Border/default + color/border/danger</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)', alignItems: 'flex-start' }}>
                    <span style={{ font: 'var(--body-sm)', fontWeight: 'var(--type-weight-medium)', color: 'var(--ds-text)' }}>Save action</span>
                    <RingDemo style={{ borderRadius: 'var(--radius-control-md)' }}>
                        <Button text="Save schedule" appearance="primary" />
                    </RingDemo>
                </div>
                <span style={caption}>Focused: Border/focused + color/border/focused</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                <TextField id="border-pair-disabled" label="Session topic" defaultValue="Fractions and unit rates" isDisabled />
                <span style={caption}>Disabled: Border/default + color/border/disabled</span>
            </div>
        </div>
    ),
    play: async ({ canvas }) => {
        await expect(canvas.getAllByRole('textbox')).toHaveLength(3);
        await expect(canvas.getByRole('button', { name: 'Save schedule' })).toBeInTheDocument();
        await expect(canvas.getByText('Name the unit or topic.')).toBeInTheDocument();
    },
};

/** Focus ring sits 2px outside the control with the fill unchanged. */
export const FocusRingShowcase = {
    render: () => (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 'var(--section-stack-md)', padding: 'var(--pad-x-md)' }}>
            <RingDemo style={{ borderRadius: 'var(--radius-control-md)' }}>
                <Button text="Save schedule" appearance="primary" />
            </RingDemo>
            <div style={{ minWidth: 'var(--field-width-md)' }}>
                <RingDemo style={{ borderRadius: 'var(--radius-control-lg)', width: '100%' }}>
                    <TextField id="border-focus-school" label="School" placeholder="Lincoln Middle" />
                </RingDemo>
            </div>
        </div>
    ),
    play: async ({ canvas }) => {
        const input = canvas.getByRole('textbox', { name: 'School' });
        input.focus();
        await expect(input).toHaveFocus();
    },
};

/** Focus uses an outer ring, never a darkened fill. */
export const FocusRingDoDont = {
    render: () => (
        <DoDont>
            <Do caption="The field keeps its fill and gains the ring.">
                <RingDemo style={{ borderRadius: 'var(--radius-control-lg)', width: '100%' }}>
                    <TextField id="border-ring-do" label="Session" defaultValue="Lincoln Middle Thursday" />
                </RingDemo>
            </Do>
            <Dont caption="A filled field reads as selected and hides what is typed.">
                <div className="sb-border-dont-fill" style={{ width: '100%' }}>
                    <style>{'.sb-border-dont-fill .plus-field { background-color: var(--ds-background-brand-bold); } .sb-border-dont-fill .plus-field__control { color: var(--ds-text-inverse); }'}</style>
                    <TextField id="border-ring-dont" label="Session" defaultValue="Lincoln Middle Thursday" />
                </div>
            </Dont>
        </DoDont>
    ),
    play: async ({ canvas }) => {
        await expect(canvas.getAllByRole('textbox', { name: 'Session' })).toHaveLength(2);
    },
};

/** Horizontal rules in a StaticTable and a vertical seam inside a ButtonGroup. */
export const Dividers = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-stack-md)', alignItems: 'flex-start' }}>
            <div style={{ width: '100%' }}>
                <StaticTable
                    headers={['Session', 'Time']}
                    rows={[
                        ['Algebra B · Maya Rodriguez', 'Tuesday, 4:30 PM'],
                        ['Geometry · Jordan Lee', 'Thursday, 3:30 PM'],
                    ]}
                />
            </div>
            <ButtonGroup label="Calendar view">
                <Button text="Day" isSelected />
                <Button text="Week" />
            </ButtonGroup>
        </div>
    ),
    play: async ({ canvas }) => {
        await expect(canvas.getByRole('table')).toBeInTheDocument();
        await expect(canvas.getByRole('button', { name: 'Day' })).toBeInTheDocument();
        await expect(canvas.getByRole('button', { name: 'Week' })).toBeInTheDocument();
    },
};

/** Docked sidebar carries one 1px border on its Page-facing edge; the header row has none. */
export const SidebarEdges = {
    render: () => (
        <DoDont>
            <Do caption="One hairline on the sidebar edge.">
                <div style={{ width: '100%' }}>
                    <InAppFrame height="var(--height-2000)" panelStorageKey={null}>
                        <Page level="surface" padding="sm">
                            <PatternSection title="Upcoming sessions" />
                        </Page>
                    </InAppFrame>
                </div>
            </Do>
            <Dont caption="A line under the header row adds a second edge the Frame does not use.">
                <div style={{ width: '100%', height: 'var(--height-2000)' }}>
                    <div className="plus-frame">
                        <div className="plus-frame__row">
                            <div className="plus-frame__sidebar plus-frame__sidebar--docked" style={{ padding: 'var(--pad-x-md)', gap: 'var(--stack-sm)', font: 'var(--body-default)' }}>
                                <span>Home</span>
                                <span>Sessions</span>
                                <span>Training</span>
                            </div>
                            <div className="plus-frame__main">
                                <div className="plus-frame__content plus-frame__content--content">
                                    <div className="plus-frame__head" style={{ borderBlockEnd: 'var(--border-width-default) solid var(--ds-border)', paddingBlockEnd: 'var(--stack-sm)', font: 'var(--body-default)' }}>
                                        Topbar
                                    </div>
                                    <Page level="surface" padding="sm">
                                        <PatternSection title="Upcoming sessions" />
                                    </Page>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Dont>
        </DoDont>
    ),
    play: async ({ canvas }) => {
        await expect(canvas.getAllByRole('heading', { name: 'Upcoming sessions' })).toHaveLength(2);
    },
};

/** Selection wraps the whole shape in the 2px selected border, never a side stripe. */
export const WholeSelectionOutline = {
    render: () => (
        <DoDont>
            <Do caption="The 2 px outline wraps the whole tile.">
                <RadioGroup
                    name="border-school-do"
                    legend="School"
                    appearance="tile"
                    defaultValue="lincoln"
                    options={[
                        { value: 'lincoln', label: 'Lincoln Middle', description: 'Tuesdays, 4:30 PM' },
                        { value: 'roosevelt', label: 'Roosevelt K-8', description: 'Thursdays, 3:30 PM' },
                    ]}
                />
            </Do>
            <Dont caption="A colored stripe on one edge marks nothing the system recognizes. Use the full outline, a fill or an icon.">
                <PatternCard
                    title="Lincoln Middle"
                    style={{
                        boxShadow: 'inset 0 0 0 var(--border-width-default) var(--ds-border)',
                        borderInlineStart: 'var(--border-width-selected) solid var(--ds-border-selected)',
                    }}
                >
                    <span style={{ font: 'var(--body-sm)', color: 'var(--ds-text-subtle)' }}>Tuesdays, 4:30 PM</span>
                </PatternCard>
            </Dont>
        </DoDont>
    ),
    play: async ({ canvas }) => {
        await userEvent.click(canvas.getByText('Roosevelt K-8'));
        await expect(canvas.getByRole('radio', { name: /Roosevelt K-8/ })).toBeChecked();
    },
};

/** Resting rows and cards keep Border/default; Border/selected is reserved for selection. */
export const SelectedWidthOnlyForSelection = {
    render: () => (
        <DoDont>
            <Do caption="Resting rows and tiles keep Border/default.">
                <Radio
                    appearance="tile"
                    name="border-rest-do"
                    value="lincoln"
                    label="Lincoln Middle"
                    description="Tuesdays, 4:30 PM"
                />
            </Do>
            <Dont caption="The 2 px width on a resting card reads as selected, so users cannot tell what is chosen.">
                <PatternCard
                    title="Lincoln Middle"
                    style={{ boxShadow: 'inset 0 0 0 var(--border-width-selected) var(--ds-border-selected)' }}
                >
                    <span style={{ font: 'var(--body-sm)', color: 'var(--ds-text-subtle)' }}>Tuesdays, 4:30 PM</span>
                </PatternCard>
            </Dont>
        </DoDont>
    ),
    play: async ({ canvas }) => {
        const lincoln = canvas.getByRole('radio', { name: /Lincoln Middle/ });
        await expect(lincoln).not.toBeChecked();
    },
};
