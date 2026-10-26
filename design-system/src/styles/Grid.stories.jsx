import React from 'react';
import { Button } from '@/components';
import { PatternCard } from '@/patterns';
import { Do, Dont, DoDont, C } from '@/storybook-docs/foundation-blocks.jsx';

/**
 * Specimens for Foundations/Layout & grid: the 12 columns and the 16 gutter, and the
 * grid rules as Do and Don't pairs. Columns are drawn with the layout tokens,
 * so they follow the docs page's own width.
 */
export default {
    title: 'Foundations/Layout & grid',
    tags: ['!dev', '!autodocs'],
};

const grid12 = {
    display: 'grid',
    gridTemplateColumns: 'repeat(var(--layout-columns), minmax(0, 1fr))',
    gap: 'var(--layout-gutter)',
};
const columnFill = {
    height: 'var(--size-500)',
    borderRadius: 'var(--element-radius-md)',
    background: 'var(--ds-background-accent-blue-subtler)',
};
const caption = { font: 'var(--body-small)', color: 'var(--ds-text-subtle)' };

/** Twelve columns with a 16 gutter, inside the surface pad. */
export const GridAnatomy = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--element-stack-md)' }}>
        <div style={{ padding: 'var(--surface-pad)', borderRadius: 'var(--surface-radius)', background: 'var(--ds-surface)', boxShadow: 'inset 0 0 0 var(--border-default) var(--ds-border)' }}>
            <div style={grid12}>
                {Array.from({ length: 12 }, (_, i) => (
                    <div key={i} style={{ ...columnFill, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 'var(--element-pad-y-md)', font: 'var(--body-small)', color: 'var(--ds-text-accent-blue)' }}>
                        {i + 1}
                    </div>
                ))}
            </div>
        </div>
        <span style={caption}>12 columns · <C>--layout-gutter</C> 16 between them · <C>--surface-pad</C> around them, 16 below 1440 and 24 from 1440.</span>
    </div>
);

/** Regions span whole columns. */
export const ColumnSpans = () => (
    <div style={{ ...grid12, padding: 'var(--surface-pad)', borderRadius: 'var(--surface-radius)', background: 'var(--ds-surface)', boxShadow: 'inset 0 0 0 var(--border-default) var(--ds-border)' }}>
        <div style={{ gridColumn: 'span 12' }}><PatternCard title="span 12" description="A table or a full-width chart" /></div>
        <div style={{ gridColumn: 'span 8' }}><PatternCard title="span 8" description="The main column" /></div>
        <div style={{ gridColumn: 'span 4' }}><PatternCard title="span 4" description="A side column" /></div>
        {[0, 1, 2].map((i) => <div key={i} style={{ gridColumn: 'span 4' }}><PatternCard title="span 4" description="One of three cards" /></div>)}
    </div>
);

const ground = { padding: 'var(--card-pad-sm)', borderRadius: 'var(--card-radius)', background: 'var(--ds-surface)' };

/** Keep the gutter 16 at every width. */
export const Gutter = () => (
    <DoDont>
        <Do caption={<><C>--layout-gutter</C> 16 between all 12 columns, at every breakpoint.</>}>
            <div style={{ ...ground, ...grid12 }}>{Array.from({ length: 12 }, (_, i) => <div key={i} style={columnFill} />)}</div>
        </Do>
        <Dont caption="An 8 gutter from the older grid. It does not match code, and cards side by side lose the rhythm of the page.">
            <div style={{ ...ground, ...grid12, gap: 'var(--space-050)' }}>{Array.from({ length: 12 }, (_, i) => <div key={i} style={columnFill} />)}</div>
        </Dont>
    </DoDont>
);

/** Span whole columns. */
export const SpanWholeColumns = () => (
    <DoDont>
        <Do caption="Three cards, four columns each. Every edge lands on a column edge.">
            <div style={{ ...ground, ...grid12 }}>
                {['Algebra', 'Geometry', 'Ratios'].map((t) => <div key={t} style={{ gridColumn: 'span 4' }}><PatternCard title={t} padding="sm" /></div>)}
            </div>
        </Do>
        <Dont caption="Cards sized by hand. Their edges fall mid-gutter and mid-column, so nothing lines up with the rows above and below.">
            <div style={{ ...ground, display: 'flex', gap: 'var(--space-0625)' }}>
                {[['Algebra', '41%'], ['Geometry', '23%'], ['Ratios', '30%']].map(([t, w]) => <div key={t} style={{ width: w }}><PatternCard title={t} padding="sm" /></div>)}
            </div>
        </Dont>
    </DoDont>
);

const ModalBox = ({ width }) => (
    <div style={{ width, maxWidth: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--modal-stack-lg)', padding: 'var(--modal-pad)', borderRadius: 'var(--modal-radius)', background: 'var(--ds-surface-overlay)', boxShadow: 'var(--ds-shadow-overlay)' }}>
        <span style={{ font: 'var(--heading-medium)', color: 'var(--ds-text)' }}>Add a tutor</span>
        <span style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--modal-inline-sm)' }}>
            <Button text="Cancel" style="default" fill="outline" />
            <Button text="Add" style="primary" fill="filled" />
        </span>
    </div>
);

/** Size modals from the screen grid. */
export const ModalFromScreenGrid = () => (
    <DoDont>
        <Do caption={<>Modal <C>md</C>: <C>--layout-width-modal-md</C>, 8 screen-grid columns plus 16 a side, centered.</>}>
            <div style={{ ...ground, background: 'var(--ds-blanket)' }}><ModalBox width="var(--layout-width-modal-md)" /></div>
        </Do>
        <Dont caption="A fixed pixel width. It ignores the screen grid, so it sits off the page columns and does not grow with the screen.">
            <div style={{ ...ground, background: 'var(--ds-blanket)' }}><ModalBox width="var(--width-1900)" /></div>
        </Dont>
    </DoDont>
);

const LESSON = 'Start each session by asking what the student worked on since you last met. Then pick one skill to practice, and leave time at the end to write the reflection together, so the next tutor knows where to begin.';

/** Cap reading text at 864. */
export const ReadingCap = () => (
    <DoDont>
        <Do caption={<>Reading content capped at <C>--layout-max-width-reading</C> 864 and centered.</>}>
            <div style={ground}><p style={{ maxWidth: 'calc(100% * 864 / 1232)', margin: '0 auto', font: 'var(--body-default)', color: 'var(--ds-text)' }}>{LESSON}</p></div>
        </Do>
        <Dont caption="A paragraph stretched across the full 1232. Lines get too long to follow from one to the next.">
            <div style={ground}><p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text)' }}>{LESSON}</p></div>
        </Dont>
    </DoDont>
);

/** Align containers to columns, not their parts. */
export const AlignContainers = () => (
    <DoDont>
        <Do caption={<>The card spans six columns; its buttons hug their labels, 8 apart (<C>--element-inline-md</C>).</>}>
            <div style={{ ...ground, ...grid12 }}>
                <div style={{ gridColumn: 'span 12' }}>
                    <PatternCard title="Weekly report" footer={<span style={{ display: 'flex', gap: 'var(--element-inline-md)' }}><Button text="Cancel" style="default" fill="outline" /><Button text="Save" style="primary" fill="filled" /></span>} />
                </div>
            </div>
        </Do>
        <Dont caption="Buttons stretched to columns. Their widths now change with the screen and the labels float.">
            <div style={{ ...ground, ...grid12 }}>
                <div style={{ gridColumn: 'span 12' }}>
                    <PatternCard title="Weekly report" footer={<span style={{ ...grid12, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', width: '100%' }}><Button text="Cancel" style="default" fill="outline" block /><Button text="Save" style="primary" fill="filled" block /></span>} />
                </div>
            </div>
        </Dont>
    </DoDont>
);
