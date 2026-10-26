import React from 'react';
import { Button, Input, Tile } from '@/components';
import { Do, Dont, DoDont, C } from '@/storybook-docs/foundation-blocks.jsx';

/**
 * Specimens for Foundations/Size roles: controls, rows, icons and media, each
 * drawn at the token it names.
 */
export default {
    title: 'Foundations/Size roles',
    tags: ['!dev', '!autodocs'],
};

const col = (gap) => ({ display: 'flex', flexDirection: 'column', gap });
const row = (gap) => ({ display: 'flex', alignItems: 'flex-end', gap, flexWrap: 'wrap' });
const caption = { font: 'var(--body-small)', color: 'var(--ds-text-subtle)' };
const title = { font: 'var(--heading-xsmall)', color: 'var(--ds-text)' };

const Labeled = ({ text, children }) => (
    <div style={col('var(--element-stack-sm)')}>
        {children}
        <span style={caption}>{text}</span>
    </div>
);

/** Control, Row, Icon and Media at each size. */
export const Roles = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(var(--card-min-width-md), 1fr))', gap: 'var(--surface-stack-md)' }}>
        <div style={col('var(--element-stack-lg)')}>
            <span style={title}>Control</span>
            <div style={row('var(--element-inline-lg)')}>
                <Labeled text="--item-height-sm 24"><Button text="Edit" size="small" style="default" fill="outline" /></Labeled>
                <Labeled text="--item-height-md 32"><Button text="Edit" style="default" fill="outline" /></Labeled>
            </div>
        </div>
        <div style={col('var(--element-stack-lg)')}>
            <span style={title}>Row</span>
            <div style={col(0)}>
                {[['--row-height-sm', 32], ['--row-height-md', 40], ['--row-height-lg', 48]].map(([t, v]) => (
                    <div key={t} style={{ minHeight: `var(${t})`, display: 'flex', alignItems: 'center', padding: '0 var(--table-pad-x-cell)', borderBottom: 'var(--border-default) solid var(--ds-border)', font: 'var(--body-default)', color: 'var(--ds-text)' }}>
                        <C>{t}</C>&nbsp;{v}
                    </div>
                ))}
            </div>
        </div>
        <div style={col('var(--element-stack-lg)')}>
            <span style={title}>Icon</span>
            <div style={row('var(--element-inline-lg)')}>
                {[['--icon-sm', 12], ['--icon-md', 16], ['--icon-lg', 24]].map(([t, v]) => (
                    <Labeled key={t} text={`${t} ${v}`}>
                        <i className="fa-solid fa-calendar-days" aria-hidden="true" style={{ fontSize: `var(${t})`, width: `var(${t})`, height: `var(${t})`, color: 'var(--ds-icon-subtle)' }} />
                    </Labeled>
                ))}
            </div>
        </div>
        <div style={col('var(--element-stack-lg)')}>
            <span style={title}>Media</span>
            <div style={row('var(--element-inline-md)')}>
                {[16, 20, 24, 32, 40, 48].map((s) => (
                    <Labeled key={s} text={String(s)}>
                        <Tile content="icon" icon="book-open" size={s} color="teal" label={`Lesson, ${s}`} />
                    </Labeled>
                ))}
            </div>
        </div>
    </div>
);

/** Controls come in two heights: 32, and 24 only in table rows and toolbars. */
export const ControlHeights = () => (
    <DoDont>
        <Do caption={<>A form at 32 (<C>--item-height-md</C>): the field and its buttons share one height.</>}>
            <div style={{ ...row('var(--element-inline-md)'), alignItems: 'flex-end' }}>
                <div style={{ flex: 1, minWidth: 'var(--field-width-sm)' }}><Input id="size-do" label="Student" placeholder="Search students" /></div>
                <Button text="Add" style="primary" fill="filled" />
            </div>
        </Do>
        <Dont caption="A compact 24 button beside a 32 field. Compact is for table rows and inline toolbars only.">
            <div style={{ ...row('var(--element-inline-md)'), alignItems: 'flex-end' }}>
                <div style={{ flex: 1, minWidth: 'var(--field-width-sm)' }}><Input id="size-dont" label="Student" placeholder="Search students" /></div>
                <Button text="Add" size="small" style="primary" fill="filled" />
            </div>
        </Dont>
    </DoDont>
);

/** 24 is the largest icon; a larger mark goes in a Tile. */
export const LargerMeansTile = () => (
    <DoDont>
        <Do caption="An empty state’s mark in a 48 Tile, which sets its size, corner and color in one place.">
            <div style={{ ...col('var(--element-stack-md)'), alignItems: 'center', textAlign: 'center' }}>
                <Tile content="icon" icon="calendar-days" size={48} color="blue" />
                <span style={{ font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>No sessions this week</span>
            </div>
        </Do>
        <Dont caption="A bare icon blown up to 48. It has no box, so its weight and spacing drift from every other mark.">
            <div style={{ ...col('var(--element-stack-md)'), alignItems: 'center', textAlign: 'center' }}>
                <i className="fa-solid fa-calendar-days" aria-hidden="true" style={{ fontSize: 'var(--image-xl)', color: 'var(--ds-icon-subtle)' }} />
                <span style={{ font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>No sessions this week</span>
            </div>
        </Dont>
    </DoDont>
);
