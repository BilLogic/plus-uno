/**
 * Profile - Sections - Status
 * 
 * Section card displaying the user's status and clearance information.
 * All fields are readonly (system-set values).
 * Re-uses Input (from forms), Label (from forms), Select (from forms),
 * and Tooltip (from components).
 * 
 * Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=4477-19341&m=dev
 * 
 * States:
 * - Default: All fields populated with readonly data
 * 
 * Layout:
 * - Section card: --color-surface-container-low bg, 12px radius, 24px padding, 16px gap
 * - Header: "Status & Clearance" (h6) + info icon tooltip + subtitle caption
 * - Row 1 (4 readonly fields, max-width 162px each, 8px gap):
 *   Tutor Status, Onboarding Status, Tutoring with PLUS since, Assigned Supervisor
 * - Semester Tutored at PLUS: readonly multi-select with badges (max-width 332px)
 * - Clearance Status: label + success icon + verified date
 * 
 * Typography:
 * - Section title: h6 (Lato SemiBold, 16px, line-height 1.5) in --color-on-surface
 * - Subtitle: body3-txt font-weight-light (Merriweather Sans Light, 12px) in --color-on-surface
 * - Labels: body3-txt (Merriweather Sans Regular, 12px, line-height 1.667) in --color-on-surface
 * - Input values: body2-txt font-weight-light (Merriweather Sans Light, 14px) in --color-on-surface-variant
 * - Clearance verified text: body3-txt font-weight-light in --color-success-text
 * - Clearance icon: fa-circle-check, 10px in --color-success
 * 
 * Colors:
 * - Card bg: --color-surface-container-low (#f3f3f6)
 * - Card border: --color-surface-container-low
 * - Readonly input bg: --color-surface-variant (#dde3ea)
 * - Readonly input border: --color-outline-variant (#bec8ca)
 * - Info icon: --color-primary
 * - Clearance icon: --color-success
 * - Clearance text: --color-success-text
 * 
 * Spacing:
 * - Card padding: var(--size-section-pad-x-md, 24px) / var(--size-section-pad-y-md, 24px)
 * - Card gap: var(--size-section-gap-md, 16px)
 * - Card border-radius: var(--size-section-radius-md, 12px)
 * - Header title-to-subtitle gap: var(--size-element-gap-xs, 4px)
 * - Field gap: var(--size-element-gap-sm, 8px)
 * - Label-to-input gap: var(--size-small-gap-xs, 4px)
 * 
 * Width: 774px (from Figma)
 * 
 * Annotations:
 * - Info tooltip: "Is some information incorrect? Contact help@tutors.plus to request a correction."
 * - This information determines your eligibility to tutor with PLUS.
 */
import React from 'react';
import { Label } from '../../../forms/LabelAndCaption.stories';
import Input from '../../../forms/Input';
import Tooltip from '../../../components/Tooltip/Tooltip';
import { SemesterAtPLUS } from '../Elements/SemesterAtPLUS.stories';

export default {
    title: 'Specs/Profile/Sections/Status',
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
};

/** Tooltip content with email link */
const InfoTooltipContent = () => (
    <span>
        Is some information incorrect? Contact{' '}
        <a
            href="mailto:help@tutors.plus"
            style={{
                color: 'inherit',
                textDecoration: 'underline',
            }}
        >
            help@tutors.plus
        </a>{' '}
        to request a correction.
    </span>
);

/**
 * Reusable Status & Clearance section component for use in pages
 */
export const StatusSection = () => {
    return (
        <div
            style={{
                width: '100%',
                backgroundColor: 'var(--color-surface-container-low, #f3f3f6)',
                border: '1px solid var(--color-surface-container-low, #f3f3f6)',
                borderRadius: 'var(--size-section-radius-md, 12px)',
                padding: 'var(--size-section-pad-y-md, 24px) var(--size-section-pad-x-md, 24px)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-section-gap-md, 16px)',
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--size-element-gap-xs, 4px)',
                    width: '100%',
                }}
            >
                {/* Title row */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--size-element-pad-y-sm, 4px)',
                        width: '100%',
                    }}
                >
                    <span
                        className="h6"
                        style={{
                            color: 'var(--color-on-surface)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        Status &amp; Clearance
                    </span>
                    <Tooltip
                        text={<InfoTooltipContent />}
                        placement="right"
                        size="small"
                        id="tooltip-status-info"
                    >
                        <span
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                height: '20px',
                                width: '9px',
                            }}
                        >
                            <i
                                className="fa-solid fa-circle-info"
                                style={{
                                    fontSize: '10px',
                                    color: 'var(--color-primary)',
                                }}
                            />
                        </span>
                    </Tooltip>
                </div>

                {/* Subtitle */}
                <span
                    className="body3-txt font-weight-light"
                    style={{
                        color: 'var(--color-on-surface)',
                    }}
                >
                    This information determines your eligibility to tutor with PLUS.
                </span>
            </div>

            {/* Row 1: Status fields (all readonly) */}
            <div
                style={{
                    display: 'flex',
                    gap: 'var(--size-element-gap-sm, 8px)',
                    width: '100%',
                }}
            >
                {/* Tutor Status (readonly) */}
                <div
                    style={{
                        flex: '1 0 0',
                        maxWidth: '162px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--size-small-gap-xs, 4px)',
                        overflow: 'hidden',
                    }}
                >
                    <Label text="Tutor Status" required={false} />
                    <Input
                        id="tutor-status"
                        value="Lead Tutor"
                        readonly={true}
                        size="medium"
                        showLabel={false}
                    />
                </div>

                {/* Onboarding Status (readonly) */}
                <div
                    style={{
                        flex: '1 0 0',
                        maxWidth: '162px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--size-small-gap-xs, 4px)',
                        overflow: 'hidden',
                    }}
                >
                    <Label text="Onboarding Status:" required={false} />
                    <Input
                        id="onboarding-status"
                        value="Complete"
                        readonly={true}
                        size="medium"
                        showLabel={false}
                    />
                </div>

                {/* Tutoring with PLUS since (readonly) */}
                <div
                    style={{
                        flex: '1 0 0',
                        maxWidth: '162px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--size-small-gap-xs, 4px)',
                        overflow: 'hidden',
                    }}
                >
                    <Label text="Tutoring with PLUS since:" required={false} />
                    <Input
                        id="tutoring-since"
                        value="01/29/2026"
                        readonly={true}
                        size="medium"
                        showLabel={false}
                    />
                </div>

                {/* Assigned Supervisor (readonly) */}
                <div
                    style={{
                        flex: '1 0 0',
                        maxWidth: '162px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--size-small-gap-xs, 4px)',
                        overflow: 'hidden',
                    }}
                >
                    <Label text="Assigned Supervisor:" required={false} />
                    <Input
                        id="assigned-supervisor"
                        value="Albus Dumbledore"
                        readonly={true}
                        size="medium"
                        showLabel={false}
                    />
                </div>
            </div>

            {/* Semester Tutored at PLUS (reusing SemesterAtPLUS element) */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    maxWidth: '580px',
                    width: '100%',
                }}
            >
                <SemesterAtPLUS
                    id="semester-tutored-status"
                    defaultValue={['fall-2024', 'spring-2025', 'summer-2025', 'fall-2025']}
                />
            </div>

            {/* Clearance Status */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--size-small-gap-xs, 4px)',
                }}
            >
                <Label text="Clearance Status" required={false} />
                <div
                    style={{
                        display: 'flex',
                        gap: 'var(--size-spacing-space-050, 4px)',
                        alignItems: 'flex-start',
                    }}
                >
                    <i
                        className="fa-solid fa-circle-check"
                        style={{
                            fontSize: '10px',
                            color: 'var(--color-success)',
                            lineHeight: '20px',
                        }}
                    />
                    <span
                        className="body3-txt font-weight-light"
                        style={{
                            color: 'var(--color-success-text)',
                        }}
                    >
                        Verified: March 16, 2026
                    </span>
                </div>
            </div>
        </div>
    );
};

/**
 * All States
 * Shows the Status & Clearance section in its default state.
 */
export const StatusStory = () => {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-section-gap-xl, 32px)',
                padding: 'var(--size-element-pad-y-lg, 12px)',
            }}
        >
            {/* Default State */}
            <div>
                <h6
                    className="h6"
                    style={{
                        color: 'var(--color-on-surface-variant)',
                        marginBottom: 'var(--size-element-gap-md, 16px)',
                    }}
                >
                    Default
                </h6>
                <StatusSection />
            </div>
        </div>
    );
};
