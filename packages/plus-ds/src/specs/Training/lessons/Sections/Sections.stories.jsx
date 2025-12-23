/**
 * Training/Lessons Specs - Sections
 * 
 * Section-level components for training lessons.
 * 
 * Components:
 * - StudentOverview: Student progress overview section
 * - WelcomeRow: Welcome banner section
 * - CompetencyHeader: Competency area header
 */

import React from 'react';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import Progress from '@/components/Progress';
import StaticBadgeSmart from '@/components/StaticBadgeSmart';
import UserAvatar from '@/components/UserAvatar';

export default {
    title: 'Specs/Training/Lessons/Sections',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Section-level components for training lessons interface.',
            },
        },
    },
};

/**
 * Overview
 */
export const Overview = () => (
    <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
        <h2 className="h2" style={{ marginBottom: '24px' }}>Training Lesson Sections</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
                { name: 'StudentOverview', desc: 'Student progress overview with metrics' },
                { name: 'WelcomeRow', desc: 'Welcome banner with greeting and quick actions' },
                { name: 'CompetencyHeader', desc: 'Header section for competency area' }
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
 * StudentOverview
 */
export const StudentOverview = () => (
    <div style={{ padding: '24px' }}>
        <h6 className="h6" style={{ marginBottom: '16px' }}>Student Overview Section</h6>
        <Card style={{ padding: '24px' }}>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                <UserAvatar firstChar="S" name="Sarah Johnson" type="regular tutor" />
                <div style={{ flex: 1 }}>
                    <h3 className="h3">Sarah Johnson</h3>
                    <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', marginTop: '4px' }}>
                        Grade 8 • Started Jan 15, 2024
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '20px' }}>
                        {[
                            { label: 'Lessons', value: '12/24' },
                            { label: 'Avg Score', value: '85%' },
                            { label: 'Time Spent', value: '6.5h' },
                            { label: 'Streak', value: '5 days' }
                        ].map(stat => (
                            <div key={stat.label}>
                                <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>{stat.label}</p>
                                <p className="h4">{stat.value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Card>
    </div>
);

/**
 * WelcomeRow
 */
export const WelcomeRow = () => (
    <div style={{ padding: '24px' }}>
        <h6 className="h6" style={{ marginBottom: '16px' }}>Welcome Row Section</h6>
        <div style={{
            padding: '32px',
            background: 'linear-gradient(135deg, var(--color-primary-container) 0%, var(--color-secondary-container) 100%)',
            borderRadius: '16px'
        }}>
            <h2 className="h2" style={{ marginBottom: '8px' }}>Welcome back, John! 👋</h2>
            <p className="body1-txt" style={{ marginBottom: '20px' }}>
                You have 3 lessons in progress. Keep up the great work!
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-primary">Continue Learning</button>
                <button className="btn btn-ghost">View All Lessons</button>
            </div>
        </div>
    </div>
);

/**
 * CompetencyHeader
 */
export const CompetencyHeader = () => (
    <div style={{ padding: '24px' }}>
        <h6 className="h6" style={{ marginBottom: '16px' }}>Competency Header Section</h6>
        <div style={{
            padding: '24px',
            backgroundColor: 'var(--color-surface-container)',
            borderRadius: '12px',
            borderLeft: '4px solid var(--color-smart-specific)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <StaticBadgeSmart competency="specific" />
                    <h3 className="h3" style={{ margin: '12px 0 8px' }}>Specific Goals</h3>
                    <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        8 lessons • 75% complete
                    </p>
                </div>
                <Progress now={75} style={{ width: '200px' }} />
            </div>
        </div>
    </div>
);
