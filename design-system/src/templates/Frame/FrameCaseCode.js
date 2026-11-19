/** The source shown behind Show code for each live example in FrameCases.jsx. */

const WINDOW = (address, body) => `<BrowserWindow address="${address}" height={440}>
${body}
</BrowserWindow>`;

const SIDEBAR = `<Sidebar user="tutor" activeTabId="home" account={account} />`;

const BAR = (second) => `<CaseSurface border="top" padding="sm">
    <FooterActions leadingAction={<Button text="Save and exit" appearance="subtle" spacing="default" />}>
        <Button text="${second}" spacing="default" />
        <Button text="Next" appearance="primary" spacing="default" />
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
    BarInOrder: BAR('Back'),
    BarScrambled: BAR('Cancel'),
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
    AiPanelDocked: PANEL('1440', 'The stage is 1440 wide: from 1168 the Frame docks the panel (from 1408 beside an open Sidebar) and the Page narrows beside it.'),
    AiPanelFloating: PANEL('1100', 'The stage is 1100 wide: under 1168 the Frame cannot dock a 400 panel, so it floats over the Page.'),
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
