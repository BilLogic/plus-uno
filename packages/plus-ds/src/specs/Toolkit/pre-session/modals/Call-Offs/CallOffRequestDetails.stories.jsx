import React, { useState } from 'react';
import Modal from '../../../../../components/Modal';
import Button from '../../../../../components/Button';
import Select from '../../../../../forms/Select';
import TextareaVer2 from '../../../../../forms/TextareaVer2';
import Switch from '../../../../../forms/Switch';

// Import CTA button components from Tutor View
import {
    BackButton,
    SubmitRequestButton
} from '../../elements/CTATutorViewButtons.stories';

export default {
    title: 'Specs/Toolkit/Pre-Session/Modals/Call-Offs',
    component: Modal,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

// Call-off reason options
const reasonOptions = [
    { value: '', label: 'Select a reason' },
    { value: 'illness', label: 'Illness/Health issue' },
    { value: 'family', label: 'Family emergency' },
    { value: 'work', label: 'Work/Job conflict' },
    { value: 'transportation', label: 'Transportation issue' },
    { value: 'academic', label: 'Academic commitment' },
    { value: 'mistake', label: 'Signed up by mistake' },
    { value: 'other', label: 'Other' },
];

/**
 * Call-off Alert Component
 * Warning bordered card with title, description and close button
 * Uses semantic tokens:
 * - Background: --color-warning-state-16 (warning tonal)
 * - Border: --color-warning (warning color)
 * - Radius: --size-modal-radius-md (modal/card radius)
 * - Padding: --size-card-pad-y-sm, --size-card-pad-x-sm (card padding)
 * - Gap: --size-card-gap-sm (internal card gap)
 * - Typography: h6, body1-txt
 */
const CallOffAlert = ({ onClose }) => (
    <div
        style={{
            backgroundColor: 'var(--color-warning-state-16)',
            border: '1px solid var(--color-warning)',
            borderRadius: 'var(--size-modal-radius-md)',
            padding: 'var(--size-card-pad-y-sm) var(--size-card-pad-x-sm)',
            display: 'flex',
            gap: 'var(--size-card-gap-sm)',
            width: '100%'
        }}
    >
        <div
            style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-element-gap-sm)'
            }}
        >
            <span className="body1-txt" style={{ color: 'var(--color-on-surface)' }}>
                This session begins in <strong>less than 12 hours</strong>. Dropping now may leave students without enough tutors. Please think carefully before submitting your call-off request, as it <strong>may not be excused</strong> and could count toward your absences.
            </span>
        </div>
        <button
            onClick={onClose}
            style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                alignSelf: 'flex-start'
            }}
        >
            <i
                className="fa-solid fa-xmark"
                style={{
                    fontSize: 'var(--font-size-fa-h4-solid)',
                    color: 'var(--color-on-surface-variant)'
                }}
            />
        </button>
    </div>
);

/**
 * Reason Dropdown Component
 * Uses semantic tokens:
 * - Gap: --size-element-gap-xs (between label and select)
 * - Typography: body3-txt for label
 */
const ReasonDropdown = ({ value, onChange }) => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-element-gap-xs)',
            width: '100%'
        }}
    >
        <div style={{ display: 'flex', gap: 'var(--size-spacing-space-050)' }}>
            <span className="body3-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                Reason for call-Off
            </span>
            <span className="body3-txt" style={{ color: 'var(--color-danger)' }}>*</span>
        </div>
        <Select
            options={reasonOptions}
            placeholder="Select a reason"
            mode="single"
            value={value}
            onChange={onChange}
            required
        />
    </div>
);

/**
 * Additional Details Textarea Component
 * Uses semantic tokens:
 * - Gap: --size-element-gap-xs (between label and textarea)
 * - Typography: body3-txt for label
 */
const AdditionalDetailsTextarea = ({ value, onChange }) => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--size-element-gap-xs)',
            width: '100%'
        }}
    >
        <div style={{ display: 'flex', gap: 'var(--size-spacing-space-050)' }}>
            <span className="body3-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                Additional details
            </span>
            <span className="body3-txt" style={{ color: 'var(--color-danger)' }}>*</span>
        </div>
        <TextareaVer2
            placeholder="Placeholder"
            value={value}
            onChange={onChange}
            rows={3}
            variant="long"
        />
    </div>
);

/**
 * Withdraw Toggle Component
 * Uses semantic tokens:
 * - Typography: body2-txt for label
 */
const WithdrawToggle = ({ checked, onChange }) => (
    <div
        className="d-flex justify-content-between align-items-center"
        style={{ width: '100%' }}
    >
        <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
            Withdraw from all recurring sessions.
        </span>
        <div style={{ marginRight: 'var(--size-element-gap-md)' }}>
            <Switch
                checked={checked}
                onChange={onChange}
                size="medium"
            />
        </div>
    </div>
);

/**
 * Call-off Request Details Modal - Overview
 * Shows the modal with all form elements in their default state
 * 
 * Components used:
 * - Modal (plus-ds)
 * - Button (plus-ds)
 * - Select (plus-ds/forms)
 * - TextareaVer2 (plus-ds/forms)
 * - Switch (plus-ds/forms)
 * - CallOffAlert (local component)
 * 
 * Semantic tokens used:
 * - Modal spacing: --size-modal-gap-lg, --size-modal-gap-md
 * - Modal padding: --size-modal-pad-y-lg, --size-modal-pad-x-lg
 * - Modal radius: --size-modal-radius-lg
 * - Background: --color-surface-container-high
 * - Typography: h4, body1-txt, body2-txt, body3-txt
 */
export const CallOff_Request_Details = () => (
    <Modal
        width={672}
        showBottomButtons={false}
        onClose={() => { }}
        body={
            <div className="d-flex flex-column" style={{
                gap: 'var(--size-modal-gap-lg)',
                backgroundColor: 'var(--color-surface-container-high)',
                padding: 'var(--size-modal-pad-y-lg) var(--size-modal-pad-x-lg)',
                borderRadius: 'var(--size-modal-radius-lg)'
            }}>

                {/* Header */}
                <div className="d-flex justify-content-between align-items-center">
                    <h4 className="h4 m-0">Call-off Request Details</h4>
                    <i
                        className="fa-solid fa-xmark"
                        style={{
                            fontSize: 'var(--font-size-fa-h4-solid)',
                            color: 'var(--color-on-surface-variant)',
                            cursor: 'pointer'
                        }}
                    />
                </div>

                {/* Form Content */}
                <div className="d-flex flex-column" style={{ gap: 'var(--size-modal-gap-md)' }}>
                    {/* Call-off Alert */}
                    <CallOffAlert onClose={() => { }} />

                    {/* Reason Dropdown */}
                    <ReasonDropdown value="" onChange={() => { }} />

                    {/* Additional Details Textarea */}
                    <AdditionalDetailsTextarea value="" onChange={() => { }} />

                    {/* Withdraw Toggle */}
                    <WithdrawToggle checked={true} onChange={() => { }} />
                </div>

                {/* Footer Buttons */}
                <div className="d-flex" style={{ gap: 'var(--size-modal-gap-md)' }}>
                    <BackButton />
                    <div style={{ flex: 1 }}>
                        <SubmitRequestButton disabled={true} block />
                    </div>
                </div>
            </div>
        }
    />
);

