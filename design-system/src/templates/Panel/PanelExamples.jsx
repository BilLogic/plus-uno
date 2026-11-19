import React from 'react';
import { Skeleton, StatusTag } from '@/components';
import { PanelBody, PanelCloseAction, PanelContainer, PanelHeader, PanelSubheader, Section } from '@/templates';
import Blanket from '../Modal/Blanket';

/**
 * The Panel page's floating-Panel do and don't examples, as PLUS parts only.
 * Show code prints each one from this file; the stage they sit in lives in
 * `PanelCases.jsx`.
 */

const SessionsBehind = () => (
    <Section title="Upcoming sessions">
        <Skeleton preset="text" lines={6} />
    </Section>
);

const DetailsPanel = () => (
    <PanelContainer>
        <PanelHeader title="Ben Okafor · Thu 5:00 PM" actions={<PanelCloseAction />} />
        <PanelSubheader><StatusTag appearance="warning">Needs a tutor</StatusTag></PanelSubheader>
        <PanelBody>
            <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text)' }}>
                Math · 60 minutes · Room 2. Ben worked through fractions last week.
            </p>
        </PanelBody>
    </PanelContainer>
);

const AssistantPanel = () => (
    <PanelContainer width="var(--panel-width-default)">
        <PanelHeader title="Assistant" actions={<PanelCloseAction />} />
        <PanelBody>
            <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text)' }}>
                Ben has missed two Thursday sessions. Want a note for his tutor?
            </p>
        </PanelBody>
    </PanelContainer>
);

const DEMO_STAGE_END = { position: 'absolute', insetBlock: 0, insetInlineEnd: 0, display: 'flex', maxInlineSize: '100%' };

const DEMO_STAGE_FLOATING = { ...DEMO_STAGE_END, boxShadow: 'var(--ds-shadow-overlay)' };

const DEMO_STAGE_SECOND = { ...DEMO_STAGE_FLOATING, insetInlineEnd: 'var(--inline-3xl)' };

export const FloatsNoBlanket = () => (
    <>
        <SessionsBehind />
        <div style={DEMO_STAGE_FLOATING}><DetailsPanel /></div>
    </>
);

export const PanelOnBlanket = () => (
    <>
        <SessionsBehind />
        <Blanket inline show style={{ position: 'absolute', inset: 0 }} />
        <div style={DEMO_STAGE_FLOATING}><DetailsPanel /></div>
    </>
);

export const TwoFloatingPanels = () => (
    <>
        <SessionsBehind />
        <div style={DEMO_STAGE_SECOND}><DetailsPanel /></div>
        <div style={DEMO_STAGE_FLOATING}><DetailsPanel /></div>
    </>
);

export const BesideAiPanel = () => (
    <>
        <SessionsBehind />
        <div style={DEMO_STAGE_END}><AssistantPanel /></div>
        <div style={{ ...DEMO_STAGE_FLOATING, insetInlineEnd: 'var(--panel-width-default)' }}><DetailsPanel /></div>
    </>
);

export const CoversAiPanel = () => (
    <>
        <SessionsBehind />
        <div style={DEMO_STAGE_END}><AssistantPanel /></div>
        <div style={DEMO_STAGE_SECOND}><DetailsPanel /></div>
    </>
);
