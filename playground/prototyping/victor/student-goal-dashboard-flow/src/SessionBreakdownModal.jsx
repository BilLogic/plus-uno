import React from 'react';
import Modal from '@plus-ds/components/Modal';
import Table from '@plus-ds/components/Table';
import Badge from '@plus-ds/components/Badge';

const SessionBreakdownModal = ({ isOpen, onClose, session, onStudentClick }) => {

    // Mock Data based on Figma
    const studentData = [
        { id: 1, name: 'Amanda Novak', status: 'Needs to set goals', tutor: 'Ethan Cole', tutorType: 'Lead', time: 11 },
        { id: 2, name: 'Ashley Brown', status: 'Needs to set goals', tutor: 'Martha Dunn', tutorType: 'Regular', time: 8 },
        { id: 3, name: 'Frank Bass', status: 'Needs to set goals', tutor: 'Martha Dunn', tutorType: 'Regular', time: 11 },
        { id: 4, name: 'Henry Hamm', status: 'Needs to set goals', tutor: 'Martha Dunn', tutorType: 'Regular', time: 15 },
        { id: 5, name: 'Jose Green', status: 'Needs to set goals', tutor: 'Ethan Cole', tutorType: 'Lead', time: 10 },
        { id: 6, name: 'Miles Hazel', status: 'Needs to set goals', tutor: 'Ethan Cole', tutorType: 'Lead', time: 14 },
        { id: 7, name: 'Olga Petra', status: 'Needs to set goals', tutor: 'Martha Dunn', tutorType: 'Regular', time: 3 },
        { id: 8, name: 'Pete Smith', status: 'Needs to set goals', tutor: 'Martha Dunn', tutorType: 'Regular', time: 4 },
        { id: 9, name: 'Sam Morales', status: 'Needs to set goals', tutor: 'Martha Dunn', tutorType: 'Regular', time: 11 },
    ];

    const headers = [
        { text: 'Student Name ↑', width: '25%' },
        { text: 'Student Status', width: '25%' },
        { text: 'Tutor Name ↑', width: '20%' },
        { text: 'Tutor Type ↑', width: '15%' },
        { text: 'Time Spent (Min)', width: '15%' }
    ];

    const rows = studentData.map(row => [
        <span
            style={{ color: 'var(--color-bg-brand-default)', cursor: 'pointer', fontWeight: 'bold' }}
            onClick={() => onStudentClick(row)}
        >
            {row.name}
        </span>,
        <Badge style="info" fill="tonal">{row.status}</Badge>,
        row.tutor,
        <Badge style="neutral" fill="tonal">{row.tutorType}</Badge>,
        row.time
    ]);

    return (
        <Modal
            show={isOpen}
            onClose={onClose}
            title="11/02/12 Session Breakdown"
            size="lg"
            hideFooter
        >
            <div style={{ padding: '0 var(--size-element-pad-x-md) var(--size-element-pad-y-md) var(--size-element-pad-x-md)' }}>
                <Table
                    headers={headers}
                    rows={rows}
                    hover={false}
                />
            </div>
        </Modal>
    );
};

export default SessionBreakdownModal;
