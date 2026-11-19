/** The source shown behind Show code for each live example in formsDemo.jsx. */

const FOOTER = `<FooterActions>
        <Button text="Cancel" />
        <Button text="Save session" appearance="primary" />
    </FooterActions>`;

export const CODE = {
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
