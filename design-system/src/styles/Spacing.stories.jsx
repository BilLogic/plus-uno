import React from 'react';

/**
 * Companion styled tables for Spacing.mdx. All tables are explicit <table>
 * elements (markdown tables do NOT parse in this MDX setup) and share ONE
 * column geometry via <DocTable> + fixed table-layout, so every spacing table
 * lines its Token / Value / Description columns up identically.
 */
export default {
    title: 'Foundations/Spacing',
    tags: ['!dev', '!autodocs'],
};

const wrap = { maxWidth: '1200px' };

/**
 * Shared table. `cols` = [{ header, width, align, mono, code }]; `rows` = arrays of cells.
 * Fixed layout + explicit widths keep every table visually consistent.
 */
const DocTable = ({ cols, rows }) => (
    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', marginBottom: '8px', border: '1px solid var(--color-outline-variant)' }}>
        <colgroup>
            {cols.map((c, i) => <col key={i} style={{ width: c.width }} />)}
        </colgroup>
        <thead>
            <tr style={{ backgroundColor: 'var(--color-surface-container-low)', borderBottom: '2px solid var(--color-outline)' }}>
                {cols.map((c, i) => (
                    <th key={i} className="body2-txt" style={{ padding: '10px 12px', textAlign: c.align || 'left', fontWeight: 600 }}>{c.header}</th>
                ))}
            </tr>
        </thead>
        <tbody>
            {rows.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
                    {row.map((cell, j) => {
                        const c = cols[j];
                        const content = c.code ? <code style={{ fontSize: '0.85em', wordBreak: 'break-word' }}>{cell}</code> : cell;
                        return (
                            <td key={j} className={c.mono || c.code ? undefined : 'body2-txt'}
                                style={{ padding: '10px 12px', textAlign: c.align || 'left', fontFamily: c.mono ? 'monospace' : 'inherit', wordBreak: 'break-word' }}>
                                {content}
                            </td>
                        );
                    })}
                </tr>
            ))}
        </tbody>
    </table>
);

// Shared column geometry for the per-context value tables — identical across all of them.
const VALUE_COLS = [
    { header: 'Token', width: '46%', code: true },
    { header: 'Value', width: '16%', mono: true },
    { header: 'Description', width: '38%' },
];
const VALUE_COLS_4 = [
    { header: 'Token', width: '34%', code: true },
    { header: 'Value', width: '14%', mono: true },
    { header: 'Use with', width: '26%', mono: true },
    { header: 'Best for', width: '26%' },
];
// Shared geometry for the conceptual 3-column reference tables.
const REF_COLS = (a, b, c) => [
    { header: a, width: '22%' },
    { header: b, width: '46%', code: false },
    { header: c, width: '32%' },
];

export const PrimitiveScale = () => (
    <div style={wrap}>
        <DocTable
            cols={[
                { header: 'Group', width: '22%' },
                { header: 'Token', width: '58%', code: true },
                { header: 'Value', width: '20%', mono: true },
            ]}
            rows={[
                ['Small', '--size-spacing-small-space-000', '0px'],
                ['Small', '--size-spacing-small-space-025', '2px'],
                ['Small', '--size-spacing-small-space-050', '4px'],
                ['Small', '--size-spacing-small-space-075', '6px'],
                ['Small', '--size-spacing-small-space-100', '8px'],
                ['Small', '--size-spacing-small-space-150', '10px'],
                ['Medium', '--size-spacing-medium-space-200', '12px'],
                ['Medium', '--size-spacing-medium-space-300', '16px'],
                ['Medium', '--size-spacing-medium-space-400', '20px'],
                ['Medium', '--size-spacing-medium-space-500', '24px'],
                ['Large', '--size-spacing-large-space-600', '32px'],
                ['Large', '--size-spacing-large-space-650', '36px'],
                ['Large', '--size-spacing-large-space-700', '40px'],
                ['Large', '--size-spacing-large-space-800', '48px'],
                ['Large', '--size-spacing-large-space-900', '64px'],
                ['Large', '--size-spacing-large-space-1000', '80px'],
            ]}
        />
    </div>
);

export const SemanticTokens = () => (
    <div style={wrap}>
        <DocTable
            cols={REF_COLS('Context', 'Token pattern', 'Used for')}
            rows={[
                ['Element', <code style={{ fontSize: '0.82em', wordBreak: 'break-word' }}>--size-element-pad-{'{x|y}'}-{'{sm|md|lg}'}, --size-element-gap-{'{xs|sm|md|lg}'}</code>, 'Buttons, inputs, chips, and their internal spacing'],
                ['Card', <code style={{ fontSize: '0.82em', wordBreak: 'break-word' }}>--size-card-pad-{'{x|y}'}-{'{sm|md|lg}'}, --size-card-gap-{'{sm|md|lg}'}</code>, 'Card padding and spacing between items inside a card'],
                ['Section', <code style={{ fontSize: '0.82em', wordBreak: 'break-word' }}>--size-section-pad-{'{x|y}'}-{'{sm|md|lg}'}, --size-section-gap-{'{sm|md|lg}'}</code>, 'Page sections and spacing between major blocks'],
                ['Modal', <code style={{ fontSize: '0.82em', wordBreak: 'break-word' }}>--size-modal-pad-{'{x|y}'}-{'{sm|md|lg}'}, --size-modal-gap-{'{sm|md|lg}'}</code>, 'Modal body padding and content spacing'],
                ['Surface', <code style={{ fontSize: '0.82em', wordBreak: 'break-word' }}>--size-surface-pad-{'{x|y}'}, --size-surface-gap-{'{sm|md|lg}'}</code>, 'Outermost page surface'],
                ['Table', <code style={{ fontSize: '0.82em', wordBreak: 'break-word' }}>--size-table-cell-{'{x|y|gap}'}</code>, 'Table cell padding and cell content gaps'],
            ]}
        />
    </div>
);

export const TierGuide = () => (
    <div style={wrap}>
        <DocTable
            cols={REF_COLS('Layer', 'Token tier', 'Example')}
            rows={[
                ['Page / surface', <code style={{ fontSize: '0.85em' }}>--size-surface-*</code>, 'Outer page padding'],
                ['Container', <code style={{ fontSize: '0.85em' }}>--size-surface-container-*</code>, 'Grouped content regions on the surface'],
                ['Section', <code style={{ fontSize: '0.85em' }}>--size-section-*</code>, 'Gap between major page blocks (e.g. two Cards)'],
                ['Card / modal', <code style={{ fontSize: '0.85em' }}>--size-card-*, --size-modal-*</code>, 'Card padding, modal body spacing'],
                ['Element', <code style={{ fontSize: '0.85em' }}>--size-element-*</code>, 'Gap between headers and text inside a Card'],
            ]}
        />
    </div>
);

export const ElementSpacings = () => (
    <div style={wrap}>
        <h4 className="h4" style={{ marginBottom: '12px' }}>Padding</h4>
        <DocTable cols={VALUE_COLS} rows={[
            ['--size-element-pad-x-lg', '16px', 'Large horizontal padding'],
            ['--size-element-pad-x-md', '12px', 'Medium horizontal padding'],
            ['--size-element-pad-x-sm', '8px', 'Small horizontal padding'],
            ['--size-element-pad-y-lg', '8px', 'Large vertical padding'],
            ['--size-element-pad-y-md', '6px', 'Medium vertical padding'],
            ['--size-element-pad-y-sm', '4px', 'Small vertical padding'],
        ]} />
        <h4 className="h4" style={{ margin: '28px 0 12px' }}>Gap</h4>
        <DocTable cols={VALUE_COLS} rows={[
            ['--size-element-gap-lg', '12px', 'Large gap'],
            ['--size-element-gap-md', '10px', 'Medium gap'],
            ['--size-element-gap-sm', '8px', 'Small gap'],
            ['--size-element-gap-xs', '4px', 'Extra small gap'],
        ]} />
        <h4 className="h4" style={{ margin: '28px 0 12px' }}>Radius</h4>
        <DocTable cols={VALUE_COLS} rows={[
            ['--size-element-radius-sm', '4px', 'Small radius (radius-100)'],
            ['--size-element-radius-md', '4px', 'Medium radius (radius-100)'],
            ['--size-element-radius-lg', '8px', 'Large radius (radius-200)'],
            ['--size-element-radius-full', '999px', 'Pill shape (radius-1000)'],
        ]} />
    </div>
);

export const CardSpacings = () => (
    <div style={wrap}>
        <DocTable cols={VALUE_COLS} rows={[
            ['--size-card-pad-x-sm', '16px', 'Small horizontal padding'],
            ['--size-card-pad-x-md', '20px', 'Medium horizontal padding'],
            ['--size-card-pad-x-lg', '24px', 'Large horizontal padding'],
            ['--size-card-pad-y-sm', '16px', 'Small vertical padding'],
            ['--size-card-pad-y-md', '20px', 'Medium vertical padding'],
            ['--size-card-pad-y-lg', '24px', 'Large vertical padding'],
            ['--size-card-gap-sm', '10px', 'Small gap'],
            ['--size-card-gap-md', '16px', 'Medium gap'],
            ['--size-card-gap-lg', '20px', 'Large gap'],
            ['--size-card-radius-sm', '12px', 'Small border radius'],
            ['--size-card-radius-md', '16px', 'Medium border radius'],
            ['--size-card-radius-full', '999px', 'Pill shape'],
            ['--size-card-border-sm', '1px', 'Small border'],
            ['--size-card-border-md', '1.5px', 'Medium border'],
            ['--size-card-border-lg', '2px', 'Large border'],
        ]} />
    </div>
);

export const SectionSpacings = () => (
    <div style={wrap}>
        <DocTable cols={VALUE_COLS} rows={[
            ['--size-section-pad-x-lg', '36px', 'Large horizontal padding'],
            ['--size-section-pad-x-md', '24px', 'Medium horizontal padding'],
            ['--size-section-pad-x-sm', '16px', 'Small horizontal padding'],
            ['--size-section-pad-y-lg', '36px', 'Large vertical padding'],
            ['--size-section-pad-y-md', '24px', 'Medium vertical padding'],
            ['--size-section-pad-y-sm', '16px', 'Small vertical padding'],
            ['--size-section-gap-lg', '24px', 'Large gap'],
            ['--size-section-gap-md', '16px', 'Medium gap'],
            ['--size-section-gap-sm', '8px', 'Small gap'],
            ['--size-section-radius-sm', '8px', 'Small border radius'],
            ['--size-section-radius-md', '12px', 'Medium border radius (radius-300)'],
            ['--size-section-radius-lg', '16px', 'Large border radius'],
        ]} />
    </div>
);

export const ModalSpacings = () => (
    <div style={wrap}>
        <DocTable cols={VALUE_COLS} rows={[
            ['--size-modal-pad-x-sm', '10px', 'Small horizontal padding'],
            ['--size-modal-pad-x-md', '16px', 'Medium horizontal padding'],
            ['--size-modal-pad-x-lg', '20px', 'Large horizontal padding'],
            ['--size-modal-pad-y-sm', '8px', 'Small vertical padding'],
            ['--size-modal-pad-y-md', '12px', 'Medium vertical padding'],
            ['--size-modal-pad-y-lg', '16px', 'Large vertical padding'],
            ['--size-modal-gap-sm', '8px', 'Small gap'],
            ['--size-modal-gap-md', '12px', 'Medium gap'],
            ['--size-modal-gap-lg', '20px', 'Large gap'],
            ['--size-modal-radius-sm', '4px', 'Small border radius'],
            ['--size-modal-radius-md', '6px', 'Medium border radius'],
            ['--size-modal-radius-lg', '12px', 'Large border radius'],
            ['--size-modal-radius-full', '999px', 'Pill shape'],
            ['--size-modal-border-sm', '1px', 'Small border'],
            ['--size-modal-border-md', '1.5px', 'Medium border'],
            ['--size-modal-border-lg', '2px', 'Large border'],
        ]} />
    </div>
);

export const SurfaceSpacings = () => (
    <div style={wrap}>
        <DocTable cols={VALUE_COLS} rows={[
            ['--size-surface-pad-x', '32px', 'Horizontal padding (matches grid margin)'],
            ['--size-surface-pad-y', '24px', 'Vertical padding'],
            ['--size-surface-gap-lg', '32px', 'Large gap'],
            ['--size-surface-gap-md', '24px', 'Medium gap'],
            ['--size-surface-gap-sm', '16px', 'Small gap'],
            ['--size-surface-radius', '16px', 'Border radius'],
            ['--size-surface-border', '2px', 'Border width'],
        ]} />
    </div>
);

export const CornerRadiusApplication = () => (
    <div style={wrap}>
        <p className="body1-txt" style={{ marginBottom: '20px' }}>
            Corner radius should match the padding/gap size tier of the container.
        </p>
        <h4 className="h4" style={{ marginBottom: '12px' }}>Elements layer</h4>
        <DocTable cols={VALUE_COLS_4} rows={[
            ['--size-element-radius-sm', '4px', 'element-pad-sm', 'Small buttons'],
            ['--size-element-radius-md', '4px', 'element-pad-md', 'Standard buttons'],
            ['--size-element-radius-lg', '8px', 'element-pad-lg', 'Large buttons'],
            ['--size-element-radius-full', '999px', 'Pill shape', 'Badges, chips'],
        ]} />
        <h4 className="h4" style={{ margin: '28px 0 12px' }}>Cards layer</h4>
        <DocTable cols={VALUE_COLS_4} rows={[
            ['--size-card-radius-sm', '12px', 'card-pad-sm', 'Compact cards'],
            ['--size-card-radius-md', '16px', 'card-pad-md/lg', 'Standard cards'],
        ]} />
    </div>
);
CornerRadiusApplication.storyName = 'Corner Radius Application';
