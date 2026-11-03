import React from 'react';
import { expect, userEvent, within } from 'storybook/test';

import Accordion from './Accordion/Accordion';

/**
 * What `disabled` on an accordion item actually stops.
 *
 * Originally (#331) `disabled` only added a class whose rule was
 * `pointer-events: none`, which stops a mouse and nothing else — a button
 * under it is still tabbable and Enter still fires its click handler.
 *
 * Base UI's accordion trigger takes the current APG guidance instead: a
 * disabled trigger stays in the tab order (`aria-disabled`, not the native
 * attribute) so a keyboard or screen-reader user can discover that the
 * section exists and is unavailable, rather than having it vanish from the
 * page. Either way, the behavior that matters is the same: a press never
 * opens it.
 */

export default {
    title: 'Components/Layout and structure/Accordion disabled',
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Regression cover for #331: a disabled section never opens for the keyboard '
                    + 'or for the mouse.',
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
    await expect(shut.getAttribute('aria-disabled')).toBe('true');
    await expect(open.getAttribute('aria-disabled')).toBe('false');

    // The disabled trigger stays in the tab order so it can be discovered.
    await userEvent.tab();
    await expect(document.activeElement).toBe(open);
    await userEvent.tab();
    await expect(document.activeElement).toBe(shut);

    // And it stays shut when pressed anyway.
    await userEvent.click(shut, { pointerEventsCheck: 0 });
    await expect(shut.getAttribute('aria-expanded')).toBe('false');

    // The one beside it still works, so this is not "nothing opens".
    await userEvent.click(open);
    await expect(open.getAttribute('aria-expanded')).toBe('true');
};
