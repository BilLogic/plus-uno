import React, { useState } from 'react';
import { Button, FooterActions, LinkButton, Logo, ProgressTracker, Sidebar, Skeleton, TextField } from '@/components';
import { Frame, PanelBody, PanelCloseAction, PanelContainer, PanelHeader, Section } from '@/templates';
import { CaseSurface } from '@/storybook-docs/lib/case-surface.jsx';
import { FitStage } from '@/storybook-docs/lib/fit-stage.jsx';
import { MultiStepTaskType, WINDOW_HEIGHT, stepItems } from '@/storybook-docs/lib/multi-step-task.jsx';
import { InAppFrame } from '@/storybook-docs/lib/pattern-demo.jsx';
import { BrowserWindow } from '@/storybook-docs/lib/template-page.jsx';

/**
 * The live do and don't bar examples of the Frame template page, built from
 * `FooterActions` and `Button`.
 */

/** Save and exit as a link at the left edge; Back and the primary Next in tracks 3 and 4, on one 32 line. */
export const BarInOrder = () => (
    <CaseSurface border="top" padding="sm">
        <FooterActions leadingAction={<LinkButton text="Save and exit" href="#save-and-exit" appearance="subtle" spacing="default" onClick={(event) => { event.preventDefault(); }} />}>
            <Button text="Back" spacing="default" onClick={() => {}} />
            <Button text="Next" appearance="primary" spacing="default" onClick={() => {}} />
        </FooterActions>
    </CaseSurface>
);

/** Cancel repeated in the footer beside Save and exit: two ways out of one task. */
export const BarScrambled = () => (
    <CaseSurface border="top" padding="sm">
        <FooterActions leadingAction={<LinkButton text="Save and exit" href="#save-and-exit" appearance="subtle" spacing="default" onClick={(event) => { event.preventDefault(); }} />}>
            <Button text="Cancel" spacing="default" onClick={() => {}} />
            <Button text="Next" appearance="primary" spacing="default" onClick={() => {}} />
        </FooterActions>
    </CaseSurface>
);

/** Wide enough that the Frame inside the window docks its Sidebar (1024 and up). */
const DOCKED_STAGE = 1100; // docs-literal: keeps the Frame at 1024 or more inside the window's border
/** Wide enough that the Sidebar and the AI panel both dock (the Page keeps its 720 floor). */
const PANEL_STAGE = 1440; // docs-literal: the X-Large stage

const ACCOUNT = { id: 'john-doe', name: 'John Doe', role: 'Lead' };

/** One task: the steps are the Sidebar's inner rows, so the Page holds only the task. */
export const MultiStepInnerSidebar = () => <MultiStepTaskType />;

const STEP_LABELS = ['Student', 'Schedule', 'Goals'];

/** The steps drawn again in the Page, beside a Sidebar that still lists the main areas: two lists for one task. */
export const MultiStepStepsInPage = () => (
    <FitStage width={DOCKED_STAGE} reflow={false}>
        <BrowserWindow address="app.plus.org/terms/new" height={WINDOW_HEIGHT}>
            <div style={{ height: '100%' }}>
                <Frame surfaceDirect sidebar={<Sidebar user="tutor" activeTabId="home" account={ACCOUNT} />}>
                    <div style={{ display: 'flex', gap: 'var(--inline-2xl)', padding: 'var(--page-pad)' }}>
                        <ProgressTracker label="Steps" orientation="vertical" items={stepItems(STEP_LABELS, 1, () => {})} />
                        <Skeleton preset="text" lines={4} />
                    </div>
                </Frame>
            </div>
        </BrowserWindow>
    </FitStage>
);

const RowsBehind = () => (
    <Section title="Upcoming sessions">
        <Skeleton preset="text" lines={6} />
    </Section>
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

/** The panel floating over the Page, hiding the rows beneath it: a Frame under 1168 cannot dock a 400 panel. */
export const AiPanelFloating = () => <PanelWindow stage={DOCKED_STAGE} />;

const SignInColumn = () => {
    const [email, setEmail] = useState('');
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 'var(--stack-2xl)', maxInlineSize: 'var(--panel-min-width)', marginInline: 'auto', paddingBlock: 'var(--stack-2xl)' }}>
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
