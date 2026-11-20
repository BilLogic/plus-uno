import React from 'react';
import { Illustration } from '@/storybook-docs/illustrations/Illustration.jsx';
import { HAIRLINE, MONO_LABEL_FONT, PAINT } from '@/storybook-docs/illustrations/paint.js';
import { FIGURES } from './layout-figure-data.js';

/**
 * A Layout page figure: a construction drawing at 1 unit = 1px, painted only with
 * the illustration kit's roles so it follows the Color mode and Contrast switches.
 * Numbers and the few axis words sit outside the measured object, in the measure role.
 */
const paint = (role) => (role ? PAINT[role] : 'none');
const strokeStyle = (width) => (width === 1 ? HAIRLINE : { strokeWidth: `calc(var(--stroke-hairline) * ${width})` });
const SANS_LABEL_FONT = { font: 'var(--body-sm)' };

const draw = (ops) => {
    const out = [];
    const stack = [out];
    ops.forEach((op, i) => {
        const here = stack[stack.length - 1];
        const [kind] = op;
        if (kind === 'r') {
            const [, x, y, w, h, fill, fillOpacity, stroke, sw, rx] = op;
            here.push(
                <rect
                    key={i}
                    x={x}
                    y={y}
                    width={w}
                    height={h}
                    rx={rx || undefined}
                    fill={paint(fill)}
                    fillOpacity={fillOpacity ?? undefined}
                    stroke={stroke ? paint(stroke) : undefined}
                    style={stroke ? strokeStyle(sw) : undefined}
                />,
            );
        } else if (kind === 'l') {
            const [, x1, y1, x2, y2, stroke, sw, dash] = op;
            here.push(
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={paint(stroke)} strokeDasharray={dash ?? undefined} style={strokeStyle(sw)} />,
            );
        } else if (kind === 't') {
            const [, x, y, text, fill, , mono, anchor, weight] = op;
            here.push(
                <text
                    key={i}
                    x={x}
                    y={y}
                    textAnchor={anchor}
                    fill={paint(fill)}
                    style={mono ? MONO_LABEL_FONT : { ...SANS_LABEL_FONT, fontWeight: weight }}
                >
                    {text}
                </text>,
            );
        } else if (kind === 'p') {
            const [, d, fill, fillOpacity, stroke, sw, evenodd] = op;
            here.push(
                <path
                    key={i}
                    d={d}
                    fill={paint(fill)}
                    fillOpacity={fillOpacity ?? undefined}
                    fillRule={evenodd ? 'evenodd' : undefined}
                    stroke={stroke ? paint(stroke) : undefined}
                    style={stroke ? strokeStyle(sw) : undefined}
                />,
            );
        } else if (kind === 'c') {
            const [, cx, cy, r, fill, stroke, sw] = op;
            here.push(
                <circle key={i} cx={cx} cy={cy} r={r} fill={paint(fill)} stroke={stroke ? paint(stroke) : undefined} style={stroke ? strokeStyle(sw) : undefined} />,
            );
        } else if (kind === 'g') {
            const group = { key: i, transform: op[1], children: [] };
            here.push(group);
            stack.push(group.children);
        } else if (kind === 'e') {
            stack.pop();
        }
    });
    const render = (nodes) =>
        nodes.map((node) => (node.children ? <g key={node.key} transform={node.transform}>{render(node.children)}</g> : node));
    return render(out);
};

export const LayoutFigure = ({ name, title }) => {
    const figure = FIGURES[name];
    if (!figure) throw new Error(`LayoutFigure: no figure named ${name}`);
    return (
        <Illustration scale={1} width={figure.w} height={figure.h} title={title}>
            {draw(figure.ops)}
        </Illustration>
    );
};

const SIZES = [
    ['16', '100'],
    ['24', '150'],
    ['32', '200'],
    ['40', '250'],
    ['48', '300'],
];

/** Each row of the core-size matrix: its label, and the figure in each of the five size columns (null is an empty cell). */
const MATRIX_ROWS = [
    { label: 'Step', note: null, cells: [4, 5, 6, 7, 8].map((n) => `dim-cell${n}`) },
    { label: 'Control · Button', note: 'compact 24 · default 32 · spacious 48', cells: [null, 'dim-cell9', 'dim-cell10', null, 'dim-cell11'] },
    { label: 'Control · Field', note: 'compact 32 · default 40', cells: [null, null, 'dim-cell12', 'dim-cell13', null] },
    { label: 'Row', note: 'compact · default · spacious', cells: [null, null, 'dim-cell14', 'dim-cell15', 'dim-cell16'] },
    { label: 'Media · Avatar, Tile', note: '16 inline … 48 largest', cells: [17, 18, 19, 20, 21].map((n) => `dim-cell${n}`) },
    { label: 'Icon in the box', note: '12 · 16 · 16 · 24 · 24, as Tile and Avatar ship', cells: [22, 23, 24, 25, 26].map((n) => `dim-cell${n}`) },
];

const matrixGrid = { display: 'grid', gridTemplateColumns: 'var(--field-width-sm) repeat(5, 1fr)' };
const matrixCell = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minBlockSize: '80px' /* docs-literal: a demo frame, not a role */,
    paddingBlock: 'var(--stack-md)',
    borderBlockStart: 'var(--border-width-default) solid var(--ds-border)',
};

/** Dimensions' core-size matrix: the five sizes as columns, each role drawn at the sizes it ships. */
export const CoreSizeMatrix = () => (
    <div role="table" aria-label="Core sizes by role" style={{ inlineSize: '100%' }}>
        <div role="row" style={matrixGrid}>
            <div role="columnheader" />
            {SIZES.map(([px, step]) => (
                <div
                    key={px}
                    role="columnheader"
                    style={{ textAlign: 'center', font: 'var(--body-sm)', fontFamily: 'var(--type-family-code)', color: 'var(--ds-text-accent-magenta)' }}
                >
                    {px}
                    <span style={{ color: 'var(--ds-text-subtle)' }}> · {step}</span>
                </div>
            ))}
        </div>
        {MATRIX_ROWS.map((row) => (
            <div key={row.label} role="row" style={matrixGrid}>
                <div role="rowheader" style={{ ...matrixCell, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
                    <span style={{ font: 'var(--body-sm)', fontWeight: 'var(--type-weight-semibold)' }}>{row.label}</span>
                    {row.note && <span style={{ font: 'var(--body-sm)', color: 'var(--ds-text-subtle)' }}>{row.note}</span>}
                </div>
                {row.cells.map((name, i) => (
                    <div key={SIZES[i][0]} role="cell" style={matrixCell}>
                        {name && <LayoutFigure name={name} title={`${row.label} at ${SIZES[i][0]}`} />}
                    </div>
                ))}
            </div>
        ))}
    </div>
);
