import React, { useState } from 'react';
import { Button, FooterActions, Skeleton, StatusTag } from '@/components';
import { Modal, PanelBody, PanelCloseAction, PanelContainer, PanelFooter, PanelHeader, PanelOverlay, PanelSubheader, Section } from '@/templates';

/**
 * The Panel page's floating-Panel do and don't examples, as PLUS parts only.
 * Show code prints each one from this file; the stage they sit in lives in
 * `PanelCases.jsx`.
 */

export const SessionsBehind = () => (
    <Section title="Upcoming sessions">
        <Skeleton preset="text" lines={6} />
    </Section>
);

export const DetailsPanel = ({ title = 'Ben Okafor · Thu 5:00 PM', onClose }) => (
    <PanelContainer>
        <PanelHeader title={title} actions={<PanelCloseAction onClick={onClose} />} />
        <PanelSubheader><StatusTag appearance="warning">Needs a tutor</StatusTag></PanelSubheader>
        <PanelBody>
            <p className="body-default" style={{ margin: 0 }}>
                Math · 60 minutes · Room 2. Ben worked through fractions last week.
            </p>
        </PanelBody>
    </PanelContainer>
);

export const AssistantPanel = () => (
    <PanelContainer width="var(--panel-width-default)">
        <PanelHeader title="Assistant" actions={<PanelCloseAction />} />
        <PanelBody>
            <p className="body-default" style={{ margin: 0 }}>
                Ben has missed two Thursday sessions. Want a note for his tutor?
            </p>
        </PanelBody>
    </PanelContainer>
);

export const FloatsNoBlanket = () => {
    const [open, setOpen] = useState(true);
    return (
        <>
            <SessionsBehind />
            <PanelOverlay isOpen={open} onOpenChange={setOpen} placement="end" label="Session details">
                <DetailsPanel onClose={() => setOpen(false)} />
            </PanelOverlay>
        </>
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
    return (
        <>
            <Section title="Upcoming sessions">
                <Button text="Ana Ruiz · Thu 4:00 PM" onClick={() => setRow('Ana Ruiz · Thu 4:00 PM')} />
                <Button text="Ben Okafor · Thu 5:00 PM" onClick={() => setRow('Ben Okafor · Thu 5:00 PM')} />
            </Section>
            <PanelOverlay isOpen={row !== null} onOpenChange={(next) => next || setRow(null)} placement="end" label="Session details">
                <DetailsPanel title={row} onClose={() => setRow(null)} />
            </PanelOverlay>
        </>
    );
};

export const TwoFloatingPanels = () => {
    const [detailsOpen, setDetailsOpen] = useState(true);
    const [inboxOpen, setInboxOpen] = useState(true);
    return (
        <>
            <SessionsBehind />
            <PanelOverlay isOpen={inboxOpen} onOpenChange={setInboxOpen} placement="start" label="Inbox">
                <PanelContainer>
                    <PanelHeader title="Inbox" actions={<PanelCloseAction onClick={() => setInboxOpen(false)} />} />
                    <PanelBody>Ana confirmed Thursday’s session.</PanelBody>
                </PanelContainer>
            </PanelOverlay>
            <PanelOverlay isOpen={detailsOpen} onOpenChange={setDetailsOpen} placement="end" label="Session details">
                <DetailsPanel onClose={() => setDetailsOpen(false)} />
            </PanelOverlay>
        </>
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
