import React from 'react';

import { Button, ButtonItem, Select, SectionMessage, TextField, RadioGroup, DropdownMenu, IconButton } from '@/components';
import { useLayerMount } from '@/storybook-docs/lib/view-bar.jsx';

/**
 * The Disabled pattern's examples, drawn with the real Button, TextField,
 * Select, RadioGroup, SectionMessage and DropdownMenu. Each picture is in the
 * state its heading names, through initial-state props: the docs page runs no
 * plays. None carries a reason in a tooltip; the reason is visible text where
 * the cause is.
 *
 *   Explains         an action that stays enabled and says what is missing
 *   DisabledWithReason  a disabled field, the caption its reason
 *   WaitsOnField     a Select that waits on another field, its caption the reason
 *   OptionCannotApply  a radio option whose description line is the reason
 *   BlocksAction     a warning SectionMessage above fields that cannot be used yet
 *   SelfEvident      Back on step one and a Danger button until the name matches
 *   Sending          the one time a button disables, Cancel still live
 *   HiddenForRole    a menu with no Delete: left out for this role
 */

/** The width the card pictures lay out at, so their words stay legible at card size. Docs geometry, in px. */
export const CARD_STAGE = 600; // docs-literal

const noop = () => {};
const pad = { padding: 'var(--page-pad)', boxSizing: 'border-box' };
const column = { ...pad, display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)', maxInlineSize: 'var(--card-min-width-lg)' };
const buttons = { display: 'flex', gap: 'var(--inline-md)' };

const SCHOOLS = [{ value: 'lincoln', label: 'Lincoln Middle School' }, { value: 'roosevelt', label: 'Roosevelt Elementary' }];

/** An action stays enabled: the field it needs is marked and the button still presses. */
export const Explains = () => (
    <div style={column}>
        <TextField label="Student" isRequired value="" onChange={noop} isInvalid errorMessage="Enter the student's name." />
        <div style={buttons}>
            <Button text="Save session" appearance="primary" onClick={noop} />
            <Button text="Cancel" appearance="subtle" onClick={noop} />
        </div>
    </div>
);

/** A disabled field with its reason as the caption, visible text that keeps full contrast. */
export const DisabledWithReason = () => (
    <div style={column}>
        <TextField label="Time" value="" onChange={noop} isDisabled caption="Choose a date first." />
    </div>
);

/** A field that waits on another on this screen: faded, out of the tab order, the caption says what to do. */
export const WaitsOnField = ({ school = null }) => (
    <div style={column}>
        <Select label="School" options={SCHOOLS} value={school} onChange={noop} />
        <Select
            label="Group"
            options={[{ value: 'algebra', label: 'Lincoln Middle' }]}
            value={null}
            onChange={noop}
            dependsOn={{ value: school, label: 'a school' }}
        />
    </div>
);

/** An option that cannot apply: its description line carries the reason and the rest of the list is live. */
export const OptionCannotApply = () => (
    <div style={column}>
        <RadioGroup
            legend="Time slot"
            value={null}
            onChange={noop}
            options={[
                { value: '3', label: '3:00 PM' },
                { value: '4', label: '4:00 PM', isDisabled: true, description: 'Ms. Ortiz has a session then.' },
                { value: '5', label: '5:00 PM' },
            ]}
        />
    </div>
);

/** A prerequisite that blocks several items: a warning above says how to turn them on. */
export const BlocksAction = () => (
    <div style={column}>
        <SectionMessage appearance="warning" title="No school yet" dismissible={false} actions={[{ text: 'Add school', onClick: noop }]}>
            Add a school to this group to schedule sessions.
        </SectionMessage>
        <Select label="Group" options={[]} value={null} onChange={noop} isDisabled caption="Needs a school first." />
        <Select label="Time" options={[]} value={null} onChange={noop} isDisabled caption="Needs a school first." />
    </div>
);

/** Self-evident cases need no reason beyond what is on screen: Back on step one, Danger until the name matches. */
export const SelfEvident = () => (
    <div style={column}>
        <div style={buttons}>
            <Button text="Back" appearance="subtle" isDisabled onClick={noop} />
            <Button text="Next" appearance="primary" onClick={noop} />
        </div>
        <TextField label="Type the school name to confirm" value="Lincoln" onChange={noop} caption="Type Lincoln Middle School." />
        <div style={buttons}>
            <Button text="Remove school" appearance="danger" isDisabled onClick={noop} />
        </div>
    </div>
);

/** Sending: the one time a button disables. The label swaps for a spinner at the same width; Cancel stays live. */
export const Sending = () => (
    <div style={column}>
        <div style={buttons}>
            <Button text="Save session" appearance="primary" isLoading onClick={noop} />
            <Button text="Cancel" appearance="subtle" onClick={noop} />
        </div>
    </div>
);

/** What a role can never use is left out: this tutor's row menu has Edit and Remove from group, and no Delete school. */
export const HiddenForRole = () => {
    const [setMount, mount] = useLayerMount();
    return (
        <div ref={setMount} style={{ ...pad, position: 'relative', minBlockSize: 'var(--card-min-width-lg)' }}>
            {mount && (
                <DropdownMenu
                    isOpen
                    onOpenChange={noop}
                    container={mount}
                    trigger={<IconButton icon="ellipsis" label="More" appearance="subtle" onClick={noop} />}
                >
                    <ButtonItem onClick={noop}>Edit</ButtonItem>
                    <ButtonItem onClick={noop}>Remove from group</ButtonItem>
                </DropdownMenu>
            )}
        </div>
    );
};
