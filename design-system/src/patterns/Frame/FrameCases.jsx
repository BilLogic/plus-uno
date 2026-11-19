import React from 'react';
import { Button, FooterActions } from '@/components';
import { CaseSurface } from '@/storybook-docs/lib/case-surface.jsx';

/**
 * The live do and don't bar examples of the Frame template page, built from
 * `FooterActions` and `Button`.
 */

/** Save and exit at the start; Back and the primary Next at the end, on one 32 line. */
export const BarInOrder = () => (
    <CaseSurface border="top" padding="sm">
        <FooterActions leadingAction={<Button text="Save and exit" appearance="subtle" spacing="default" onClick={() => {}} />}>
            <Button text="Back" spacing="default" onClick={() => {}} />
            <Button text="Next" appearance="primary" spacing="default" onClick={() => {}} />
        </FooterActions>
    </CaseSurface>
);

/** Cancel repeated in the footer beside Save and exit: two ways out of one task. */
export const BarScrambled = () => (
    <CaseSurface border="top" padding="sm">
        <FooterActions leadingAction={<Button text="Save and exit" appearance="subtle" spacing="default" onClick={() => {}} />}>
            <Button text="Cancel" spacing="default" onClick={() => {}} />
            <Button text="Next" appearance="primary" spacing="default" onClick={() => {}} />
        </FooterActions>
    </CaseSurface>
);
