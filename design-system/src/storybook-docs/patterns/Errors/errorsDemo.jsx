import React, { useState } from 'react';

import { Banner, Button, ButtonItem, DropdownMenu, EmptyState, Flag, FlagGroup, IconButton, TextField } from '@/components';
import { Page, PatternSection } from '@/patterns';
import { DemoPageHeader, SessionsTable } from '../../../patterns/Page/pageDemo.jsx';
import { BrowserWindow } from '@/storybook-docs/lib/template-page.jsx';
import { ViewBar, useLayerMount } from '@/storybook-docs/lib/view-bar.jsx';

/**
 * The Errors pattern's examples: where a failure shows, drawn with the real
 * TextField, EmptyState, Flag and Banner. A blocked and a rejected submit are
 * the Form template's own demos (formDemo.jsx), reused on the page so the
 * pattern and the template show one thing. Every picture is drawn in the state
 * its heading names, through initial-state props.
 *
 *   FieldError      one field after blur, its message under it
 *   LoadFailure     a Section whose content could not load, in the empty-state slot
 *   NoAccess        the same slot, saying who can help
 *   BackgroundJob   a danger Flag that stays, with Try again
 *   PageCondition   a danger Banner at the Page tier
 *   MenuError       a menu whose options could not load: one row with Retry
 *   InPage          a Section with a failed load, under a page header
 *   FlagOnPage      a failed save after the person moved on, the Flag at the top right
 */

/** The width a picture lays out at, in px: docs geometry. */
export const STAGE = 1024; // docs-literal

/** The width the six place pictures lay out at, so their words stay legible at card size. Docs geometry, in px. */
export const PLACE_STAGE = 600; // docs-literal

/** Docs geometry, in px: the window height of a page picture. */
const WINDOW = 420; // docs-literal

const noop = () => {};
const pad = { padding: 'var(--page-pad)', boxSizing: 'border-box' };

export const isValidEmail = (value) => value.includes('@') && value.includes('.');

/** One field after blur: invalid, the message under it saying what to fix. */
export const FieldError = ({ padded = true }) => {
    const [email, setEmail] = useState('ana@school');
    const invalid = !isValidEmail(email);
    const field = (
        <TextField
            label="School email"
            isRequired
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            isInvalid={invalid}
            errorMessage={invalid ? 'Enter a full email, like name@school.org' : undefined}
        />
    );
    return padded ? <div style={{ ...pad, maxInlineSize: 'var(--card-min-width-lg)' }}>{field}</div> : field;
};

/** A Section whose content could not load: the view bar stays, the body holds the error with Try again. */
export const LoadFailure = ({ onRetry, padded = true }) => {
    const [recovered, setRecovered] = useState(false);
    const [view, setView] = useState('This week');
    const handleRetry = onRetry ?? (() => setRecovered(true));
    const showingTable = recovered || view !== 'This week';

    const section = (
        <PatternSection
            title="Sessions"
            description={view}
            tabs={(
                <ViewBar
                    views={['This week', 'Next week']}
                    activeView={view}
                    onViewChange={(next) => {
                        setView(next);
                        if (next === 'This week') setRecovered(false);
                    }}
                    searchLabel="Search sessions"
                    filters={null}
                    primary={null}
                />
            )}
        >
            {showingTable ? (
                <SessionsTable status={view === 'Next week' ? 'past' : 'upcoming'} />
            ) : (
                <EmptyState
                    spacing="compact"
                    icon="triangle-exclamation"
                    header="Couldn't load this week's sessions"
                    description="Check your connection and try again."
                    primaryAction={<Button text="Try again" appearance="default" spacing="compact" onClick={handleRetry} />}
                />
            )}
        </PatternSection>
    );
    return padded ? <div style={pad}>{section}</div> : section;
};

/** No access: the same slot names who can help and offers no action the person cannot take. */
export const NoAccess = () => (
    <div style={pad}>
        <PatternSection title="Session notes" description="Lincoln Middle" tabs={<ViewBar views={['All notes']} filters={null} primary={null} />}>
            <EmptyState
                spacing="compact"
                icon="lock"
                header="Only Lincoln's supervisor can open these notes"
                description="Ask the supervisor to add you."
            />
        </PatternSection>
    </div>
);

/** A save that failed after the person moved on: a danger Flag at the top right, held in the picture, no autohide. */
export const BackgroundJob = ({ padded = true }) => {
    const [saved, setSaved] = useState(false);
    const [show, setShow] = useState(true);

    return (
        <div style={{ ...(padded ? pad : {}), display: 'flex', justifyContent: 'flex-end', minBlockSize: 'var(--card-min-width-lg)' }}>
            <FlagGroup position="top-end" containerPosition="static">
                {saved ? (
                    <Flag
                        appearance="success"
                        title="Session note saved"
                        autohide={false}
                        show={show}
                        onDismiss={() => setShow(false)}
                    >
                        Your note is now synced.
                    </Flag>
                ) : (
                    <Flag
                        appearance="error"
                        title="Couldn't save your session note"
                        defaultExpanded
                        show={show}
                        actions={[{ text: 'Try again', onClick: () => setSaved(true) }]}
                    >
                        Your note is kept on this device.
                    </Flag>
                )}
            </FlagGroup>
        </div>
    );
};

/** A condition on the whole page: one danger Banner at the Page tier, above the page header. */
export const PageCondition = () => (
    <div style={pad}>
        <Banner appearance="danger">We lost the connection. Your work is kept on this device.</Banner>
    </div>
);

/** A menu whose options could not load: one "Couldn't load options" row with Retry. Held open once the picture's element exists. */
export const MenuError = () => {
    const [setMount, mount] = useLayerMount();
    const [hasError, setHasError] = useState(true);
    return (
        <div ref={setMount} style={{ position: 'relative', boxSizing: 'border-box', padding: 'var(--page-pad)', minBlockSize: 'var(--card-min-width-lg)' }}>
            {mount && (
                <DropdownMenu
                    isOpen
                    onOpenChange={noop}
                    container={mount}
                    hasError={hasError}
                    onRetry={() => setHasError(false)}
                    trigger={<IconButton icon="ellipsis" label="More" appearance="subtle" onClick={noop} />}
                >
                    <ButtonItem onClick={noop}>Edit</ButtonItem>
                    <ButtonItem onClick={noop}>Remove from group</ButtonItem>
                </DropdownMenu>
            )}
        </div>
    );
};

/** A page whose Section failed to load: the rest of the page works. */
export const InPage = () => (
    <BrowserWindow address="app.plus.org/groups/algebra-b" height={WINDOW}>
        <Page header={<DemoPageHeader title="Lincoln Middle" description="Tuesdays and Thursdays, 4:00 PM" />}>
            <LoadFailure padded={false} />
        </Page>
    </BrowserWindow>
);

/** A failed save after the person moved on: the page behind them, the Flag finding them at the top right. */
export const FlagOnPage = () => (
    <BrowserWindow address="app.plus.org/students" height={WINDOW}>
        <Page header={<DemoPageHeader title="Students" description="Lincoln Middle" />}>
            <BackgroundJob padded={false} />
        </Page>
    </BrowserWindow>
);
