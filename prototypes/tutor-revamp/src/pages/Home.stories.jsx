import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import Home from './Home';
import { ScreenFrame } from '../storyFrame';
import { DARK_WITH_LEGACY, LIGHT } from '../kit/storyModes';

/**
 * Home: the tutor's day at a glance, after the Main board. The play holds the
 * board's copy and states: the greeting, four tiles, the Math 7 card with its
 * prep (items tick and expand) and the locked Join session, the overdue
 * reflection, today's agenda, the students and the picked lesson.
 */
export default {
    title: 'Prototypes/Tutor revamp/Screens/Home',
    component: Home,
    parameters: { layout: 'fullscreen' },
    render: () => (
        <ScreenFrame path="/">
            <Home />
        </ScreenFrame>
    ),
};

export const Light = {
    ...LIGHT,
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const main = canvas.getByRole('main');
        const page = within(main);

        await expect(page.getByRole('heading', { level: 1, name: 'Good afternoon, Boyuan' })).toBeInTheDocument();
        await expect(page.getByText('Monday, January 22')).toBeInTheDocument();

        const glance = page.getByRole('navigation', { name: 'At a glance' });
        const tiles = within(glance).getAllByRole('link').map((a) => a.textContent);
        await expect(tiles).toEqual([
            'Next session1:00 pmMath 7, Lincoln Middle School',
            'Waiting on you2A reflection and a lesson',
            'Math 7 students42 need support this week',
            'Paid hours this week16.8of 20Includes prep and training',
        ]);
        await expect(within(glance).getByRole('meter', { name: '16.8 of 20 paid hours' })).toBeInTheDocument();

        // The Math 7 card: prep items tick and expand; Join waits for 12:45.
        const math = within(page.getByRole('region', { name: 'Math 7' }));
        await expect(math.getByText('Starts in 25 min')).toBeInTheDocument();
        await expect(math.getByRole('checkbox', { name: 'Celebrate Arlene’s fractions streak' })).toBeChecked();
        const warmUp = math.getByRole('checkbox', { name: 'Warm up on unlike denominators' });
        await expect(math.getByText(/Morgan missed 3 of 4 tries/)).toBeVisible();
        await userEvent.click(warmUp);
        await expect(warmUp).toBeChecked();
        const taylor = math.getByRole('button', { name: 'Ask Taylor to explain one step out loud' });
        await userEvent.click(taylor);
        await expect(taylor).toHaveAttribute('aria-expanded', 'true');
        const join = math.getByRole('button', { name: 'Join session' });
        await expect(join).toBeDisabled();
        await expect(join).toHaveAccessibleDescription('Join opens at 12:45 pm');

        // Overdue and today.
        const overdue = within(page.getByRole('region', { name: 'Overdue' }));
        await expect(overdue.getByText('Reflect on Algebra I')).toBeInTheDocument();
        await expect(overdue.getByText('Draft saved')).toBeInTheDocument();
        await expect(overdue.getByRole('link', { name: 'Continue reflection' })).toBeInTheDocument();
        const today = within(page.getByRole('list', { name: 'Today' }));
        await expect(today.getAllByRole('listitem')).toHaveLength(4);
        await expect(page.getByText('1 of 4 done')).toBeInTheDocument();

        // Students: a sparkline and a status per row; the action is in each row.
        const students = within(page.getByRole('region', { name: 'Your students this week' }));
        await expect(students.getAllByRole('img', { name: /practice minutes/ })).toHaveLength(4);
        await expect(students.getByRole('link', { name: 'Open Arlene McCoy' })).toBeInTheDocument();
        await expect(students.getAllByText('On track')).toHaveLength(2);

        // Picked for you.
        const picked = within(page.getByRole('region', { name: 'Picked for you' }));
        await expect(picked.getByText('Supporting a Growth Mindset')).toBeInTheDocument();
        await expect(picked.getByRole('img', { name: '4 of 9 steps' })).toBeInTheDocument();

        // One primary action on the screen.
        await waitFor(() => expect(main.querySelectorAll('.plus-btn--primary.plus-btn--filled').length).toBeLessThanOrEqual(1));
    },
};

export const Dark = { ...DARK_WITH_LEGACY };
