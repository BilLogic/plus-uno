/**
 * Training/Onboarding Specs - Pages
 * 
 * Page-level components for onboarding.
 * 
 * Components:
 * - OnboardingOverview: Main onboarding overview page
 * - OnboardingModulePage: Individual module page
 */

import React from 'react';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Progress from '@/components/Progress';
import Breadcrumb from '@/components/Breadcrumb';

export default {
    title: 'Specs/Training/Onboarding/Pages',
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'Page-level components for onboarding interface.',
            },
        },
    },
};

/**
 * Overview
 */
export const Overview = () => (
    <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
        <h2 className="h2" style={{ marginBottom: '24px' }}>Onboarding Pages</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
                { name: 'OnboardingOverview', desc: 'Main page with all onboarding modules' },
                { name: 'OnboardingModulePage', desc: 'Individual module content page' }
            ].map(item => (
                <div key={item.name} style={{
                    padding: '16px',
                    backgroundColor: 'var(--color-surface-container)',
                    borderRadius: '8px'
                }}>
                    <h4 className="h4">{item.name}</h4>
                    <p className="body2-txt">{item.desc}</p>
                </div>
            ))}
        </div>
    </div>
);

/**
 * OnboardingOverview
 */
export const OnboardingOverview = () => (
    <div style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-surface)',
        padding: '24px'
    }}>
        <Breadcrumb>
            <Breadcrumb.Item href="#">Training</Breadcrumb.Item>
            <Breadcrumb.Item active>Onboarding</Breadcrumb.Item>
        </Breadcrumb>

        {/* Welcome Section */}
        <div style={{
            padding: '32px',
            background: 'linear-gradient(135deg, var(--color-primary-container) 0%, var(--color-secondary-container) 100%)',
            borderRadius: '16px',
            margin: '24px 0 32px'
        }}>
            <h1 className="h2" style={{ marginBottom: '8px' }}>Welcome to PLUS Onboarding</h1>
            <p className="body1-txt" style={{ marginBottom: '16px' }}>
                Complete these modules to get started as a tutor. You're 40% complete!
            </p>
            <Progress now={40} style={{ maxWidth: '300px' }} />
        </div>

        {/* Modules Grid */}
        <h3 className="h3" style={{ marginBottom: '20px' }}>Onboarding Modules</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {[
                { title: 'Platform Overview', desc: 'Learn how to navigate the PLUS platform', status: 'Complete', progress: 100 },
                { title: 'Your First Session', desc: 'Prepare for your first tutoring session', status: 'In Progress', progress: 60 },
                { title: 'Student Management', desc: 'Learn to track and support your students', status: 'Not Started', progress: 0 },
                { title: 'Communication Tools', desc: 'Master messaging and feedback tools', status: 'Not Started', progress: 0 },
                { title: 'Assessment Basics', desc: 'Understand student assessment methods', status: 'Not Started', progress: 0 }
            ].map((mod, i) => (
                <Card key={i} style={{ padding: '24px' }}>
                    <Badge
                        text={mod.status}
                        style={mod.status === 'Complete' ? 'success' : mod.status === 'In Progress' ? 'info' : 'secondary'}
                    />
                    <h4 className="h4" style={{ margin: '12px 0 8px' }}>{mod.title}</h4>
                    <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', marginBottom: '16px' }}>
                        {mod.desc}
                    </p>
                    <Progress now={mod.progress} style={{ marginBottom: '16px' }} />
                    <Button
                        text={mod.progress === 100 ? 'Review' : mod.progress > 0 ? 'Continue' : 'Start'}
                        style="primary"
                        className="w-100"
                    />
                </Card>
            ))}
        </div>
    </div>
);

/**
 * OnboardingModulePage
 */
export const OnboardingModulePage = () => (
    <div style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-surface)',
        padding: '24px'
    }}>
        <Breadcrumb>
            <Breadcrumb.Item href="#">Training</Breadcrumb.Item>
            <Breadcrumb.Item href="#">Onboarding</Breadcrumb.Item>
            <Breadcrumb.Item active>Platform Overview</Breadcrumb.Item>
        </Breadcrumb>

        <div style={{ maxWidth: '800px', margin: '24px auto' }}>
            <Badge text="Complete" style="success" />
            <h1 className="h2" style={{ margin: '12px 0 8px' }}>Platform Overview</h1>
            <p className="body1-txt" style={{ color: 'var(--color-on-surface-variant)', marginBottom: '24px' }}>
                Step 1 of 5 • 15 minutes
            </p>

            <Card style={{ padding: '32px', marginBottom: '24px' }}>
                <h3 className="h3" style={{ marginBottom: '16px' }}>Welcome to PLUS</h3>
                <p className="body1-txt" style={{ marginBottom: '16px' }}>
                    PLUS is a comprehensive tutoring platform designed to help you succeed.
                    This module will introduce you to the main features and navigation.
                </p>
                <p className="body1-txt" style={{ marginBottom: '24px' }}>
                    By the end of this module, you'll be able to:
                </p>
                <ul className="body1-txt" style={{ paddingLeft: '24px', marginBottom: '24px' }}>
                    <li>Navigate the main dashboard</li>
                    <li>Access your student roster</li>
                    <li>View and manage your schedule</li>
                    <li>Find training resources</li>
                </ul>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <Button text="Previous" style="ghost" />
                    <Button text="Next: Navigation Basics" style="primary" />
                </div>
            </Card>
        </div>
    </div>
);
