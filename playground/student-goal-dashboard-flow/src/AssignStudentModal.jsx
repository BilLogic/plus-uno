import React, { useState } from 'react';
import Modal from '@plus-ds/components/Modal';
import Table from '@plus-ds/components/Table';
import Button from '@plus-ds/components/Button';
import Checkbox from '@plus-ds/forms/Checkbox';

const AssignStudentModal = ({ isOpen, onClose, targetItem }) => {
    // Mock students data
    const mockStudents = [
        { id: 1, name: 'Alice Smith', grade: '9th Grade', status: 'Available' },
        { id: 2, name: 'Bobby Tables', grade: '8th Grade', status: 'Available' },
        { id: 3, name: 'Charlie Doe', grade: '9th Grade', status: 'Assigned' },
        { id: 4, name: 'Diana Prince', grade: '10th Grade', status: 'Available' },
        { id: 5, name: 'Evan Wright', grade: '9th Grade', status: 'Available' },
    ];

    const [selectedStudents, setSelectedStudents] = useState([]);

    const handleSelect = (id) => {
        if (selectedStudents.includes(id)) {
            setSelectedStudents(selectedStudents.filter(sId => sId !== id));
        } else {
            setSelectedStudents([...selectedStudents, id]);
        }
    };

    const headers = [
        { text: 'Select', width: '10%' },
        { text: 'Student Name', width: '40%' },
        { text: 'Grade', width: '25%' },
        { text: 'Status', width: '25%' }
    ];

    const rows = mockStudents.map(student => [
        <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Checkbox
                checked={selectedStudents.includes(student.id)}
                onChange={() => handleSelect(student.id)}
            />
        </div>,
        student.name,
        student.grade,
        student.status
    ]);

    return (
        <Modal
            show={isOpen}
            onClose={onClose}
            title="Assign Students"
            size="lg"
            primaryButton={{
                text: 'Assign Selected',
                onClick: () => {
                    console.log('Assigned students:', selectedStudents, 'to', targetItem);
                    onClose();
                }
            }}
            secondaryButton={{
                text: 'Cancel',
                onClick: onClose,
                fill: 'outline'
            }}
        >
            <div style={{ padding: '0 var(--size-element-pad-x-md) var(--size-element-pad-y-md) var(--size-element-pad-x-md)' }}>
                <p style={{ marginBottom: 'var(--size-element-gap-md)', color: 'var(--color-on-surface-variant)' }}>
                    Select students to assign.
                </p>
                <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--color-outline-variant)' }}>
                    <Table
                        headers={headers}
                        rows={rows}
                        hover={true}
                        onRowClick={(rowIndex) => handleSelect(mockStudents[rowIndex].id)}
                        style={{ cursor: 'pointer' }}
                    />
                </div>
            </div>
        </Modal>
    );
};

export default AssignStudentModal;
