import React from 'react';
import { expect, userEvent, within } from 'storybook/test';

import Accordion from './Accordion/Accordion';

/**
 * What `disabled` on an accordion item actually stops.
 *
 * WHY THIS FILE EXISTS (#331). The prop added a class whose rule is
 * `pointer-events: none` and never became a `disabled` attribute. Measured in
 * chromium: a button under `pointer-events: none` is still in the tab order and
 * Enter still fires its click handler. So a section marked unavailable opened
 * for anyone using a keyboard — the mouse was stopped and nobody else was.
 *
 * That is the worst shape a disabled control can take, because it reads as
 * handled: it is greyed out, the mouse does nothing, and the defect is only
 * visible to someone who tabs to it and presses Enter.
 *
 * axe cannot see it either. `aria-disabled` was not set and no rule says "this
 * greyed-out button should be disabled" — the class is styling, and styling is
 * not a contract.
 */

export default {
    title: 'Components/Layout and structure/Accordion disabled',
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Regression cover for #331: a disabled section is disabled for the keyboard '
                    + 'as well as for the mouse.',
            },
        },
    },
};

export const DisabledSectionsStayShut = () => (
    <div style={{ maxWidth: '520px' }}>
        <Accordion>
            <Accordion.Item eventKey="0" header="Available">
                <p>Anyone can open this one.</p>
            </Accordion.Item>
            <Accordion.Item eventKey="1" header="Unavailable" disabled>
                <p data-testid="ad-secret">Nobody should reach this.</p>
            </Accordion.Item>
        </Accordion>
    </div>
);

DisabledSectionsStayShut.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const open = canvas.getByRole('button', { name: 'Available' });
    const shut = canvas.getByRole('button', { name: 'Unavailable' });

    // The discriminator: a real attribute, not a class.
    await expect(shut.disabled).toBe(true);
    await expect(open.disabled).toBe(false);

    // Tab reaches the first header and skips the disabled one entirely —
    // a disabled button is not in the tab order, which is the whole point.
    await userEvent.tab();
    await expect(document.activeElement).toBe(open);
    await userEvent.tab();
    await expect(document.activeElement).not.toBe(shut);

    // And it stays shut when pressed anyway.
    await userEvent.click(shut, { pointerEventsCheck: 0 });
    await expect(shut.getAttribute('aria-expanded')).toBe('false');

    // The one beside it still works, so this is not "nothing opens".
    await userEvent.click(open);
    await expect(open.getAttribute('aria-expanded')).toBe('true');
};
