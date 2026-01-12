/**
 * OnboardingInnerPage - Training Onboarding Page
 * 
 * Full page layout for individual onboarding module with content, alert, iframe, and reflection form.
 * Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=74-121860
 */

import React, { useState, useEffect } from 'react';
import OnboardingInnerPage from './OnboardingInnerPage';
import ResponsiveFrame from '../ResponsiveFrame';
import './OnboardingInnerPage.scss';

export default {
    title: 'Specs/Training/Onboarding/Pages/OnboardingInnerPage',
    component: OnboardingInnerPage,
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Full page layout for individual onboarding module. Shows content description, alert card, iframe for Google Sites, reflection question form, and completion modal.',
            },
        },
        layout: 'fullscreen',
    },
    argTypes: {
        breakpoint: {
            control: { type: 'select' },
            options: ['md', 'lg', 'xl', 'xxl'],
            description: 'Responsive breakpoint (md: 768px, lg: 992px, xl: 1200px, xxl: 1400px)',
            table: { category: 'Responsive' },
        },
        moduleTitle: {
            control: 'text',
            description: 'Module title',
            table: { category: 'Content' },
        },
        moduleDescription: {
            control: 'text',
            description: 'Module description',
            table: { category: 'Content' },
        },
        moduleDuration: {
            control: 'text',
            description: 'Estimated module duration',
            table: { category: 'Content' },
        },
        badgeType: {
            control: { type: 'select' },
            options: ['image', 'video', 'audio', 'document', 'book', 'website', 'other'],
            description: 'Badge type for content blurb',
            table: { category: 'Content' },
        },
        showAlert: {
            control: 'boolean',
            description: 'Show/hide alert card',
            table: { category: 'State' },
        },
        showCompletionModal: {
            control: 'boolean',
            description: 'Show completion modal overlay',
            table: { category: 'State' },
        },
    },
};

/**
 * Docs
 * Documentation for OnboardingInnerPage component
 */
export const Docs = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
            <h2 className="h2" style={{ marginBottom: '24px' }}>OnboardingInnerPage</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Description</h4>
                    <p className="body2-txt">
                        Full page layout for individual onboarding module. Contains resource description
                        with ContentBlurb, dismissible alert card, iframe for embedded content (Google Sites),
                        and reflection question form. Shows completion modal upon submission.
                    </p>
                </section>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Features</h4>
                    <ul className="body2-txt" style={{ listStyle: 'disc', paddingLeft: '24px' }}>
                        <li>TopBar with breadcrumbs (Home → Onboarding → Module Name)</li>
                        <li>Sidebar navigation</li>
                        <li>ContentBlurb with title, description, duration, badge, action button</li>
                        <li>Illustration placeholder area</li>
                        <li>Dismissible alert card reminding to complete module</li>
                        <li>Iframe section for Google Sites content</li>
                        <li>StrategyContentPromptModal for reflection question</li>
                        <li>ModuleCompletionModal overlay on submission</li>
                    </ul>
                </section>
                <section>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>Figma Reference</h4>
                    <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Node ID: 74-121860
                    </p>
                </section>
            </div>
        </div>
    ),
};

/**
 * Overview
 * Static rendering matching Figma design exactly
 */
export const Overview = {
    render: (args) => (
        <ResponsiveFrame breakpoint={args.breakpoint}>
            <OnboardingInnerPage
                moduleTitle="PLUS APP Usage"
                moduleDescription="Learn how to use the PLUS tutoring application effectively."
                moduleDuration="Estimated Time: 15 minutes"
                badgeType="image"
                showAlert={true}
                showCompletionModal={false}
            />
        </ResponsiveFrame>
    ),
    parameters: {
        layout: 'fullscreen',
    },
    args: {
        breakpoint: 'lg',
    },
};

/**
 * WithCompletionModal
 * Shows the page with completion modal overlay
 */
export const WithCompletionModal = {
    render: (args) => (
        <ResponsiveFrame breakpoint={args.breakpoint}>
            <OnboardingInnerPage
                moduleTitle="PLUS APP Usage"
                moduleDescription="Learn how to use the PLUS tutoring application effectively."
                moduleDuration="Estimated Time: 15 minutes"
                badgeType="image"
                showAlert={false}
                showCompletionModal={true}
            />
        </ResponsiveFrame>
    ),
    parameters: {
        layout: 'fullscreen',
    },
    args: {
        breakpoint: 'lg',
    },
};

/**
 * Interactive
 * Interactive playground with Storybook controls
 */
export const Interactive = {
    render: (args) => {
        const [showModal, setShowModal] = useState(args.showCompletionModal);

        // Sync with args
        useEffect(() => {
            setShowModal(args.showCompletionModal);
        }, [args.showCompletionModal]);

        return (
            <ResponsiveFrame breakpoint={args.breakpoint}>
                <OnboardingInnerPage
                    moduleTitle={args.moduleTitle}
                    moduleDescription={args.moduleDescription}
                    moduleDuration={args.moduleDuration}
                    badgeType={args.badgeType}
                    showAlert={args.showAlert}
                    showCompletionModal={showModal}
                    reflectionQuestion="What's one specific action you plan to take in your next session based on what you learned in this module?"
                    onModuleComplete={(data) => {
                        console.log('Module completed:', data);
                        setShowModal(true);
                    }}
                    onBackToOverview={() => {
                        console.log('Back to overview');
                        setShowModal(false);
                    }}
                />
            </ResponsiveFrame>
        );
    },
    args: {
        breakpoint: 'lg',
        moduleTitle: 'Welcome to PLUS',
        moduleDescription: 'This module introduces you to the PLUS tutoring platform and its core features.',
        moduleDuration: 'Estimated Time: 9 minutes',
        badgeType: 'image',
        showAlert: true,
        showCompletionModal: false,
    },
};
