import React from 'react';
import { Button, Input, Tag, Suggestion } from '@/components';
import { PatternCard } from '@/patterns';
import { Do, Dont, DoDont, C } from '@/storybook-docs/foundation-blocks.jsx';

/**
 * Specimens for Foundations/Spacing: the three kinds of box, and the spacing
 * principles as Do and Don't pairs. Every gap is a spacing token; a Don't that
 * shows a wrong gap names the wrong value in its caption.
 */
export default {
    title: 'Foundations/Spacing',
    tags: ['!dev', '!autodocs'],
};

const box = {
    padding: 'var(--modal-pad)',
    borderRadius: 'var(--modal-radius)',
    background: 'var(--ds-surface-overlay)',
    boxShadow: 'var(--ds-shadow-overlay)',
    color: 'var(--ds-text)',
};
const col = (gap) => ({ display: 'flex', flexDirection: 'column', gap });
const row = (gap) => ({ display: 'flex', alignItems: 'center', gap, flexWrap: 'wrap' });
const tag = { font: 'var(--body-small)', color: 'var(--ds-text-subtle)' };

const School = ({ id }) => <Input id={`${id}-school`} label="School" placeholder="Select a school" />;
const Teacher = ({ id }) => <Input id={`${id}-teacher`} label="Teacher" placeholder="Select a teacher" />;
const SessionDate = ({ id }) => <Input id={`${id}-date`} label="Session date" defaultValue="Tuesday, June 3" />;

/** Item, Container and Wrapper: the kind of box decides its pad. */
export const ThreeKinds = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(var(--card-min-width-sm), 1fr))', gap: 'var(--layout-gutter)' }}>
        <div style={col('var(--element-stack-md)')}>
            <span><Button text="Save changes" style="primary" fill="filled" /></span>
            <span style={{ font: 'var(--heading-xsmall)', color: 'var(--ds-text)' }}>Item</span>
            <span style={tag}>A minimum height, and pad-x larger than pad-y: 32 = 20 line + 2 × 6, pad-x 12. Button, Text field, Tag, a menu or table row.</span>
        </div>
        <div style={col('var(--element-stack-md)')}>
            <PatternCard title="Container" description="Card/pad-md, 20 on every side." />
            <span style={{ font: 'var(--heading-xsmall)', color: 'var(--ds-text)' }}>Container</span>
            <span style={tag}>A background and one pad on every side; the height hugs. Card, Modal, Popover, Flag, Section message.</span>
        </div>
        <div style={col('var(--element-stack-md)')}>
            <span style={row('var(--element-inline-md)')}>
                <Button text="Cancel" style="default" fill="outline" />
                <Button text="Save" style="primary" fill="filled" />
            </span>
            <span style={{ font: 'var(--heading-xsmall)', color: 'var(--ds-text)' }}>Wrapper</span>
            <span style={tag}>No fill and no pad. It only arranges its children with a gap or a grid. Section, Button group, Tag group, a form row.</span>
        </div>
    </div>
);

/** Items pad by their height: compact 24, default 32, label 20. */
export const ItemHeights = () => (
    <div style={row('var(--surface-stack-md)')}>
        <div style={col('var(--element-stack-md)')}>
            <span><Button text="Compact" size="small" style="default" fill="outline" /></span>
            <span style={tag}>24 · pad-y 2, pad-x 8 · table rows and inline toolbars</span>
        </div>
        <div style={col('var(--element-stack-md)')}>
            <span><Button text="Default" style="default" fill="outline" /></span>
            <span style={tag}>32 · pad-y 6, pad-x 12 · buttons, tabs, menu rows, fields</span>
        </div>
        <div style={col('var(--element-stack-md)')}>
            <span><Tag text="Grade 7" /></span>
            <span style={tag}>Label 20 · pad-x 4 · Tag, Status, Count</span>
        </div>
    </div>
);

/** 1 · Similarity: the same kind of thing takes the same gap. */
export const Similarity = () => (
    <DoDont>
        <Do caption={<>Three fields in one group, <C>--modal-stack-md</C> (16) between each.</>}>
            <div style={{ ...box, ...col('var(--modal-stack-md)') }}>
                <School id="sim-do" /><Teacher id="sim-do" /><SessionDate id="sim-do" />
            </div>
        </Do>
        <Dont caption="The same fields 8 and 24 apart. Uneven gaps suggest groups that are not there.">
            <div style={{ ...box, ...col(0) }}>
                <School id="sim-dont" />
                <div style={{ height: 'var(--space-050)' }} />
                <Teacher id="sim-dont" />
                <div style={{ height: 'var(--space-150)' }} />
                <SessionDate id="sim-dont" />
            </div>
        </Dont>
    </DoDont>
);

/** 2 · Differentiation: a new group gets a bigger gap. */
export const Differentiation = () => (
    <DoDont>
        <Do caption={<><C>--modal-stack-lg</C> (24) between the suggestion and the fields; <C>--modal-stack-md</C> (16) between the fields.</>}>
            <div style={{ ...box, ...col('var(--modal-stack-lg)') }}>
                <span><Suggestion label="Use last week's school and teacher" /></span>
                <div style={col('var(--modal-stack-md)')}><School id="dif-do" /><Teacher id="dif-do" /></div>
            </div>
        </Do>
        <Dont caption="One small gap everywhere. The suggestion and the form run together.">
            <div style={{ ...box, ...col('var(--modal-stack-sm)') }}>
                <span><Suggestion label="Use last week's school and teacher" /></span>
                <School id="dif-dont" /><Teacher id="dif-dont" />
            </div>
        </Dont>
    </DoDont>
);

const MiniSection = ({ title, gap, cardGap }) => (
    <div style={col(gap)}>
        <span style={{ font: 'var(--heading-small)', color: 'var(--ds-text)' }}>{title}</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: cardGap }}>
            <PatternCard title="Algebra" description="4 students" />
            <PatternCard title="Geometry" description="6 students" />
        </div>
    </div>
);

/** 3 · Rhythm: gaps come in tiers that grow with the box. */
export const Rhythm = () => (
    <DoDont>
        <Do caption={<>Sections 24 apart (<C>--surface-stack-md</C>), heading to cards 16 (<C>--section-stack-md</C>), cards 16 apart on the gutter.</>}>
            <div style={col('var(--surface-stack-md)')}>
                <MiniSection title="This week" gap="var(--section-stack-md)" cardGap="var(--layout-gutter)" />
                <MiniSection title="Next week" gap="var(--section-stack-md)" cardGap="var(--layout-gutter)" />
            </div>
        </Do>
        <Dont caption="16 everywhere. Sections, headings and cards sit the same distance apart, so nothing groups.">
            <div style={col('var(--space-100)')}>
                <MiniSection title="This week" gap="var(--space-100)" cardGap="var(--space-100)" />
                <MiniSection title="Next week" gap="var(--space-100)" cardGap="var(--space-100)" />
            </div>
        </Dont>
    </DoDont>
);

/** 4 · Hierarchy: headings and primary actions get room. */
export const Hierarchy = () => (
    <DoDont>
        <Do caption={<>Title to description <C>--card-stack-sm</C> (4), heading to body <C>--section-stack-md</C> (16), body to the action <C>--section-stack-lg</C> (24).</>}>
            <div style={col(0)}>
                <div style={col('var(--card-stack-sm)')}>
                    <span style={{ font: 'var(--heading-medium)', color: 'var(--ds-text)' }}>Profile</span>
                    <span style={{ font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>Shown to your students.</span>
                </div>
                <div style={{ height: 'var(--section-stack-md)' }} />
                <Input id="hie-do-name" label="Display name" defaultValue="Maya Chen" />
                <div style={{ height: 'var(--section-stack-lg)' }} />
                <span><Button text="Save changes" style="primary" fill="filled" /></span>
            </div>
        </Do>
        <Dont caption="Everything 8 apart. The heading and the action are lost in the body.">
            <div style={col('var(--space-050)')}>
                <span style={{ font: 'var(--heading-medium)', color: 'var(--ds-text)' }}>Profile</span>
                <span style={{ font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>Shown to your students.</span>
                <Input id="hie-dont-name" label="Display name" defaultValue="Maya Chen" />
                <span><Button text="Save changes" style="primary" fill="filled" /></span>
            </div>
        </Dont>
    </DoDont>
);

const Footer = () => (
    <span style={{ ...row('var(--modal-inline-sm)'), justifyContent: 'flex-end' }}>
        <Button text="Cancel" style="default" fill="outline" />
        <Button text="Create session" style="primary" fill="filled" />
    </span>
);

/** 5 · White space: a modal breathes before its footer. */
export const WhiteSpace = () => (
    <DoDont>
        <Do caption={<><C>--modal-pad</C> 16 on every side, <C>--modal-stack-lg</C> (24) from the fields to the footer.</>}>
            <div style={{ ...box, ...col('var(--modal-stack-lg)') }}>
                <span style={{ font: 'var(--heading-medium)' }}>Create new session</span>
                <div style={col('var(--modal-stack-md)')}><School id="ws-do" /><SessionDate id="ws-do" /></div>
                <Footer />
            </div>
        </Do>
        <Dont caption="The footer squeezed 4 under the last field. Commit actions need distance from the inputs.">
            <div style={{ ...box, ...col(0) }}>
                <span style={{ font: 'var(--heading-medium)' }}>Create new session</span>
                <div style={{ height: 'var(--modal-stack-lg)' }} />
                <div style={col('var(--modal-stack-md)')}><School id="ws-dont" /><SessionDate id="ws-dont" /></div>
                <div style={{ height: 'var(--space-025)' }} />
                <Footer />
            </div>
        </Dont>
    </DoDont>
);

/** Never hand-space: step to the next tier instead. */
export const NeverHandSpace = () => (
    <DoDont>
        <Do caption={<>The gap looked tight, so it steps up a tier: <C>--section-stack-lg</C> (24).</>}>
            <div style={col('var(--section-stack-lg)')}>
                <span style={{ font: 'var(--heading-small)', color: 'var(--ds-text)' }}>Upcoming</span>
                <PatternCard title="Algebra with Maya" description="Tuesday, 11:00 am" />
            </div>
        </Do>
        <Dont caption="6 added under a 16 gap because it looked tight. The extra space is invisible in the tokens and nobody can repeat it.">
            <div style={col('var(--section-stack-md)')}>
                <span style={{ font: 'var(--heading-small)', color: 'var(--ds-text)', paddingBottom: 'var(--space-0375)' }}>Upcoming</span>
                <PatternCard title="Algebra with Maya" description="Tuesday, 11:00 am" />
            </div>
        </Dont>
    </DoDont>
);

const Metric = ({ value, label, divider }) => (
    <div style={{ ...col('var(--card-stack-sm)'), paddingTop: divider ? 'var(--card-stack-lg)' : 0, borderTop: divider ? 'var(--border-default) solid var(--ds-border)' : 'none' }}>
        <span style={{ font: 'var(--metric-medium)', color: 'var(--ds-text)' }}>{value}</span>
        <span style={{ font: 'var(--body-small)', color: 'var(--ds-text-subtle)' }}>{label}</span>
    </div>
);

/** No card inside a card. */
export const NoCardInCard = () => (
    <DoDont>
        <Do caption="One card; three metrics stacked in its body, split by dividers.">
            <PatternCard title="Sessions this week" gap="lg">
                <div style={col('var(--card-stack-lg)')}>
                    <Metric value="128" label="Completed" />
                    <Metric value="12" label="Canceled" divider />
                    <Metric value="4" label="No-shows" divider />
                </div>
            </PatternCard>
        </Do>
        <Dont caption="Three mini cards inside the card. Shadows pile up and the hierarchy flattens.">
            <PatternCard title="Sessions this week" gap="lg">
                <div style={col('var(--card-stack-md)')}>
                    <PatternCard padding="sm"><Metric value="128" label="Completed" /></PatternCard>
                    <PatternCard padding="sm"><Metric value="12" label="Canceled" /></PatternCard>
                    <PatternCard padding="sm"><Metric value="4" label="No-shows" /></PatternCard>
                </div>
            </PatternCard>
        </Dont>
    </DoDont>
);
