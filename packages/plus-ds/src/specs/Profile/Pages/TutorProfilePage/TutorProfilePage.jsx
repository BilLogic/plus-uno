/**
 * TutorProfilePage Component
 * 
 * Full page layout for Tutor Profile with sidebar, topbar, and profile sections.
 * Reuses PageLayout (sidebar + topbar), and Profile sections/elements.
 * 
 * Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=5615-214865&m=dev
 * 
 * Layout:
 * - PageLayout shell (TopBar + Sidebar)
 * - Content: Page title "Tutor Profile" (h3)
 * - Upload Profile Pic (from Profile/Elements)
 * - Basic Information section (from Profile/Sections)
 * - Status & Clearance section (from Profile/Sections)
 * - Background & Matching section (from Profile/Sections)
 * 
 * Typography:
 * - Page title: h3 (Lato Bold, 28px, line-height 1.429) in --color-on-surface
 * 
 * Colors:
 * - Content area bg: --color-surface (#f9f9fc) — handled by PageLayout
 * - Page bg: --color-surface-container — handled by PageLayout
 * 
 * Spacing:
 * - Content padding: var(--size-surface-pad-y, 24px) / var(--size-surface-pad-x, 32px) — handled by PageLayout
 * - Content gap: var(--size-surface-gap-md, 24px) — handled by PageLayout
 * - Sections gap: var(--size-surface-gap-md, 24px)
 * 
 * Breadcrumbs: Home / Profile
 * Sidebar: tutor user type, active tab: none specific (profile page)
 */

import React from 'react';
import PropTypes from 'prop-types';
import { PageLayout } from '../../../Universal/Pages';
import { UploadProfilePic } from '../../Elements/UploadProfilePic.stories';
import { BasicInformationSection } from '../../Sections/BasicInformation.stories';
import { StatusSection } from '../../Sections/Status.stories';
import { BackgroundAndMatchingSection } from '../../Sections/BackgroundAndMatching.stories';

const TutorProfilePage = ({
    changed = false,
    profileState = 'unfilled',
    className = '',
    ...props
}) => {
    const topBarConfig = {
        breadcrumbs: [
            { text: 'Home', href: '#' },
            { text: 'Profile' }
        ],
        user: {
            name: 'John Doe',
            counter: true,
            counterValue: 2,
        },
    };

    const sidebarConfig = {
        user: 'tutor',
    };

    return (
        <PageLayout
            topBarConfig={topBarConfig}
            sidebarConfig={sidebarConfig}
            id="tutor-profile-page"
            className={className}
            {...props}
        >
            {/* Page Content */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--size-surface-gap-md, 24px)',
                    width: '100%',
                }}
            >
                {/* Page Title */}
                <h3
                    className="h3"
                    style={{
                        color: 'var(--color-on-surface)',
                        margin: 0,
                    }}
                >
                    Tutor Profile
                </h3>

                {/* Upload Profile Pic */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        width: '100%',
                    }}
                >
                    <UploadProfilePic state={profileState} />
                </div>

                {/* Basic Information Section */}
                <BasicInformationSection changed={changed} />

                {/* Status & Clearance Section */}
                <StatusSection />

                {/* Background & Matching Section */}
                <BackgroundAndMatchingSection changed={changed} />
            </div>
        </PageLayout>
    );
};

TutorProfilePage.propTypes = {
    /** Whether any form fields have been changed (enables Save buttons) */
    changed: PropTypes.bool,
    /** Profile pic state: 'unfilled' or 'filled' */
    profileState: PropTypes.oneOf(['unfilled', 'filled']),
    /** Additional CSS class */
    className: PropTypes.string,
};

export default TutorProfilePage;
