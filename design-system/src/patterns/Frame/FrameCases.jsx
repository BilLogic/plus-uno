import React from 'react';
import { Button, FooterActions } from '@/components';

/**
 * The live do and don't bar examples of the Frame template page, built from
 * `FooterActions` and `Button`.
 */

const BarSurface = ({ children }) => (
    <div
        className="sb-unstyled"
        style={{
            inlineSize: '100%',
            padding: 'var(--space-100) var(--space-150)',
            borderTop: 'var(--border-width-default) solid var(--ds-border)',
            background: 'var(--ds-surface)',
        }}
    >
        {children}
    </div>
);

/** Back and the primary Next split the bar; Close in the title row leaves the task. */
export const BarInOrder = () => (
    <BarSurface>
        <FooterActions>
            <Button text="Back" onClick={() => {}} />
            <Button text="Next" appearance="primary" onClick={() => {}} />
        </FooterActions>
    </BarSurface>
);

/** Cancel repeated in the bar beside Back and Next: two ways out of one task. */
export const BarScrambled = () => (
    <BarSurface>
        <FooterActions>
            <Button text="Cancel" appearance="subtle" onClick={() => {}} />
            <Button text="Back" onClick={() => {}} />
            <Button text="Next" appearance="primary" onClick={() => {}} />
        </FooterActions>
    </BarSurface>
);
