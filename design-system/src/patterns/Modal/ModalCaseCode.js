/** The source shown behind Show code for each live example in ModalCases.jsx. */

const CONFIRM = (width) => `<Modal inline show width="${width}" title="Delete session?" footer={(
    <FooterActions>
        <Button text="Keep session" />
        <Button text="Delete session" appearance="danger" />
    </FooterActions>
)}>
    <p>This removes Thursday's session for Ana and her tutor.</p>
</Modal>`;

export const CODE = {
    ConfirmNarrow: CONFIRM('4-col'),
    ConfirmWide: CONFIRM('10-col'),
    ConfirmsInside: `const [confirming, setConfirming] = useState(true);

<Modal
    inline
    show
    title={confirming ? 'Delete session?' : 'Session details'}
    footer={(
        <FooterActions>
            <Button text="Back" onClick={() => setConfirming(false)} />
            <Button text="Delete session" appearance="danger" />
        </FooterActions>
    )}
>
    <SectionMessage appearance="warning" dismissible={false}>
        This removes Thursday's session for Ana and her tutor. This cannot be undone.
    </SectionMessage>
</Modal>`,
    ModalOnModal: `<>
    <Modal inline show title="Session details" footer={detailsFooter}>
        <p>This removes Thursday's session for Ana and her tutor.</p>
    </Modal>
    <Modal inline show width="4-col" title="Delete session?" footer={confirmFooter}>
        <p>This removes Thursday's session for Ana and her tutor.</p>
    </Modal>
</>`,
};
