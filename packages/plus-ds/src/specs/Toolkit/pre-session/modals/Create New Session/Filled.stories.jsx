import React from 'react';
import Modal from '../../../../../components/Modal';
import Select from '../../../../../forms/Select';
import { Label } from '../../../../../forms/LabelAndCaption.stories';
import { SessionDateInput } from '../../elements/NewFormDateInput.stories';
import { SessionTimeInput } from '../../elements/NewFormTimeInput.stories';
import { Stepper } from '../../elements/Steppers.stories';
import { CancelButton, CreateSessionButton } from '../../elements/SupervisorManagementButtons.stories';

export default {
    title: 'Specs/Toolkit/Pre-Session/Modals/Create New Session',
    component: Modal,
    parameters: {
        layout: 'centered',
    },
};

// ─── Dropdown Options ─────────────────────────────────────────

const schoolOptions = [
    { value: 'hogwarts', label: 'Hogwarts' },
    { value: 'school-b', label: 'School B' },
    { value: 'school-c', label: 'School C' },
];

const teacherOptions = [
    { value: 'mr-dumbledore', label: 'Mr. Dumbledore' },
    { value: 'teacher-b', label: 'Teacher B' },
    { value: 'teacher-c', label: 'Teacher C' },
];

const dayOptions = [
    { value: 'mondays', label: 'Mondays' },
    { value: 'tuesdays', label: 'Tuesdays' },
    { value: 'wednesdays', label: 'Wednesdays' },
    { value: 'thursdays', label: 'Thursdays' },
    { value: 'fridays', label: 'Fridays' },
];

// ─── Reusable Field Wrapper ───────────────────────────────────

const FieldWrapper = ({ label, required = true, children }) => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-element-gap-xs)',
            flex: '1 0 0',
            minWidth: 0,
        }}
    >
        <Label text={label} required={required} />
        {children}
    </div>
);

// ─── Stepper Column ───────────────────────────────────────────

const StepperColumn = ({ children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-xs)', flex: 1 }}>
        {children}
    </div>
);

// ─── Modal Body ───────────────────────────────────────────────

const FilledModalBody = () => (
    <div
        className="d-flex flex-column"
        style={{
            gap: 'var(--size-modal-gap-lg)',
            backgroundColor: 'var(--color-surface-container-high)',
            padding: 'var(--size-modal-pad-y-lg) var(--size-modal-pad-x-lg)',
            borderRadius: 'var(--size-modal-radius-lg)',
        }}
    >
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center">
            <h4 className="h4 m-0">Create new session</h4>
            <i
                className="fa-solid fa-xmark"
                style={{
                    fontSize: 'var(--font-size-fa-h4-solid)',
                    color: 'var(--color-on-surface-variant)',
                    cursor: 'pointer',
                }}
            />
        </div>

        {/* Components Section - all components use modal-gap-md between them */}
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-modal-gap-md)',
            }}
        >
            {/* Row 1: School, Teacher, Days dropdowns — all pre-filled */}
            <div
                style={{
                    display: 'flex',
                    gap: 'var(--size-modal-gap-md)',
                    alignItems: 'flex-start',
                    width: '100%',
                }}
            >
                <FieldWrapper label="School">
                    <Select
                        options={schoolOptions}
                        defaultValue="hogwarts"
                        placeholder="Select a school"
                        mode="single"
                        searchable
                    />
                </FieldWrapper>
                <FieldWrapper label="Teacher">
                    <Select
                        options={teacherOptions}
                        defaultValue="mr-dumbledore"
                        placeholder="Select a teacher"
                        mode="single"
                        searchable
                    />
                </FieldWrapper>
                <FieldWrapper label="Days">
                    <Select
                        options={dayOptions}
                        defaultValue="mondays"
                        placeholder="Select a day"
                        mode="single"
                    />
                </FieldWrapper>
            </div>

            {/* Row 2: Session date — filled */}
            <div style={{ width: '100%' }}>
                <SessionDateInput
                    state="filled"
                    startDate="06/28/2026"
                    endDate="06/28/2026"
                />
            </div>

            {/* Row 3: Session time — filled */}
            <div style={{ width: '100%' }}>
                <SessionTimeInput state="filled" />
            </div>

            {/* Row 4: Max tutors steppers — both enabled */}
            <div
                style={{
                    display: 'flex',
                    gap: 'var(--size-modal-gap-md)',
                    alignItems: 'flex-start',
                    width: '100%',
                }}
            >
                <StepperColumn>
                    <Stepper
                        state="steppers-enabled"
                        label="Max # of regular tutors"
                        value="4"
                    />
                </StepperColumn>
                <StepperColumn>
                    <Stepper
                        state="steppers-enabled"
                        label="Max # of lead tutors"
                        value="4"
                    />
                </StepperColumn>
            </div>
        </div>

        {/* Bottom Buttons */}
        <div
            style={{
                display: 'flex',
                gap: 'var(--size-modal-gap-md)',
                alignItems: 'center',
                justifyContent: 'flex-end',
                width: '100%',
            }}
        >
            <div style={{ flex: 1 }}>
                <CancelButton block />
            </div>
            <div style={{ flex: 1 }}>
                <CreateSessionButton block />
            </div>
        </div>
    </div>
);

// ─── Story ────────────────────────────────────────────────────

/**
 * Filled
 * The "Create new session" modal with all fields filled in.
 *
 * Pre-filled values:
 * - School: Hogwarts
 * - Teacher: Mr. Dumbledore
 * - Days: Mondays
 * - Session date: 06/28/2026 - 06/28/2026
 * - Session time: 11:00 AM - 11:00 AM
 * - Max regular tutors: 4
 * - Max lead tutors: 4
 *
 * Tokens:
 * - Modal padding: --size-modal-pad-y-lg / --size-modal-pad-x-lg
 * - Modal gap: --size-modal-gap-lg (header/buttons), --size-modal-gap-md (between components)
 * - Modal radius: --size-modal-radius-lg
 * - Background: --color-surface-container-high
 */
export const Filled = () => (
    <Modal
        width={672}
        showBottomButtons={false}
        onClose={() => { }}
        body={<FilledModalBody />}
    />
);
