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
    { value: 'school-a', label: 'School A' },
    { value: 'school-b', label: 'School B' },
    { value: 'school-c', label: 'School C' },
];

const teacherOptions = [
    { value: 'teacher-a', label: 'Teacher A' },
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

const FormingModalBody = () => (
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
            {/* Row 1: School, Teacher, Days dropdowns */}
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
                        placeholder="Select a school"
                        mode="single"
                        searchable
                    />
                </FieldWrapper>
                <FieldWrapper label="Teacher">
                    <Select
                        options={teacherOptions}
                        placeholder="Select a teacher"
                        mode="single"
                        searchable
                    />
                </FieldWrapper>
                <FieldWrapper label="Days">
                    <Select
                        options={dayOptions}
                        placeholder="Select a day"
                        mode="single"
                    />
                </FieldWrapper>
            </div>

            {/* Row 2: Session date */}
            <div style={{ width: '100%' }}>
                <SessionDateInput state="unfilled" />
            </div>

            {/* Row 3: Session time */}
            <div style={{ width: '100%' }}>
                <SessionTimeInput state="unfilled" />
            </div>

            {/* Row 4: Max tutors steppers */}
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
 * Forming
 * The "Create new session" modal in its forming/default state.
 * All fields are unfilled and ready for user input.
 *
 * Layout:
 * - Row 1: School, Teacher, Days dropdowns (3 columns)
 * - Row 2: Session date range (start - end)
 * - Row 3: Session time range (start - end)
 * - Row 4: Max regular tutors & Max lead tutors steppers
 * - Bottom: Cancel (outline) + Create Session (filled) buttons
 *
 * Tokens:
 * - Modal padding: --size-modal-pad-y-lg / --size-modal-pad-x-lg
 * - Modal gap: --size-modal-gap-lg (between sections), --size-modal-gap-md (between columns)
 * - Modal radius: --size-modal-radius-lg
 * - Background: --color-surface-container-high
 * - Title: h4
 * - Close icon: fa-xmark, --font-size-fa-h4-solid, --color-on-surface-variant
 */
export const Forming = () => (
    <Modal
        width={672}
        showBottomButtons={false}
        onClose={() => { }}
        body={<FormingModalBody />}
    />
);
