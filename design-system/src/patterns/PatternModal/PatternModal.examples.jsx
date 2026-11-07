import React from 'react';
import PatternModal from '@/patterns/PatternModal';
import { Button, TextField } from '@/components';
import Blanket from '@/patterns/Blanket';
import { ScaledPreview } from '@/storybook-docs/lib/scaled-preview.jsx';

/**
 * Live compositions for the Modal page's do and don't pairs. Each is a real
 * PatternModal, held to the width of its card instead of the screen's.
 */
const fit = { width: '100%', maxWidth: 'var(--modal-width-sm)' };

/** Keeps the docs page heading styles off the Modal title: the docs fence canvases by the docs-story class. */
const Plain = ({ children }) => <div className="docs-story sb-unstyled" style={{ width: '100%' }}>{children}</div>;

const actions = (primary) => (
    <>
        <Button text="Cancel" spacing="compact" onClick={() => {}} />
        <Button text={primary} appearance="primary" spacing="compact" onClick={() => {}} />
    </>
);

const stack = (gap, children) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>{children}</div>
);

const field = (label, placeholder) => <TextField label={label} placeholder={placeholder} spacing="compact" />;

/** The actions sit in the footer slot, apart from the fields. */
export const FooterActions = () => (
    <Plain>
    <PatternModal title="Rename session" style={fit} onClose={() => {}} footer={actions('Save')}>
        {field('Session name', 'Algebra I review')}
    </PatternModal>
    </Plain>
);

/** The buttons sit in the body with the fields, and the footer is off. */
export const ButtonsInBody = () => (
    <Plain>
    <PatternModal title="Rename session" style={fit} onClose={() => {}}>
        {stack('var(--modal-stack-md)', (
            <>
                {field('Session name', 'Algebra I review')}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--modal-inline-sm)' }}>
                    {actions('Save')}
                </div>
            </>
        ))}
    </PatternModal>
    </Plain>
);

const line = (text) => <p style={{ margin: 0, font: 'var(--body-default)' }}>{text}</p>;

/** Views of one session, opened in any order. */
export const TabsForViews = () => (
    <Plain>
    <PatternModal
        title="Session settings"
        style={fit}
        onClose={() => {}}
        footer={actions('Save')}
        tabs={[
            { key: 'details', label: 'Details', content: line('Tutor Ana Ruiz · Thursday, 4:30–5:15 PM') },
            { key: 'students', label: 'Students', content: line('Twelve students') },
            { key: 'notes', label: 'Notes', content: line('Reviewed factoring.') },
        ]}
    />
    </Plain>
);

/** Numbered tabs fake a sequence. */
export const TabsAsSteps = () => (
    <Plain>
    <PatternModal
        title="Add a student"
        style={fit}
        onClose={() => {}}
        footer={(
            <>
                <Button text="Back" spacing="compact" onClick={() => {}} />
                <Button text="Next" appearance="primary" spacing="compact" onClick={() => {}} />
            </>
        )}
        tabs={[
            { key: 'student', label: '1. Student', content: field('Student name', 'Maya Patel') },
            { key: 'schedule', label: '2. Schedule', content: line('Pick a time.') },
            { key: 'confirm', label: '3. Confirm', content: line('Review and add.') },
        ]}
    />
    </Plain>
);

const SCREEN = { width: 1024, height: 480 };

/** A modal in its Blanket at a 1024 stand-in screen, scaled down to the card. Stage sizes are docs geometry. */
const atScreen = (height) => (
    <ScaledPreview {...SCREEN}>
        <Blanket inline screenWidth={SCREEN.width} screenHeight={SCREEN.height}>
            <PatternModal title="Move session" height={height} onClose={() => {}} footer={actions('Move session')}>
                {line('Move Thursday’s session with Ana Ruiz to 4:30 PM?')}
            </PatternModal>
        </Blanket>
    </ScaledPreview>
);

/** Do: a short body in a hug modal, as tall as its content. */
export const HugShortContent = () => atScreen('hug');

/** Don't: the same short body in a fill modal, which sits at the cap. */
export const FillShortContent = () => atScreen('fill');
