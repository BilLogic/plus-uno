import React, { useEffect, useState } from 'react';

import { Button, ButtonItem, Dialog, DropdownMenu, Fieldset, FooterActions, IconButton, InlineEdit, TextField, Tooltip } from '@/components';
import { PatternCard, PatternSection } from '@/patterns';
import { HeaderSearch, SectionActions } from '@/storybook-docs/lib/section-header.jsx';
import { FilterSide, StudentsTable, ViewPills, useLayerMount } from '@/storybook-docs/lib/view-bar.jsx';
import { CaseBlanket, CaseSurface } from '@/storybook-docs/lib/case-surface.jsx';
import { FooterCells } from '@/storybook-docs/lib/full-bleed-footer.jsx';
import { MultiStepTaskType } from '@/storybook-docs/lib/multi-step-task.jsx';
import { FILLED, FormInPage, PAGE_WIDTH as FORM_PAGE_WIDTH } from '../../../patterns/Form/formDemo.jsx';
import { ModalStage, TwoCells } from '../../../patterns/Modal/modalDemo.jsx';

/**
 * The Common actions pattern's examples: real Buttons, placed where each
 * situation puts them. Each one composes the real parts; nothing here draws a
 * button of its own.
 *
 *   Appearances   every appearance, with the word it takes
 *   Page          buttons under a page form
 *   ModalFooter   full bleed, Close in the header, Discard left and the action right (no Cancel)
 *   Reset         a filter side, "Reset filters" at its top
 *   Copy          an icon button and its "Copied" tooltip
 *   EditOne       one value, edited in place
 *   EditRecord    the whole record, from the More menu
 *   Sending       a full-bleed button that keeps its width
 */

/** The width a picture lays out at, in px: docs geometry. */
export const STAGE = 1024; // docs-literal

/** A page form's stage: wide enough for the Frame to dock its Sidebar. */
export const PAGE_WIDTH = FORM_PAGE_WIDTH;

const text = (copy) => <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text)' }}>{copy}</p>;

/** Every appearance with the word it takes: one Primary, one AI, the rest in their places. */
export const APPEARANCES = [
    ['primary', 'Add students'],
    ['default', 'Reschedule session'],
    ['subtle', 'Cancel'],
    ['warning', 'Remove from this week'],
    ['danger', 'Delete note'],
    ['discovery', 'Try the new schedule view'],
    ['ai', 'Generate summary'],
];

export const Appearances = () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--stack-md)', padding: 'var(--page-pad)' }}>
        {APPEARANCES.map(([appearance, label]) => <Button key={appearance} appearance={appearance} text={label} onClick={() => {}} />)}
    </div>
);

/** Buttons under a page form: left-aligned, Primary first, Cancel Subtle. The form sits on the Page, in the Frame. */
export const Page = () => <FormInPage initial={FILLED} />;

/** A Modal's footer: full bleed, Discard (Default) left and the action right; Close sits in the header, no Cancel. */
export const ModalFooter = () => (
    <ModalStage title="Log a session" footer={<TwoCells action="Save session" />}>
        {text('Ana Ruiz, Thursday at 4:00 PM, Lincoln Middle.')}
    </ModalStage>
);

/** A multi-step task's bottom bar: Back and Next split 50/50, Close in the title row, no Cancel. */
export const MultiStepBar = () => <MultiStepTaskType start={1} />;

/** A card's main action: Subtle in the footer. */
export const CardAction = () => (
    <div style={{ display: 'flex', padding: 'var(--page-pad)' }}>
        <PatternCard
            title="Next session"
            description="Thursday, 4:00 PM with Ana Ruiz"
            footer={<Button text="Open session" appearance="subtle" spacing="compact" onClick={() => {}} />}
        />
    </div>
);

/** Reset clears the choices; the rows come back when it is pressed. */
export const Reset = () => {
    const [checked, setChecked] = useState(['Grade 7']);
    const toggle = (v) => setChecked((c) => (c.includes(v) ? c.filter((x) => x !== v) : [...c, v]));
    return (
        <div style={{ padding: 'var(--page-pad)' }}>
            <FilterSide checked={checked} onToggle={toggle} onReset={() => setChecked([])} />
        </div>
    );
};

/** Copy: an icon button beside the value; the tooltip says "Copied" once the value is on the clipboard. */
export const Copy = ({ held = false }) => {
    const [copied, setCopied] = useState(held);
    useEffect(() => {
        // A picture holds the tooltip open, so the page shows the state; a press elsewhere lets it leave on its own.
        if (!copied || held) return undefined;
        const id = setTimeout(() => setCopied(false), 2000); // docs-literal: how long the tooltip stays
        return () => clearTimeout(id);
    }, [copied, held]);
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--stack-md)', padding: 'var(--page-pad)', paddingBlockStart: 'calc(var(--page-pad) * 2)' }}>
            <span style={{ font: 'var(--body-default)', color: 'var(--ds-text)' }}>plus.org/join/algebra-b</span>
            <Tooltip text="Copied" placement="top" show={copied ? true : undefined}>
                <IconButton icon="copy" label="Copy" appearance="subtle" isTooltipDisabled onClick={() => setCopied(true)} />
            </Tooltip>
        </div>
    );
};

/** One value, edited in place: the read view is one button, a pencil appears on hover and focus. */
export const EditOne = () => {
    const [name, setName] = useState('Lincoln Middle');
    return (
        <div style={{ padding: 'var(--page-pad)', maxInlineSize: 'calc(var(--card-min-width-md))' }}>
            <InlineEdit
                label="Group name"
                defaultValue={name}
                readView={() => name}
                editView={({ id, value, onChange }) => <TextField id={id} label="Group name" isLabelHidden value={value} onChange={onChange} />}
                onConfirm={setName}
            />
        </div>
    );
};

/** Room for the held-open DropdownMenu in EditRecord: docs geometry, in px. */
const EDIT_RECORD_HEIGHT = 180; // docs-literal

/** The whole record: Edit sits in the More menu beside the record's other actions. */
export const EditRecord = ({ held = false }) => {
    const [setMount, mount] = useLayerMount();
    return (
        // A held-open menu waits for the picture's element, so it mounts inside it and not on the page.
        <div ref={setMount} style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: 'var(--page-pad)', minBlockSize: held ? EDIT_RECORD_HEIGHT : undefined }}>
            <span style={{ font: 'var(--heading-sm)', color: 'var(--ds-text)' }}>Ana Ruiz</span>
            <DropdownMenu
                trigger={<IconButton icon="ellipsis" label="More" appearance="subtle" />}
                placement="bottom-end"
                {...(held && mount ? { isOpen: true, onOpenChange: () => {} } : {})}
                container={mount ?? undefined}
            >
                <ButtonItem onClick={() => {}}>Edit</ButtonItem>
                <ButtonItem onClick={() => {}}>Remove from group</ButtonItem>
            </DropdownMenu>
        </div>
    );
};

/** Rows selected: the head row becomes the bulk bar, so the actions sit with the rows they act on. */
export const ManyRows = () => {
    const [view, setView] = useState('All students');
    return (
        <PatternSection
            title="Students"
            description="Lincoln Middle · 24 students"
            actions={<SectionActions />}
            views={<ViewPills views={['All students', 'Needs follow-up']} activeView={view} onViewChange={setView} />}
            search={<HeaderSearch />}
        >
            <StudentsTable
                count={6}
                view={view}
                sortable
                isSelectable
                defaultSelectedRowKeys={['Ava Thompson', 'Sofia Ramirez']}
                bulkActions={[{ label: 'Move to group' }, { label: 'Remove from group' }]}
            />
        </PatternSection>
    );
};

/** Sending: only the pressed button disables, swapping its label for a spinner in place at the same width. */
export const Sending = ({ sending: started = false }) => {
    const [sending, setSending] = useState(started);
    return (
        <ModalStage
            title="Log a session"
            footer={(
                <FooterCells>
                    <Button text="Discard" shouldFitContainer onClick={() => {}} />
                    <Button text="Save session" appearance="primary" shouldFitContainer isLoading={sending} onClick={() => setSending(true)} />
                </FooterCells>
            )}
        >
            {text('Ana Ruiz, Thursday at 4:00 PM, Lincoln Middle.')}
        </ModalStage>
    );
};

/* ----------------------------------------------------- live do/don't pairs */

const buttonRow = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'var(--stack-md)',
    marginBlockStart: 'var(--stack-lg)',
};

/** Do: one Primary, with the second action Default beside it. */
export const OnePrimaryCase = () => (
    <CaseSurface>
        <Fieldset legend="Session">
            <TextField label="Student" defaultValue="Ana Ruiz" />
        </Fieldset>
        <div style={buttonRow}>
            <Button appearance="primary" text="Save session" onClick={() => {}} />
            <Button appearance="default" text="Save draft" onClick={() => {}} />
        </div>
    </CaseSurface>
);

/** Don't: two Primary buttons in one row; neither reads as the next step. */
export const TwoPrimariesCase = () => (
    <CaseSurface>
        <Fieldset legend="Session">
            <TextField label="Student" defaultValue="Ana Ruiz" />
        </Fieldset>
        <div style={buttonRow}>
            <Button appearance="primary" text="Save session" onClick={() => {}} />
            <Button appearance="primary" text="Save draft" onClick={() => {}} />
        </div>
    </CaseSurface>
);

/** Do: Primary first, then Cancel, left-aligned under the fields. */
export const PageButtonsLeftCase = () => (
    <CaseSurface>
        <Fieldset legend="Session">
            <TextField label="Student" defaultValue="Ana Ruiz" />
            <TextField label="Site" defaultValue="Lincoln Middle" />
        </Fieldset>
        <div style={{ ...buttonRow, justifyContent: 'flex-start' }}>
            <Button appearance="primary" text="Save session" onClick={() => {}} />
            <Button appearance="subtle" text="Cancel" onClick={() => {}} />
        </div>
    </CaseSurface>
);

/** Don't: buttons pushed to the far end of the page, away from the fields, with Primary last. */
export const PageButtonsFarRightCase = () => (
    <CaseSurface>
        <Fieldset legend="Session">
            <TextField label="Student" defaultValue="Ana Ruiz" />
            <TextField label="Site" defaultValue="Lincoln Middle" />
        </Fieldset>
        <div style={{ ...buttonRow, justifyContent: 'flex-end' }}>
            <Button appearance="subtle" text="Cancel" onClick={() => {}} />
            <Button appearance="primary" text="Save session" onClick={() => {}} />
        </div>
    </CaseSurface>
);

/** Do: two buttons filling the Modal footer edge to edge. */
export const ModalFooterFullBleedCase = () => (
    <CaseBlanket height={280}>
        <Dialog
            width="4-col"
            title="Log a session"
            onClose={() => {}}
            footer={(
                <FooterActions>
                    <Button text="Discard" onClick={() => {}} />
                    <Button text="Save session" appearance="primary" onClick={() => {}} />
                </FooterActions>
            )}
        >
            <TextField label="Student" defaultValue="Ana Ruiz" />
        </Dialog>
    </CaseBlanket>
);

/** Don't: small buttons inset at the end, with spare footer around them. */
// Deliberately mirrors the inset footer (non-full-bleed) as the Don't example.
export const ModalFooterInsetCase = () => (
    <CaseBlanket height={280}>
        <Dialog
            width="4-col"
            title="Log a session"
            onClose={() => {}}
            footer={(
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 'var(--inline-md)',
                        paddingInline: 'var(--dialog-pad-x-default)',
                        paddingBlock: 'var(--stack-md)',
                        borderTop: 'var(--border-width-default) solid var(--ds-border)',
                    }}
                >
                    <Button text="Discard" onClick={() => {}} />
                    <Button text="Save session" appearance="primary" onClick={() => {}} />
                </div>
            )}
        >
            <TextField label="Student" defaultValue="Ana Ruiz" />
        </Dialog>
    </CaseBlanket>
);
