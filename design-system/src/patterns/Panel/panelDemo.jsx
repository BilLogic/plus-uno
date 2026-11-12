import React, { useState } from 'react';

import {
    Avatar,
    Button,
    EmptyState,
    Heading,
    PanelBody,
    PanelCloseAction,
    PanelContainer,
    PanelDownAction,
    PanelFooter,
    PanelHeader,
    PanelMoreAction,
    PanelSubheader,
    PanelUpAction,
    Select,
    StaticTable,
    StatusTag,
    TextArea,
    TextField,
    VisuallyHidden,
} from '@/components';
import { PatternSection } from '@/patterns';
import { BrowserWindow } from '@/storybook-docs/lib/template-page.jsx';
import { InAppFrame } from '@/storybook-docs/lib/pattern-demo.jsx';
import { WINDOW_HEIGHT } from '@/storybook-docs/lib/focused-task.jsx';
import { FullBleedFooter } from '../Form/formDemo.jsx';

/**
 * The Panel template's examples: the real Frame with its Panel area, filled the
 * way each type fills it. A Frame under 1408 wide cannot dock a Sidebar and a
 * 400 Panel beside 720 of content, so at the docs stage the Panel floats on the
 * overlay fill and shadow with no Backdrop, which is what Details and the
 * Inbox always do. The Frame is the only host a Panel has today, so the
 * Inbox's own placement (out of the Sidebar, on the left) is Planned and the
 * Inbox is drawn in the same right-hand slot.
 */

/** The width the docs lay the Frame out at so the Panel floats: under 1168, where a 400 Panel docks alone. Docs geometry, px. */
export const FLOAT_STAGE = 1100; // docs-literal

const SESSIONS = [
    ['Ana Ruiz', 'Thu 4:00 PM', { content: <StatusTag appearance="success">Confirmed</StatusTag> }],
    ['Ben Okafor', 'Thu 5:00 PM', { content: <StatusTag appearance="warning">Needs a tutor</StatusTag> }],
    ['Chloe Tran', 'Fri 3:30 PM', { content: <StatusTag appearance="success">Confirmed</StatusTag> }],
    ['Diego Alvarez', 'Fri 4:30 PM', { content: <StatusTag appearance="neutral">Waitlist</StatusTag> }],
];

/** The page under a Details Panel: the session list, the picked row highlighted while the Panel is open. */
export const SessionsBehind = ({ picked = 1 }) => (
    <PatternSection title="Upcoming sessions">
        <StaticTable
            headers={['Student', 'Time', 'Status']}
            rows={SESSIONS}
            rowStates={SESSIONS.map((_, i) => (i === picked ? 'highlighted' : 'rest'))}
        />
    </PatternSection>
);

const text = (copy) => <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text)' }}>{copy}</p>;

/** A record's Section inside a Panel body: a small heading and its lines. */
const Block = ({ title, children }) => (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
        <Heading size="xxsmall">{title}</Heading>
        {children}
    </section>
);

const bodyStack = { display: 'flex', flexDirection: 'column', gap: 'var(--stack-lg)' };

/** Details: the title names the record, its status sits under it, then Up, Down, More and Close. */
export const DetailsPanel = ({ editing = false, onEdit, onClose = () => {}, onSave, onCancel, picked = 'Ben Okafor' }) => (
    <PanelContainer>
        <div data-probe="head" style={{ flex: 'none' }}>
        <PanelHeader
            title={`${picked} · Thu 5:00 PM`}
            actions={(
                <>
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
                        {!editing && onEdit ? <div><Button text="Edit" onClick={onEdit} /></div> : null}
                    </Block>
                </div>
            )}
        </PanelBody>
        {editing ? (
            <PanelFooter style={{ padding: 0 }}>
                <FullBleedFooter primary="Save" onSave={onSave} onCancel={onCancel} />
            </PanelFooter>
        ) : null}
    </PanelContainer>
);

const INBOX = [
    { id: 1, name: 'Ana Ruiz', what: 'moved Thursday’s session', where: 'Sessions', excerpt: 'New time is 4:30 PM, if that works.', time: '2m', unread: true },
    { id: 2, name: 'Ben Okafor', what: 'mentioned you', where: 'Notes', excerpt: 'Can you check the unit rates plan?', time: '1h', unread: true },
    { id: 3, name: 'Chloe Tran', what: 'confirmed Friday', where: 'Sessions', excerpt: 'See you at 3:30 PM.', time: 'Yesterday', unread: false },
];

/** Notifications: the Inbox. Items carry an avatar, who did what and where, an excerpt, the time and an unread dot paired with the word. */
export const InboxPanel = ({ onClose = () => {}, items = INBOX }) => (
    <PanelContainer>
        <PanelHeader
            title="Inbox"
            actions={(
                <>
                    <Button text="Archive all" appearance="subtle" spacing="compact" onClick={() => {}} />
                    <PanelCloseAction onClick={onClose} />
                </>
            )}
        />
        <PanelSubheader>
            <Select
                aria-label="Show"
                value="unread"
                onChange={() => {}}
                options={[
                    { value: 'unread', label: 'Unread' },
                    { value: 'all', label: 'All' },
                    { value: 'mentions', label: 'Mentions' },
                ]}
            />
        </PanelSubheader>
        <PanelBody data-probe="body">
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
                {items.map((n) => (
                    <li key={n.id} data-probe="item" style={{ display: 'flex', gap: 'var(--inline-md)', alignItems: 'flex-start' }}>
                        <Avatar name={n.name} size={32} />
                        <div style={{ flex: '1 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                            <span style={{ font: 'var(--body-default)', color: 'var(--ds-text)' }}>{`${n.name} ${n.what} in ${n.where}`}</span>
                            <span style={{ font: 'var(--body-small)', color: 'var(--ds-text-subtle)' }}>{n.excerpt}</span>
                            <span style={{ font: 'var(--body-small)', color: 'var(--ds-text-subtle)' }}>{n.time}</span>
                        </div>
                        {n.unread ? (
                            <>
                                <span aria-hidden="true" data-probe="unread" style={{ inlineSize: 'var(--inline-md)', blockSize: 'var(--inline-md)', marginBlockStart: 'var(--stack-md)', borderRadius: 'var(--radius-full)', background: 'var(--ds-background-brand-bold)' }} />
                                <VisuallyHidden>unread</VisuallyHidden>
                            </>
                        ) : null}
                    </li>
                ))}
            </ul>
        </PanelBody>
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
                primaryAction={<Button text="Back to sessions" appearance="primary" onClick={onClose} />}
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

/** The Inbox open over the session list. */
export const InboxFrame = (frame) => <PanelFrame label="Inbox" panel={<InboxPanel />} {...frame} />;

/** The record is gone: the same Panel shows its empty state. */
export const GoneFrame = (frame) => <PanelFrame label="Session" panel={<GonePanel />} behind={<SessionsBehind picked={-1} />} {...frame} />;
