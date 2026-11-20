import React, { useState } from 'react';
import { Button, FooterActions, LinkButton, Logo, PageHeader, ProgressTracker, Sidebar, Skeleton, TextField } from '@/components';
import { Frame, Page, PanelBody, PanelCloseAction, PanelContainer, PanelHeader, Section } from '@/templates';

/**
 * The Frame page's do and don't examples, as PLUS parts only. Show code prints
 * each one from this file; the stage, window and docs width around it live in
 * `FrameCases.jsx`.
 */

const ACCOUNT = { id: 'john-doe', name: 'John Doe', role: 'Lead' };

export const BarInOrder = () => (
    <FooterActions leadingAction={<LinkButton text="Save and exit" href="#save-and-exit" appearance="link" />}>
        <Button text="Back" />
        <Button text="Next" appearance="primary" />
    </FooterActions>
);

export const BarScrambled = () => (
    <FooterActions leadingAction={<LinkButton text="Save and exit" href="#save-and-exit" appearance="link" />}>
        <Button text="Cancel" />
        <Button text="Next" appearance="primary" />
    </FooterActions>
);

const STEP_ROWS = [
    { id: 'student', text: 'Student', done: true },
    { id: 'schedule', text: 'Schedule' },
    { id: 'goals', text: 'Goals', disabled: true, disabledText: 'Answer the steps before it first.' },
];

export const MultiStepInnerSidebar = () => (
    <Frame
        surfaceDirect
        sidebarDocked
        sidebar={(
            <Sidebar
                user="tutor"
                account={ACCOUNT}
                activeId="schedule"
                inner={{ areaLabel: 'Home', rows: STEP_ROWS, label: 'Steps' }}
                onBack={() => {}}
            />
        )}
    >
        <div style={{ display: 'flex', flexDirection: 'column', blockSize: '100%', minBlockSize: 0 }}>
            <Page style={{ flex: '1 1 auto', minBlockSize: 0, overflowY: 'auto' }} header={<PageHeader title="Plan a tutoring term" />}>
                <Skeleton preset="text" lines={4} />
            </Page>
            <div style={{ flex: '0 0 auto', paddingInline: 'var(--page-pad)', borderBlockStart: 'var(--border-width-default) solid var(--ds-border)' }}>
                <FooterActions leadingAction={<LinkButton text="Save and exit" href="#save-and-exit" appearance="link" />}>
                    <Button text="Back" />
                    <Button text="Next" appearance="primary" />
                </FooterActions>
            </div>
        </div>
    </Frame>
);

const STEPS = [
    { id: 'student', label: 'Student', status: 'visited' },
    { id: 'schedule', label: 'Schedule', status: 'current' },
    { id: 'goals', label: 'Goals', status: 'unvisited' },
];

export const MultiStepStepsInPage = () => (
    <Frame surfaceDirect sidebar={<Sidebar user="tutor" activeTabId="home" account={ACCOUNT} />}>
        <div style={{ display: 'flex', gap: 'var(--inline-2xl)', padding: 'var(--page-pad)' }}>
            <ProgressTracker label="Steps" orientation="vertical" items={STEPS} />
            <Skeleton preset="text" lines={4} />
        </div>
    </Frame>
);

const AskPanel = () => (
    <PanelContainer>
        <PanelHeader title="AI chat" actions={<PanelCloseAction />} />
        <PanelBody>Ask about this page.</PanelBody>
    </PanelContainer>
);

export const AiPanel = () => (
    <Frame
        sidebar={<Sidebar user="tutor" activeTabId="home" account={ACCOUNT} />}
        panelLabel="AI chat"
        panelStorageKey={null}
        panel={<AskPanel />}
        panelOpen
    >
        <Section title="Upcoming sessions">
            <Skeleton preset="text" lines={6} />
        </Section>
    </Frame>
);

const SignInColumn = () => {
    const [email, setEmail] = useState('');
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 'var(--stack-2xl)', maxInlineSize: 'var(--field-width-xl)', marginInline: 'auto', paddingBlock: 'var(--stack-2xl)' }}>
            <Logo />
            <TextField label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            <Button text="Sign in" appearance="primary" />
        </div>
    );
};

export const BareColumn = () => (
    <Frame surfaceDirect>
        <SignInColumn />
    </Frame>
);

export const BareWithSidebar = () => (
    <Frame surfaceDirect sidebar={<Sidebar user="tutor" activeTabId="home" account={ACCOUNT} />}>
        <SignInColumn />
    </Frame>
);
