import React from 'react';
import Modal from '../../../../components/Modal';
import Button from '../../../../components/Button';
import Select from '../../../../forms/Select';

export default {
    title: 'Specs/Toolkit/In-Session/Modals/Add Modal',
    component: Modal,
    parameters: {
        layout: 'centered',
    },
};

const tutorOptions = [
    { value: 'savannah', label: 'Savannah Nguyen' },
    { value: 'marcus', label: 'Marcus Lee' },
    { value: 'lila', label: 'Lila Chen' },
    { value: 'ethan', label: 'Ethan Kim' },
    { value: 'maya', label: 'Maya Thompson' },
];

const studentOptions = [
    { value: 'sophie', label: 'Sophie Zhang' },
    { value: 'noah', label: 'Noah Kim' },
    { value: 'isabella', label: 'Isabella Roy' },
    { value: 'oliver', label: 'Oliver Park' },
    { value: 'emma', label: 'Emma Davis' },
];

/**
 * Add Tutor
 *
 * Modal for adding a tutor who is present for today's session
 * but not on the regular roster. Uses a searchable select component.
 */
export const AddTutor = () => (
    <Modal
        width={332}
        showBottomButtons={false}
        onClose={() => {}}
        body={
            <div
                className="d-flex flex-column"
                style={{
                    gap: 'var(--size-modal-gap-sm)',
                    backgroundColor: 'var(--color-surface-container-high)',
                    padding: 'var(--size-modal-pad-y-sm) var(--size-modal-pad-x-sm)',
                    borderRadius: 'var(--size-modal-radius-md)',
                }}
            >
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center">
                    <span className="h5" style={{ margin: 0, color: 'var(--color-on-surface)' }}>
                        Add Tutor
                    </span>
                    <i
                        className="fa-solid fa-xmark"
                        style={{
                            fontSize: 'var(--font-size-fa-h3-solid)',
                            lineHeight: 'var(--font-line-height-fa-h3-solid)',
                            color: 'var(--color-on-surface-variant)',
                            cursor: 'pointer',
                        }}
                    />
                </div>

                {/* Divider */}
                <div style={{ height: '1px', backgroundColor: 'var(--color-outline)', opacity: 0.1 }} />

                {/* Body */}
                <div
                    className="d-flex flex-column"
                    style={{ gap: 'var(--size-modal-gap-md)' }}
                >
                    <span
                        className="body3-txt font-weight-light"
                        style={{ color: 'var(--color-on-surface)' }}
                    >
                        Add a tutor who is present for today's session but not on the regular roster.
                    </span>

                    <div
                        className="d-flex flex-column"
                        style={{ gap: 'var(--size-spacing-small-space-025)' }}
                    >
                        <div
                            className="d-inline-flex"
                            style={{ gap: 'var(--size-spacing-small-space-025)' }}
                        >
                            <span
                                className="body3-txt font-weight-semibold"
                                style={{ color: 'var(--color-on-surface)' }}
                            >
                                Tutor name
                            </span>
                            <span
                                className="body3-txt font-weight-light"
                                style={{ color: 'var(--color-danger)' }}
                            >
                                *
                            </span>
                        </div>
                        <Select
                            options={tutorOptions}
                            placeholder="Enter tutor name"
                            searchable
                            size="medium"
                        />
                    </div>
                </div>

                {/* Divider */}
                <div style={{ height: '1px', backgroundColor: 'var(--color-outline)', opacity: 0.1 }} />

                {/* Footer */}
                <div className="d-flex justify-content-end">
                    <Button text="Add tutor" style="primary" fill="filled" size="small" onClick={() => {}} />
                </div>
            </div>
        }
    />
);

/**
 * Add Student
 *
 * Modal for adding a student who is present for today's session
 * but not on the regular roster. Uses a searchable and creatable select component.
 */
export const AddStudent = () => (
    <Modal
        width={332}
        showBottomButtons={false}
        onClose={() => {}}
        body={
            <div
                className="d-flex flex-column"
                style={{
                    gap: 'var(--size-modal-gap-sm)',
                    backgroundColor: 'var(--color-surface-container-high)',
                    padding: 'var(--size-modal-pad-y-sm) var(--size-modal-pad-x-sm)',
                    borderRadius: 'var(--size-modal-radius-md)',
                }}
            >
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center">
                    <span className="h5" style={{ margin: 0, color: 'var(--color-on-surface)' }}>
                        Add Student
                    </span>
                    <i
                        className="fa-solid fa-xmark"
                        style={{
                            fontSize: 'var(--font-size-fa-h3-solid)',
                            lineHeight: 'var(--font-line-height-fa-h3-solid)',
                            color: 'var(--color-on-surface-variant)',
                            cursor: 'pointer',
                        }}
                    />
                </div>

                {/* Divider */}
                <div style={{ height: '1px', backgroundColor: 'var(--color-outline)', opacity: 0.1 }} />

                {/* Body */}
                <div
                    className="d-flex flex-column"
                    style={{ gap: 'var(--size-modal-gap-md)' }}
                >
                    <span
                        className="body3-txt font-weight-light"
                        style={{ color: 'var(--color-on-surface)' }}
                    >
                        Add a student who is present for today's session but not on the regular roster.
                    </span>

                    <div
                        className="d-flex flex-column"
                        style={{ gap: 'var(--size-spacing-small-space-025)' }}
                    >
                        <div
                            className="d-inline-flex"
                            style={{ gap: 'var(--size-spacing-small-space-025)' }}
                        >
                            <span
                                className="body3-txt font-weight-semibold"
                                style={{ color: 'var(--color-on-surface)' }}
                            >
                                Student name
                            </span>
                            <span
                                className="body3-txt font-weight-light"
                                style={{ color: 'var(--color-danger)' }}
                            >
                                *
                            </span>
                        </div>
                        <Select
                            options={studentOptions}
                            placeholder="Enter student name"
                            searchable
                            creatable
                            size="medium"
                        />
                    </div>
                </div>

                {/* Divider */}
                <div style={{ height: '1px', backgroundColor: 'var(--color-outline)', opacity: 0.1 }} />

                {/* Footer */}
                <div className="d-flex justify-content-end">
                    <Button text="Add Student" style="primary" fill="filled" size="small" onClick={() => {}} />
                </div>
            </div>
        }
    />
);
