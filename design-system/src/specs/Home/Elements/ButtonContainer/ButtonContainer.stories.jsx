import React, { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { ButtonContainer } from './ButtonContainer';

export default {
    title: 'Specs/Home/Elements/Button Container',
    tags: ['!dev', '!autodocs'],
    component: ButtonContainer,
    parameters: {
        layout: 'centered',
    },
};

const sessions = [
    { value: 'jackson-0905', label: 'Jackson, 9:05 am - 9:55 am, 10/13/2023' },
    { value: 'sarah-1000', label: 'Sarah, 10:00 am - 10:50 am, 10/13/2023' },
];

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-lg)' }}>
        <ButtonContainer enabled sessions={sessions} selectedSession="jackson-0905" />
        <ButtonContainer enabled={false} sessions={sessions} />
    </div>
);

/** Pick a session, then join it: the button waits for a pick. */
export const Interactive = () => {
    const [session, setSession] = useState('');
    return (
        <div style={{ minHeight: '240px' }}>
            <ButtonContainer
                enabled={Boolean(session)}
                sessions={sessions}
                selectedSession={session}
                onSelectChange={setSession}
            />
        </div>
    );
};

Interactive.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const join = canvas.getByRole('button', { name: /Join session/ });
    await expect(join).toBeDisabled();

    await userEvent.click(canvas.getByRole('combobox', { name: 'Session' }));
    await userEvent.click(await within(document.body).findByRole('option', { name: /^Sarah/ }));
    await expect(canvas.getByRole('combobox', { name: 'Session' })).toHaveTextContent('Sarah');
    await expect(canvas.getByRole('button', { name: /Join session/ })).toBeEnabled();
};
