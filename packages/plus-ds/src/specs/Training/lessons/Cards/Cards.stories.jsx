/**
 * Training/Lessons Specs - Cards
 * 
 * Card components for training lessons.
 * 
 * Components:
 * - LessonCard: Individual lesson card with progress and status
 * - SupervisorAlert: Alert card for supervisors (AI-enabled/disabled)
 */

import React from 'react';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Progress from '@/components/Progress';
import Alert from '@/components/Alert';
import StaticBadgeSmart from '@/components/StaticBadgeSmart';

export default {
    title: 'Specs/Training/Lessons/Cards',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Card components for training lessons interface.',
            },
        },
    },
};

/**
 * Overview
 */
export const Overview = () => (
    <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
        <h2 className="h2" style={{ marginBottom: '24px' }}>Training Lesson Cards</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
                { name: 'LessonCard', desc: 'Individual lesson card with SMART badge, progress, and actions' },
                { name: 'SupervisorAlert', desc: 'Alert for supervisors about AI features or student status' }
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
 * LessonCard
 */
export const LessonCard = () => (
    <div style={{ padding: '24px' }}>
        <h6 className="h6" style={{ marginBottom: '16px' }}>Lesson Card</h6>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {[
                { title: 'Building Trust', comp: 'specific', progress: 75, status: 'In Progress' },
                { title: 'Goal Setting', comp: 'measurable', progress: 100, status: 'Completed' },
                { title: 'Time Management', comp: 'timely', progress: 0, status: 'Not Started' }
            ].map((lesson, i) => (
                <Card key={i} style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <StaticBadgeSmart competency={lesson.comp} />
                        <Badge
                            text={lesson.status}
                            style={lesson.status === 'Completed' ? 'success' : lesson.status === 'In Progress' ? 'info' : 'secondary'}
                        />
                    </div>
                    <h4 className="h4" style={{ marginBottom: '8px' }}>{lesson.title}</h4>
                    <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', marginBottom: '12px' }}>
                        Learn strategies for {lesson.title.toLowerCase()}.
                    </p>
                    <Progress now={lesson.progress} style={{ marginBottom: '16px' }} />
                    <Button
                        text={lesson.progress === 100 ? 'Review' : lesson.progress > 0 ? 'Continue' : 'Start'}
                        style="primary"
                        className="w-100"
                    />
                </Card>
            ))}
        </div>
    </div>
);

/**
 * LessonCardStates
 */
export const LessonCardStates = () => (
    <div style={{ padding: '24px' }}>
        <h6 className="h6" style={{ marginBottom: '16px' }}>Lesson Card States</h6>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Card style={{ padding: '20px', width: '280px' }}>
                <Badge text="Default" style="secondary" />
                <h4 className="h4" style={{ margin: '12px 0 8px' }}>Default State</h4>
                <p className="body2-txt">Normal card appearance</p>
            </Card>
            <Card style={{ padding: '20px', width: '280px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                <Badge text="Hover" style="info" />
                <h4 className="h4" style={{ margin: '12px 0 8px' }}>Hover State</h4>
                <p className="body2-txt">Elevated with shadow</p>
            </Card>
        </div>
    </div>
);

/**
 * SupervisorAlert
 */
export const SupervisorAlert = () => (
    <div style={{ padding: '24px', maxWidth: '600px' }}>
        <h6 className="h6" style={{ marginBottom: '16px' }}>Supervisor Alerts</h6>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Alert style="info">
                <Alert.Icon><i className="fas fa-robot" /></Alert.Icon>
                <Alert.Title>AI Features Enabled</Alert.Title>
                <Alert.Content>AI-assisted feedback is available for this lesson. Students will receive automated suggestions.</Alert.Content>
            </Alert>
            <Alert style="warning">
                <Alert.Icon><i className="fas fa-exclamation-triangle" /></Alert.Icon>
                <Alert.Title>Attention Required</Alert.Title>
                <Alert.Content>3 students have not completed this lesson. Consider sending a reminder.</Alert.Content>
            </Alert>
        </div>
    </div>
);
