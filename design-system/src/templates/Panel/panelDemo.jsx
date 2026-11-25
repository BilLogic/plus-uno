import React, { useState } from 'react';

import {
    Button,
    EmptyState,
    Heading,
    StaticTable,
    StatusTag,
    TextArea,
    TextField,
} from '@/components';
import {
    Section,
    PanelBody,
    PanelCloseAction,
    PanelContainer,
    PanelDownAction,
    PanelFooter,
    PanelHeader,
    PanelMoreAction,
    PanelSubheader,
    PanelUpAction,
} from '@/templates';
import { BrowserWindow } from '@/storybook-docs/lib/template-page.jsx';
import { InAppFrame } from '@/storybook-docs/lib/template-demo.jsx';
import { WINDOW_HEIGHT } from '@/storybook-docs/lib/multi-step-task.jsx';
import { FullBleedFooter } from '@/storybook-docs/patterns/Forms/formHosts.jsx';
import { typeStyle } from '../../storybook-docs/lib/type-style.js';

/**
 * The Panel template's examples: the real Frame with its Panel area, filled the
 * way each type fills it. Details (`panelKind="details"`, the default) floats
 * over the Page on the overlay material and shadow with no Blanket at every
 * width; only the AI chat panel docks. The Inbox is the other type: it opens
 * from the Sidebar's bell and opens beside the Sidebar at the start, 360 wide,
 * so it is drawn by the Notifications pattern's `InboxInSidebar` rather than
 * in the Frame's right-hand Panel area.
 */

/**
 * The docs stage width used by Details examples, px: at least 1024 (`dockMin`)
 * so the Sidebar docks and Details opens at its 400 default width rather than
 * capping at 320, while fitting comfortably inside the docs column.
 */
export const FLOAT_STAGE = 1100; // docs-literal

const SESSIONS = [
    ['Ana Ruiz', 'Thu 4:00 PM', { content: <StatusTag appearance="success">Confirmed</StatusTag> }],
    ['Ben Okafor', 'Thu 5:00 PM', { content: <StatusTag appearance="warning">Needs a tutor</StatusTag> }],
    ['Chloe Tran', 'Fri 3:30 PM', { content: <StatusTag appearance="success">Confirmed</StatusTag> }],
    ['Diego Alvarez', 'Fri 4:30 PM', { content: <StatusTag appearance="neutral">Waitlist</StatusTag> }],
];

/** The page under a Details Panel: the session list, the picked row highlighted while the Panel is open. */
export const SessionsBehind = ({ picked = 1 }) => (
    <Section title="Upcoming sessions">
        <StaticTable
            headers={['Student', 'Time', 'Status']}
            rows={SESSIONS}
            rowStates={SESSIONS.map((_, i) => (i === picked ? 'highlighted' : 'rest'))}
        />
    </Section>
);

const text = (copy) => <p style={{ margin: 0, ...typeStyle('body-default'), color: 'var(--ds-text)' }}>{copy}</p>;

/** A record's Section inside a Panel body: a small heading and its lines. */
const Block = ({ title, children }) => (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
        <Heading size="xxs">{title}</Heading>
        {children}
    </section>
);

const bodyStack = { display: 'flex', flexDirection: 'column', gap: 'var(--stack-lg)' };

/** Details: the title names the record, its status sits under it, then Edit and the fixed actions Up, Down, More and Close. */
export const DetailsPanel = ({ editing = false, onEdit, onClose = () => {}, onSave, onCancel, picked = 'Ben Okafor' }) => (
    <PanelContainer>
        <div data-probe="head" style={{ flex: 'none' }}>
        <PanelHeader
            title={`${picked} · Thu 5:00 PM`}
            actions={(
                <>
                    {!editing && onEdit ? <Button text="Edit" spacing="compact" onClick={onEdit} /> : null}
                    <PanelUpAction />
                    <PanelDownAction />
                    <PanelMoreAction />
                    <PanelCloseAction onClick={onClose} />
                </>
            )}
        />
        <PanelSubheader><StatusTag appearance="warning">Needs a tutor</StatusTag></PanelSubheader>
        </div>
        <PanelBody data-probe="body">
            {editing ? (
                <div style={bodyStack}>
                    <TextField label="Topic" value="Ratios" onChange={() => {}} />
                    <TextArea label="Notes" value="Ben asked to start with unit rates." onChange={() => {}} />
                </div>
            ) : (
                <div style={bodyStack}>
                    <Block title="Session">
                        {text('Math · 60 minutes · Room 2')}
                        {text('Ben worked through fractions last week.')}
                    </Block>
                    <Block title="Tutor">
                        {text('Not assigned yet. Three tutors are free at this time.')}
                    </Block>
                </div>
            )}
        </PanelBody>
        {editing ? (
            <PanelFooter>
                <FullBleedFooter primary="Save" onSave={onSave} onCancel={onCancel} />
            </PanelFooter>
        ) : null}
    </PanelContainer>
);

/** The record behind the Panel was removed: the body shows its empty state with a way back. */
export const GonePanel = ({ onClose = () => {} }) => (
    <PanelContainer>
        <PanelHeader title="Session" actions={<PanelCloseAction onClick={onClose} />} />
        <PanelBody data-probe="body">
            <EmptyState
                spacing="compact"
                icon="calendar-xmark"
                header="This session no longer exists"
                description="Someone removed it, or it moved to another week."
                primaryAction={<Button text="Back to sessions" appearance="primary" spacing="compact" onClick={onClose} />}
            />
        </PanelBody>
    </PanelContainer>
);

/**
 * The Frame at the float stage with a Panel open, in a browser window. `behind`
 * is the page under it. The Panel's storage key is off so a story never
 * remembers another's width.
 */
export const PanelFrame = ({ panel, label, behind, height = WINDOW_HEIGHT, address = 'app.plus.org/sessions', ...frame }) => (
    <BrowserWindow address={address} height={height}>
        <InAppFrame
            height="100%"
            panel={panel}
            panelLabel={label}
            panelOpen
            panelStorageKey={null}
            {...frame}
        >
            {behind ?? <SessionsBehind />}
        </InAppFrame>
    </BrowserWindow>
);

/** Details open over the session list. */
export const DetailsFrame = ({ editing: start = false, ...frame }) => {
    const [editing, setEditing] = useState(start);
    return (
        <PanelFrame
            label="Session details"
            panel={<DetailsPanel editing={editing} onEdit={() => setEditing(true)} onSave={() => setEditing(false)} onCancel={() => setEditing(false)} />}
            {...frame}
        />
    );
};

/** The Inbox, opened from the Sidebar's bell: the Notifications pattern's picture, drawn here for the Panel's start-side placement. */
export { InboxInSidebar as InboxFrame } from '@/storybook-docs/lib/inbox-demo.jsx';

/** The record is gone: the same Panel shows its empty state. */
export const GoneFrame = (frame) => <PanelFrame label="Session" panel={<GonePanel />} behind={<SessionsBehind picked={-1} />} {...frame} />;
