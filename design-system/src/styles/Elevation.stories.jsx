import React from 'react';
import { PatternCard } from '@/patterns';
import { ModeCompare, Do, Dont, DoDont, C } from '@/storybook-docs/foundation-blocks.jsx';

/**
 * Specimens for Foundations/Elevation. Each level paints its surface token
 * with its shadow token, in a light pane and a dark pane, so the pairs can be
 * compared where shadows are hard to see.
 */
export default {
    title: 'Foundations/Elevation',
    tags: ['!dev', '!autodocs'],
};

const LEVELS = [
    { name: 'Sunken', surface: '--ds-surface-sunken', shadow: null, note: 'The frame behind the work' },
    { name: 'Default', surface: '--ds-surface', shadow: null, note: 'The page' },
    { name: 'Raised', surface: '--ds-surface-raised', shadow: '--ds-shadow-raised', note: 'A card' },
    { name: 'Overlay', surface: '--ds-surface-overlay', shadow: '--ds-shadow-overlay', note: 'A menu, popup or modal' },
];

const tile = (surface, shadow) => ({
    minHeight: 'var(--size-500)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    gap: 'var(--card-stack-sm)',
    padding: 'var(--card-pad-sm)',
    borderRadius: 'var(--card-radius)',
    background: `var(${surface})`,
    boxShadow: shadow ? `var(${shadow})` : 'none',
    color: 'var(--ds-text)',
});

const code = { font: 'var(--code)', color: 'var(--ds-text-subtle)' };

/** The four surface levels, each with the shadow it pairs with. */
export const Overview = () => (
    <ModeCompare>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 'var(--layout-gutter)', padding: 'var(--card-pad-sm)', borderRadius: 'var(--card-radius)', background: 'var(--ds-surface)' }}>
            {LEVELS.map((l) => (
                <div key={l.name} style={tile(l.surface, l.shadow)}>
                    <span style={{ font: 'var(--heading-xsmall)' }}>{l.name}</span>
                    <span style={{ font: 'var(--body-small)', color: 'var(--ds-text-subtle)' }}>{l.note}</span>
                    <span style={code}>{l.surface}</span>
                    {l.shadow && <span style={code}>{l.shadow}</span>}
                </div>
            ))}
        </div>
    </ModeCompare>
);

/** A card at rest, a card lifted while it is dragged, and a well inside a card. */
export const Cards = () => (
    <ModeCompare>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 'var(--layout-gutter)', padding: 'var(--card-pad-sm)', borderRadius: 'var(--card-radius)', background: 'var(--ds-surface)' }}>
            <PatternCard title="At rest" description="The raised pair, no border." />
            <PatternCard title="Dragged" description="The overlay pair while it moves." dragging />
            <PatternCard title="With a well" description="A recessed strip inside the card.">
                <div style={{ padding: 'var(--card-pad-sm)', borderRadius: 'var(--card-radius-sm)', background: 'var(--ds-surface-container)', font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>
                    12 sessions this week
                </div>
            </PatternCard>
        </div>
    </ModeCompare>
);

const ground = { padding: 'var(--card-pad-sm)', borderRadius: 'var(--card-radius)', background: 'var(--ds-surface)' };

/** Lift a surface with its shadow, never with a darker gray. */
export const LiftWithShadow = () => (
    <DoDont>
        <Do caption={<>The card keeps the page color and lifts with its shadow: <C>--ds-surface-raised</C> with <C>--ds-shadow-raised</C>.</>}>
            <div style={ground}><PatternCard title="Upcoming sessions" description="3 this week" /></div>
        </Do>
        <Dont caption="The card set apart by a gray fill. Gray is for recessed areas, so the card reads as a hole in the page, and dark mode loses the step.">
            <div style={ground}>
                <PatternCard title="Upcoming sessions" description="3 this week" style={{ background: 'var(--ds-surface-container)', boxShadow: 'none' }} />
            </div>
        </Dont>
    </DoDont>
);

/** A card rests on the raised pair and draws no border of its own. */
export const NoCardBorder = () => (
    <DoDont>
        <Do caption="The raised shadow's 1px ring is the card's edge. In light it reads almost flat.">
            <div style={ground}><PatternCard title="Reflections" description="2 due today" /></div>
        </Do>
        <Dont caption={<>A 1px <C>--ds-border</C> outline with no shadow. The card loses its level, and in dark mode it no longer lightens as it rises.</>}>
            <div style={ground}>
                <PatternCard title="Reflections" description="2 due today" style={{ boxShadow: 'inset 0 0 0 var(--border-default) var(--ds-border)' }} />
            </div>
        </Dont>
    </DoDont>
);

/** A surface and its shadow always travel together. */
export const AlwaysPair = () => (
    <DoDont>
        <Do caption={<>A menu on the overlay pair: <C>--ds-surface-overlay</C> with <C>--ds-shadow-overlay</C>.</>}>
            <div style={ground}>
                <div style={{ ...tile('--ds-surface-overlay', '--ds-shadow-overlay'), minHeight: 0, padding: 'var(--popover-pad-menu)', borderRadius: 'var(--popover-radius-menu-md)' }}>
                    {['Rename', 'Duplicate', 'Move to…'].map((t) => (
                        <span key={t} style={{ font: 'var(--body-default)', padding: 'var(--element-pad-y-md) var(--element-pad-x-md)' }}>{t}</span>
                    ))}
                </div>
            </div>
        </Do>
        <Dont caption="An overlay shadow on the default surface. The shadow promises a layer the fill does not have, and dark mode shows the mismatch.">
            <div style={ground}>
                <div style={{ ...tile('--ds-surface', '--ds-shadow-overlay'), minHeight: 0, padding: 'var(--popover-pad-menu)', borderRadius: 'var(--popover-radius-menu-md)' }}>
                    {['Rename', 'Duplicate', 'Move to…'].map((t) => (
                        <span key={t} style={{ font: 'var(--body-default)', padding: 'var(--element-pad-y-md) var(--element-pad-x-md)' }}>{t}</span>
                    ))}
                </div>
            </div>
        </Dont>
    </DoDont>
);
