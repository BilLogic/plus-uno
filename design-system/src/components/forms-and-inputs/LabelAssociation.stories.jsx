import React from 'react';
import { expect, within } from 'storybook/test';

import DateAndTimePicker from './DateAndTimePicker';
import FileUpload from './FileUpload';
import Input from './Input';
import MultipleChoice from './MultipleChoice';
import NumberInput from './NumberInput';
import Radio from './Radio';
import Rating from './Rating';
import Scale from './RadioButtonGroup';
import TagInput from './TagInput';
import Textarea from './Textarea';

/**
 * Label association across every form component that renders its own label.
 *
 * WHY THIS FILE EXISTS (#206). Eight components rendered `htmlFor={id || name}`
 * while handing only `id` to the control. A caller who passed `name` and no
 * `id` got a label pointing at an id no element carried — a `for` that looks
 * right in the markup and resolves to nothing. Three of them
 * (`DateAndTimePicker`, `Rating`, `TagInput`) never put an id on anything the
 * label could reach, so their labels dangled even when `id` *was* passed.
 *
 * axe's `label` rule only sees half of that: it fires when an `input` ends up
 * with no accessible name, so it catches `Input`, `Textarea` and friends but
 * says nothing about `Rating` or `TagInput`, which render no input at all. The
 * `play` blocks below cover the other half — every `label[for]` in the story
 * has to resolve, and every field has to be reachable by its visible label.
 *
 * #225 added the hidden-label case, which is the same defect one step earlier:
 * `DateAndTimePicker`'s `showLabel={false}` used to skip rendering the label at
 * all, so there was no `for` to dangle and no name to check — the field simply
 * had none. Its story asserts names rather than `for` targets, which is the only
 * form of the question that survives a label that is not there.
 *
 * #222 added the radio case, which resolves and is still wrong: radios in a
 * group share a `name`, so `id={id || name}` gave every option in the group the
 * *same* id. Nothing dangles — N controls claim one id and every label in the
 * group lands on whichever the browser reached first — so a story here has to
 * check that the ids are distinct as well as that they exist.
 */

/** Fails with the list of dangling `for` values, which is the useful message. */
async function expectNoDanglingLabels(canvasElement) {
    const doc = canvasElement.ownerDocument;
    const dangling = Array.from(canvasElement.querySelectorAll('label[for]'))
        .map((label) => label.getAttribute('for'))
        .filter((target) => !doc.getElementById(target));
    await expect(dangling).toEqual([]);
}

const stack = { display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '640px' };

const reminderOptions = [
    { value: 'email', label: 'Email' },
    { value: 'sms', label: 'Text message' },
];

const scaleOptions = [
    { value: 1, label: '1' },
    { value: 2, label: '2' },
    { value: 3, label: '3' },
];

export default {
    title: 'Components/Forms and inputs/Label association',
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Regression cover for #206: every form component that renders its own '
                    + 'label must associate that label with something real, whether the caller '
                    + 'passes `id`, `name`, both, or neither.',
            },
        },
    },
};

/**
 * The case that was broken: `name` given, `id` omitted. Every label here used
 * to point at the `name` string, which no element carried.
 */
export const NameWithoutId = () => (
    <div style={stack}>
        <Input name="email" label="Email address" placeholder="you@example.com" />
        <Textarea name="message" label="Message" placeholder="Say something" />
        <NumberInput name="quantity" label="Quantity" />
        <FileUpload name="transcript" label="Transcript" />
        <DateAndTimePicker name="starts" label="Session start" />
        <Scale name="confidence" label="Confidence" options={scaleOptions} />
        <Rating name="overall" label="Overall rating" value={3} />
        <TagInput name="topics" label="Topics" tags={['Algebra', 'Geometry']} />
    </div>
);

NameWithoutId.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectNoDanglingLabels(canvasElement);

    // Single-control fields: the visible label has to name the control itself.
    await expect(canvas.getByLabelText('Email address').tagName).toBe('INPUT');
    await expect(canvas.getByLabelText('Message').tagName).toBe('TEXTAREA');
    await expect(canvas.getByLabelText('Quantity').tagName).toBe('INPUT');
    await expect(canvas.getByLabelText('Transcript').getAttribute('type')).toBe('file');

    // Composite fields: one label over several controls is a group label.
    const dateTime = canvas.getByRole('group', { name: /Session start/ });
    await expect(within(dateTime).getAllByLabelText(/Session start/)).toHaveLength(2);
    canvas.getByRole('radiogroup', { name: /Confidence/ });
    canvas.getByRole('group', { name: /Overall rating/ });
    canvas.getByRole('group', { name: /Topics/ });
};

/**
 * A radio group as the docs show it: one shared `name`, no `id` anywhere (#222).
 * Every option used to derive the same id from that `name`, so all three labels
 * pointed at the first radio and clicking any of them selected it.
 */
export const RadioGroupWithoutIds = () => (
    <div style={stack}>
        <Radio name="cadence" label="Every session" value="every" defaultChecked />
        <Radio name="cadence" label="Every other session" value="alternate" />
        <Radio name="cadence" label="Once a month" value="monthly" />
        <MultipleChoice name="reminder" options={reminderOptions} />
    </div>
);

RadioGroupWithoutIds.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectNoDanglingLabels(canvasElement);

    const radios = Array.from(canvasElement.querySelectorAll('input[type="radio"]'));
    await expect(radios).toHaveLength(5);

    // The half a dangling-`for` check cannot see: every option carries an id,
    // and no two options carry the same one.
    const ids = radios.map((radio) => radio.id);
    await expect(ids.filter(Boolean)).toHaveLength(radios.length);
    await expect(new Set(ids).size).toBe(radios.length);

    // So each label reaches its own option rather than the first in the group.
    for (const [text, value] of [
        ['Every session', 'every'],
        ['Every other session', 'alternate'],
        ['Once a month', 'monthly'],
        ['Email', 'email'],
        ['Text message', 'sms'],
    ]) {
        const radio = canvas.getByLabelText(text);
        await expect(radio.getAttribute('type')).toBe('radio');
        await expect(radio.value).toBe(value);
    }
};

/**
 * `showLabel={false}` on the two components that offer it. The label is clipped,
 * not dropped: #213 settled that for `Input`, #225 for `DateAndTimePicker`,
 * whose `showLabel` used to feed `hasLabel` and so took the name away along with
 * the pixels — leaving two inputs called "Date" and "Time", which does not say
 * which field.
 *
 * #222 is why the `play` block checks names rather than `for` targets. There,
 * every `label[for]` resolved — to the same element. Here the equivalent failure
 * resolves too: both inputs of a picker have a name, and before the fix it was
 * the same generic one on every picker on the page.
 */
export const HiddenLabels = () => (
    <div style={stack}>
        <Input id="hl-email" name="email" label="Email address" showLabel={false} />
        <DateAndTimePicker id="hl-starts" name="starts" label="Session start" showLabel={false} />
        <DateAndTimePicker
            id="hl-ends"
            name="ends"
            label="Session end"
            showLabel={false}
            showDate={false}
            showSectionLabels={false}
        />
    </div>
);

HiddenLabels.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectNoDanglingLabels(canvasElement);

    // Every text control in the story, and the one name each must answer to.
    // `getByRole` throws on a second match, so this fails both when a name is
    // missing and when two controls share one.
    const named = [
        'Email address',
        'Session start Date',
        'Session start Time',
        'Session end',
    ].map((name) => canvas.getByRole('textbox', { name }));

    await expect(new Set(named).size).toBe(named.length);
    // No control left over with some other name — "Date", say, or nothing.
    await expect(canvas.getAllByRole('textbox')).toHaveLength(named.length);

    // And none of those names is on screen: `showLabel` moves pixels only, so
    // all three field labels are rendered and all three are clipped to nothing.
    const labels = Array.from(canvasElement.querySelectorAll('label'));
    await expect(labels).toHaveLength(3);
    for (const label of labels) {
        await expect(label.getBoundingClientRect().width).toBeLessThanOrEqual(1);
    }
};

/**
 * The other half of naming a field: pointing it at text the component did not
 * render (#230).
 *
 * `DateAndTimePicker` destructured `...props` and never spread it, so a caller
 * wiring up validation wrote `aria-describedby={errorId}` and got nothing — no
 * React warning, no `propTypes` warning, no attribute. It now forwards to the
 * wrapper, which is the same element that carries `role="group"` and the field's
 * name, and the `play` block below is what says so.
 *
 * #222 decides what this asserts. The proxy questions are all green on the
 * broken component: the error paragraph is in the document either way, the group
 * exists either way, and the inputs are named either way. The one fact that is
 * false before the fix and true after is the *association* — the group carrying
 * the caller's `aria-describedby`, resolving to the caller's element. So that is
 * what it checks, along with the rule the MDX states about where a forwarded
 * prop lands: on the wrapper, and not on either input.
 */
export const ForwardedProps = () => (
    <div style={stack}>
        <DateAndTimePicker
            name="starts"
            label="Session start"
            validation="invalid"
            aria-describedby="fp-starts-error"
            data-testid="session-start-field"
        />
        {/* The caller's own error text. `validationMessage` renders without an
            id, so it is not something `aria-describedby` can point at — this is
            the escape hatch the Accessibility section documents. */}
        <p id="fp-starts-error">Start time must be in the future.</p>
    </div>
);

ForwardedProps.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const doc = canvasElement.ownerDocument;

    const group = canvas.getByRole('group', { name: 'Session start' });

    // The discriminator. `null` before #230, because the rest object was
    // collected and dropped.
    await expect(group.getAttribute('aria-describedby')).toBe('fp-starts-error');

    // And it resolves — a `for`/`describedby` that points at nothing is #206's
    // defect wearing a different attribute.
    const description = doc.getElementById('fp-starts-error');
    await expect(description).not.toBeNull();
    await expect(description.textContent).toBe('Start time must be in the future.');

    // The stated rule, both halves: forwarded props land on the wrapper, which
    // is the group, and on nothing else. `data-testid` is the non-ARIA case and
    // has to land on the same element, or the rule is two rules.
    await expect(group.getAttribute('data-testid')).toBe('session-start-field');
    await expect(doc.querySelectorAll('[data-testid="session-start-field"]')).toHaveLength(1);

    // Not copied onto the two inputs — "spread onto both and hope" is the thing
    // the rule exists to rule out.
    const inputs = within(group).getAllByRole('textbox');
    await expect(inputs).toHaveLength(2);
    for (const input of inputs) {
        await expect(input.hasAttribute('aria-describedby')).toBe(false);
        await expect(input.hasAttribute('data-testid')).toBe(false);
    }

    // The spread goes last, but the caller passed no `aria-labelledby`, so the
    // generated one still names the group and both inputs still resolve.
    await expectNoDanglingLabels(canvasElement);
    await expect(within(group).getByRole('textbox', { name: 'Session start Date' })).toBeTruthy();
    await expect(within(group).getByRole('textbox', { name: 'Session start Time' })).toBeTruthy();
};

/**
 * The contract the fix must not disturb: a caller who passes `id` keeps the
 * exact ids they passed, on the exact elements they were on before.
 */
export const ExplicitIds = () => (
    <div style={stack}>
        <Input id="la-email" name="email" label="Email address" />
        <Textarea id="la-message" name="message" label="Message" />
        <NumberInput id="la-quantity" name="quantity" label="Quantity" />
        <FileUpload id="la-transcript" name="transcript" label="Transcript" />
        <DateAndTimePicker id="la-starts" name="starts" label="Session start" />
        <Scale id="la-confidence" name="confidence" label="Confidence" options={scaleOptions} />
        <Rating id="la-overall" name="overall" label="Overall rating" value={3} />
        <TagInput id="la-topics" name="topics" label="Topics" tags={['Algebra']} />
        <Radio id="la-cadence" name="cadence" label="Every session" value="every" />
        <MultipleChoice id="la-reminder" name="reminder" options={reminderOptions} />
    </div>
);

ExplicitIds.play = async ({ canvasElement }) => {
    const doc = canvasElement.ownerDocument;
    await expectNoDanglingLabels(canvasElement);

    // Ids that shipped before #206 and are therefore public surface.
    for (const id of [
        'la-email',
        'la-message',
        'la-quantity',
        'la-transcript',
        'la-starts-date',
        'la-starts-time',
        'la-confidence-option-0',
        'la-topics-container',
        'la-cadence',
        'la-reminder-option-0',
    ]) {
        await expect(doc.getElementById(id)).not.toBeNull();
    }

    // Additive, never a rename: the id the caller passed is on the control.
    await expect(doc.getElementById('la-cadence').getAttribute('type')).toBe('radio');
    await expect(doc.getElementById('la-reminder-option-0').getAttribute('type')).toBe('radio');
};
