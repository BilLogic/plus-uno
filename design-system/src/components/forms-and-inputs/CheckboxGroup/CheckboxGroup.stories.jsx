import React, { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { withForcedPseudo } from '@/storybook-docs/lib/force-pseudo.js';
import { px, tokenColor } from '@/storybook-docs/lib/style-probes.js';
import { Illustration } from '@/components';
import CheckboxGroup from './CheckboxGroup';

export default {
    title: 'Components/Forms and inputs/Checkbox/Checkbox group',
    component: CheckboxGroup,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'One question and its checkbox answers, any number of which may be chosen: a Fieldset of Checkboxes, stacked, inline or as 224px pictured choice tiles, with one group error.',
            },
        },
    },
    argTypes: {
        onChange: { table: { disable: true } },
        style: { table: { disable: true } },
        options: { table: { disable: true, category: 'Development' } },
        value: { table: { disable: true, category: 'Development' } },
        defaultValue: { table: { disable: true, category: 'Development' } },
        legend: { control: 'text', table: { category: 'Content' } },
        orientation: {
            control: 'select',
            options: ['stacked', 'inline'],
            table: { category: 'Design' },
        },
        appearance: {
            control: 'select',
            options: ['plain', 'card', 'tile'],
            table: { category: 'Design' },
        },
        error: { control: 'text', table: { category: 'Behavior' } },
        isRequired: { control: 'boolean', table: { category: 'Behavior' } },
        isDisabled: { control: 'boolean', table: { category: 'Behavior' } },
        isReadOnly: { control: 'boolean', table: { category: 'Behavior' } },
        isInvalid: { control: 'boolean', table: { category: 'State' } },
    },
};

const stack = { display: 'flex', flexDirection: 'column', gap: 'var(--section-stack-lg)', maxWidth: 'var(--content-max-width-reading)' };

const subjects = [
    { value: 'math', label: 'Math' },
    { value: 'reading', label: 'Reading' },
    { value: 'science', label: 'Science' },
];

const described = [
    { value: 'email', label: 'Email summary', description: 'Sent after each completed session.' },
    { value: 'sms', label: 'Text reminder', description: 'Sent an hour before a session starts.' },
    { value: 'calendar', label: 'Calendar invite', description: 'Added when a session is scheduled.' },
];

const tileChoices = [
    {
        value: 'mastering-content',
        label: 'Mastering content',
        description: 'Build concept fluency step by step.',
        illustration: <Illustration character="mastering-content" size={96} />,
    },
    {
        value: 'advocacy',
        label: 'Student advocacy',
        description: 'Coach students to ask for what they need.',
        illustration: <Illustration character="advocacy" size={96} />,
    },
    {
        value: 'technology',
        label: 'Session tools',
        description: 'Practice whiteboards and shared notes.',
        illustration: <Illustration character="technology" size={96} />,
    },
];

export const Overview = () => {
    const [picked, setPicked] = useState(['math']);
    return (
        <div style={stack}>
            <CheckboxGroup
                id="cbg-overview"
                name="cbg-overview"
                legend="Which subjects can you tutor?"
                options={subjects}
                value={picked}
                onChange={setPicked}
            />
            <p className="body-default" style={{ margin: 0 }} data-testid="cbg-overview-value">
                Picked: {picked.join(', ') || 'none'}
            </p>
        </div>
    );
};
Overview.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('group', { name: 'Which subjects can you tutor?' });
    await expect(group.tagName).toBe('FIELDSET');

    const boxes = within(group).getAllByRole('checkbox');
    await expect(boxes).toHaveLength(3);
    await expect(canvas.getByRole('checkbox', { name: 'Math' })).toHaveAttribute('aria-checked', 'true');
    await expect(canvas.getByRole('checkbox', { name: 'Reading' })).toHaveAttribute('aria-checked', 'false');

    await userEvent.click(canvas.getByRole('checkbox', { name: 'Reading' }));
    await expect(canvas.getByTestId('cbg-overview-value').textContent).toBe('Picked: math, reading');
};

export const Orientation = () => (
    <div style={stack}>
        <CheckboxGroup name="cbg-stacked" legend="Stacked" options={subjects} defaultValue={['math']} />
        <CheckboxGroup name="cbg-inline" legend="Inline" orientation="inline" options={subjects} defaultValue={['math']} />
    </div>
);

export const Descriptions = () => (
    <div style={stack}>
        <CheckboxGroup name="cbg-desc-plain" legend="Notifications (plain)" options={described} />
        <CheckboxGroup
            name="cbg-desc-card"
            legend="Notifications (card)"
            appearance="card"
            options={described}
            defaultValue={['sms']}
        />
    </div>
);
Descriptions.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const plain = canvas.getByRole('group', { name: 'Notifications (plain)' });
    const email = within(plain).getByRole('checkbox', { name: 'Email summary' });
    await expect(email).toHaveAccessibleDescription('Sent after each completed session.');

    const card = canvas.getByRole('group', { name: 'Notifications (card)' });
    await expect(card.querySelectorAll('.plus-choice-card')).toHaveLength(3);
};

export const Reveal = () => (
    <div style={stack}>
        <CheckboxGroup
            name="cbg-reveal"
            legend="What changed about the session?"
            options={[
                { value: 'late', label: 'Started late' },
                {
                    value: 'other',
                    label: 'Something else',
                    reveal: <p className="body-default" style={{ margin: 0 }} data-testid="cbg-reveal-content">Add a short note below.</p>,
                },
            ]}
        />
    </div>
);
Reveal.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByTestId('cbg-reveal-content')).toBeNull();
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Something else' }));
    await expect(canvas.getByTestId('cbg-reveal-content')).toBeTruthy();
};

/** Pictured 224px tiles laid out inline and wrapping, with a Checkbox at each tile's top end. */
export const Tiles = () => {
    const [picked, setPicked] = useState(['mastering-content']);
    return (
        <CheckboxGroup
            name="cbg-tiles"
            legend="Which training topics do you want next?"
            appearance="tile"
            orientation="inline"
            options={tileChoices}
            value={picked}
            onChange={setPicked}
        />
    );
};
Tiles.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('group', { name: 'Which training topics do you want next?' });
    const tiles = [...group.querySelectorAll('.plus-choice-tile')];
    await expect(tiles).toHaveLength(3);
    await expect(px(getComputedStyle(tiles[0]).width)).toBe(224);

    // Pick many: visible checkbox at the top end of the tile.
    const firstBox = within(tiles[0]).getByRole('checkbox', { name: 'Mastering content' });
    const tileRect = tiles[0].getBoundingClientRect();
    const boxRect = firstBox.getBoundingClientRect();
    await expect(boxRect.width).toBeGreaterThan(0);
    await expect(boxRect.right).toBeGreaterThan(tileRect.left + tileRect.width / 2);
    await expect(boxRect.top - tileRect.top).toBeLessThan(32);

    // Illustration is decorative.
    await expect(tiles[0].querySelector('.plus-choice-tile-illustration')).toHaveAttribute('aria-hidden', 'true');

    // Clicking a second tile adds it to the selection.
    await userEvent.click(tiles[1]);
    await expect(within(tiles[1]).getByRole('checkbox', { name: 'Student advocacy' })).toHaveAttribute('aria-checked', 'true');
};

export const Unselected = {
    render: () => <CheckboxGroup name="cbg-ex-off" legend="Subjects" options={subjects} />,
    play: async ({ canvasElement }) => {
        const boxes = within(canvasElement).getAllByRole('checkbox');
        await expect(boxes.every((b) => b.getAttribute('aria-checked') === 'false')).toBe(true);
    },
};

export const Selected = {
    render: () => <CheckboxGroup name="cbg-ex-on" legend="Subjects" options={subjects} defaultValue={['math', 'science']} />,
    play: async ({ canvasElement }) => {
        const math = within(canvasElement).getByRole('checkbox', { name: 'Math' });
        await expect(math).toHaveAttribute('aria-checked', 'true');
        await expect(getComputedStyle(math).backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-selected-bold'));
    },
};

export const Required = {
    render: () => <CheckboxGroup name="cbg-ex-req" legend="Subjects" options={subjects} isRequired />,
    play: async ({ canvasElement }) => {
        const group = within(canvasElement).getByRole('group', { name: /Subjects/ });
        await expect(group.tagName).toBe('FIELDSET');
    },
};

export const Invalid = {
    render: () => (
        <CheckboxGroup
            name="cbg-ex-invalid"
            legend="Subjects"
            options={subjects}
            isRequired
            error="Select at least one subject."
        />
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const alert = canvas.getByRole('alert');
        await expect(alert.textContent).toBe('Select at least one subject.');
        const boxes = canvas.getAllByRole('checkbox');
        await expect(boxes.every((b) => b.getAttribute('aria-invalid') === 'true')).toBe(true);
    },
};

export const ReadOnly = {
    render: () => <CheckboxGroup name="cbg-ex-ro" legend="Subjects" options={subjects} defaultValue={['math']} isReadOnly />,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const reading = canvas.getByRole('checkbox', { name: 'Reading' });
        await expect(reading).toHaveAttribute('aria-readonly', 'true');
        await userEvent.click(reading);
        await expect(reading).toHaveAttribute('aria-checked', 'false');
    },
};

export const Disabled = {
    render: () => <CheckboxGroup name="cbg-ex-dis" legend="Subjects" options={subjects} defaultValue={['math']} isDisabled />,
    play: async ({ canvasElement }) => {
        const boxes = within(canvasElement).getAllByRole('checkbox');
        await expect(boxes.every((b) => b.hasAttribute('data-disabled'))).toBe(true);
    },
};

/** Tile state matrix: rest, hovered, selected, focused (ring outside), disabled, invalid, read-only. */
export const TileRest = {
    render: () => <CheckboxGroup name="cbg-tile-rest" legend="Focus areas" appearance="tile" options={tileChoices.slice(0, 2)} />,
    play: async ({ canvasElement }) => {
        const tile = canvasElement.querySelector('.plus-choice-tile');
        await expect(px(getComputedStyle(tile).width)).toBe(224);
        await expect(getComputedStyle(tile).backgroundColor).toBe(tokenColor(canvasElement, '--ds-surface'));
        await expect(getComputedStyle(tile).borderTopColor).toBe(tokenColor(canvasElement, '--ds-border'));
    },
};

export const TileHovered = {
    render: () => <CheckboxGroup name="cbg-tile-hover" legend="Focus areas" appearance="tile" options={tileChoices.slice(0, 2)} />,
    play: async ({ canvasElement }) => {
        const tile = canvasElement.querySelector('.plus-choice-tile');
        tile.style.transition = 'none';
        const hovered = withForcedPseudo(tile, ':hover', () => ({
            backgroundColor: getComputedStyle(tile).backgroundColor,
            borderTopColor: getComputedStyle(tile).borderTopColor,
        }));
        await expect(hovered.backgroundColor).toBe(tokenColor(canvasElement, '--ds-surface-hovered'));
        await expect(hovered.borderTopColor).toBe(tokenColor(canvasElement, '--ds-border-brand'));
    },
};

export const TileSelected = {
    render: () => (
        <CheckboxGroup
            name="cbg-tile-selected"
            legend="Focus areas"
            appearance="tile"
            options={tileChoices.slice(0, 2)}
            defaultValue={['mastering-content']}
        />
    ),
    play: async ({ canvasElement }) => {
        const tile = canvasElement.querySelector('.plus-choice-tile');
        await expect(px(getComputedStyle(tile).borderTopWidth)).toBe(2);
        await expect(getComputedStyle(tile).borderTopColor).toBe(tokenColor(canvasElement, '--ds-border-selected'));
        await expect(getComputedStyle(tile).backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-selected'));
    },
};

export const TileFocused = {
    render: () => (
        <CheckboxGroup
            name="cbg-tile-focus"
            legend="Focus areas"
            appearance="tile"
            options={tileChoices.slice(0, 2)}
            defaultValue={['mastering-content']}
        />
    ),
    play: async ({ canvasElement }) => {
        const box = within(canvasElement).getByRole('checkbox', { name: 'Mastering content' });
        const tile = box.closest('.plus-choice-tile');
        tile.style.transition = 'none';
        box.focus({ focusVisible: true });
        await waitFor(() => expect(getComputedStyle(tile).outlineStyle).toBe('solid'));
        await expect(px(getComputedStyle(tile).outlineWidth)).toBe(2);
        await expect(px(getComputedStyle(tile).outlineOffset)).toBe(2);
        await expect(getComputedStyle(tile).outlineColor).toBe(tokenColor(canvasElement, '--ds-border-focused'));
        box.blur();
    },
};

export const TileInvalid = {
    render: () => (
        <CheckboxGroup
            name="cbg-tile-invalid"
            legend="Focus areas"
            appearance="tile"
            options={tileChoices.slice(0, 2)}
            isRequired
            error="Select at least one focus area."
        />
    ),
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('alert').textContent).toBe('Select at least one focus area.');
        const tile = canvasElement.querySelector('.plus-choice-tile');
        await expect(getComputedStyle(tile).borderTopColor).toBe(tokenColor(canvasElement, '--ds-border-danger'));
    },
};

export const TileReadOnly = {
    render: () => (
        <CheckboxGroup
            name="cbg-tile-readonly"
            legend="Focus areas"
            appearance="tile"
            options={tileChoices.slice(0, 2)}
            defaultValue={['mastering-content']}
            isReadOnly
        />
    ),
    play: async ({ canvasElement }) => {
        const tiles = canvasElement.querySelectorAll('.plus-choice-tile');
        await expect(getComputedStyle(tiles[1]).backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-neutral'));
        await userEvent.click(tiles[1]);
        await expect(within(tiles[1]).getByRole('checkbox', { name: 'Student advocacy' })).toHaveAttribute('aria-checked', 'false');
    },
};

export const TileDisabled = {
    render: () => (
        <CheckboxGroup
            name="cbg-tile-disabled"
            legend="Focus areas"
            appearance="tile"
            options={tileChoices.slice(0, 2)}
            defaultValue={['mastering-content']}
            isDisabled
        />
    ),
    play: async ({ canvasElement }) => {
        const tile = canvasElement.querySelector('.plus-choice-tile');
        await expect(getComputedStyle(tile).backgroundColor).toBe(tokenColor(canvasElement, '--ds-background-disabled'));
        await expect(getComputedStyle(tile).borderTopColor).toBe(tokenColor(canvasElement, '--ds-border-disabled'));
    },
};

export const Interactive = (args) => {
    const [picked, setPicked] = useState([]);
    const activeOptions = args.appearance === 'tile' ? tileChoices : described;
    return (
        <div style={{ maxWidth: 'var(--content-max-width)' }}>
            <CheckboxGroup
                {...args}
                name="cbg-interactive"
                options={activeOptions}
                value={picked}
                onChange={setPicked}
            />
        </div>
    );
};
Interactive.args = {
    legend: 'Which reminders would you like?',
    orientation: 'stacked',
    appearance: 'plain',
    error: '',
    isRequired: false,
    isDisabled: false,
    isReadOnly: false,
};
