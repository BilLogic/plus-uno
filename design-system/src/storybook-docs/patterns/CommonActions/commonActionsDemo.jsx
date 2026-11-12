import React, { useEffect, useState } from 'react';

import { Button, ButtonItem, DropdownMenu, IconButton, InlineEdit, TextField, Tooltip } from '@/components';
import { PatternCard, PatternSection } from '@/patterns';
import { FilterSide, StudentsTable, ViewBar, useLayerMount } from '@/storybook-docs/lib/view-bar.jsx';
import { CELL, FooterCells } from '@/storybook-docs/lib/full-bleed-footer.jsx';
import { FocusedType } from '@/storybook-docs/lib/focused-task.jsx';
import { FormFields, FILLED, PageFooter } from '../../../patterns/Form/formDemo.jsx';
import { ModalStage, TwoCells } from '../../../patterns/PatternModal/modalDemo.jsx';

/**
 * The Common actions pattern's examples: real Buttons, placed where each
 * situation puts them. Each one composes the real parts; nothing here draws a
 * button of its own.
 *
 *   Appearances   every appearance, with the word it takes
 *   Page          buttons under a page form
 *   ModalFooter   full bleed, Close in the header and Cancel in the footer
 *   Reset         a filter side, "Reset filters" at its top
 *   Copy          an icon button and its "Copied" tooltip
 *   EditOne       one value, edited in place
 *   EditRecord    the whole record, from the More menu
 *   Sending       a full-bleed button that keeps its width
 */

/** The width a picture lays out at, in px: docs geometry. */
export const STAGE = 1024; // docs-literal

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

/** Buttons under a page form: left-aligned, Primary first, Cancel Subtle. */
export const Page = () => (
    <PatternSection title="Log a session" fill="subtle">
        <FormFields values={FILLED} onChange={() => {}} />
        <PageFooter onSave={() => {}} />
    </PatternSection>
);

/** A Modal's footer: full bleed, Cancel (Default) left and the action right; Close sits in the header. */
export const ModalFooter = () => (
    <ModalStage title="Log a session" footer={<TwoCells action="Save session" />}>
        {text('Ana Ruiz, Thursday at 4:00 PM, Algebra I.')}
    </ModalStage>
);

/** A focused task's bottom bar: Cancel (Subtle) at the start, Back and Next at the end. */
export const FocusedBar = () => <FocusedType start={1} />;

/** A card's main action: Subtle in the footer. */
export const CardAction = () => (
    <div style={{ display: 'flex', padding: 'var(--page-pad)' }}>
        <PatternCard
            title="Next session"
            description="Thursday, 4:00 PM with Ana Ruiz"
            footer={<Button text="Open session" appearance="subtle" onClick={() => {}} />}
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
    const [name, setName] = useState('Algebra B');
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

/** The whole record: Edit sits in the More menu beside the record's other actions. */
export const EditRecord = ({ held = false }) => {
    const [setMount, mount] = useLayerMount();
    return (
        // A held-open menu waits for the picture's element, so it mounts inside it and not on the page.
        <div ref={setMount} style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: 'var(--page-pad)', minBlockSize: held ? 'calc(var(--card-min-width-md) * 0.6)' : undefined }}>
            <span style={{ font: 'var(--heading-small)', color: 'var(--ds-text)' }}>Ana Ruiz</span>
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
export const ManyRows = () => (
    <PatternSection title="Students" description="Algebra B · 24 students" tabs={<ViewBar views={['All students', 'Needs follow-up']} />}>
        <StudentsTable
            count={4}
            isSelectable
            defaultSelectedRowKeys={['Ava Thompson', 'Sofia Ramirez']}
            bulkActions={[{ label: 'Move to group' }, { label: 'Remove from group' }]}
        />
    </PatternSection>
);

/** Sending: only the pressed button disables, swapping its label for a spinner in place at the same width. */
export const Sending = () => {
    const [sending, setSending] = useState(false);
    return (
        <ModalStage
            title="Log a session"
            footer={(
                <FooterCells bleed="--modal-pad-x-default">
                    <Button text="Cancel" shouldFitContainer style={CELL} onClick={() => {}} />
                    <Button text="Save session" appearance="primary" shouldFitContainer isLoading={sending} style={CELL} onClick={() => setSending(true)} />
                </FooterCells>
            )}
        >
            {text('Ana Ruiz, Thursday at 4:00 PM, Algebra I.')}
        </ModalStage>
    );
};
