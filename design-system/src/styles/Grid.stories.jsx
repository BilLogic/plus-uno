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

const note = { color: 'var(--color-on-surface-variant)', marginTop: 'var(--space-050)' };

/** Mode values, Medium · Large · X-Large, as `_frame_layers.scss` holds them. */
const MODES = ['Medium (768)', 'Large (1024)', 'X-Large (1440)'];

export const Breakpoints = () => (
    <div style={wrap}>
        <DocTable
            headers={['Breakpoint', 'Min width', 'Columns', 'Screen grid', 'Content grid']}
            aligns={['left', 'right', 'right', 'right', 'right']}
            rows={[
                [<strong>Medium</strong>, '768px', '12', '720px', '720px'],
                [<strong>Large</strong>, '1024px', '12', '976px', '744px'],
                [<strong>X-Large</strong>, '1440px', '12', '1232px', '1144px'],
            ]}
        />
        <p className="body2-txt" style={note}>
            In Figma these are the modes of the <strong>spacing / layout</strong> collection; in code the
            breakpoints are {code('--breakpoint-md-min')} / {code('-lg-min')} / {code('-xl-min')} and the
            mode values live in {code('_frame_layers.scss')}. Both grids have gutter 16 ({code('--layout-gutter')}).
        </p>
    </div>
);

export const TwoGrids = () => (
    <div style={wrap}>
        <DocTable
            headers={['Grid', 'Where it sits', 'Used for', 'Width', 'Column']}
            rows={[
                [
                    <strong>Screen grid</strong>,
                    <>Across the screen, inside the screen pad ({code('--layout-pad-x-screen')}), centered and capped at 1232. It ignores the sidebar.</>,
                    'Modals and overlays.',
                    '720 · 976 · 1232',
                    <>{code('--layout-width-column-screen')} 45.33 · 66.67 · 88</>,
                ],
                [
                    <strong>Content grid</strong>,
                    <>Inside the surface, after the sidebar and {code('--surface-pad')}.</>,
                    'Page content: cards, tables, forms, charts and text blocks.',
                    <>{code('--layout-width-content')} 720 · 744 · 1144</>,
                    <>{code('--layout-width-column')} 45.33 · 47.33 · 80.67</>,
                ],
            ]}
        />
        <p className="body2-txt" style={note}>
            Both grids are 12 columns ({code('--layout-columns')}) with gutter 16 ({code('--layout-gutter')}),
            bound to <strong>spacing / layout</strong> variables. You never pick a per-breakpoint grid:
            <strong> switch the frame&rsquo;s spacing / layout mode</strong> and the grid and the frame width adapt together.
        </p>
    </div>
);

export const FixedFluid = () => (
    <div style={wrap}>
        <DocTable
            headers={['Mode', 'Max width', 'Use for']}
            aligns={['left', 'right', 'left']}
            rows={[
                [<strong>Fixed-wide</strong>, <>1232px {code('--layout-max-width-content')}</>, 'Most experiences: dashboards, directories, search results, settings — anything with structured content.'],
                [<strong>Fixed-narrow</strong>, <>864px {code('--layout-max-width-reading')}</>, 'Long-form reading: documentation, articles, review flows. Caps line length so text stays readable.'],
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
                [<strong>TopNav</strong>, <>The <code>Topbar</code> pattern — 32 high ({code('--layout-height-topbar')}) across the top of the frame.</>],
                [<strong>SideNav</strong>, <>The sidebar — 240 wide ({code('--layout-width-sidebar')}), docked from Large and closed below it.</>],
                [<strong>Main</strong>, <>The surface inside the <code>Pattern/Surface container</code> component, which <strong>fills the width it is given</strong> and carries the content grid and the Content slot. <strong>The content grid applies here and only here.</strong></>],
                [<strong>Overlays</strong>, <>Modals and their overlay sit above the frame on the <strong>screen grid</strong>, so they ignore the sidebar.</>],
            ]}
        />
    </div>
);

const GridStrip = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(var(--layout-columns), minmax(0, 1fr))', gap: 'var(--layout-gutter)', marginBottom: 'var(--space-150)' }}>
        {Array.from({ length: 12 }, (_, i) => (
            <div key={i} style={{
                height: 'var(--space-200)',
                backgroundColor: 'var(--color-surface-container-low)',
                borderRadius: 'var(--radius-025)',
                border: '1px dashed var(--color-outline-variant)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', color: 'var(--color-on-surface-variant)',
            }}>{i + 1}</div>
        ))}
    </div>
);

export const ColumnReference = () => (
    <div style={wrap}>
        <p className="body1-txt" style={{ marginBottom: 'var(--space-100)' }}>
            Both grids are <strong>12 columns with gutter 16</strong>. The column tokens hold one column at
            each mode&rsquo;s screen; between breakpoints they step, so lay content out on the grid itself
            ({code('repeat(var(--layout-columns), minmax(0, 1fr))')} with {code('gap: var(--layout-gutter)')})
            and span whole columns with {code('grid-column: span N')}.
        </p>

        <GridStrip />

        <DocTable
            headers={['Token', ...MODES]}
            aligns={['left', 'right', 'right', 'right']}
            rows={[
                [code('--layout-width-column-screen'), '45.33px', '66.67px', '88px'],
                [code('--layout-width-column'), '45.33px', '47.33px', '80.67px'],
                [code('--layout-width-content'), '720px', '744px', '1144px'],
                [code('--layout-gutter'), '16px', '16px', '16px'],
            ]}
        />
        <p className="body2-txt" style={note}>
            The older {code('--col-1')} … {code('--col-12')} and {code('--layout-grid-gap')} (8) are the legacy
            spec-page grid on a 672 · 748 · 1164 width. Only the spec pages read them; new work uses the tokens above.
        </p>
    </div>
);

export const ModalWidths = () => (
    <div style={wrap}>
        <p className="body1-txt" style={{ marginBottom: 'var(--space-100)' }}>
            A modal spans <strong>6 · 8 · 10 screen-grid columns</strong>, the gutters between them, and its
            own pad of 16 ({code('--modal-pad')}) on each side:
        </p>
        <pre style={{ backgroundColor: 'var(--color-surface-container-low)', padding: 'var(--space-100)', borderRadius: 'var(--radius-050)', overflow: 'auto', marginBottom: 'var(--space-100)', lineHeight: 1.7 }}>
{`width = n × --layout-width-column-screen + (n − 1) × --layout-gutter + 2 × --modal-pad`}
        </pre>
        <DocTable
            headers={['Width', 'Columns', ...MODES, 'Token']}
            aligns={['left', 'right', 'right', 'right', 'right', 'left']}
            rows={[
                [code('sm'), '6', '384px', '512px', '640px', code('--layout-width-modal-sm')],
                [code('md'), '8', '507px', '677px', '848px', code('--layout-width-modal-md')],
                [code('lg'), '10', '629px', '843px', '1056px', code('--layout-width-modal-lg')],
            ]}
        />
        <p className="body2-txt" style={note}>
            The tokens are rounded to a whole pixel. {code('Modal.scss')} works the formula out continuously from
            the screen width, so a modal grows with the screen between breakpoints, stops past a 1280 screen and
            ignores the sidebar. Pass {code('width="sm" | "md" | "lg"')} to {code('<Modal>')} rather than a pixel width.
        </p>
    </div>
);

export const ShellMath = () => (
    <div style={wrap}>
        <p className="body1-txt" style={{ marginBottom: 'var(--space-100)' }}>
            Pages render inside <code>SurfaceContainer</code>: the topbar row, then the sidebar and the surface.
            The content grid is measured from the <strong>surface&rsquo;s inner width</strong>, not the screen:
        </p>
        <pre style={{ backgroundColor: 'var(--color-surface-container-low)', padding: 'var(--space-100)', borderRadius: 'var(--radius-050)', overflow: 'auto', marginBottom: 'var(--space-050)', lineHeight: 1.7 }}>
{`Medium   (768):  768 − 8 container pad − 8 − 2 × 16 surface pad      =  720
Large   (1024): 1024 − 240 sidebar − 8 − 2 × 16                        =  744
X-Large (1440): 1440 − 240 sidebar − 8 − 2 × 24 surface pad            = 1144

Screen grid:    clamp(720, screen − 2 × 24, 1232)  =  720 · 976 · 1232`}
        </pre>
        <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
            The sidebar is 240 from the screen edge once it docks at Large; below Large it is closed and the
            surface starts at the container pad. Content is capped at 1232 and never under 720. Ownership is
            layered: the <strong>page frame</strong> owns the width ({code('Screen/width-screen')}) and the
            spacing / layout <strong>mode</strong>; the <strong>Surface container pattern</strong> fills the
            space it is given and carries the content grid and the Content slot.
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
        do: <>Switch breakpoints in Figma through the frame&rsquo;s <strong>spacing / layout mode</strong> — grid, width, and visibility adapt together.</>,
        dont: <>Detach or hand-edit the grid styles — the variable bindings are what make one grid serve every breakpoint.</>,
    },
    {
        do: <>Design at MD (768) and XL (1440) at minimum, so stretch behavior is intentional.</>,
        dont: <>Design below 768px — PLUS has no small-screen tier.</>,
    },
    {
        do: <>Lay page content on the content grid inside Main, and size modals from the screen grid.</>,
        dont: <>Span the content grid across SideNav or TopNav, or give a modal a fixed pixel width.</>,
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
                    backgroundColor: i % 2 ? 'transparent' : 'var(--color-surface-container-low, #f3f3f6)',
                }}>
                    <PairCell tone="do">{p.do}</PairCell>
                </div>
                <div style={{
                    borderTop: '1px solid var(--color-outline-variant)',
                    backgroundColor: i % 2 ? 'transparent' : 'var(--color-surface-container-low, #f3f3f6)',
                }}>
                    <PairCell tone="dont">{p.dont}</PairCell>
                </div>
            </React.Fragment>
        ))}
    </div>
);
