import React, { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { AttendanceDropdown } from './AttendanceDropdown.jsx';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/In-Session/Elements/Attendance Dropdown',
    component: AttendanceDropdown,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'Attendance picker: a small single Select over Joined and Did not join. The field takes the colour of the status picked.'
            }
        }
    }
};

export const Default = () => {
    const [status, setStatus] = useState('unknown');
    return (
        <div className="d-flex flex-column" style={{ gap: 'var(--size-element-gap-md)', minHeight: '160px' }}>
            <AttendanceDropdown onStatusChange={setStatus} />
            <p className="body3-txt">Attendance: <strong data-testid="applied">{status}</strong></p>
        </div>
    );
};

Default.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox', { name: 'Attendance' });

    await userEvent.click(field);
    await userEvent.click(await within(document.body).findByRole('option', { name: 'Joined' }));

    await expect(canvas.getByTestId('applied')).toHaveTextContent('present');
    await expect(field).toHaveTextContent('Joined');
    await expect(field.closest('.status-select')).toHaveClass('status-select--success');
};
