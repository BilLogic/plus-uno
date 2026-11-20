import React, { useState } from 'react';
import { Button, FooterActions, Skeleton, StatusTag } from '@/components';
import { Modal, PanelBody, PanelCloseAction, PanelContainer, PanelFooter, PanelHeader, PanelOverlay, PanelSubheader, Section } from '@/templates';

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

const DetailsPanel = ({ title = 'Ben Okafor · Thu 5:00 PM', onClose }) => (
    <PanelContainer>
        <PanelHeader title={title} actions={<PanelCloseAction onClick={onClose} />} />
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

export const FloatsNoBlanket = () => {
    const [open, setOpen] = useState(true);
    const [host, setHost] = useState(null);
    return (
        <div ref={setHost} style={{ position: 'relative', blockSize: '100%' }}>
            <SessionsBehind />
            <PanelOverlay isOpen={open} onOpenChange={setOpen} placement="end" label="Session details" container={host}>
                <DetailsPanel onClose={() => setOpen(false)} />
            </PanelOverlay>
        </div>
    );
};

export const DetailsInModal = () => {
    const [open, setOpen] = useState(true);
    return (
        <Modal
            show={open}
            onClose={() => setOpen(false)}
            title="Ben Okafor · Thu 5:00 PM"
            body="Math · 60 minutes · Room 2. Ben worked through fractions last week."
        />
    );
};

export const OneFloatingPanel = () => {
    const [row, setRow] = useState('Ben Okafor · Thu 5:00 PM');
    const [host, setHost] = useState(null);
    return (
        <div ref={setHost} style={{ position: 'relative', blockSize: '100%' }}>
            <Section title="Upcoming sessions">
                <Button text="Ana Ruiz · Thu 4:00 PM" onClick={() => setRow('Ana Ruiz · Thu 4:00 PM')} />
                <Button text="Ben Okafor · Thu 5:00 PM" onClick={() => setRow('Ben Okafor · Thu 5:00 PM')} />
            </Section>
            <PanelOverlay isOpen={row !== null} onOpenChange={(next) => next || setRow(null)} placement="end" label="Session details" container={host}>
                <DetailsPanel title={row} onClose={() => setRow(null)} />
            </PanelOverlay>
        </div>
    );
};

export const TwoFloatingPanels = () => {
    const [detailsOpen, setDetailsOpen] = useState(true);
    const [inboxOpen, setInboxOpen] = useState(true);
    const [host, setHost] = useState(null);
    return (
        <div ref={setHost} style={{ position: 'relative', blockSize: '100%' }}>
            <SessionsBehind />
            <PanelOverlay isOpen={inboxOpen} onOpenChange={setInboxOpen} placement="start" label="Inbox" container={host}>
                <PanelContainer>
                    <PanelHeader title="Inbox" actions={<PanelCloseAction onClick={() => setInboxOpen(false)} />} />
                    <PanelBody>Ana confirmed Thursday’s session.</PanelBody>
                </PanelContainer>
            </PanelOverlay>
            <PanelOverlay isOpen={detailsOpen} onOpenChange={setDetailsOpen} placement="end" label="Session details" container={host}>
                <DetailsPanel onClose={() => setDetailsOpen(false)} />
            </PanelOverlay>
        </div>
    );
};

export const ReadingNoFooter = () => (
    <PanelContainer>
        <PanelHeader title="Ben Okafor · Thu 5:00 PM" actions={<PanelCloseAction onClick={() => {}} />} />
        <PanelSubheader><StatusTag appearance="warning">Needs a tutor</StatusTag></PanelSubheader>
        <PanelBody>
            <p style={{ margin: 0 }}>Math · 60 minutes · Room 2. Ben worked through fractions last week.</p>
        </PanelBody>
    </PanelContainer>
);

export const ReadingNarrow = () => (
    <PanelContainer width="calc(var(--panel-width-default) / 3)">
        <PanelHeader title="Ben Okafor · Thu 5:00 PM" actions={<PanelCloseAction onClick={() => {}} />} />
        <PanelSubheader><StatusTag appearance="warning">Needs a tutor</StatusTag></PanelSubheader>
        <PanelBody>
            <p style={{ margin: 0 }}>Math · 60 minutes · Room 2. Ben worked through fractions last week.</p>
        </PanelBody>
    </PanelContainer>
);

export const ReadingWithFooter = () => (
    <PanelContainer>
        <PanelHeader title="Ben Okafor · Thu 5:00 PM" actions={<PanelCloseAction onClick={() => {}} />} />
        <PanelSubheader><StatusTag appearance="warning">Needs a tutor</StatusTag></PanelSubheader>
        <PanelBody>
            <p style={{ margin: 0 }}>Math · 60 minutes · Room 2. Ben worked through fractions last week.</p>
        </PanelBody>
        <PanelFooter>
            <FooterActions>
                <Button text="Done" appearance="primary" onClick={() => {}} />
            </FooterActions>
        </PanelFooter>
    </PanelContainer>
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
