import React from 'react';
import HomeHero from './HomeHero';

export default {
    title: 'Specs/Home/Sections/Home Hero',
    component: HomeHero,
    tags: ['!dev', '!autodocs'],
};

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <HomeHero activeTab="sign-up" />
        <HomeHero activeTab="session" />
        <HomeHero activeTab="reflection" />
    </div>
);

export const SignUp = {
    args: {
        activeTab: 'sign-up',
        tutorName: 'John Doe',
        onSignUp: () => console.log('Sign up clicked'),
        onViewSchedule: () => console.log('View schedule clicked'),
    },
};

export const Session = {
    args: {
        activeTab: 'session',
        tutorName: 'John Doe',
        sessionLinks: [
            {
                id: '1',
                studentName: 'Jackson',
                time: '9:05 am - 9:55 am',
                date: '10/13/2023'
            },
            {
                id: '2',
                studentName: 'Sarah',
                time: '10:00 am - 10:50 am',
                date: '10/13/2023'
            }
        ],
        selectedSession: '1',
        onSessionSelect: (value) => console.log('Session selected:', value),
        onJoinSession: () => console.log('Join session clicked'),
    },
};

export const Reflection = {
    args: {
        activeTab: 'reflection',
        tutorName: 'John Doe',
        onSubmitReflection: () => console.log('Submit reflection clicked'),
    },
};

