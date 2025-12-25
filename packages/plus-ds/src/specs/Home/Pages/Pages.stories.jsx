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
import Sidebar from '@/components/Sidebar';
import Breadcrumb from '@/components/Breadcrumb';
import UserAvatar from '@/components/UserAvatar';
import Footer from '@/components/Footer';

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
 * Overview
 * Home pages summary.
 */
export const Overview = () => (
    <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
        <h2 className="h2" style={{ marginBottom: 'var(--size-section-pad-y-md)' }}>Home Pages</h2>
        <p className="body1-txt" style={{ marginBottom: 'var(--size-card-gap-lg)' }}>
            Complete page-level components for home and dashboard.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-card-gap-md)' }}>
            {[
                { name: 'HomePage', desc: 'Main dashboard with metrics, progress, and recommended content' },
                { name: 'SkillsOverview', desc: 'Overview of all SMART competency skills' }
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
 * HomePage
 * Main dashboard page.
 */
export const HomePage = () => (
    <div style={{
        minHeight: '100vh',
        display: 'flex',
        backgroundColor: 'var(--color-surface)'
    }}>
        {/* Sidebar */}
        <div style={{
            width: '250px',
            flexShrink: 0,
            backgroundColor: 'var(--color-surface-container)'
        }}>
            <Sidebar user="tutor" visible={true} />
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* TopBar */}
            <header style={{
                backgroundColor: 'var(--color-surface-container)',
                padding: '12px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--color-outline-variant)'
            }}>
                <Breadcrumb>
                    <Breadcrumb.Item href="#">Home</Breadcrumb.Item>
                    <Breadcrumb.Item active>Dashboard</Breadcrumb.Item>
                </Breadcrumb>
                <UserAvatar firstChar="J" name="John Doe" counter counterValue={3} />
            </header>

            {/* Content */}
            <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
                <h1 className="h2" style={{ marginBottom: '8px' }}>Welcome back, John!</h1>
                <p className="body1-txt" style={{ color: 'var(--color-on-surface-variant)', marginBottom: '32px' }}>
                    Here's your progress summary
                </p>

                {/* Metrics Row */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
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
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '16px',
                    marginBottom: '32px'
                }}>
                    {['specific', 'measurable', 'attainable', 'relevant', 'timely'].map(c => (
                        <Card key={c} style={{ padding: '16px' }}>
                            <StaticBadgeSmart competency={c} />
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
            </main>

            {/* Footer */}
            <footer style={{
                backgroundColor: 'var(--color-surface-container)',
                padding: '16px 24px',
                borderTop: '1px solid var(--color-outline-variant)'
            }}>
                <Footer version="v5.2.0" copyright="© 2024 CMU" />
            </footer>
        </div>
    </div>
);

/**
 * SkillsOverview
 * SMART skills overview page.
 */
export const SkillsOverview = () => (
    <div style={{ padding: '32px', backgroundColor: 'var(--color-surface)', minHeight: '100vh' }}>
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
                    <StaticBadgeSmart competency={skill.comp} />
                    <h3 className="h3" style={{ margin: '16px 0 8px' }}>{skill.title}</h3>
                    <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        {skill.lessons} lessons • {skill.progress}% complete
                    </p>
                    <Progress now={skill.progress} style={{ marginTop: '16px' }} />
                    <Button text="View Lessons" style="primary" className="mt-4 w-100" />
                </Card>
            ))}
        </div>
    </div>
);
