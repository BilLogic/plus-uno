/** The source shown behind Show code for each live example in FormCases.jsx. */

export const CODE = {
    EditInPanel: `<div style={{ display: 'flex' }}>
    <SessionsSection />
    <PanelContainer width="var(--panel-width-default)">
        <PanelHeader title="Ana Ruiz" actions={<PanelCloseAction onClick={close} />} />
        <PanelBody><FormFields values={values} onChange={setValues} /></PanelBody>
        <PanelFooter>
            <FullBleedFooter primary="Save" onSave={save} onCancel={discard} />
        </PanelFooter>
    </PanelContainer>
</div>`,
    EditInModal: `<>
    <SessionsSection />
    <Blanket inline show>
        <Dialog
            title="Ana Ruiz"
            onClose={close}
            footer={<FullBleedFooter primary="Save" onSave={save} onCancel={discard} />}
        >
            <FormFields values={values} onChange={setValues} />
        </Dialog>
    </Blanket>
</>`,
};
