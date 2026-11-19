import React, { useState } from 'react';
import { Button, FooterActions, Logo, PanelBody, PanelCloseAction, PanelContainer, PanelHeader, Sidebar, Skeleton, TextField } from '@/components';
import { Frame, PatternSection } from '@/patterns';
import { CaseSurface } from '@/storybook-docs/lib/case-surface.jsx';
import { FitStage } from '@/storybook-docs/lib/fit-stage.jsx';
import { FocusedTask, WINDOW_HEIGHT } from '@/storybook-docs/lib/focused-task.jsx';
import { InAppFrame } from '@/storybook-docs/lib/pattern-demo.jsx';
import { BrowserWindow } from '@/storybook-docs/lib/template-page.jsx';

/**
 * The live do and don't bar examples of the Frame template page, built from
 * `FooterActions` and `Button`.
 */

/** Back and the primary Next split the bar; Close in the title row leaves the task. */
export const BarInOrder = () => (
    <CaseSurface border="top" padding="sm">
        <FooterActions>
            <Button text="Back" onClick={() => {}} />
            <Button text="Next" appearance="primary" onClick={() => {}} />
        </FooterActions>
    </CaseSurface>
);

/** Cancel repeated in the bar beside Back and Next: two ways out of one task. */
export const BarScrambled = () => (
    <CaseSurface border="top" padding="sm">
        <FooterActions>
            <Button text="Cancel" appearance="subtle" onClick={() => {}} />
            <Button text="Back" onClick={() => {}} />
            <Button text="Next" appearance="primary" onClick={() => {}} />
        </FooterActions>
    </CaseSurface>
);

/** Wide enough that the Frame inside the window docks its Sidebar (1024 and up). */
const DOCKED_STAGE = 1100; // docs-literal: keeps the Frame at 1024 or more inside the window's border
/** Wide enough that the Sidebar and the AI panel both dock (the Page keeps its 720 floor). */
const PANEL_STAGE = 1440; // docs-literal: the X-Large stage

const ACCOUNT = { id: 'john-doe', name: 'John Doe', role: 'Lead' };

const FocusedWindow = ({ withSidebar }) => (
    <FitStage width={DOCKED_STAGE} reflow={false}>
        <BrowserWindow address="app.plus.org/terms/new" height={WINDOW_HEIGHT}>
            <FocusedTask
                count={5}
                {...(withSidebar ? { sidebar: <Sidebar user="tutor" activeTabId="home" account={ACCOUNT} /> } : {})}
            />
        </BrowserWindow>
    </FitStage>
);

/** The task fills the window: no Sidebar, nothing to invite the person away. */
export const FocusedNoSidebar = () => <FocusedWindow />;

/** The Sidebar left docked beside a focused task, one click from leaving it. */
export const FocusedWithSidebar = () => <FocusedWindow withSidebar />;

const RowsBehind = () => (
    <PatternSection title="Upcoming sessions">
        <Skeleton preset="text" lines={6} />
    </PatternSection>
);

const AskPanel = ({ onClose }) => (
    <PanelContainer>
        <PanelHeader title="AI chat" actions={<PanelCloseAction onClick={onClose} />} />
        <PanelBody>Ask about this page.</PanelBody>
    </PanelContainer>
);

const PanelWindow = ({ stage }) => (
    <FitStage width={stage} reflow={false}>
        <BrowserWindow address="app.plus.org/dashboard" height={WINDOW_HEIGHT}>
            <InAppFrame height="100%" panelLabel="AI chat" panelStorageKey={null} panel={<AskPanel />} panelOpen>
                <RowsBehind />
            </InAppFrame>
        </BrowserWindow>
    </FitStage>
);

/** The panel docked at the right edge, the Page narrowing beside it. */
export const AiPanelDocked = () => <PanelWindow stage={PANEL_STAGE} />;

/** The panel floating over the Page, hiding the rows beneath it: a Frame under 1200 cannot dock both. */
export const AiPanelFloating = () => <PanelWindow stage={DOCKED_STAGE} />;

const SignInColumn = () => {
    const [email, setEmail] = useState('');
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 'var(--section-stack-lg)', maxInlineSize: 'var(--panel-min-width)', marginInline: 'auto', paddingBlock: 'var(--section-stack-lg)' }}>
            <Logo />
            <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Button text="Sign in" appearance="primary" onClick={() => {}} />
        </div>
    );
};

/** One centered column: the form and its button. */
export const BareColumn = () => (
    <FitStage width={DOCKED_STAGE} reflow={false}>
        <BrowserWindow address="app.plus.org/sign-in" height={WINDOW_HEIGHT}>
            <Frame surfaceDirect><SignInColumn /></Frame>
        </BrowserWindow>
    </FitStage>
);

/** The Sidebar beside a sign-in: navigation for a person who has not signed in. */
export const BareWithSidebar = () => (
    <FitStage width={DOCKED_STAGE} reflow={false}>
        <BrowserWindow address="app.plus.org/sign-in" height={WINDOW_HEIGHT}>
            <div style={{ height: '100%' }}>
                <Frame surfaceDirect sidebar={<Sidebar user="tutor" activeTabId="home" account={ACCOUNT} />}>
                    <SignInColumn />
                </Frame>
            </div>
        </BrowserWindow>
    </FitStage>
);
