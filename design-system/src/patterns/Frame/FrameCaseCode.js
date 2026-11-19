/** The source shown behind Show code for each live example in FrameCases.jsx. */

const WINDOW = (address, body) => `<BrowserWindow address="${address}" height={440}>
${body}
</BrowserWindow>`;

const SIDEBAR = `<Sidebar user="tutor" activeTabId="home" account={account} />`;

const BAR = (cancel) => `<CaseSurface border="top" padding="sm">
    <FooterActions>${cancel ? '\n        <Button text="Cancel" appearance="subtle" />' : ''}
        <Button text="Back" />
        <Button text="Next" appearance="primary" />
    </FooterActions>
</CaseSurface>`;

export const CODE = {
    BarInOrder: BAR(false),
    BarScrambled: BAR(true),
    FocusedNoSidebar: WINDOW('app.plus.org/terms/new', `    <Frame
        header={<><IconButton icon="xmark" label="Close" /><h1>Plan a tutoring term</h1></>}
        width="reading"
    >
        <ProgressTracker label="Steps" orientation="vertical" items={steps} />
    </Frame>
    <FooterActions>
        <Button text="Back" />
        <Button text="Next" appearance="primary" />
    </FooterActions>`),
    FocusedWithSidebar: WINDOW('app.plus.org/terms/new', `    <Frame
        sidebar={${SIDEBAR}}
        header={<><IconButton icon="xmark" label="Close" /><h1>Plan a tutoring term</h1></>}
        width="reading"
    >
        <ProgressTracker label="Steps" orientation="vertical" items={steps} />
    </Frame>
    <FooterActions>
        <Button text="Back" />
        <Button text="Next" appearance="primary" />
    </FooterActions>`),
    AiPanelDocked: WINDOW('app.plus.org/dashboard', `    <Frame sidebar={${SIDEBAR}} panel={<AskPanel />} panelOpen panelLabel="AI chat">
        <PatternSection title="Upcoming sessions">
            <Skeleton preset="text" lines={6} />
        </PatternSection>
    </Frame>`),
    AiPanelFloating: WINDOW('app.plus.org/dashboard', `    <Frame sidebar={${SIDEBAR}} panel={<AskPanel />} panelOpen panelLabel="AI chat">
        <PatternSection title="Upcoming sessions">
            <Skeleton preset="text" lines={6} />
        </PatternSection>
    </Frame>`),
    BareColumn: WINDOW('app.plus.org/sign-in', `    <Frame surfaceDirect>
        <Logo />
        <TextField label="Email" type="email" />
        <Button text="Sign in" appearance="primary" />
    </Frame>`),
    BareWithSidebar: WINDOW('app.plus.org/sign-in', `    <Frame surfaceDirect sidebar={${SIDEBAR}}>
        <Logo />
        <TextField label="Email" type="email" />
        <Button text="Sign in" appearance="primary" />
    </Frame>`),
};
