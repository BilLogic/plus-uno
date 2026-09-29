import React, { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';

import CloseButton from './CloseButton';

export default {
    title: 'Components/Actions/Close button',
    component: CloseButton,
    tags: ['!dev', '!autodocs'],
    parameters: {
        layout: 'padded',
        changelog: [
            { date: '2026-09-29', kind: 'added', summary: 'The shared dismiss control: a fixed 24×24 box with a 16px ×, in default and inverse tones.' },
        ],
        docs: {
            description: {
                component:
                    'The one dismiss control for surfaces that close as a whole. A fixed 24×24 '
                    + 'hit area with a 16px ×, in a default and an inverse tone.',
            },
        },
    },
    argTypes: {
        tone: {
            control: 'inline-radio',
            options: ['default', 'inverse'],
            description: '`default` on neutral surfaces, `inverse` on colored or dark grounds',
            table: { category: 'Design' },
        },
        what: {
            control: 'text',
            description: 'What closes — the accessible name becomes "Dismiss {what}"',
            table: { category: 'Content' },
        },
        onClick: { table: { disable: true, category: 'Development' } },
        className: { control: false, table: { disable: true, category: 'Development' } },
    },
};

const row = { display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' };
const label = { color: 'var(--color-on-surface-variant)' };
const inverseGround = {
    ...row,
    padding: '16px',
    borderRadius: 'var(--size-element-radius-md)',
    background: 'var(--color-inverse-surface)',
};
const primaryGround = { ...inverseGround, background: 'var(--color-primary)' };

/**
 * The computed color a token paints, read off a probe element, so an assertion
 * compares like with like (`rgb(…)`) rather than a hex against a computed value.
 */
function tokenColor(canvasElement, token) {
    const probe = canvasElement.ownerDocument.createElement('span');
    probe.style.color = `var(${token})`;
    canvasElement.appendChild(probe);
    const value = getComputedStyle(probe).color;
    probe.remove();
    return value;
}

const box = (element) => element.getBoundingClientRect();

export const Tones = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-start' }}>
        <div style={row}>
            <CloseButton what="default example" />
            <span className="body2-txt" style={label}>default — on neutral surfaces</span>
        </div>
        <div style={inverseGround}>
            <CloseButton tone="inverse" what="inverse example on a dark ground" />
            <span className="body2-txt" style={{ color: 'var(--color-inverse-on-surface)' }}>inverse — on a dark ground</span>
        </div>
        <div style={primaryGround}>
            <CloseButton tone="inverse" what="inverse example on a colored ground" />
            <span className="body2-txt" style={{ color: 'var(--color-on-primary)' }}>inverse — on a colored ground</span>
        </div>
    </div>
);

Tones.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const onSurfaceVariant = tokenColor(canvasElement, '--color-on-surface-variant');
    const surface = tokenColor(canvasElement, '--color-surface');

    const plain = canvas.getByRole('button', { name: 'Dismiss default example' });
    await expect(getComputedStyle(plain.querySelector('i')).color).toBe(onSurfaceVariant);

    for (const name of ['Dismiss inverse example on a dark ground', 'Dismiss inverse example on a colored ground']) {
        const inverse = canvas.getByRole('button', { name });
        await expect(getComputedStyle(inverse.querySelector('i')).color).toBe(surface);
    }
};

/**
 * The same control inside text of five sizes. The old Alert dismiss button took
 * the title or body class and grew with it; this one must not.
 */
export const FixedSize = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-start' }}>
        {[
            ['body3-txt', 'body 3'],
            ['body2-txt', 'body 2'],
            ['h4', 'heading 4'],
            ['display1-txt', 'display 1'],
        ].map(([className, name]) => (
            <div key={className} className={className} style={row}>
                <span>Aa</span>
                <CloseButton what={`${name} context`} />
            </div>
        ))}
        <div style={{ ...row, fontSize: '48px' }}>
            <span>Aa</span>
            <CloseButton what="48px context" />
        </div>
    </div>
);

FixedSize.play = async ({ canvasElement }) => {
    const buttons = within(canvasElement).getAllByRole('button');
    await expect(buttons).toHaveLength(5);
    for (const button of buttons) {
        const name = button.getAttribute('aria-label');
        const { width, height } = box(button);
        await expect(Math.round(width), `${name} width`).toBe(24);
        await expect(Math.round(height), `${name} height`).toBe(24);
        const icon = button.querySelector('i');
        await expect(getComputedStyle(icon).fontSize, `${name} icon`).toBe('16px');
        // The glyph stays inside the hit area.
        const glyph = box(icon);
        await expect(glyph.height).toBeLessThanOrEqual(24);
        await expect(glyph.width).toBeLessThanOrEqual(24);
        await expect(getComputedStyle(button).borderRadius).toBe('4px');
    }
};

/** "Close" by default, "Dismiss {what}" when the caller says what closes. */
export const Names = () => {
    const [closed, setClosed] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    return (
        <div style={row}>
            <CloseButton onClick={() => setClosed((n) => n + 1)} />
            <CloseButton what="session reminder" onClick={() => setClosed((n) => n + 1)} />
            <form onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}>
                <CloseButton what="form panel" type="submit" onClick={() => setClosed((n) => n + 1)} />
            </form>
            <span className="body2-txt" style={label} data-testid="closed-count">{closed}</span>
            <span className="body2-txt" style={label} data-testid="submitted">{submitted ? 'submitted' : 'not submitted'}</span>
        </div>
    );
};

Names.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const plain = canvas.getByRole('button', { name: 'Close' });
    const named = canvas.getByRole('button', { name: 'Dismiss session reminder' });
    await expect(plain).toHaveAttribute('type', 'button');
    // The icon is decoration; the name is the whole of what is announced.
    await expect(plain.querySelector('i')).toHaveAttribute('aria-hidden', 'true');

    await userEvent.click(plain);
    await userEvent.click(named);
    await expect(canvas.getByTestId('closed-count')).toHaveTextContent('2');

    // A caller's `type="submit"` does not win: inside a form it still does not submit.
    const inForm = canvas.getByRole('button', { name: 'Dismiss form panel' });
    await expect(inForm).toHaveAttribute('type', 'button');
    await userEvent.click(inForm);
    await expect(canvas.getByTestId('closed-count')).toHaveTextContent('3');
    await expect(canvas.getByTestId('submitted')).toHaveTextContent('not submitted');
};

/**
 * Keyboard focus draws the ring 2px outside the box: Focus Ring, 2px, radius
 * lg — Focus Ring Inverse on the inverse tone — over the 12% state layer.
 */
export const Focus = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-start' }}>
        <div style={row}>
            <CloseButton what="default focus example" />
        </div>
        <div style={inverseGround}>
            <CloseButton tone="inverse" what="inverse focus example" />
        </div>
    </div>
);

Focus.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cases = [
        ['Dismiss default focus example', '--color-focus-ring', '--color-on-surface-variant-state-12'],
        ['Dismiss inverse focus example', '--color-focus-ring-inverse', '--color-surface-state-12'],
    ];
    for (const [name, ringToken, layerToken] of cases) {
        const button = canvas.getByRole('button', { name });

        // At rest: no ring.
        await expect(getComputedStyle(button, '::after').content).toBe('none');

        button.focus({ focusVisible: true });
        await expect(button.matches(':focus-visible'), `${name} is keyboard-focused`).toBe(true);

        const ring = getComputedStyle(button, '::after');
        await expect(ring.borderTopStyle).toBe('solid');
        await expect(ring.borderTopWidth).toBe('2px');
        await expect(ring.borderTopColor).toBe(tokenColor(canvasElement, ringToken));
        await expect(ring.borderTopLeftRadius).toBe('8px');
        // 2px stroke + 2px offset outside the 24px box.
        await expect(ring.top).toBe('-4px');
        await expect(ring.left).toBe('-4px');

        const probe = canvasElement.ownerDocument.createElement('span');
        probe.style.backgroundColor = `var(${layerToken})`;
        canvasElement.appendChild(probe);
        await expect(getComputedStyle(button).backgroundColor).toBe(getComputedStyle(probe).backgroundColor);
        probe.remove();

        button.blur();
    }
};

export const Overview = {
    render: (args) => <CloseButton {...args} />,
    args: { tone: 'default' },
};

export const Interactive = {
    render: (args) => (
        <div style={args.tone === 'inverse' ? inverseGround : row}>
            <CloseButton {...args} />
        </div>
    ),
    args: { tone: 'default', what: '' },
};
