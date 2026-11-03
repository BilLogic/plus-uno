import React from 'react';
import StatusTag from '@/components/labels/StatusTag';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/In-Session/Elements/Badges/Attendance Badge',
    component: StatusTag,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Attendance status badges used to indicate student attendance: "Joined" (Present), "Did not join" (Absent), or "Select" (Unknown).'
            }
        }
    },
    argTypes: {
        children: { control: 'text' },
        appearance: {
            control: 'select',
            options: ['success', 'danger', 'neutral'],
            description: 'Green for Joined, Red for Absent, Gray for Unknown.'
        },
    },
};

import { AttendanceBadge } from './AttendanceBadge.jsx';


// Reusable component for other stories already exported from AttendanceBadge.jsx


export const Present = {
    args: {
        children: 'Joined',
        appearance: 'success',
    },
};

export const Absent = {
    args: {
        children: 'Did not join',
        appearance: 'danger',
    },
};

export const Unknown = {
    args: {
        children: 'Select',
        appearance: 'neutral',
    },
};

export const NA = {
    args: {
        children: 'N/A',
        appearance: 'neutral',
    },
};

export const PresentStatic = {
    args: {
        children: 'Joined',
        appearance: 'success',
    },
};

export const AbsentStatic = {
    args: {
        children: 'Did not join',
        appearance: 'danger',
    },
};

export const UnknownStatic = {
    args: {
        children: 'Select',
        appearance: 'neutral',
    },
};

export const NAStatic = {
    args: {
        children: 'N/A',
        appearance: 'neutral',
    },
};
