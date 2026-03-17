/**
 * Profile - Sections - Basic Information
 * 
 * Section card containing personal information fields for the user's profile.
 * Re-uses Input (from forms), Label (from forms), Select (from forms),
 * Button (from components), and Tooltip (from components).
 * 
 * Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=4477-18992&m=dev
 * 
 * States:
 * - Default (unchanged): Save button disabled, all fields at rest
 * - Changed: Save button active (primary), indicating edits have been made
 * 
 * Layout:
 * - Section card: --color-surface-container-low bg, 12px radius, 24px padding, 16px gap
 * - Header: "Basic Information" (h6, --color-on-surface)
 * - Row 1 (Personal Info): First Name (readonly), Last Name (readonly),
 *   Preferred Name (editable), Preferred Pronouns (Select dropdown) — max-width 162px each
 * - Row 2 (Contact Info): PLUS Account Email (readonly), Additional Email (with tooltip),
 *   Slack Email (editable) — max-width ~218.67px each
 * - Footer: "Save and Update" button aligned right
 * 
 * Typography:
 * - Section title: h6 (Lato SemiBold, 16px, line-height 1.5) in --color-on-surface
 * - Labels: body3-txt (Merriweather Sans Regular, 12px, line-height 1.667) in --color-on-surface
 * - Input values: body2-txt font-weight-light (Merriweather Sans Light, 14px) in --color-on-surface
 * - Placeholders: body2-txt font-weight-light in --color-on-surface-variant
 * - Button text: h6 (Lato SemiBold, 16px, line-height 1.5)
 * 
 * Colors:
 * - Card bg: --color-surface-container-low (#f3f3f6)
 * - Card border: --color-surface-container-low
 * - Readonly input bg: --color-surface-variant (#dde3ea)
 * - Readonly input border: --color-outline (#6f797a)
 * - Editable input bg: --color-surface (#f9f9fc)
 * - Editable input border: --color-outline-variant (#bec8ca)
 * - Disabled button: --color-on-surface opacity 12% bg, 38% opacity text
 * - Active button: --color-primary bg, --color-on-primary text
 * 
 * Spacing:
 * - Card padding: var(--size-section-pad-x-md, 24px) / var(--size-section-pad-y-md, 24px)
 * - Card gap: var(--size-section-gap-md, 16px)
 * - Card border-radius: var(--size-section-radius-md, 12px)
 * - Field gap (between fields): var(--size-element-gap-sm, 8px)
 * - Label-to-input gap: var(--size-small-gap-xs, 4px)
 * - Input padding: var(--size-element-pad-x-md, 10px) / var(--size-element-pad-y-md, 6px)
 * - Input border-radius: var(--size-border-radius-50, 2px)
 * 
 * Width: ~848px (from Figma)
 * 
 * Annotations:
 * - Slack Email default value is same as PLUS Account Email; users can overwrite it
 * - Save button gets set active upon any edits
 * - Additional Email info icon tooltip: "Get notifications sent to an alternate email address"
 */
import React from 'react';
import { Label } from '../../../forms/LabelAndCaption.stories';
import Input from '../../../forms/Input';
import Button from '../../../components/Button/Button';
import Tooltip from '../../../components/Tooltip/Tooltip';
import { Pronouns } from '../Elements/Pronouns.stories';

export default {
    title: 'Specs/Profile/Sections/Basic Information',
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
};

/**
 * Reusable Basic Information section component for use in pages
 */
export const BasicInformationSection = ({ changed = false }) => {
    return (
        <div
            style={{
                width: '848px',
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
                    alignItems: 'center',
                    height: '24px',
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
                    Basic Information
                </span>
            </div>

            {/* Row 1: Personal Information Inputs */}
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 'var(--size-element-gap-sm, 8px)',
                    width: '100%',
                }}
            >
                {/* First Name (readonly) */}
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
                    <Label text="First Name" required={false} />
                    <Input
                        id="first-name"
                        placeholder="Value"
                        value="Veronica"
                        readonly={true}
                        size="medium"
                        showLabel={false}
                    />
                </div>

                {/* Last Name (readonly) */}
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
                    <Label text="Last Name" required={false} />
                    <Input
                        id="last-name"
                        placeholder="Value"
                        value="Lodge"
                        readonly={true}
                        size="medium"
                        showLabel={false}
                    />
                </div>

                {/* Preferred Name (editable) */}
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
                    <Label text="Preferred Name" required={false} />
                    <Input
                        id="preferred-name"
                        placeholder="Enter"
                        size="medium"
                        showLabel={false}
                    />
                </div>

                {/* Preferred Pronouns (reusing Pronouns element) */}
                <div
                    style={{
                        flex: '1 0 0',
                        maxWidth: '162px',
                        overflow: 'hidden',
                    }}
                >
                    <Pronouns id="preferred-pronouns" />
                </div>
            </div>

            {/* Row 2: Contact Information Inputs */}
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 'var(--size-element-gap-sm, 8px)',
                    width: '100%',
                }}
            >
                {/* PLUS Account Email (readonly) */}
                <div
                    style={{
                        flex: '1 0 0',
                        maxWidth: '218.67px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--size-small-gap-xs, 4px)',
                        overflow: 'hidden',
                    }}
                >
                    <Label text="PLUS Account Email" required={false} />
                    <Input
                        id="plus-account-email"
                        placeholder="Placeholder"
                        value="pl2-app-demo@gmail.com"
                        readonly={true}
                        size="medium"
                        showLabel={false}
                    />
                </div>

                {/* Additional Email (editable, with info tooltip) */}
                <div
                    style={{
                        flex: '1 0 0',
                        maxWidth: '218.67px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--size-small-gap-xs, 4px)',
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            gap: 'var(--size-spacing-space-050, 4px)',
                            alignItems: 'flex-start',
                        }}
                    >
                        <Label text="Additional Email" required={false} />
                        <Tooltip
                            text="Get notifications sent to an alternate email address"
                            placement="right"
                            size="small"
                            id="tooltip-additional-email-section"
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
                    <Input
                        id="additional-email"
                        placeholder="pl2-app-demo@gmail.com"
                        size="medium"
                        showLabel={false}
                    />
                </div>

                {/* Slack Email (editable) */}
                <div
                    style={{
                        flex: '1 0 0',
                        maxWidth: '218.67px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--size-small-gap-xs, 4px)',
                        overflow: 'hidden',
                    }}
                >
                    <Label text="Slack Email" required={false} />
                    <Input
                        id="slack-email"
                        placeholder="pl2-app-demo@gmail.com"
                        size="medium"
                        showLabel={false}
                    />
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
 * Shows the Basic Information section in both states:
 * Default (unchanged, save disabled) and Changed (save active).
 */
export const BasicInformationStory = () => {
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
                <BasicInformationSection changed={false} />
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
                <BasicInformationSection changed={true} />
            </div>
        </div>
    );
};
