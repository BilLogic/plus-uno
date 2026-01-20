/**
 * Home Specs - Pages
 * 
 * Complete page-level components for home/dashboard.
 * 
 * Components:
 * - SkillsOverview: Overview page showing all SMART skills
 * - HomePage: Main home page with dashboard widgets
 */

import React from 'react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Progress from '@/components/Progress';
import Badge from '@/components/Badge';
import StaticBadgeSmart from '@/components/StaticBadgeSmart';
import Breadcrumb from '@/components/Breadcrumb';
import { PageLayout } from '@/specs/Universal/Pages';

export default {
    title: 'Specs/Home/Pages',
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'Complete page-level components for home/dashboard.',
            },
        },
    },
};

/**
 * HomePage
 * Main dashboard page.
 */
export const HomePage = () => {
    const topBarConfig = {
        user: { name: 'John Doe', avatar: 'https://via.placeholder.com/150' }, // Example user data
        breadcrumbs: [
            { text: 'Home', href: '#' },
            { text: 'Dashboard', active: true }
        ]
    };

    const sidebarConfig = {
        user: 'tutor', // Or appropriate user type
    };

    return (
        <PageLayout
            topBarConfig={topBarConfig}
            sidebarConfig={sidebarConfig}
        >
            <h1 className="h2" style={{ marginBottom: '8px' }}>Welcome back, John!</h1>
            <p className="body1-txt" style={{ color: 'var(--color-on-surface-variant)', marginBottom: '32px' }}>
                Here's your progress summary
            </p>

            {/* Metrics Row */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', // improved responsiveness
                gap: '16px',
                marginBottom: '32px'
            }}>
                {[
                    { label: 'Completion', value: '78%', badge: '+5%' },
                    { label: 'Accuracy', value: '92%', badge: '+2%' },
                    { label: 'Sessions', value: '24', badge: '' },
                    { label: 'Time', value: '12.5h', badge: '' }
                ].map(m => (
                    <Card key={m.label} style={{ padding: '16px', textAlign: 'center' }}>
                        <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>{m.label}</p>
                        <h3 className="h2" style={{ margin: '8px 0' }}>{m.value}</h3>
                        {m.badge && <Badge text={m.badge} style="success" />}
                    </Card>
                ))}
            </div>

            {/* SMART Cards */}
            <h4 className="h4" style={{ marginBottom: '16px' }}>Your SMART Progress</h4>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', // improved responsiveness
                gap: '16px',
                marginBottom: '32px'
            }}>
                {['specific', 'measurable', 'attainable', 'relevant', 'timely'].map(c => (
                    <Card key={c} style={{ padding: '16px' }}>
                        <StaticBadgeSmart type={c} />
                        <Progress now={Math.floor(Math.random() * 60) + 20} style={{ marginTop: '12px' }} />
                    </Card>
                ))}
            </div>

            {/* Recent Activity */}
            <h4 className="h4" style={{ marginBottom: '16px' }}>Recommended Lessons</h4>
            <Card style={{ padding: '20px' }}>
                {['Building Relationships', 'Goal Setting', 'Time Management'].map((title, i) => (
                    <div key={i} style={{
                        padding: '12px',
                        borderBottom: i < 2 ? '1px solid var(--color-outline-variant)' : 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <span className="body2-txt">{title}</span>
                        <Button text="Start" style="ghost" size="small" />
                    </div>
                ))}
            </Card>
        </PageLayout>
    );
};

/**
 * SkillsOverview
 * SMART skills overview page.
 */
export const SkillsOverview = () => {
    // Assuming SkillsOverview also shares the layout, or maybe it's a standalone page.
    // For now, wrapping it in PageLayout to be consistent with "Specs" usually showing full pages.
    // However, if it was intended to be just the content, we can adjust.
    // Given the previous code had full page structure (minHeight 100vh), using PageLayout is safer.

    const topBarConfig = {
        user: { name: 'John Doe' },
        breadcrumbs: [
            { text: 'Home', href: '#' },
            { text: 'Skills Overview', active: true }
        ]
    };

    return (
        <PageLayout topBarConfig={topBarConfig} sidebarConfig={{ user: 'tutor' }}>
            <h1 className="h2" style={{ marginBottom: '24px' }}>Skills Overview</h1>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '24px'
            }}>
                {[
                    { comp: 'specific', title: 'Specific Goals', lessons: 8, progress: 75 },
                    { comp: 'measurable', title: 'Measurable Outcomes', lessons: 6, progress: 45 },
                    { comp: 'attainable', title: 'Attainable Targets', lessons: 10, progress: 60 },
                    { comp: 'relevant', title: 'Relevant Skills', lessons: 5, progress: 30 },
                    { comp: 'timely', title: 'Timely Execution', lessons: 7, progress: 55 }
                ].map(skill => (
                    <Card key={skill.comp} style={{ padding: '24px' }}>
                        <StaticBadgeSmart type={skill.comp} />
                        <h3 className="h3" style={{ margin: '16px 0 8px' }}>{skill.title}</h3>
                        <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                            {skill.lessons} lessons • {skill.progress}% complete
                        </p>
                        <Progress now={skill.progress} style={{ marginTop: '16px' }} />
                        <Button text="View Lessons" style="primary" className="mt-4 w-100" />
                    </Card>
                ))}
            </div>
        </PageLayout>
    );
};
