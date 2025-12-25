/**
 * Training/Onboarding Specs - Cards
 * 
 * Card components for onboarding.
 * 
 * Components:
 * - OnboardingAlertCard: Alert/welcome card
 * - OnboardingModuleCard: Module card with progress
 */

import React from 'react';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Progress from '@/components/Progress';
import Alert from '@/components/Alert';

export default {
    title: 'Specs/Training/Onboarding/Cards',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Card components for onboarding interface.',
            },
        },
    },
};

/**
 * Overview
 */
export const Overview = () => (
    <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
        <h2 className="h2" style={{ marginBottom: '24px' }}>Onboarding Cards</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
                { name: 'OnboardingAlertCard', desc: 'Welcome/intro alert card with CTA' },
                { name: 'OnboardingModuleCard', desc: 'Module card showing progress and actions' }
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
 * OnboardingAlertCard
 */
export const OnboardingAlertCard = () => (
    <div style={{ padding: '24px', maxWidth: '600px' }}>
        <h6 className="h6" style={{ marginBottom: '16px' }}>Onboarding Alert Card</h6>
        <Alert style="info">
            <Alert.Icon><i className="fas fa-graduation-cap" /></Alert.Icon>
            <Alert.Title>Welcome to Tutor Training!</Alert.Title>
            <Alert.Content>
                Complete the onboarding modules to get started. You'll learn essential skills for effective tutoring.
            </Alert.Content>
        </Alert>
    </div>
);

/**
 * OnboardingModuleCard
 */
export const OnboardingModuleCard = () => (
    <div style={{ padding: '24px' }}>
        <h6 className="h6" style={{ marginBottom: '16px' }}>Onboarding Module Cards</h6>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {[
                { title: 'Platform Overview', status: 'Complete', progress: 100, time: '15 min' },
                { title: 'Your First Session', status: 'In Progress', progress: 60, time: '20 min' },
                { title: 'Student Management', status: 'Not Started', progress: 0, time: '25 min' }
            ].map((mod, i) => (
                <Card key={i} style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <Badge
                            text={mod.status}
                            style={mod.status === 'Complete' ? 'success' : mod.status === 'In Progress' ? 'info' : 'secondary'}
                        />
                        <span className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>{mod.time}</span>
                    </div>
                    <h4 className="h4" style={{ marginBottom: '12px' }}>{mod.title}</h4>
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
