import React from 'react';
import Modal from '../../../../../components/Modal';
import Select from '@/forms/Select';
import { Label } from '@/forms/LabelAndCaption.stories';
import { SessionDateInput } from '../../elements/NewFormDateInput.stories';
import { SessionTimeInput } from '../../elements/NewFormTimeInput.stories';
import { Stepper } from '../../elements/Steppers.stories';
import ButtonGroup from '../../../../../components/ButtonGroup';
import Button from '../../../../../components/Button';
import Badge from '../../../../../components/Badge';
import { CancelButton, SaveChangesButton } from '../../elements/SupervisorManagementButtons.stories';

export default {
    title: 'Specs/Toolkit/Pre-Session/Modals/Edit Session',
    component: Modal,
    parameters: {
        layout: 'centered',
    },
};

// ─── Dropdown Options ─────────────────────────────────────────

const schoolOptions = [
    { value: 'hogwarts', label: 'Hogwarts' },
    { value: 'beauxbatons', label: 'Beauxbatons' },
    { value: 'durmstrang', label: 'Durmstrang' },
];

const teacherOptions = [
    { value: 'dumbledore', label: 'Mr. Dumbledore' },
    { value: 'snape', label: 'Mr. Snape' },
    { value: 'mcgonagall', label: 'Ms. McGonagall' },
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
            <h4 className="h4 m-0">Edit session</h4>
            <i
                className="fa-solid fa-xmark"
                style={{
                    fontSize: 'var(--font-size-fa-h4-solid)',
                    color: 'var(--color-on-surface-variant)',
                    cursor: 'pointer',
                }}
            />
        </div>

        {/* Tab Navigation - ButtonGroup */}
        <div style={{ display: 'flex', width: '100%' }}>
            <ButtonGroup
                fill="tonal"
                className="w-100"
            >
                <Button
                    text="Session info"
                    active={true}
                    style="primary"
                    fill="tonal"
                    block
                />
                <Button
                    text="Attendees"
                    trailingVisual={
                        <Badge text="20" style="secondary" size="b3" />
                    }
                    style="secondary"
                    fill="tonal"
                    block
                />
            </ButtonGroup>
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
                        defaultValue="hogwarts"
                        mode="single"
                        searchable
                    />
                </FieldWrapper>
                <FieldWrapper label="Teacher">
                    <Select
                        options={teacherOptions}
                        defaultValue="dumbledore"
                        mode="single"
                        searchable
                    />
                </FieldWrapper>
                <FieldWrapper label="Teacher">
                    <Select
                        options={dayOptions}
                        defaultValue="mondays"
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
                <SaveChangesButton block />
            </div>
        </div>
    </div>
);

// ─── Story ────────────────────────────────────────────────────

/**
 * Forming
 * The "Edit session" modal in its forming/default state.
 * Fields are pre-filled with existing session data and ready for editing.
 *
 * Layout:
 * - Header: "Edit session" title + close icon
 * - Tab navigation: Session info (active) | Attendees (with count badge)
 * - Row 1: School, Teacher, Days dropdowns (3 columns, pre-filled)
 * - Row 2: Session date range (start - end)
 * - Row 3: Session time range (start - end)
 * - Row 4: Max regular tutors & Max lead tutors steppers
 * - Bottom: Cancel (outline) + Save Changes (filled) buttons
 *
 * Tokens:
 * - Modal padding: --size-modal-pad-y-lg / --size-modal-pad-x-lg
 * - Modal gap: --size-modal-gap-lg (between sections), --size-modal-gap-md (between components)
 * - Modal radius: --size-modal-radius-lg
 * - Background: --color-surface-container-high
 * - Title: h4
 * - Close icon: fa-xmark, --font-size-fa-h4-solid, --color-on-surface-variant
 */
export const Forming = () => (
    <Modal
        width={672}
        showBottomButtons={false}
        onClose={() => {}}
        body={<FormingModalBody />}
    />
);
