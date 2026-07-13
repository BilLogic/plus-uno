import React from 'react';

/**
 * Companion styled blocks for Grid.mdx.
 * Tables are rendered as explicit <table> elements (not markdown) so they parse
 * and style consistently with the other Foundation docs (see Spacing / Layout).
 */
export default {
    title: 'Foundations/Grid',
    tags: ['!dev', '!autodocs'],
};

const wrap = { maxWidth: '1200px' };

const DocTable = ({ headers, aligns = [], rows }) => (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px', border: '1px solid var(--color-outline-variant)' }}>
        <thead>
            <tr style={{ backgroundColor: 'var(--color-surface-container-low)', borderBottom: '2px solid var(--color-outline)' }}>
                {headers.map((h, i) => (
                    <th key={h} className="body2-txt" style={{ padding: '10px 12px', textAlign: aligns[i] || 'left', fontWeight: 600 }}>{h}</th>
                ))}
            </tr>
        </thead>
        <tbody>
            {rows.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
                    {row.map((cell, j) => (
                        <td key={j} className="body2-txt" style={{ padding: '10px 12px', textAlign: aligns[j] || 'left', fontFamily: aligns[j] === 'right' ? 'monospace' : 'inherit' }}>{cell}</td>
                    ))}
                </tr>
            ))}
        </tbody>
    </table>
);

const code = (t) => <code style={{ fontSize: '0.85em' }}>{t}</code>;

export const GridAnatomy = () => (
    <div style={wrap}>
        <DocTable
            headers={['Part', 'What it is']}
            rows={[
                [<strong>Columns</strong>, 'Equal vertical divisions of the main content area. Content containers align to column edges.'],
                [<strong>Gutters</strong>, 'The fixed gaps between columns. Content never bleeds into gutters.'],
                [<strong>Margins</strong>, 'The empty space between the outermost columns and the edge of the main content area. Content never bleeds into margins either.'],
            ]}
        />
    </div>
);

export const Breakpoints = () => (
    <div style={wrap}>
        <DocTable
            headers={['Breakpoint', 'Min width', 'Columns', 'Viewport gutter', 'Viewport margin']}
            aligns={['left', 'right', 'right', 'left', 'left']}
            rows={[
                [<strong>MD</strong>, '768px', '12', '12px', '16px'],
                [<strong>LG</strong>, '1024px', '12', '16px', '32px'],
                [<strong>XL</strong>, '1440px', '12', '16px', '32px'],
            ]}
        />
        <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', marginTop: '8px' }}>
            In Figma these live as mode-varying variables in the <strong>size / layout</strong> collection
            ({code('Breakpoints/min width')}, {code('Grid/viewport-gutter')}, {code('Grid/viewport-margin')});
            in code as {code('--breakpoint-md-min')} / {code('-lg-')} / {code('-xl-min')}.
        </p>
    </div>
);

export const TwoGrids = () => (
    <div style={wrap}>
        <DocTable
            headers={['Grid', 'Figma style', 'Applies to', 'Gutter', 'Margin / offset']}
            rows={[
                [
                    <strong>Viewport grid</strong>,
                    code('Grid/Viewport (adaptive)'),
                    'Full-page frames without the app shell (login, standalone flows) and the Breakpoint reference frames.',
                    <>12 / 16 / 16px&nbsp;{code('Grid/viewport-gutter')}</>,
                    <>16 / 32 / 32px&nbsp;{code('Grid/viewport-margin')}</>,
                ],
                [
                    <strong>Content grid</strong>,
                    code('Grid/Adaptive (12-col)'),
                    <>The <strong>Main region</strong> — carried by the {code('Pattern/Surface container')} component, so every page built on it inherits the grid automatically.</>,
                    <>8px&nbsp;{code('--layout-grid-gap')}</>,
                    <>32px&nbsp;{code('Surface/pad-x')} (columns align to the content box inside the surface padding)</>,
                ],
            ]}
        />
        <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', marginTop: '8px' }}>
            Both are <strong>single grid styles</strong> whose count/gutter/offset are bound to
            variables in the <strong>size / layout</strong> collection. You never pick a per-breakpoint
            style: <strong>switch the frame&rsquo;s size / layout mode</strong> (MD / LG / XL) and the grid,
            the frame width, and the {code('Display/*')} visibility toggles all adapt together.
        </p>
    </div>
);

export const FixedFluid = () => (
    <div style={wrap}>
        <DocTable
            headers={['Mode', 'Max width (incl. margins)', 'Use for']}
            aligns={['left', 'right', 'left']}
            rows={[
                [<strong>Fixed-wide</strong>, '1296px', 'Most experiences: dashboards, directories, search results, settings — anything with structured content.'],
                [<strong>Fixed-narrow</strong>, '864px', 'Long-form reading: documentation, articles, review flows. Caps line length so text stays readable.'],
                [<strong>Fluid</strong>, 'None (fills Main)', 'Content with no natural maximum width — boards, timelines, whiteboard-style canvases.'],
            ]}
        />
    </div>
);

export const LayoutRegions = () => (
    <div style={wrap}>
        <DocTable
            headers={['Region', 'PLUS today']}
            rows={[
                [<strong>TopNav</strong>, <>The <code>TopBar</code> section spec — full-width bar at the top of the shell.</>],
                [<strong>SideNav</strong>, <>The <code>Sidebar</code> section spec — fixed-width navigation on the left (164px, {code('--layout-sidebar-width')}).</>],
                [<strong>Main</strong>, <>The content area — an instance of the <code>Pattern/Surface container</code> component, which <strong>fills the width it is given</strong> and carries the content grid + Content slot. <strong>The grid applies here and only here.</strong></>],
                [<strong>Panel</strong>, 'Contextual surface on the right. In PLUS it currently functions as an off-canvas drawer rather than a docked region, but the region name is retained for future use.'],
            ]}
        />
    </div>
);

export const ColumnReference = () => (
    <div style={wrap}>
        <p className="body1-txt" style={{ marginBottom: '16px' }}>
            The main content area is a <strong>12-column grid with an 8px gutter</strong>{' '}
            (<code>--layout-grid-gap</code>) at every breakpoint. Columns flex with the viewport;
            the spans below are measured at each breakpoint&rsquo;s <strong>minimum</strong> width and
            match the <code>Columns/col-1…12</code> variables in Figma (12 × col-1 + 11 × 8px = the
            Main content width).
        </p>

        {/* Visual 12-column grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '8px', marginBottom: '24px' }}>
            {Array.from({ length: 12 }, (_, i) => (
                <div key={i} style={{
                    height: '32px',
                    backgroundColor: 'var(--color-surface-container-low)',
                    borderRadius: '4px',
                    border: '1px dashed var(--color-outline-variant)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', color: 'var(--color-on-surface-variant)',
                }}>{i + 1}</div>
            ))}
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', border: '1px solid var(--color-outline-variant)' }}>
            <thead>
                <tr style={{ backgroundColor: 'var(--color-surface-container-low)', borderBottom: '2px solid var(--color-outline)' }}>
                    <th className="body2-txt" style={{ padding: '10px 12px', textAlign: 'left' }}>Span</th>
                    <th className="body2-txt" style={{ padding: '10px 12px', textAlign: 'right' }}>MD (768)</th>
                    <th className="body2-txt" style={{ padding: '10px 12px', textAlign: 'right' }}>LG (1024)</th>
                    <th className="body2-txt" style={{ padding: '10px 12px', textAlign: 'right' }}>XL (1440)</th>
                </tr>
            </thead>
            <tbody>
                <tr style={{ borderBottom: '1px solid var(--color-outline-variant)', backgroundColor: 'var(--color-surface-container-lowest)' }}>
                    <td className="body2-txt" style={{ padding: '10px 12px' }}><strong>Main content width</strong></td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace' }}>672px</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace' }}>748px</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace' }}>1164px</td>
                </tr>
                {[
                    { col: '--col-1', md: '48.67', lg: '55.00', xl: '89.67' },
                    { col: '--col-2', md: '105.33', lg: '118.00', xl: '187.33' },
                    { col: '--col-3', md: '162.00', lg: '181.00', xl: '285.00' },
                    { col: '--col-4', md: '218.67', lg: '244.00', xl: '382.67' },
                    { col: '--col-5', md: '275.33', lg: '307.00', xl: '480.33' },
                    { col: '--col-6', md: '332.00', lg: '370.00', xl: '578.00' },
                    { col: '--col-7', md: '388.67', lg: '433.00', xl: '675.67' },
                    { col: '--col-8', md: '445.33', lg: '496.00', xl: '773.33' },
                    { col: '--col-9', md: '502.00', lg: '559.00', xl: '871.00' },
                    { col: '--col-10', md: '558.67', lg: '622.00', xl: '968.67' },
                    { col: '--col-11', md: '615.33', lg: '685.00', xl: '1066.33' },
                    { col: '--col-12', md: '672.00', lg: '748.00', xl: '1164.00' },
                ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
                        <td style={{ padding: '10px 12px' }}><code style={{ fontSize: '0.85em' }}>{row.col}</code></td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace' }}>{row.md}px</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace' }}>{row.lg}px</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace' }}>{row.xl}px</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export const ShellMath = () => (
    <div style={wrap}>
        <p className="body1-txt" style={{ marginBottom: '16px' }}>
            Most PLUS pages render inside <code>PageLayout</code> (SideNav + TopNav + Main). The grid is
            computed from the <strong>Main region&rsquo;s width</strong>, not the viewport, so at each
            breakpoint minimum the usable content width is smaller than the viewport:
        </p>
        <pre style={{ backgroundColor: 'var(--color-surface-container-low)', padding: '16px', borderRadius: '8px', overflow: 'auto', marginBottom: '8px', lineHeight: 1.7 }}>
{`MD  (768):  768 − 32 (outer) − 64 (surface padding)          =  672px
LG (1024): 1024 − 32 − 164 (SideNav) − 16 (gap) − 64          =  748px
XL (1440): 1440 − 32 − 164 (SideNav) − 16 (gap) − 64          = 1164px`}
        </pre>
        <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
            At MD the SideNav collapses (its visibility is bound to the <code>Display/*</code> booleans),
            which is why it drops out of the MD calculation. The SideNav is <strong>164px</strong>{' '}
            (<code>--layout-sidebar-width</code>) — the app shell, the Figma variable, and the grid math
            all agree on this value. Ownership is layered: the <strong>page frame</strong> owns the width
            (bound to <code>Breakpoints/min width</code>) and the size/layout <strong>mode</strong>; the{' '}
            <strong>Surface container pattern</strong> runs on <em>auto mode</em>, inherits the page&rsquo;s
            mode, and simply <strong>fills the space it is given</strong> — it carries the content grid
            and the Content slot, nothing else.
        </p>
    </div>
);

/**
 * Do/Don't as MATCHED PAIRS: each row is one Do and its corresponding Don't on the
 * same topic, side by side — not one block of Dos and one block of Don'ts.
 */
const PAIRS = [
    {
        do: <>Span a content container across however many columns it needs — 3, 4, 6, or 12.</>,
        dont: <>Let content bleed into gutters or margins — it breaks alignment across the whole page.</>,
    },
    {
        do: <>Align <strong>content containers</strong> (cards, tables, forms) to column edges.</>,
        dont: <>Align buttons, icons, or chips to columns — use <code>--size-element-*</code> tokens instead.</>,
    },
    {
        do: <>Use <strong>fixed-wide</strong> for structured content: dashboards, directories, tables.</>,
        dont: <>Use fixed-wide for long-form text — the lines get too long to read comfortably.</>,
    },
    {
        do: <>Use <strong>fixed-narrow</strong> for long-form reading so line length stays comfortable.</>,
        dont: <>Use fixed-narrow for content that needs horizontal room, like wide tables.</>,
    },
    {
        do: <>Use <strong>fluid</strong> grids for content that grows horizontally — boards, timelines.</>,
        dont: <>Use fluid grids for structured content with a natural width — relationships fall apart when wide.</>,
    },
    {
        do: <>Switch breakpoints in Figma through the frame&rsquo;s <strong>size / layout mode</strong> — grid, width, and visibility adapt together.</>,
        dont: <>Detach or hand-edit the grid styles — the variable bindings are what make one grid serve every breakpoint.</>,
    },
    {
        do: <>Design at MD (768) and XL (1440) at minimum, so stretch behavior is intentional.</>,
        dont: <>Design below 768px — PLUS has no small-screen tier.</>,
    },
    {
        do: <>Keep the grid inside the Main region; compute columns from Main&rsquo;s width.</>,
        dont: <>Span the grid across SideNav, TopNav, or Panel — those regions are fixed.</>,
    },
];

const PairCell = ({ tone, children, header }) => {
    const isDo = tone === 'do';
    const accent = isDo ? 'var(--color-success, #1a7f37)' : 'var(--color-error, #b3261e)';
    const tint = isDo ? 'var(--color-success-container, #e6f4ea)' : 'var(--color-error-container, #fbe9e7)';
    const onTint = isDo ? 'var(--color-on-success-container, #0b3d1a)' : 'var(--color-on-error-container, #601410)';
    if (header) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px',
                backgroundColor: tint, color: onTint, fontWeight: 700,
                borderTopLeftRadius: '12px', borderTopRightRadius: '12px',
            }}>
                <i className={`fa-solid ${isDo ? 'fa-circle-check' : 'fa-circle-xmark'}`} aria-hidden="true" />
                <span className="label-large">{isDo ? 'Do' : "Don't"}</span>
            </div>
        );
    }
    return (
        <div className="body2-txt" style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '12px 16px' }}>
            <i className={`fa-solid ${isDo ? 'fa-check' : 'fa-xmark'}`}
               style={{ marginTop: '3px', color: accent, flexShrink: 0 }} aria-hidden="true" />
            <span>{children}</span>
        </div>
    );
};

export const DosAndDonts = () => (
    <div style={{
        ...wrap,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        columnGap: '16px',
        rowGap: '10px',
        alignItems: 'stretch',
        border: '1px solid var(--color-outline-variant)',
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundColor: 'var(--color-surface-container-lowest)',
    }}>
        {/* header row */}
        <div style={{ borderRight: '1px solid var(--color-outline-variant)' }}><PairCell tone="do" header /></div>
        <div><PairCell tone="dont" header /></div>

        {/* matched pairs */}
        {PAIRS.map((p, i) => (
            <React.Fragment key={i}>
                <div style={{
                    borderRight: '1px solid var(--color-outline-variant)',
                    borderTop: '1px solid var(--color-outline-variant)',
                    backgroundColor: i % 2 ? 'transparent' : 'var(--color-surface-container-low, rgba(0,0,0,0.02))',
                }}>
                    <PairCell tone="do">{p.do}</PairCell>
                </div>
                <div style={{
                    borderTop: '1px solid var(--color-outline-variant)',
                    backgroundColor: i % 2 ? 'transparent' : 'var(--color-surface-container-low, rgba(0,0,0,0.02))',
                }}>
                    <PairCell tone="dont">{p.dont}</PairCell>
                </div>
            </React.Fragment>
        ))}
    </div>
);
