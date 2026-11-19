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
    MultiStepInnerSidebar: WINDOW('app.plus.org/terms/new', `    <Frame
        surfaceDirect
        sidebarDocked
        sidebar={<Sidebar user="tutor" account={account} activeId="schedule" inner={{ areaLabel: 'Home', rows, label: 'Steps' }} onBack={leave} />}
    >
        <h1>Plan a tutoring term</h1>
        {stepBody}
        <FooterActions leadingAction={<Button text="Save and exit" appearance="subtle" />}>
            <Button text="Back" />
            <Button text="Next" appearance="primary" />
        </FooterActions>
    </Frame>`),
    MultiStepStepsInPage: WINDOW('app.plus.org/terms/new', `    <Frame surfaceDirect sidebar={${SIDEBAR}}>
        <ProgressTracker label="Steps" orientation="vertical" items={steps} />
        <Skeleton preset="text" lines={4} />
    </Frame>`),
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
