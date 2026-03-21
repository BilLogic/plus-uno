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
 * - BadgeCard: Badge display cards with claim/view actions
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
                { name: 'TrainingProgressCard', desc: 'Training progress summary (default/small sizes)' },
                { name: 'BadgeCard', desc: 'Badge display cards with claim/view actions for certified tutor badges' }
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

