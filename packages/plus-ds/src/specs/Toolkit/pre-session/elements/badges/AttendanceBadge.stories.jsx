import React from 'react';
import Badge from '../../../../../components/Badge/Badge';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/Badges/Attendance Badge',
    component: Badge,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Attendance status badges used to indicate student attendance: "Joined" (Present), "Did not join" (Absent), or "Select" (Unknown).'
            }
        }
    },
    argTypes: {
        text: { control: 'text' },
        style: {
            control: 'select',
            options: ['success', 'danger', 'secondary'],
            description: 'Green for Joined, Red for Absent, Grey for Unknown.'
        },
        size: {
            control: 'select',
            options: ['b3'],
            description: 'Attendance badges use "b3" (12px) size.'
        }
    },
};

import { AttendanceBadge } from './AttendanceBadge.jsx';

const caretIcon = <i className="fa-solid fa-caret-down"></i>;

// Reusable component for other stories already exported from AttendanceBadge.jsx


export const Present = {
    args: {
        text: 'Joined',
        style: 'success',
        size: 'b3',
        trailingVisual: caretIcon,
        className: 'fw-normal',
    },
};

export const Absent = {
    args: {
        text: 'Did not join',
        style: 'danger',
        size: 'b3',
        trailingVisual: caretIcon,
        className: 'fw-normal',
    },
};

export const Unknown = {
    args: {
        text: 'Select',
        style: 'secondary',
        size: 'b3',
        trailingVisual: caretIcon,
        className: 'fw-normal',
    },
};

export const NA = {
    args: {
        text: 'N/A',
        style: 'secondary',
        size: 'b3',
        trailingVisual: caretIcon,
        className: 'fw-normal',
    },
};

export const PresentStatic = {
    args: {
        text: 'Joined',
        style: 'success',
        size: 'b3',
        className: 'fw-normal',
    },
};

export const AbsentStatic = {
    args: {
        text: 'Did not join',
        style: 'danger',
        size: 'b3',
        className: 'fw-normal',
    },
};

export const UnknownStatic = {
    args: {
        text: 'Select',
        style: 'secondary',
        size: 'b3',
        className: 'fw-normal',
    },
};

export const NAStatic = {
    args: {
        text: 'N/A',
        style: 'secondary',
        size: 'b3',
        className: 'fw-normal',
    },
};
