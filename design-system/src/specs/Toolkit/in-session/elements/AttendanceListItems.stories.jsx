import React from 'react';
import Dropdown from '../../../../components/Dropdown/Dropdown';

export default {
    title: 'Specs/Toolkit/In-Session/Elements/Attendance List Items',
    component: Dropdown,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'The menu list items used within the Attendance Badge dropdown.'
            }
        }
    },
    argTypes: {
        isOpen: { control: 'boolean', description: 'Force open state' },
        items: { control: 'object' }
    }
};

import { AttendanceListItems } from './AttendanceListItems.jsx';

// Story Template wrapper to provide the Dropdown Menu container context for visual verification
const Template = (args) => (
    <div className="pdropdown">
        <div className="dropdown-menu show" style={{ position: 'static', display: 'block', width: '200px' }}>
            <AttendanceListItems {...args} />
        </div>
    </div>
);

export const Unfilled = Template.bind({});
Unfilled.args = {
    status: 'unknown'
};

export const Filled = Template.bind({});
Filled.args = {
    status: 'present'
};
