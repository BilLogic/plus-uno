import React, { useState } from 'react';
import { Button, EmptyState, FooterActions, SearchField, Tabs, TextField, Tooltip } from '@/components';
import { Modal, Section } from '@/templates';

/**
 * The Errors page's do and don't examples, as PLUS parts only. Show code prints
 * each one from this file; the surface that holds them lives in
 * `ErrorsCases.jsx`.
 */

const isValidEmail = (value) => value.includes('@') && value.includes('.');

export const MessageOnField = () => {
    const [email, setEmail] = useState('ana@school');
    const [touched, setTouched] = useState(false);
    const invalid = touched && !isValidEmail(email);
    return (
        <TextField
            label="School email"
            isRequired
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched(true)}
            isInvalid={invalid}
            errorMessage={invalid ? 'Enter a full email, like name@school.org' : undefined}
        />
    );
};

export const BorderAndTooltip = () => {
    const [email, setEmail] = useState('ana@school');
    const invalid = !isValidEmail(email);
    return (
        <Tooltip text="Enter a full email, like name@school.org" placement="bottom" show={invalid}>
            <div style={{ inlineSize: '100%' }}>
                <TextField
                    label="School email"
                    isRequired
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    isInvalid={invalid}
                />
            </div>
        </Tooltip>
    );
};

export const FailureInSlot = () => (
    <Section
        title="Sessions"
        description="This week"
        views={(
            <Tabs appearance="pill" defaultActiveKey="This week" aria-label="Views">
                <Tabs.Tab eventKey="This week">This week</Tabs.Tab>
                <Tabs.Tab eventKey="Next week">Next week</Tabs.Tab>
            </Tabs>
        )}
        search={<SearchField mode="active" spacing="compact" placeholder="Search sessions" />}
    >
        <EmptyState
            spacing="compact"
            icon="triangle-exclamation"
            header="Couldn't load this week's sessions"
            description="Check your connection and try again."
            primaryAction={<Button text="Try again" spacing="compact" onClick={() => {}} />}
        />
    </Section>
);

export const FailureInModal = () => (
    <Modal
        show
        title="Couldn't load sessions"
        footer={(
            <FooterActions>
                <Button text="Try again" appearance="primary" />
            </FooterActions>
        )}
    >
        <p className="body-default" style={{ margin: 0 }}>Check your connection and try again.</p>
    </Modal>
);
