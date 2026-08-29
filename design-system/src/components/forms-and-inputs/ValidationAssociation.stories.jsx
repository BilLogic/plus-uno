import React from 'react';
import { expect, within } from 'storybook/test';

import DateAndTimePicker from './DateAndTimePicker';
import FileUpload from './FileUpload';
import Input from './Input';
import NumberInput from './NumberInput';

/**
 * Pointing a field at the reason it was rejected.
 *
 * WHY THIS FILE EXISTS (#327). Four components render a validation message and
 * none of them attached it to anything. The message was a `div` of text after
 * the control, with no id, so nothing could refer to it — and the control
 * carried no `aria-invalid`, so nothing said it had been rejected either. A
 * screen-reader user heard the field's name, heard no error, and had no way to
 * find out why the form would not submit. The red border was the whole message.
 *
 * This is #206's defect one attribute along. That issue was about the label
 * resolving to the field; this one is about the DESCRIPTION resolving to it.
 * Both are "the markup looks right and the association is not there", and
 * neither is visible in a screenshot.
 *
 * axe cannot catch it. There is no rule that says "this text near this input
 * ought to be its description" — that is a judgement about meaning, and the
 * component is the only place that knows the two belong together.
 *
 * The composing case is asserted separately because it is where a naive fix
 * breaks: a caller who already points the field at their own help text must not
 * lose it when validation appears, and must not lose the error either. Both ids
 * are present, in reading order, and both resolve.
 */

const stack = { display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '520px' };

export default {
    title: 'Components/Forms and inputs/Validation association',
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Regression cover for #327: a validation message is something the field '
                    + 'points at, not text that happens to sit near it.',
            },
        },
    },
};

/** Fails with the list of ids that point at nothing, which is the useful message. */
async function expectDescriptionResolves(canvasElement, control, expectedText) {
    const doc = canvasElement.ownerDocument;
    const ids = (control.getAttribute('aria-describedby') || '').split(' ').filter(Boolean);
    await expect(ids.length).toBeGreaterThan(0);

    const dangling = ids.filter((id) => !doc.getElementById(id));
    await expect(dangling).toEqual([]);

    const described = ids.map((id) => doc.getElementById(id).textContent).join(' ');
    await expect(described).toContain(expectedText);
}

export const InvalidFieldsPointAtTheirMessage = () => (
    <div style={stack}>
        <Input
            id="va-email"
            label="Email address"
            validation="invalid"
            validationMessage="Use the address your school gave you."
        />
        <NumberInput
            id="va-sessions"
            label="Sessions"
            validation="invalid"
            validationMessage="Ten sessions is the maximum."
        />
        <FileUpload
            id="va-report"
            label="Report"
            description="PDF, up to 10 MB."
            validation="invalid"
            validationMessage="That file was larger than 10 MB."
        />
        <DateAndTimePicker
            id="va-starts"
            name="starts"
            label="Session start"
            validation="invalid"
            validationMessage="Start time must be in the future."
        />
    </div>
);

InvalidFieldsPointAtTheirMessage.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const email = canvas.getByRole('textbox', { name: 'Email address' });
    await expectDescriptionResolves(canvasElement, email, 'Use the address your school gave you.');
    await expect(email.getAttribute('aria-invalid')).toBe('true');

    const sessions = canvas.getByRole('textbox', { name: 'Sessions' });
    await expectDescriptionResolves(canvasElement, sessions, 'Ten sessions is the maximum.');
    await expect(sessions.getAttribute('aria-invalid')).toBe('true');

    // The file input carries BOTH: the standing format rule and the result.
    const report = canvasElement.querySelector('#va-report');
    await expectDescriptionResolves(canvasElement, report, 'PDF, up to 10 MB.');
    await expectDescriptionResolves(canvasElement, report, 'That file was larger than 10 MB.');
    await expect(report.getAttribute('aria-invalid')).toBe('true');

    // The picker describes the GROUP, which is the field — not either input.
    const group = canvas.getByRole('group', { name: /Session start/ });
    await expectDescriptionResolves(canvasElement, group, 'Start time must be in the future.');
};

/**
 * A valid field describes nothing and claims nothing.
 *
 * `aria-invalid="false"` on every untouched field is noise; the attribute is
 * absent instead, which is what "no opinion" looks like.
 */
export const ValidFieldsSayNothing = () => (
    <div style={stack}>
        <Input id="va-quiet" label="Full name" />
        <Input
            id="va-good"
            label="Postcode"
            validation="success"
            validationMessage="That looks right."
        />
    </div>
);

ValidFieldsSayNothing.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const quiet = canvas.getByRole('textbox', { name: 'Full name' });
    await expect(quiet.hasAttribute('aria-describedby')).toBe(false);
    await expect(quiet.hasAttribute('aria-invalid')).toBe(false);

    // A success message is still a description — it just is not an error.
    const good = canvas.getByRole('textbox', { name: 'Postcode' });
    await expectDescriptionResolves(canvasElement, good, 'That looks right.');
    await expect(good.hasAttribute('aria-invalid')).toBe(false);
};

/**
 * The caller's own description survives, and so does ours.
 */
export const CallerDescriptionIsKept = () => (
    <div style={stack}>
        <Input
            id="va-phone"
            label="Phone"
            aria-describedby="va-phone-help"
            validation="invalid"
            validationMessage="That is not a UK number."
        />
        <p id="va-phone-help">Include the area code.</p>
    </div>
);

CallerDescriptionIsKept.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const phone = canvas.getByRole('textbox', { name: 'Phone' });

    const ids = (phone.getAttribute('aria-describedby') || '').split(' ').filter(Boolean);
    await expect(ids).toHaveLength(2);
    // Reading order: the standing help, then what just went wrong.
    await expect(ids[0]).toBe('va-phone-help');

    await expectDescriptionResolves(canvasElement, phone, 'Include the area code.');
    await expectDescriptionResolves(canvasElement, phone, 'That is not a UK number.');
};
