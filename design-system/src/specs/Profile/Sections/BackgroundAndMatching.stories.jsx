/**
 * Profile - Sections - Background & Matching
 * 
 * Section card containing academic background and matching preference fields.
 * Re-uses exported components from Profile/Elements:
 * StudentTypeDropdown, University, GradYearDropdown, MathLevel, LanguagePreferences.
 * Also uses Tooltip (from components) and Button (from components).
 * 
 * Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=4535-22983&m=dev
 * 
 * States:
 * - Default (unchanged): Save button disabled, all fields at rest
 * - Changed: Save button active (primary), indicating edits have been made
 * 
 * Layout:
 * - Section card: --color-surface-container-low bg, 12px radius, 24px padding, 16px gap
 * - Header: "Background & Matching" (h6) + info icon tooltip + subtitle
 * - Row 1 (3 dropdowns, max-width ~218.67px each, 8px gap):
 *   Academic / Professional Background (required), University, Expected Graduation Time
 * - Row 2 (2 dropdowns, 8px gap):
 *   Math Topic Expertise (required, ~218.67px), Languages you can tutor in (~332px)
 * - Footer: "Save and Update" button aligned right
 * 
 * Typography:
 * - Section title: h6 (Lato SemiBold, 16px) in --color-on-surface
 * - Subtitle: body3-txt font-weight-light in --color-on-surface
 * - Labels: body3-txt (Merriweather Sans Regular, 12px) in --color-on-surface
 * 
 * Colors:
 * - Card bg: --color-surface-container-low (#f3f3f6)
 * - Card border: --color-surface-container-low
 * - Info icon: --color-primary
 * - Disabled button: opacity 38%, --color-on-surface opacity 12% bg
 * - Active button: --color-primary bg, --color-on-primary text
 * 
 * Spacing:
 * - Card padding: var(--size-section-pad-x-md, 24px) / var(--size-section-pad-y-md, 24px)
 * - Card gap: var(--size-section-gap-md, 16px)
 * - Card border-radius: var(--size-section-radius-md, 12px)
 * - Row gap: var(--size-element-gap-sm)
 * - Row-to-row gap: var(--size-section-gap-md) (16px)
 * 
 * Width: ~896px (from Figma)
 * 
 * Annotations:
 * - Info tooltip: "Is some information incorrect? Contact help@tutors.plus to request a correction."
 * - Subtitle: "This information helps us match tutors with students."
 * - Save button gets set active upon any edits
 */
import React from 'react';
import Tooltip from '../../../components/Tooltip/Tooltip';
import Button from '../../../components/Button/Button';
import { StudentTypeDropdown } from '../Elements/StudentTypeDropdown.stories';
import { University } from '../Elements/University.stories';
import { GradYearDropdown } from '../Elements/GradYearDropdown.stories';
import { MathLevel } from '../Elements/MathLevel.stories';
import { LanguagePreferences } from '../Elements/LanguagePreferences.stories';

export default {
    title: 'Specs/Profile/Sections/Background and Matching',
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
 * Reusable Background & Matching section component for use in pages
 */
export const BackgroundAndMatchingSection = ({ changed = false }) => {
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
                        Background &amp; Matching
                    </span>
                    <Tooltip
                        text={<InfoTooltipContent />}
                        placement="right"
                        size="small"
                        id="tooltip-bg-matching-info"
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
                    This information helps us match tutors with students .
                </span>
            </div>

            {/* Input Container */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    width: '100%',
                }}
            >
                {/* Row 1: Academic Background, University, Grad Year */}
                <div
                    style={{
                        display: 'flex',
                        gap: 'var(--size-element-gap-sm)',
                        width: '100%',
                    }}
                >
                    {/* Academic / Professional Background (reusing StudentTypeDropdown) */}
                    <div
                        style={{
                            flex: '1 0 0',
                            maxWidth: '382.67px',
                            overflow: 'hidden',
                        }}
                    >
                        <StudentTypeDropdown
                            id="academic-background"
                            required={true}
                        />
                    </div>

                    {/* University (reusing University element) */}
                    <div
                        style={{
                            flex: '1 0 0',
                            maxWidth: '382.67px',
                            overflow: 'hidden',
                        }}
                    >
                        <University id="university-bg" />
                    </div>

                    {/* Expected Graduation Time (reusing GradYearDropdown) */}
                    <div
                        style={{
                            flex: '1 0 0',
                            maxWidth: '382.67px',
                            overflow: 'hidden',
                        }}
                    >
                        <GradYearDropdown id="expected-grad-time" />
                    </div>
                </div>

                {/* Row 2: Math Topic Expertise, Languages */}
                <div
                    style={{
                        display: 'flex',
                        gap: 'var(--size-element-gap-sm)',
                        width: '100%',
                    }}
                >
                    {/* Math Topic Expertise (reusing MathLevel element) */}
                    <div
                        style={{
                            flex: '1 0 0',
                            maxWidth: '578px',
                            overflow: 'hidden',
                        }}
                    >
                        <MathLevel id="math-topic-expertise" required={true} />
                    </div>

                    {/* Languages you can tutor in (reusing LanguagePreferences element) */}
                    <div
                        style={{
                            flex: '1 0 0',
                            maxWidth: '578px',
                            overflow: 'hidden',
                        }}
                    >
                        <LanguagePreferences id="languages-tutor" />
                    </div>
                </div>
            </div>

            {/* Footer: Save and Update */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    width: '100%',
                }}
            >
                <Button
                    text="Save and Update"
                    style="primary"
                    fill="filled"
                    size="medium"
                    disabled={!changed}
                />
            </div>
        </div>
    );
};

/**
 * All States
 * Shows the Background & Matching section in both states:
 * Default (unchanged, save disabled) and Changed (save active).
 */
export const BackgroundAndMatchingStory = () => {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-section-gap-xl, 32px)',
                padding: 'var(--size-element-pad-y-lg, 12px)',
            }}
        >
            {/* State 1: Default (unchanged) */}
            <div>
                <h6
                    className="h6"
                    style={{
                        color: 'var(--color-on-surface-variant)',
                        marginBottom: 'var(--size-element-gap-md, 16px)',
                    }}
                >
                    Default (Unchanged — Save Disabled)
                </h6>
                <BackgroundAndMatchingSection changed={false} />
            </div>

            {/* State 2: Changed (save active) */}
            <div>
                <h6
                    className="h6"
                    style={{
                        color: 'var(--color-on-surface-variant)',
                        marginBottom: 'var(--size-element-gap-md, 16px)',
                    }}
                >
                    Changed (Save Active)
                </h6>
                <BackgroundAndMatchingSection changed={true} />
            </div>
        </div>
    );
};
