import React from 'react';
import { Button, FooterActions } from '@/components';
import { CaseSurface } from '@/storybook-docs/lib/case-surface.jsx';

/**
 * The live do and don't bar examples of the Frame template page, built from
 * `FooterActions` and `Button`.
 */

/** Back and the primary Next split the bar; Close in the title row leaves the task. */
export const BarInOrder = () => (
    <CaseSurface border="top" padding="sm">
        <FooterActions>
            <Button text="Back" onClick={() => {}} />
            <Button text="Next" appearance="primary" onClick={() => {}} />
        </FooterActions>
    </CaseSurface>
);

/** Cancel repeated in the bar beside Back and Next: two ways out of one task. */
export const BarScrambled = () => (
    <CaseSurface border="top" padding="sm">
        <FooterActions>
            <Button text="Cancel" appearance="subtle" onClick={() => {}} />
            <Button text="Back" onClick={() => {}} />
            <Button text="Next" appearance="primary" onClick={() => {}} />
        </FooterActions>
    </CaseSurface>
);
