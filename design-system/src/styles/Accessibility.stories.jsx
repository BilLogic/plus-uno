import React from 'react';
import { Button } from '@/components';
import { RefTable, C, Do, Dont, DoDont } from '@/storybook-docs/foundation-blocks.jsx';
import { iconClass } from '../lib/icon';

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
            <span style={{ display: 'inline-flex', borderRadius: 'var(--radius-control-md)', outline: 'var(--border-focused) solid var(--ds-border-focused)', outlineOffset: 'var(--border-focused)' }}>
                <Button text="Save changes" appearance="primary" />
            </span>
        </Do>
        <Dont caption="Focus shown only by darkening the fill. It reads as hover or press, and it is easy to miss.">
            <span style={{ display: 'inline-flex' }}>
                <Button text="Save changes" appearance="primary" className="sb-focus-by-fill" />
                <style>{'.sb-focus-by-fill.btn { background-color: var(--ds-background-brand-bold-pressed); }'}</style>
            </span>
        </Dont>
    </DoDont>
);

/** Color alone is not a message. */
export const StatusNotColorAlone = () => (
    <DoDont>
        <Do caption="Color, an icon and a word together. The status reads with no color vision.">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--inline-sm)', font: 'var(--body-default)', color: 'var(--ds-text-danger)' }}>
                <i className={iconClass('circle-exclamation')} aria-hidden="true" />
                Payment failed
            </span>
        </Do>
        <Dont caption="A red dot and no words. Users who cannot tell the colors apart get nothing.">
            <span aria-hidden="true" style={{ display: 'inline-block', width: 'var(--icon-sm)', height: 'var(--icon-sm)', borderRadius: 'var(--radius-full)', background: 'var(--ds-background-danger-bold)' }} />
        </Dont>
    </DoDont>
);
