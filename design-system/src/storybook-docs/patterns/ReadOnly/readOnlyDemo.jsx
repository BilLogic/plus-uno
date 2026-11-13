import React from 'react';

import { Checkbox, DatePicker, RadioGroup, Select, TextArea, TextField, Toggle } from '@/components';
import { PatternSection } from '@/patterns';
import { BrowserWindow } from '@/storybook-docs/lib/template-page.jsx';
import { InAppFrame } from '@/storybook-docs/lib/pattern-demo.jsx';
import { PAGE_WIDTH } from '../../../patterns/Form/formDemo.jsx';

/**
 * The Read-only pattern's examples, drawn with the real fields in their
 * `isReadOnly` state. Each picture is in the state its heading names, through
 * props: the docs page runs no plays.
 *
 *   ReadOnlyField    a TextField set by someone else, the reason in its caption
 *   ReadOnlyPickers  a Select and a DatePicker without their chevron and calendar
 *   ReadOnlyChoices  a Checkbox, a RadioGroup and a Toggle holding their state
 *   OwnedForm        a whole form someone else owns: every field read-only, one caption on the group
 *   LongValue        a long value in a TextArea whose rows show all of it
 *   PlainText        a value nobody changes here: a label and a value, not a field
 */

/** The width the card pictures lay out at, so their words stay legible at card size. Docs geometry, in px. */
export const CARD_STAGE = 600; // docs-literal

const noop = () => {};
const pad = { padding: 'var(--page-pad)', boxSizing: 'border-box' };
const column = { ...pad, display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)', maxInlineSize: 'var(--card-min-width-lg)' };

const NOTE = 'Ana is working on fractions. She asked to review ratios before the quiz on Friday, and she wants a second pass at word problems, especially the ones with two steps. Ms. Ortiz agreed to add a short warm-up each week.';

/** A time someone else set: neutral fill, full contrast, the reason in the caption. */
export const ReadOnlyField = () => (
    <div style={column}>
        <TextField label="Session time" value="Thursday at 4:00 PM" onChange={noop} isReadOnly caption="Set by your supervisor." />
    </div>
);

/** A Select and a DatePicker: no chevron, no calendar button, the value reads as text. */
export const ReadOnlyPickers = () => (
    <div style={column}>
        <Select label="Site" options={[{ value: 'lincoln', label: 'Lincoln Middle' }]} value="algebra" onChange={noop} isReadOnly caption="Set by your supervisor." />
        <DatePicker aria-label="Date" value="2026-03-05" onChange={noop} isReadOnly />
    </div>
);

/** A Checkbox, a RadioGroup and a Toggle keep their state at full contrast and ignore clicks. */
export const ReadOnlyChoices = () => (
    <div style={column}>
        <Checkbox label="Parent notified" isChecked onChange={noop} isReadOnly />
        <RadioGroup legend="Format" value="video" onChange={noop} isReadOnly options={[{ value: 'person', label: 'In person' }, { value: 'video', label: 'Video' }]} />
        <Toggle label="Send a reminder" isChecked onChange={noop} isReadOnly />
    </div>
);

/** The window's height: the title, three fields and the caption, with room under them. Docs geometry, in px. */
const PAGE_HEIGHT = 420; // docs-literal

const PAGE_BREADCRUMBS = [{ text: 'Home', href: '#' }, { text: 'Sessions', href: '#' }, { text: 'Session details' }];

/**
 * A whole form someone else owns, in a page: drawn in the Frame with the Sidebar
 * docked, straight on the Page like the Form template. The title is the page's
 * h1 and the fields follow it, every one read-only, one caption on the group, no Save.
 */
export const OwnedForm = () => (
    <BrowserWindow address="app.plus.org/sessions/ana-ruiz" height={PAGE_HEIGHT}>
        <InAppFrame height="100%" activeTabId="sessions" breadcrumbs={PAGE_BREADCRUMBS} panelStorageKey={null}>
            <PatternSection level="page" title="Session details" description="Set by Lincoln's supervisor.">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)', maxInlineSize: 'var(--card-min-width-lg)' }}>
                    <TextField label="Student" value="Ana Ruiz" onChange={noop} isReadOnly />
                    <TextField label="Time" value="Thursday at 4:00 PM" onChange={noop} isReadOnly />
                    <Select label="Site" options={[{ value: 'lincoln', label: 'Lincoln Middle' }]} value="algebra" onChange={noop} isReadOnly />
                </div>
            </PatternSection>
        </InAppFrame>
    </BrowserWindow>
);

export { PAGE_WIDTH };

/** Docs geometry: rows enough to show the whole note; a read-only TextArea does not size itself to its value today. */
const LONG_ROWS = 6; // docs-literal

/** A long value is never truncated: the rows are set so all of it shows. */
export const LongValue = () => (
    <div style={column}>
        <TextArea label="Session notes" value={NOTE} onChange={noop} isReadOnly rows={LONG_ROWS} caption="Locked while the import runs." />
    </div>
);

/** A value nobody changes here is plain text: a label and a value in a details Section. */
export const PlainText = () => (
    <div style={pad}>
        <PatternSection title="Details" description="Lincoln Middle">
            <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: 'var(--stack-sm) var(--inline-lg)', font: 'var(--body-default)', color: 'var(--ds-text)' }}>
                <dt style={{ color: 'var(--ds-text-subtle)' }}>School</dt>
                <dd style={{ margin: 0 }}>Lincoln Middle School</dd>
                <dt style={{ color: 'var(--ds-text-subtle)' }}>Created</dt>
                <dd style={{ margin: 0 }}>Sep 3, 2026</dd>
            </dl>
        </PatternSection>
    </div>
);
