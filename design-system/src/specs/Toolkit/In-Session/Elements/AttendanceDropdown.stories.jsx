import { AttendanceDropdown } from './AttendanceDropdown.jsx';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/In-Session/Elements/Attendance Dropdown',
    component: AttendanceDropdown,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Interactive Attendance Dropdown composed of the Toolkit "Attendance Badge" and "Attendance List Items".'
            }
        }
    }
};

export const Default = () => {
    return (
        <AttendanceDropdown />
    );
};
