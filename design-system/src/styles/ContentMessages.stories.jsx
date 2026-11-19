import React from 'react';
import { expect } from 'storybook/test';
import { Dialog, EmptyState, Flag, SectionMessage, TextField } from '@/components';
import { Do, Dont, DoDont } from '@/storybook-docs/foundation-blocks.jsx';

export default {
    title: 'Foundations/Brand/Content/Messages',
    tags: ['!dev', '!autodocs'],
};

const narrowOverlay = { '--plus-overlay-screen': 'var(--width-3000)', width: '100%' };

/** Every message has a title, body and action. */
export const Anatomy = {
    render: () => (
        <SectionMessage
            appearance="primary"
            title="Sessions start late Monday"
            dismissible={false}
            actions={[{ text: 'See schedule', href: '#schedule' }]}
        >
            School B has a late start. Sessions begin at 10:30 AM ET.
        </SectionMessage>
    ),
    play: async ({ canvas }) => {
        await expect(canvas.getByRole('heading', { name: 'Sessions start late Monday' })).toBeInTheDocument();
        await expect(canvas.getByRole('link', { name: 'See schedule' })).toBeInTheDocument();
    },
};

/** Errors say what broke, what is safe, and the next step. */
export const Errors = {
    render: () => (
        <DoDont>
            <Do caption="Answers the first worry: did I lose my work?">
                <SectionMessage
                    appearance="error"
                    title="Notes didn’t save"
                    dismissible={false}
                    actions={[{ text: 'Try again', onClick: () => {} }]}
                >
                    Your connection dropped. Your draft is safe on this device.
                </SectionMessage>
            </Do>
            <Dont caption="Polite and short, but the tutor still wonders if the notes are gone.">
                <SectionMessage
                    appearance="error"
                    title="Notes didn’t save"
                    dismissible={false}
                    actions={[{ text: 'Try again', onClick: () => {} }]}
                >
                    Something went wrong. Try again.
                </SectionMessage>
            </Dont>
        </DoDont>
    ),
    play: async ({ canvas }) => {
        await expect(canvas.getAllByRole('button', { name: 'Try again' })).toHaveLength(2);
    },
};

/** Warnings name who the decision affects and label both actions. */
export const Warnings = {
    render: () => (
        <DoDont>
            <Do caption="The tutor sees the ripple before deciding."><TheTutorSeesDoFigure /></Do>
            <Dont caption="Clear action, but it hides the people it touches."><ClearActionButDontFigure /></Dont>
        </DoDont>
    ),
    play: async ({ canvas }) => {
        await expect(canvas.getAllByRole('button', { name: 'Call off' })).toHaveLength(2);
    },
};

/** Success messages name what finished and what happens next. */
export const Success = {
    render: () => (
        <DoDont>
            <Do caption="The tutor knows their work lands somewhere.">
                <Flag appearance="success" title="Reflection submitted" defaultExpanded autohide={false}>
                    Your lead tutor reads it before Friday’s check-in.
                </Flag>
            </Do>
            <Dont caption="Warm, but the tutor doesn’t know who reads it.">
                <Flag appearance="success" title="Reflection submitted" defaultExpanded autohide={false}>
                    Thanks for sharing.
                </Flag>
            </Dont>
        </DoDont>
    ),
    play: async ({ canvas }) => {
        await expect(canvas.getAllByText('Reflection submitted')).toHaveLength(2);
    },
};

/** Empty states say why the view is empty and what will fill it. */
export const EmptyStates = {
    render: () => (
        <DoDont>
            <Do caption="Sets the expectation and names who acts.">
                <EmptyState
                    spacing="compact"
                    icon="calendar"
                    header="No sessions this week"
                    description="Sessions show up here once your lead tutor schedules them."
                />
            </Do>
            <Dont caption="Calm, but later when, and why?">
                <EmptyState
                    spacing="compact"
                    icon="calendar"
                    header="No sessions this week"
                    description="Check back later."
                />
            </Dont>
        </DoDont>
    ),
    play: async ({ canvas }) => {
        await expect(canvas.getAllByText('No sessions this week')).toHaveLength(2);
    },
};

/** Field errors sit under the field and tell the user how to fix the value. */
export const FieldErrors = {
    render: () => (
        <DoDont>
            <Do caption="An instruction, with the unit.">
                <TextField
                    id="msg-length-do"
                    label="Session length"
                    defaultValue="95"
                    isInvalid
                    errorMessage="Enter 30 to 90 minutes."
                />
            </Do>
            <Dont caption="Correct, but reads like a rule, and drops the unit.">
                <TextField
                    id="msg-length-dont"
                    label="Session length"
                    defaultValue="95"
                    isInvalid
                    errorMessage="Must be between 30 and 90."
                />
            </Dont>
        </DoDont>
    ),
    play: async ({ canvas }) => {
        await expect(canvas.getByText('Enter 30 to 90 minutes.')).toBeInTheDocument();
        await expect(canvas.getByText('Must be between 30 and 90.')).toBeInTheDocument();
    },
};

const TheTutorSeesDoFigure = () => (
    <>
        <div style={narrowOverlay}>
            <Dialog
                width="6-col"
                title="Call off Thursday’s session?"
                body="Jordan’s teacher gets a note, and we look for a fill-in."
                secondaryButton={{ text: 'Keep session' }}
                primaryButton={{ text: 'Call off', appearance: 'warning' }}
                onClose={() => {}}
            />
        </div>
    </>
);

const ClearActionButDontFigure = () => (
    <>
        <div style={narrowOverlay}>
            <Dialog
                width="6-col"
                title="Call off this session?"
                body="You can’t undo this."
                secondaryButton={{ text: 'Cancel' }}
                primaryButton={{ text: 'Call off', appearance: 'warning' }}
                onClose={() => {}}
            />
        </div>
    </>
);
