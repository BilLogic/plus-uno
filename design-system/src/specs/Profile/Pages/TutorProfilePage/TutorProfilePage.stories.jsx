/**
 * TutorProfilePage - Profile Page
 * 
 * Full page layout for Tutor Profile.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=5615-214865&m=dev
 */

import React, { useState, useCallback } from 'react';
import TutorProfilePage from './TutorProfilePage';
import ResponsiveFrame from '@/specs/Universal/ResponsiveFrame';
import { PageLayout } from '../../../Universal/Pages';
import { Label } from '../../../../forms/LabelAndCaption.stories';
import Input from '../../../../forms/Input';
import Button from '../../../../components/Button/Button';
import Tooltip from '../../../../components/Tooltip/Tooltip';
import { Pronouns } from '../../Elements/Pronouns.stories';
import { StudentTypeDropdown } from '../../Elements/StudentTypeDropdown.stories';
import { University } from '../../Elements/University.stories';
import { GradYearDropdown } from '../../Elements/GradYearDropdown.stories';
import { MathLevel } from '../../Elements/MathLevel.stories';
import { LanguagePreferences } from '../../Elements/LanguagePreferences.stories';
import { SemesterAtPLUS } from '../../Elements/SemesterAtPLUS.stories';
import { UploadProfilePic } from '../../Elements/UploadProfilePic.stories';

export default {
    title: 'Specs/Profile/Pages/TutorProfilePage',
    component: TutorProfilePage,
    tags: ['autodocs'],
    decorators: [
        (Story, context) => (
            <ResponsiveFrame breakpoint={context.args.breakpoint || 'xl'}>
                <Story />
            </ResponsiveFrame>
        ),
    ],
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: `Full page layout for Tutor Profile. Includes TopBar with breadcrumbs, Sidebar navigation, and profile content sections.

## Figma Reference
Node ID: 5615-214865

## Features
- TopBar with breadcrumbs (Home / Profile)
- Sidebar navigation (tutor user type)
- Page title "Tutor Profile" (h3)
- Upload Profile Pic element
- Basic Information section (with Save and Update button)
- Status & Clearance section (readonly)
- Background & Matching section (with Save and Update button)
- Responsive breakpoints (md, lg, xl)

## Reused Components
- **PageLayout** (sidebar + topbar from Universal)
- **UploadProfilePic** (from Profile/Elements)
- **BasicInformationSection** (from Profile/Sections)
- **StatusSection** (from Profile/Sections)
- **BackgroundAndMatchingSection** (from Profile/Sections)
`,
            },
        },
    },
    argTypes: {
        changed: {
            control: 'boolean',
            description: 'Whether form fields have been changed (enables Save buttons)',
            table: { category: 'State' },
        },
        profileState: {
            control: 'select',
            options: ['unfilled', 'filled'],
            description: 'Profile pic state',
            table: { category: 'State' },
        },
        breakpoint: {
            control: { type: 'select' },
            options: ['md', 'lg', 'xl'],
            description: 'Responsive breakpoint',
            table: { category: 'Responsive' },
        },
    },
    args: {
        changed: false,
        profileState: 'unfilled',
        breakpoint: 'xl',
    },
};

/**
 * Overview
 * Use the controls panel to switch breakpoints (md, lg, xl),
 * toggle changed state, and profile pic state.
 */
export const Overview = {
    render: (args) => (
        <TutorProfilePage
            changed={args.changed}
            profileState={args.profileState}
        />
    ),
};

/** Tooltip content with email link */
const InfoTooltipContent = () => (
    <span>
        Is some information incorrect? Contact{' '}
        <a href="mailto:help@tutors.plus" style={{ color: 'inherit', textDecoration: 'underline' }}>
            help@tutors.plus
        </a>{' '}
        to request a correction.
    </span>
);

/**
 * Interactive
 * All inputs, dropdowns, and buttons are fully interactive.
 * Save buttons automatically enable when any field in their section changes.
 */
export const Interactive = {
    render: (args) => {
        // === Basic Information state ===
        const [preferredName, setPreferredName] = useState('');
        const [additionalEmail, setAdditionalEmail] = useState('');
        const [slackEmail, setSlackEmail] = useState('');
        const [pronounsDirty, setPronounsDirty] = useState(false);

        // === Background & Matching state (dirty flags — dropdowns are uncontrolled) ===
        const [studentTypeDirty, setStudentTypeDirty] = useState(false);
        const [universityDirty, setUniversityDirty] = useState(false);
        const [gradYearDirty, setGradYearDirty] = useState(false);
        const [mathLevelDirty, setMathLevelDirty] = useState(false);
        const [languagesDirty, setLanguagesDirty] = useState(false);

        // Derive changed state
        const basicInfoChanged = !!(preferredName || pronounsDirty || additionalEmail || slackEmail);
        const bgMatchingChanged = !!(studentTypeDirty || universityDirty || gradYearDirty || mathLevelDirty || languagesDirty);

        // Save handlers
        const handleBasicInfoSave = useCallback(() => {
            alert('Basic Information saved!');
        }, []);

        const handleBgMatchingSave = useCallback(() => {
            alert('Background & Matching saved!');
        }, []);

        const topBarConfig = {
            breadcrumbs: [
                { text: 'Home', href: '#' },
                { text: 'Profile' },
            ],
            user: { name: 'John Doe', counter: true, counterValue: 2 },
        };

        const sidebarConfig = { user: 'tutor' };

        return (
            <PageLayout
                topBarConfig={topBarConfig}
                sidebarConfig={sidebarConfig}
                id="tutor-profile-page-interactive"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-surface-gap-md, 24px)', width: '100%' }}>

                    {/* Page Title */}
                    <h3 className="h3" style={{ color: 'var(--color-on-surface)', margin: 0 }}>
                        Tutor Profile
                    </h3>

                    {/* Upload Profile Pic */}
                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                        <UploadProfilePic state="unfilled" />
                    </div>

                    {/* ====== Basic Information Section (interactive) ====== */}
                    <div style={{
                        width: '100%',
                        backgroundColor: 'var(--color-surface-container-low, #f3f3f6)',
                        border: '1px solid var(--color-surface-container-low, #f3f3f6)',
                        borderRadius: 'var(--size-section-radius-md, 12px)',
                        padding: 'var(--size-section-pad-y-md, 24px) var(--size-section-pad-x-md, 24px)',
                        display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md, 16px)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', height: '24px', width: '100%' }}>
                            <span className="h6" style={{ color: 'var(--color-on-surface)' }}>Basic Information</span>
                        </div>

                        {/* Row 1 */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--size-element-gap-sm, 8px)', width: '100%' }}>
                            <div style={{ flex: '1 0 0', maxWidth: '285px', display: 'flex', flexDirection: 'column', gap: 'var(--size-small-gap-xs, 4px)', overflow: 'hidden' }}>
                                <Label text="First Name" required={false} />
                                <Input id="bi-first-name" value="Veronica" readonly={true} size="medium" showLabel={false} />
                            </div>
                            <div style={{ flex: '1 0 0', maxWidth: '285px', display: 'flex', flexDirection: 'column', gap: 'var(--size-small-gap-xs, 4px)', overflow: 'hidden' }}>
                                <Label text="Last Name" required={false} />
                                <Input id="bi-last-name" value="Lodge" readonly={true} size="medium" showLabel={false} />
                            </div>
                            <div style={{ flex: '1 0 0', maxWidth: '285px', display: 'flex', flexDirection: 'column', gap: 'var(--size-small-gap-xs, 4px)', overflow: 'hidden' }}>
                                <Label text="Preferred Name" required={false} />
                                <Input id="bi-preferred-name" placeholder="Enter" value={preferredName} onChange={(e) => setPreferredName(e.target.value)} size="medium" showLabel={false} />
                            </div>
                            <div style={{ flex: '1 0 0', maxWidth: '285px' }}>
                                <Pronouns id="bi-pronouns" onChange={() => setPronounsDirty(true)} />
                            </div>
                        </div>

                        {/* Row 2 */}
                        <div style={{ display: 'flex', gap: 'var(--size-element-gap-lg, 12px)', width: '100%' }}>
                            <div style={{ flex: '1 0 0', maxWidth: '382.67px', display: 'flex', flexDirection: 'column', gap: 'var(--size-small-gap-xs, 4px)', overflow: 'hidden' }}>
                                <Label text="PLUS Account Email" required={false} />
                                <Input id="bi-plus-email" value="pl2-app-demo@gmail.com" readonly={true} size="medium" showLabel={false} />
                            </div>
                            <div style={{ flex: '1 0 0', maxWidth: '382.67px', display: 'flex', flexDirection: 'column', gap: 'var(--size-small-gap-xs, 4px)', overflow: 'hidden' }}>
                                <div style={{ display: 'flex', gap: 'var(--size-spacing-space-050, 4px)', alignItems: 'flex-start' }}>
                                    <Label text="Additional Email" required={false} />
                                    <Tooltip text="Get notifications sent to an alternate email address" placement="right" size="small" id="tooltip-bi-additional-email">
                                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', height: '20px', width: '9px' }}>
                                            <i className="fa-solid fa-circle-info" style={{ fontSize: '10px', color: 'var(--color-primary)' }} />
                                        </span>
                                    </Tooltip>
                                </div>
                                <Input id="bi-additional-email" placeholder="pl2-app-demo@gmail.com" value={additionalEmail} onChange={(e) => setAdditionalEmail(e.target.value)} size="medium" showLabel={false} />
                            </div>
                            <div style={{ flex: '1 0 0', maxWidth: '382.67px', display: 'flex', flexDirection: 'column', gap: 'var(--size-small-gap-xs, 4px)', overflow: 'hidden' }}>
                                <Label text="Slack Email" required={false} />
                                <Input id="bi-slack-email" placeholder="pl2-app-demo@gmail.com" value={slackEmail} onChange={(e) => setSlackEmail(e.target.value)} size="medium" showLabel={false} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%' }}>
                            <Button text="Save and Update" style="primary" fill="filled" size="medium" disabled={!basicInfoChanged} onClick={handleBasicInfoSave} />
                        </div>
                    </div>

                    {/* ====== Status & Clearance Section (readonly — reuse as-is) ====== */}
                    <div style={{
                        width: '100%',
                        backgroundColor: 'var(--color-surface-container-low, #f3f3f6)',
                        border: '1px solid var(--color-surface-container-low, #f3f3f6)',
                        borderRadius: 'var(--size-section-radius-md, 12px)',
                        padding: 'var(--size-section-pad-y-md, 24px) var(--size-section-pad-x-md, 24px)',
                        display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md, 16px)',
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-xs, 4px)', width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--size-element-pad-y-sm, 4px)', width: '100%' }}>
                                <span className="h6" style={{ color: 'var(--color-on-surface)' }}>Status &amp; Clearance</span>
                                <Tooltip text={<InfoTooltipContent />} placement="right" size="small" id="tooltip-status-interactive">
                                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', height: '20px', width: '9px' }}>
                                        <i className="fa-solid fa-circle-info" style={{ fontSize: '10px', color: 'var(--color-primary)' }} />
                                    </span>
                                </Tooltip>
                            </div>
                            <span className="body3-txt font-weight-light" style={{ color: 'var(--color-on-surface)' }}>
                                This information determines your eligibility to tutor with PLUS.
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--size-element-gap-sm, 8px)', width: '100%' }}>
                            {[{ label: 'Tutor Status', value: 'Lead Tutor' }, { label: 'Onboarding Status:', value: 'Complete' }, { label: 'Tutoring with PLUS since:', value: '01/29/2026' }, { label: 'Assigned Supervisor:', value: 'Albus Dumbledore' }].map((field) => (
                                <div key={field.label} style={{ flex: '1 0 0', maxWidth: '162px', display: 'flex', flexDirection: 'column', gap: 'var(--size-small-gap-xs, 4px)', overflow: 'hidden' }}>
                                    <Label text={field.label} required={false} />
                                    <Input id={`status-${field.label}`} value={field.value} readonly={true} size="medium" showLabel={false} />
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '580px', width: '100%' }}>
                            <SemesterAtPLUS id="status-semester-interactive" defaultValue={['fall-2024', 'spring-2025', 'summer-2025', 'fall-2025']} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-small-gap-xs, 4px)' }}>
                            <Label text="Clearance Status" required={false} />
                            <div style={{ display: 'flex', gap: 'var(--size-spacing-space-050, 4px)', alignItems: 'flex-start' }}>
                                <i className="fa-solid fa-circle-check" style={{ fontSize: '10px', color: 'var(--color-success)', lineHeight: '20px' }} />
                                <span className="body3-txt font-weight-light" style={{ color: 'var(--color-success-text)' }}>
                                    Verified: March 16, 2026
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ====== Background & Matching Section (interactive) ====== */}
                    <div style={{
                        width: '100%',
                        backgroundColor: 'var(--color-surface-container-low, #f3f3f6)',
                        border: '1px solid var(--color-surface-container-low, #f3f3f6)',
                        borderRadius: 'var(--size-section-radius-md, 12px)',
                        padding: 'var(--size-section-pad-y-md, 24px) var(--size-section-pad-x-md, 24px)',
                        display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md, 16px)',
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-xs, 4px)', width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--size-element-pad-y-sm, 4px)', width: '100%' }}>
                                <span className="h6" style={{ color: 'var(--color-on-surface)' }}>Background &amp; Matching</span>
                                <Tooltip text={<InfoTooltipContent />} placement="right" size="small" id="tooltip-bg-interactive">
                                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', height: '20px', width: '9px' }}>
                                        <i className="fa-solid fa-circle-info" style={{ fontSize: '10px', color: 'var(--color-primary)' }} />
                                    </span>
                                </Tooltip>
                            </div>
                            <span className="body3-txt font-weight-light" style={{ color: 'var(--color-on-surface)' }}>
                                This information helps us match tutors with students .
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                            {/* Row 1 */}
                            <div style={{ display: 'flex', gap: 'var(--size-spacing-between-components-spacer-2, 8px)', width: '100%' }}>
                                <div style={{ flex: '1 0 0', maxWidth: '382.67px' }}>
                                    <StudentTypeDropdown id="bg-student-type" onChange={() => setStudentTypeDirty(true)} required={true} />
                                </div>
                                <div style={{ flex: '1 0 0', maxWidth: '382.67px' }}>
                                    <University id="bg-university" onChange={() => setUniversityDirty(true)} />
                                </div>
                                <div style={{ flex: '1 0 0', maxWidth: '382.67px' }}>
                                    <GradYearDropdown id="bg-grad-year" onChange={() => setGradYearDirty(true)} />
                                </div>
                            </div>
                            {/* Row 2 */}
                            <div style={{ display: 'flex', gap: 'var(--size-spacing-between-components-spacer-2, 8px)', width: '100%' }}>
                                <div style={{ flex: '1 0 0', maxWidth: '578px' }}>
                                    <MathLevel id="bg-math-level" onChange={() => setMathLevelDirty(true)} required={true} />
                                </div>
                                <div style={{ flex: '1 0 0', maxWidth: '578px' }}>
                                    <LanguagePreferences id="bg-languages" onChange={() => setLanguagesDirty(true)} />
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%' }}>
                            <Button text="Save and Update" style="primary" fill="filled" size="medium" disabled={!bgMatchingChanged} onClick={handleBgMatchingSave} />
                        </div>
                    </div>

                </div>
            </PageLayout>
        );
    },
};
