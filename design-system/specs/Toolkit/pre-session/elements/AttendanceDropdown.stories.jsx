import { AttendanceDropdown } from './AttendanceDropdown.jsx';

export default {
    title: 'Specs/Toolkit/Pre-Session/Elements/Attendance Dropdown',
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
