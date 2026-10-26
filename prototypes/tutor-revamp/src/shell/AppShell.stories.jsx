import React from 'react';
import { Link } from 'react-router-dom';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import AppShell from './AppShell';
import { ScreenFrame } from '../storyFrame';
import { DARK_WITH_LEGACY, LIGHT } from '../kit/storyModes';

/**
 * AppShell: Frame, Topbar and the tutor sidebar with its open tabs. The play
 * opens a student (a tab appears and is selected) and closes a session tab.
 */
export default {
    title: 'Prototypes/Tutor revamp/Shell',
    component: AppShell,
    parameters: { layout: 'fullscreen' },
    render: () => (
        <ScreenFrame>
            <AppShell breadcrumbs={[{ text: 'Home' }]}>
                <p style={{ gridColumn: '1 / -1', margin: 0 }}>
                    <Link to="/students/morgan-reed">Open Morgan Reed</Link>
                </p>
            </AppShell>
        </ScreenFrame>
    ),
};

export const Light = {
    ...LIGHT,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const nav = canvas.getByRole('navigation', { name: 'Main' });
        const sessions = within(nav).getByRole('list', { name: 'Open Sessions' });
        const sessionTabs = within(sessions).getAllByRole('link').map((a) => a.textContent);
        await expect(sessionTabs).toEqual(['Math 7, today 1:00 pm', 'Algebra I, Thu, Jan 18']);
        await expect(within(nav).getByRole('list', { name: 'Open Students' })).toHaveTextContent('Arlene McCoy');
        await expect(nav.querySelector('[aria-current="page"]')).toHaveTextContent('Home');

        // Opening a student adds its tab, first under Students, and selects it.
        await userEvent.click(canvas.getByRole('link', { name: 'Open Morgan Reed' }));
        await waitFor(() => expect(within(nav).getByRole('link', { name: 'Morgan Reed' })).toHaveAttribute('aria-current', 'page'));
        const students = within(within(nav).getByRole('list', { name: 'Open Students' })).getAllByRole('link');
        await expect(students.map((a) => a.textContent)).toEqual(['Morgan Reed', 'Arlene McCoy']);

        // Closing a tab removes it.
        within(nav).getByRole('link', { name: 'Algebra I, Thu, Jan 18' }).focus(); // focus shows the hover actions, as hover does
        await userEvent.click(within(nav).getByRole('button', { name: 'Close Algebra I, Thu, Jan 18' }));
        await waitFor(() => expect(within(nav).queryByRole('link', { name: 'Algebra I, Thu, Jan 18' })).toBeNull());
    },
};

export const Dark = { ...DARK_WITH_LEGACY };
