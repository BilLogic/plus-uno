import React, { useState } from 'react';
import { Button, FooterActions, Popup, TextField } from '@/components';
import { Blanket, PatternModal } from '@/patterns';

/**
 * The live do and don't examples on the Popup template page, composed from
 * `Blanket`, `PatternModal`, `Popup`, `FooterActions`, `TextField` and `Button`.
 */

/** Fields the person must finish sit in a Modal over a Blanket. */
export const FieldsInModalCase = () => {
    const [student, setStudent] = useState('Ana Ruiz');
    const [topic, setTopic] = useState('Two-step equations');
    return (
        <div className="sb-unstyled" style={{ inlineSize: '100%' }}>
            <Blanket
                inline
                screenHeight={280}
                style={{
                    padding: 'var(--pad-y-md) var(--pad-x-md)',
                    borderRadius: 'var(--radius-md)',
                }}
            >
                <PatternModal
                    title="Add session"
                    onClose={() => {}}
                    style={{ inlineSize: '100%' }}
                    footer={(
                        <FooterActions>
                            <Button text="Discard" onClick={() => {}} />
                            <Button text="Save" appearance="primary" onClick={() => {}} />
                        </FooterActions>
                    )}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
                        <TextField label="Student" value={student} onChange={(e) => setStudent(e.target.value)} />
                        <TextField label="Topic" value={topic} onChange={(e) => setTopic(e.target.value)} />
                    </div>
                </PatternModal>
            </Blanket>
        </div>
    );
};

/** A form placed inside a Popup closes on an outside click and loses edits. */
export const FormInPopupCase = () => {
    const [mount, setMount] = useState(null);
    const [student, setStudent] = useState('Ana Ruiz');
    return (
        <div
            ref={setMount}
            className="sb-unstyled"
            style={{
                position: 'relative',
                overflow: 'hidden',
                boxSizing: 'border-box',
                inlineSize: '100%',
                blockSize: 280,
                padding: 'var(--pad-y-md) var(--pad-x-md)',
                background: 'var(--ds-surface)',
                border: 'var(--border-width-default) solid var(--ds-border)',
                borderRadius: 'var(--radius-md)',
            }}
        >
            {mount ? (
                <Popup
                    show
                    triggerType="manual"
                    container={mount}
                    placement="bottom-start"
                    title="Add session"
                    trigger={<Button text="Add session" spacing="compact" onClick={() => {}} />}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                        <TextField label="Student" value={student} onChange={(e) => setStudent(e.target.value)} />
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button text="Save" appearance="primary" spacing="compact" onClick={() => {}} />
                        </div>
                    </div>
                </Popup>
            ) : null}
        </div>
    );
};
