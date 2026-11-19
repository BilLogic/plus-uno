import React, { useEffect, useRef } from 'react';
import { animate } from 'motion/react';
import { expect, userEvent } from 'storybook/test';
import { Button, StatusTag } from '@/components';
import { PatternCard } from '@/patterns';
import { SPRINGS } from '@/tokens/ladder/springs.generated.js';
import { RefTable, C, Do, Dont, DoDont, ModeCompare, RingDemo } from '@/storybook-docs/foundation-blocks.jsx';
import { tokenColor } from '@/storybook-docs/lib/style-probes.js';

export default {
    title: 'Foundations/Accessibility',
    tags: ['!dev', '!autodocs'],
};

/** Which text and icon token goes on which fill. */
export const ContrastPairings = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-xl)' }}>
            <ModeCompare>
                {() => (
                    <PatternCard
                        title="Algebra B · Lincoln Middle"
                        description="Tuesdays at 4:30 PM with Maya Rodriguez"
                        actions={<StatusTag appearance="success">Active</StatusTag>}
                    >
                        <Button text="Open session notes" appearance="primary" />
                    </PatternCard>
                )}
            </ModeCompare>
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
        </div>
    ),
    play: async ({ canvas, canvasElement }) => {
        await expect(canvas.getAllByText('Active').length).toBe(2);
        await userEvent.click(canvas.getByRole('button', { name: 'Dark' }));
        await expect(canvasElement.querySelectorAll('[data-color-mode]')).toHaveLength(1);
        await userEvent.click(canvas.getByRole('button', { name: 'Light and dark' }));
        await expect(canvasElement.querySelectorAll('[data-color-mode]')).toHaveLength(2);
    },
};

/** Focus is a ring outside the control, never a fill. */
export const FocusRing = {
    render: () => (
        <DoDont>
            <Do caption={<>A 2px ring in <C>--ds-border-focused</C>, 2px outside the button. The fill is unchanged.</>}>
                <RingDemo style={{ borderRadius: 'var(--radius-control-md)' }}>
                    <Button text="Save changes" appearance="primary" />
                </RingDemo>
            </Do>
            <Dont caption="Focus shown only by darkening the fill. It reads as hover or press, and it is easy to miss.">
                <Button
                    text="Save changes"
                    appearance="primary"
                    style={{ backgroundColor: 'var(--ds-background-brand-bold-pressed)' }}
                />
            </Dont>
        </DoDont>
    ),
    play: async ({ canvas, canvasElement }) => {
        const buttons = canvas.getAllByRole('button', { name: 'Save changes' });
        await expect(buttons).toHaveLength(2);
        buttons[0].focus();
        await expect(buttons[0]).toHaveFocus();
        await expect(getComputedStyle(buttons[0].parentElement).outlineColor).toBe(
            tokenColor(canvasElement, '--ds-border-focused'),
        );
    },
};

/** Color alone is not a message. */
export const StatusNotColorAlone = {
    render: () => (
        <DoDont>
            <Do caption="Color, an icon and a word together. The status reads with no color vision.">
                <StatusTag appearance="danger" iconBefore="circle-exclamation">Payment failed</StatusTag>
            </Do>
            <Dont caption="A red dot and no words. Users who cannot tell the colors apart get nothing.">
                <span style={{ display: 'inline-block', width: 'var(--icon-sm)', height: 'var(--icon-sm)', borderRadius: 'var(--radius-full)', background: 'var(--ds-background-danger-bold)' }} />
            </Dont>
        </DoDont>
    ),
    play: async ({ canvas }) => {
        await expect(canvas.getByText('Payment failed')).toBeInTheDocument();
    },
};

const FadeInFromZero = () => {
    const ref = useRef(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        const controls = animate(el, { opacity: [0, 1] }, SPRINGS['appearance.slow'].productive);
        return () => controls.stop();
    }, []);
    return (
        <div
            ref={ref}
            style={{
                opacity: 0,
                background: 'var(--ds-surface)',
                color: 'var(--ds-text)',
                padding: 'var(--section-stack-lg)',
            }}
        >
            Session notes saved.
        </div>
    );
};

/** An element that fades in from 0 opacity settles before the a11y scan checks contrast. */
export const SettledFadeInPassesScan = {
    render: () => <FadeInFromZero />,
    play: async ({ canvas }) => {
        await expect(canvas.getByText('Session notes saved.')).toBeInTheDocument();
    },
};
