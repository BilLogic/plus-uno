/**
 * Home Specs - Cards
 * 
 * Card components for home page and dashboard.
 * 
 * Components:
 * - OverviewCard: SMART competency overview cards
 * - ResourceCard: Resource display card
 * - MetricsCard: Key metrics display
 * - DataVisualization: Chart/progress visualization cards
 * - RecommendedLessons: Recommended lessons list
 * - TrainingProgressCard: Training progress summary
 */

import React from 'react';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Progress from '@/components/Progress';
import StaticBadgeSmart from '@/components/StaticBadgeSmart';

export default {
    title: 'Specs/Home/Cards',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Card components for home page and dashboard. Self-contained cards for displaying data, metrics, and content.',
            },
        },
    },
};

/**
 * Overview
 * All home page card types.
 */
export const Overview = () => (
    <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
        <h2 className="h2" style={{ marginBottom: 'var(--size-section-pad-y-md)' }}>Home Cards</h2>
        <p className="body1-txt" style={{ marginBottom: 'var(--size-card-gap-lg)' }}>
            Card components for home page and dashboard.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-card-gap-md)' }}>
            {[
                { name: 'OverviewCard', desc: 'SMART competency cards (relationships, socio-emotional, mastering, advocacy, technology)' },
                { name: 'MetricsCard', desc: 'Status, completion, accuracy, time-spent, effort, progress metrics' },
                { name: 'ResourceCard', desc: 'Resource display with type icons' },
                { name: 'DataVisualization', desc: 'Skills progress and overview charts' },
                { name: 'RecommendedLessons', desc: 'Recommended lessons list with responsive layout' },
                { name: 'TrainingProgressCard', desc: 'Training progress summary (default/small sizes)' }
            ].map(item => (
                <div key={item.name} style={{
                    padding: '16px',
                    border: '1px solid var(--color-outline-variant)',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-surface-container)'
                }}>
                    <h4 className="h4">{item.name}</h4>
                    <p className="body2-txt">{item.desc}</p>
                </div>
            ))}
        </div>
    </div>
);

/**
 * OverviewCards - SMART Competencies
 * Cards for each SMART competency area.
 */
export const OverviewCards = () => (
    <div style={{ padding: 'var(--size-section-pad-y-lg)' }}>
        <h6 className="h6" style={{ marginBottom: '16px' }}>SMART Competency Cards</h6>
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px'
        }}>
            {['specific', 'measurable', 'attainable', 'relevant', 'timely'].map(comp => (
                <Card key={comp} style={{ padding: '20px' }}>
                    <StaticBadgeSmart competency={comp} />
                    <h4 className="h4" style={{ margin: '12px 0 8px', textTransform: 'capitalize' }}>{comp}</h4>
                    <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        {Math.floor(Math.random() * 20) + 5} lessons
                    </p>
                    <Progress now={Math.floor(Math.random() * 60) + 20} style={{ marginTop: '12px' }} />
                </Card>
            ))}
        </div>
    </div>
);

/**
 * MetricsCards
 * Cards showing key metrics.
 */
export const MetricsCards = () => (
    <div style={{ padding: 'var(--size-section-pad-y-lg)' }}>
        <h6 className="h6" style={{ marginBottom: '16px' }}>Metrics Cards</h6>
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '16px'
        }}>
            {[
                { label: 'Completion', value: '78%', badge: '+5%', badgeStyle: 'success' },
                { label: 'Accuracy', value: '92%', badge: '+2%', badgeStyle: 'success' },
                { label: 'Time Spent', value: '12.5h', badge: '-1h', badgeStyle: 'danger' },
                { label: 'Sessions', value: '24', badge: 'New', badgeStyle: 'info' }
            ].map(metric => (
                <Card key={metric.label} style={{ padding: '16px', textAlign: 'center' }}>
                    <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>{metric.label}</p>
                    <h3 className="h2" style={{ margin: '8px 0' }}>{metric.value}</h3>
                    <Badge text={metric.badge} style={metric.badgeStyle} />
                </Card>
            ))}
        </div>
    </div>
);

/**
 * ResourceCard
 * Card displaying a resource item.
 */
export const ResourceCard = () => (
    <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '400px' }}>
        <h6 className="h6" style={{ marginBottom: '16px' }}>Resource Card</h6>
        <Card style={{ padding: '20px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: 'var(--color-primary-container)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <i className="fas fa-file-pdf" style={{ fontSize: '24px', color: 'var(--color-primary)' }} />
                </div>
                <div style={{ flex: 1 }}>
                    <h4 className="h4">Training Guide</h4>
                    <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', marginTop: '4px' }}>
                        PDF • 2.4 MB
                    </p>
                </div>
            </div>
            <Button text="Download" style="primary" className="mt-3 w-100" />
        </Card>
    </div>
);

/**
 * RecommendedLessons
 * Card showing recommended lessons.
 */
export const RecommendedLessons = () => (
    <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '500px' }}>
        <h6 className="h6" style={{ marginBottom: '16px' }}>Recommended Lessons</h6>
        <Card style={{ padding: '20px' }}>
            <h4 className="h4" style={{ marginBottom: '16px' }}>Recommended for You</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                    { title: 'Building Relationships', competency: 'specific', progress: 45 },
                    { title: 'Goal Setting Strategies', competency: 'measurable', progress: 20 },
                    { title: 'Time Management', competency: 'timely', progress: 0 }
                ].map((lesson, i) => (
                    <div key={i} style={{
                        padding: '12px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--color-surface-container-low)',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'center'
                    }}>
                        <StaticBadgeSmart competency={lesson.competency} />
                        <div style={{ flex: 1 }}>
                            <p className="body2-txt">{lesson.title}</p>
                            <Progress now={lesson.progress} style={{ marginTop: '4px', height: '4px' }} />
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    </div>
);

/**
 * TrainingProgressCard
 * Training progress summary card.
 */
export const TrainingProgressCard = () => (
    <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '400px' }}>
        <h6 className="h6" style={{ marginBottom: '16px' }}>Training Progress Card</h6>
        <Card style={{ padding: '20px' }}>
            <h4 className="h4">Your Training Progress</h4>
            <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)', marginTop: '4px' }}>
                12 of 24 modules completed
            </p>
            <Progress now={50} label="50%" style={{ marginTop: '16px' }} />
            <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                <Button text="Continue" style="primary" />
                <Button text="View All" style="ghost" />
            </div>
        </Card>
    </div>
);
