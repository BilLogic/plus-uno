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

const PANEL = (stage, note) => `{/* ${note} */}
<div style={{ inlineSize: ${stage} }}>
    <BrowserWindow address="app.plus.org/dashboard" height={440}>
        <InAppFrame panelLabel="AI chat" panelStorageKey={null} panel={<AskPanel />} panelOpen>
            <Section title="Upcoming sessions">
                <Skeleton preset="text" lines={6} />
            </Section>
        </InAppFrame>
    </BrowserWindow>
</div>`;

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
        <FooterActions>
            <Button text="Save and exit" />
            <Button text="Back" />
            <Button text="Next" appearance="primary" />
        </FooterActions>
    </Frame>`),
    MultiStepStepsInPage: WINDOW('app.plus.org/terms/new', `    <Frame surfaceDirect sidebar={${SIDEBAR}}>
        <ProgressTracker label="Steps" orientation="vertical" items={steps} />
        <Skeleton preset="text" lines={4} />
    </Frame>`),
    AiPanelDocked: PANEL('1440', 'The stage is 1440 wide: at 1200 or more the Frame docks the panel and the Page narrows beside it.'),
    AiPanelFloating: PANEL('1100', 'The stage is 1100 wide: under 1200 the Frame cannot dock both, so the panel floats over the Page.'),
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
