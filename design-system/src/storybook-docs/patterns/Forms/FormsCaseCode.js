/** The source shown behind Show code for each live example in formsDemo.jsx and formLayoutCases.jsx. */

const FOOTER = `<FooterActions>
        <Button text="Cancel" />
        <Button text="Save session" appearance="primary" />
    </FooterActions>`;

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
    ErrorOnField: `<Modal inline show title="Log a session" footer={(
    ${FOOTER}
)}>
    <TextField label="Student" isRequired isInvalid errorMessage="Enter the student’s name" />
</Modal>`,
    ErrorInSecondDialog: `<>
    <Modal inline show title="Log a session" footer={(
        ${FOOTER}
    )}>
        <TextField label="Student" isRequired isInvalid />
    </Modal>
    <Modal inline show width="4-col" title="Something went wrong" footer={(
        <FooterActions>
            <Button text="OK" appearance="primary" />
        </FooterActions>
    )}>
        <p>The session was not saved.</p>
    </Modal>
</>`,
};
