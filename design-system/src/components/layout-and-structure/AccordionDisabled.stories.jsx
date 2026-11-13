import { settleAnimations } from '@/storybook-docs/lib/overlay-motion-plays';
import React from 'react';
import { expect, userEvent, within } from 'storybook/test';

import { Accordion } from '@/components';
/**
 * What `disabled` on an accordion item actually stops.
 *
 * Originally (#331) `disabled` only added a class whose rule was
 * `pointer-events: none`, which stops a mouse and nothing else — a button
 * under it is still tabbable and Enter still fires its click handler.
 *
 * A disabled trigger is a real disabled button: it leaves the tab order and a
 * press never opens it. The reason an item is unavailable is visible text in
 * or beside it, never a tooltip on the disabled header.
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
    await expect(shut).toBeDisabled();
    await expect(open).not.toBeDisabled();

    // The disabled trigger leaves the tab order.
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
    await settleAnimations(canvasElement);
};
