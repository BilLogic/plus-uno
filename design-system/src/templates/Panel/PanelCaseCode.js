/** The source shown behind Show code for each live example in PanelCases.jsx. */

const PANEL = `<div style={{ position: 'absolute', insetBlock: 0, insetInlineEnd: 0, boxShadow: 'var(--ds-shadow-overlay)' }}>
    <DetailsPanel />
</div>`;

export const CODE = {
    FloatsNoBlanket: `<>
    <SessionsBehind />
    ${PANEL.replace(/\n/g, '\n    ')}
</>`,
    PanelOnBlanket: `<>
    <SessionsBehind />
    <Blanket inline show style={{ position: 'absolute', inset: 0 }} />
    ${PANEL.replace(/\n/g, '\n    ')}
</>`,
    OneFloatingPanel: `<>
    <SessionsBehind />
    ${PANEL.replace(/\n/g, '\n    ')}
</>`,
    TwoFloatingPanels: `<>
    <SessionsBehind />
    <div style={{ position: 'absolute', insetBlock: 0, insetInlineEnd: SECOND_OFFSET, boxShadow: 'var(--ds-shadow-overlay)' }}>
        <DetailsPanel />
    </div>
    ${PANEL.replace(/\n/g, '\n    ')}
</>`,
    BesideAiPanel: `<>
    <SessionsBehind />
    <div style={{ position: 'absolute', insetBlock: 0, insetInlineEnd: 0 }}>
        <PanelContainer width="var(--panel-width-default)">{/* Assistant */}</PanelContainer>
    </div>
    <div style={{ position: 'absolute', insetBlock: 0, insetInlineEnd: 'var(--panel-width-default)', boxShadow: 'var(--ds-shadow-overlay)' }}>
        <DetailsPanel />
    </div>
</>`,
    CoversAiPanel: `<>
    <SessionsBehind />
    <div style={{ position: 'absolute', insetBlock: 0, insetInlineEnd: 0 }}>
        <PanelContainer width="var(--panel-width-default)">{/* Assistant */}</PanelContainer>
    </div>
    <div style={{ position: 'absolute', insetBlock: 0, insetInlineEnd: SECOND_OFFSET, boxShadow: 'var(--ds-shadow-overlay)' }}>
        <DetailsPanel />
    </div>
</>`,
};
