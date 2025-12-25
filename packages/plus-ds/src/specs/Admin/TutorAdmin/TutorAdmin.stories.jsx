/**
 * Admin/TutorAdmin Specs
 * 
 * Components for tutor administration.
 */

import React from 'react';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Progress from '@/components/Progress';
import UserAvatar from '@/components/UserAvatar';

export default {
    title: 'Specs/Admin/Tutor Admin',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Admin components for managing tutors.',
            },
        },
    },
};

/**
 * Overview
 */
export const Overview = () => (
    <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
        <h2 className="h2" style={{ marginBottom: '24px' }}>Tutor Admin Components</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
                { name: 'TutorsTable', desc: 'Table listing all tutors with performance metrics' },
                { name: 'TutorOverviewModal', desc: 'Modal showing tutor details and stats' },
                { name: 'DataCard', desc: 'Data visualization card for tutor metrics' },
                { name: 'TutorToolUsageSection', desc: 'Section showing tool usage analytics' }
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
 * TutorsTable
 */
export const TutorsTable = () => (
    <div style={{ padding: '24px' }}>
        <h6 className="h6" style={{ marginBottom: '16px' }}>Tutors Performance Table</h6>
        <div style={{
            border: '1px solid var(--color-outline-variant)',
            borderRadius: '8px',
            overflow: 'hidden'
        }}>
            <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 100px',
                gap: '16px',
                padding: '12px 16px',
                backgroundColor: 'var(--color-surface-container)',
                borderBottom: '1px solid var(--color-outline-variant)',
                fontWeight: 600
            }}>
                <span className="body2-txt">Tutor</span>
                <span className="body2-txt">Students</span>
                <span className="body2-txt">Sessions</span>
                <span className="body2-txt">Training</span>
                <span className="body2-txt">Rating</span>
                <span className="body2-txt">Status</span>
                <span className="body2-txt">Actions</span>
            </div>

            {[
                { name: 'John Doe', type: 'lead tutor', students: 8, sessions: 42, training: 100, rating: 4.8, status: 'Active' },
                { name: 'Jane Wilson', type: 'regular tutor', students: 6, sessions: 35, training: 85, rating: 4.5, status: 'Active' },
                { name: 'Mike Chen', type: 'regular tutor', students: 5, sessions: 28, training: 60, rating: 4.2, status: 'Training' }
            ].map((tutor, i) => (
                <div key={i} style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 100px',
                    gap: '16px',
                    padding: '12px 16px',
                    borderBottom: i < 2 ? '1px solid var(--color-outline-variant)' : 'none',
                    alignItems: 'center'
                }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <UserAvatar firstChar={tutor.name.charAt(0)} name={tutor.name} type={tutor.type} />
                        <span className="body2-txt">{tutor.name}</span>
                    </span>
                    <span className="body2-txt">{tutor.students}</span>
                    <span className="body2-txt">{tutor.sessions}</span>
                    <span>
                        <Progress now={tutor.training} style={{ width: '60px', height: '6px' }} />
                    </span>
                    <span className="body2-txt">⭐ {tutor.rating}</span>
                    <span>
                        <Badge text={tutor.status} style={tutor.status === 'Active' ? 'success' : 'info'} />
                    </span>
                    <span><Button text="View" style="ghost" size="small" /></span>
                </div>
            ))}
        </div>
    </div>
);

/**
 * DataCard
 */
export const DataCard = () => (
    <div style={{ padding: '24px' }}>
        <h6 className="h6" style={{ marginBottom: '16px' }}>Tutor Data Cards</h6>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {[
                { label: 'Active Tutors', value: '24', trend: '+3', icon: 'user-check' },
                { label: 'In Training', value: '8', trend: '-2', icon: 'graduation-cap' },
                { label: 'Avg Sessions/Week', value: '12.5', trend: '+1.2', icon: 'calendar' },
                { label: 'Avg Rating', value: '4.6', trend: '+0.1', icon: 'star' }
            ].map(card => (
                <Card key={card.label} style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>{card.label}</p>
                            <p className="h2" style={{ margin: '8px 0 4px' }}>{card.value}</p>
                            <Badge
                                text={card.trend}
                                style={card.trend.startsWith('+') ? 'success' : 'danger'}
                            />
                        </div>
                        <i className={`fas fa-${card.icon}`} style={{ fontSize: '24px', color: 'var(--color-primary)' }} />
                    </div>
                </Card>
            ))}
        </div>
    </div>
);

/**
 * TutorToolUsageSection
 */
export const TutorToolUsageSection = () => (
    <div style={{ padding: '24px' }}>
        <h6 className="h6" style={{ marginBottom: '16px' }}>Tool Usage Analytics</h6>
        <Card style={{ padding: '24px' }}>
            <h4 className="h4" style={{ marginBottom: '16px' }}>Most Used Features</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                    { tool: 'Session Notes', usage: 92 },
                    { tool: 'Student Feedback', usage: 85 },
                    { tool: 'Resource Library', usage: 78 },
                    { tool: 'Progress Reports', usage: 65 },
                    { tool: 'Messaging', usage: 58 }
                ].map(item => (
                    <div key={item.tool} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span className="body2-txt" style={{ width: '140px' }}>{item.tool}</span>
                        <Progress now={item.usage} style={{ flex: 1 }} />
                        <span className="body3-txt" style={{ width: '40px', textAlign: 'right' }}>{item.usage}%</span>
                    </div>
                ))}
            </div>
        </Card>
    </div>
);
