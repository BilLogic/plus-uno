import React from 'react';
import SessionInfo from './SessionInfo';

export default {
    title: 'Specs/Toolkit/Post-Session/Elements/Session Info',
    component: SessionInfo,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Display component for session details (date, time, client, topic) used in post-session screens.'
            }
        }
    },
    tags: ['autodocs'],
    argTypes: {
        date: { control: 'text' },
        time: { control: 'text' },
        clientName: { control: 'text' },
        topic: { control: 'text' },
    }
};

export const Default = {
    args: {
        date: 'Mon, Oct 24, 2026',
        time: '4:00 PM - 5:00 PM',
        clientName: 'Kiera Wintervale',
        topic: 'Calculus I: Limits and Continuity',
    }
};

export const MathSession = {
    args: {
        date: 'Tue, Nov 02, 2026',
        time: '3:30 PM - 4:30 PM',
        clientName: 'Baxter Ellington',
        topic: 'Algebra II: Quadratic Equations',
    }
};

export const EnglishSession = {
    args: {
        date: 'Wed, Nov 03, 2026',
        time: '5:00 PM - 6:00 PM',
        clientName: 'Milo Thorne',
        topic: 'Literature: Macbeth Analysis',
    }
};
