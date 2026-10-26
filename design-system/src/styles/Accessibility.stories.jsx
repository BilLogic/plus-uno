import React from 'react';
import { Button } from '@/components';
import { RefTable, C, Do, Dont, DoDont } from '@/storybook-docs/foundation-blocks.jsx';

export default {
    title: 'Foundations/Accessibility',
    tags: ['!dev', '!autodocs'],
};

/** Which text and icon token goes on which fill. */
export const ContrastPairings = () => (
    <RefTable
        head={['Content', 'Token', 'Sits on']}
        rows={[
            ['Body text and labels', <C>--ds-text</C>, 'Any surface'],
            ['Secondary text, helper text', <C>--ds-text-subtle</C>, 'Any surface'],
            ['Metadata, placeholders, timestamps', <C>--ds-text-subtlest</C>, 'Any surface, including hovered and selected rows'],
            ['Text or an icon on a bold fill', <><C>--ds-text-inverse</C>, <C>--ds-icon-inverse</C></>, <>Any <C>-bold</C> background except warning</>],
            ['Text on the bold warning fill', <C>--ds-text-warning-inverse</C>, <C>--ds-background-warning-bold</C>],
            ['Status text', <C>--ds-text-danger</C>, <><C>--ds-background-danger</C>, and the same for each status</>],
        ]}
    />
);

/** Focus is a ring outside the control, never a fill. */
export const FocusRing = () => (
    <DoDont>
        <Do caption={<>A 2px ring in <C>--ds-border-focused</C>, 2px outside the button. The fill is unchanged.</>}>
            <span style={{ display: 'inline-flex', borderRadius: 'var(--element-radius-item-md)', outline: 'var(--border-focused) solid var(--ds-border-focused)', outlineOffset: 'var(--border-focused)' }}>
                <Button text="Save changes" style="primary" fill="filled" />
            </span>
        </Do>
        <Dont caption="Focus shown only by darkening the fill. It reads as hover or press, and it is easy to miss.">
            <span style={{ display: 'inline-flex' }}>
                <Button text="Save changes" style="primary" fill="filled" className="sb-focus-by-fill" />
                <style>{'.sb-focus-by-fill.btn { background-color: var(--ds-background-brand-bold-pressed); }'}</style>
            </span>
        </Dont>
    </DoDont>
);
