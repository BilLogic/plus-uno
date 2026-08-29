import React, { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';

import Rating from './Rating';

/**
 * Saying which rating is set.
 *
 * WHY THIS FILE EXISTS (#319). `Rating` drew its value and never stated it. The
 * five items were `role="button"` with `aria-label="Rate 1"` … `"Rate 5"`, and
 * selection was the difference between a filled and an outline icon plus a
 * class. Nothing carried `aria-checked`, `aria-pressed` or any other state, so
 * a screen-reader user could set a rating and not hear what it was, and could
 * arrive at an already-rated control and not hear the value at all.
 *
 * No guard the repo had could see it. axe has no rule that says "this row of
 * buttons is really one value"; the render assertions see the class change,
 * which was there and correct; and the component's own stories clicked and
 * looked right. The information existed only as a fill colour, and a colour is
 * exactly what an automated check cannot read a meaning out of.
 *
 * The fix is the model, not an attribute: one value out of five is a
 * `radiogroup` of `radio`s. That brings the keyboard contract with it — ONE tab
 * stop for the group, arrow keys within it — which the five-button version also
 * did not have, and which is why the assertions below check the tab order as
 * well as the state.
 *
 * `disabled` is asserted separately because it used to drop `role`, `tabIndex`
 * and `aria-label` together: a disabled rating was five unlabelled `div`s,
 * invisible rather than unavailable, which is a different failure from the one
 * above and had to be fixed in the same place.
 */

const stack = { display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'flex-start' };

export default {
    title: 'Components/Forms and inputs/Rating selection',
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Interaction cover for #319: a rating has to say which value it holds, '
                    + 'and has to be settable from the keyboard.',
            },
        },
    },
};

/**
 * The state, and the single tab stop that comes with the role.
 *
 * The discriminator is `aria-checked` on exactly one item. Before the fix every
 * item was a button and none of them carried it, so the whole group answered
 * "which one is chosen?" with silence.
 */
export const AnnouncesItsValue = () => {
    const [score, setScore] = useState(3);
    return (
        <div style={stack}>
            <Rating id="rs-value" label="How was the session?" value={score} onChange={setScore} />
        </div>
    );
};

AnnouncesItsValue.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // The group exists, is named by its label, and is a radiogroup rather than
    // a bag of buttons.
    const group = canvas.getByRole('radiogroup', { name: 'How was the session?' });
    await expect(group).toBeTruthy();

    const radios = within(group).getAllByRole('radio');
    await expect(radios).toHaveLength(5);

    // Exactly one checked, and it is the one the value names. `null` on every
    // item is what this looked like before the fix.
    const checked = radios.filter((radio) => radio.getAttribute('aria-checked') === 'true');
    await expect(checked).toHaveLength(1);
    await expect(checked[0].getAttribute('aria-label')).toBe('Rate 3');

    // One tab stop for the group, on the checked item — the roving tabindex.
    // Five stops for one value is what `tabIndex={0}` on every item gave.
    const tabbable = radios.filter((radio) => radio.getAttribute('tabindex') === '0');
    await expect(tabbable).toHaveLength(1);
    await expect(tabbable[0]).toBe(checked[0]);
};

/**
 * The keyboard contract the role promises.
 *
 * A `radiogroup` that cannot be moved through with the arrow keys is a role
 * that lies, which is worse than the buttons were.
 */
export const ArrowKeysMoveTheValue = () => {
    const [score, setScore] = useState(3);
    return (
        <div style={stack}>
            <Rating id="rs-keys" label="Confidence" value={score} onChange={setScore} />
            <p data-testid="rs-keys-value">{score}</p>
        </div>
    );
};

ArrowKeysMoveTheValue.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('radiogroup', { name: 'Confidence' });
    const readout = () => canvas.getByTestId('rs-keys-value').textContent;

    // Tab from the top of the story lands on the group's one tabbable item.
    await userEvent.tab();
    await expect(document.activeElement.getAttribute('aria-label')).toBe('Rate 3');

    await userEvent.keyboard('{ArrowRight}');
    await expect(readout()).toBe('4');

    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    await expect(readout()).toBe('2');

    await userEvent.keyboard('{Home}');
    await expect(readout()).toBe('1');

    // And it does not walk off the end in either direction.
    await userEvent.keyboard('{ArrowLeft}');
    await expect(readout()).toBe('1');

    await userEvent.keyboard('{End}{ArrowRight}');
    await expect(readout()).toBe('5');

    // Focus never left the group while all that happened.
    await expect(group.contains(document.activeElement)).toBe(true);
};

/**
 * Disabled says "not now", and stays a control while it says it.
 *
 * Before the fix `disabled` removed `role`, `tabIndex` and `aria-label` in one
 * conditional, so the five items vanished from the accessibility tree rather
 * than appearing in it as unavailable.
 */
export const DisabledStaysAnnounced = () => (
    <div style={stack}>
        <Rating id="rs-disabled" label="Session rating" value={4} disabled onChange={() => {}} />
    </div>
);

DisabledStaysAnnounced.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('radiogroup', { name: 'Session rating' });

    // Still five radios — the discriminator. `getAllByRole` threw here before.
    const radios = within(group).getAllByRole('radio');
    await expect(radios).toHaveLength(5);

    for (const radio of radios) {
        await expect(radio.getAttribute('aria-disabled')).toBe('true');
        await expect(radio.getAttribute('tabindex')).toBe('-1');
        await expect(radio.getAttribute('aria-label')).toBeTruthy();
    }

    // The value is still readable, which is the point of leaving it announced.
    const checked = radios.filter((radio) => radio.getAttribute('aria-checked') === 'true');
    await expect(checked).toHaveLength(1);
    await expect(checked[0].getAttribute('aria-label')).toBe('Rate 4');
};
