import React, { useState } from 'react';
import { Button, Dialog, FooterActions, TextField, Tooltip } from '@/components';
import { CaseBlanket, CaseSurface } from '@/storybook-docs/lib/case-surface.jsx';
import { DocsOverlayBoundary } from '@/storybook-docs/lib/docs-overlay-boundary.jsx';
import { FieldError, LoadFailure, isValidEmail } from './errorsDemo.jsx';

/**
 * The live do and don't examples on the Errors pattern page, composed from
 * `FieldError`, `TextField`, `Tooltip`, `CaseSurface` and `DocsOverlayBoundary`.
 */

/** Do: the message sits right under the invalid field, in words that say what to fix. */
export const MessageOnFieldCase = () => (
    <CaseSurface>
        <FieldError padded={false} />
    </CaseSurface>
);

/** Don't: a red border alone, with the error words hidden inside a tooltip layer. */
export const BorderAndTooltipCase = () => {
    const [email, setEmail] = useState('ana@school');
    const invalid = !isValidEmail(email);
    return (
        <DocsOverlayBoundary fit={false} containHeight>
            <CaseSurface style={{ minBlockSize: 'calc(var(--control-lg) * 3)' }}>
                <Tooltip
                    text="Enter a full email, like name@school.org"
                    placement="bottom"
                    show={invalid}
                >
                    <div style={{ inlineSize: '100%' }}>
                        <TextField
                            label="School email"
                            isRequired
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            isInvalid={invalid}
                        />
                    </div>
                </Tooltip>
            </CaseSurface>
        </DocsOverlayBoundary>
    );
};

/** Do: the failure in the Section's slot, with its header rows and the rest of the page still working. */
export const FailureInSlot = () => <LoadFailure padded={false} />;

/** Don't: a Modal over the whole page to report one Section's failure. */
export const FailureInModal = () => (
    <CaseBlanket height={300}>
        <Dialog
            title="Couldn't load sessions"
            onClose={() => {}}
            style={{ inlineSize: '100%' }}
            footer={(
                <FooterActions>
                    <Button text="Close" onClick={() => {}} />
                    <Button text="Try again" appearance="primary" onClick={() => {}} />
                </FooterActions>
            )}
        >
            <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text)' }}>Check your connection and try again.</p>
        </Dialog>
    </CaseBlanket>
);
