/** The source shown behind Show code for each live example in ErrorsCases.jsx. */

export const CODE = {
    FailureInSlot: `<PatternSection
    title="Sessions"
    description="This week"
    views={<ViewPills views={['This week', 'Next week']} activeView="This week" />}
    search={<HeaderSearch label="Search sessions" />}
>
    <EmptyState
        spacing="compact"
        icon="triangle-exclamation"
        header="Couldn't load this week's sessions"
        description="Check your connection and try again."
        primaryAction={<Button text="Try again" spacing="compact" />}
    />
</PatternSection>`,
    FailureInModal: `<Dialog
    title="Couldn't load sessions"
    footer={(
        <FooterActions>
            <Button text="Close" />
            <Button text="Try again" appearance="primary" />
        </FooterActions>
    )}
>
    <p>Check your connection and try again.</p>
</Dialog>`,
};
