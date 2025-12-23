/**
 * Training/Lessons Specs - Pages
 * 
 * Page-level components for training lessons.
 * 
 * Components:
 * - LessonsOverview: Overview page with lesson list
 * - LessonDetail: Individual lesson detail page
 */

import React from 'react';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Progress from '@/components/Progress';
import StaticBadgeSmart from '@/components/StaticBadgeSmart';
import Breadcrumb from '@/components/Breadcrumb';

export default {
    title: 'Specs/Training/Lessons/Pages',
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'Page-level components for training lessons interface.',
            },
        },
    },
};

/**
 * Overview
 */
export const Overview = () => (
    <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
        <h2 className="h2" style={{ marginBottom: '24px' }}>Training Lesson Pages</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
                { name: 'LessonsOverview', desc: 'Overview page with all lessons in a filterable list' },
                { name: 'LessonDetail', desc: 'Individual lesson page with content and progress' }
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
 * LessonsOverview
 */
export const LessonsOverview = () => (
    <div style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-surface)',
        padding: '24px'
    }}>
        <Breadcrumb>
            <Breadcrumb.Item href="#">Training</Breadcrumb.Item>
            <Breadcrumb.Item active>Lessons</Breadcrumb.Item>
        </Breadcrumb>

        <h1 className="h2" style={{ margin: '24px 0 8px' }}>Training Lessons</h1>
        <p className="body1-txt" style={{ color: 'var(--color-on-surface-variant)', marginBottom: '32px' }}>
            Complete these lessons to build your tutoring skills
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {[
                { title: 'Building Trust', comp: 'specific', progress: 75, lessons: 6 },
                { title: 'Goal Setting', comp: 'measurable', progress: 100, lessons: 4 },
                { title: 'Growth Mindset', comp: 'attainable', progress: 50, lessons: 5 },
                { title: 'Student Engagement', comp: 'relevant', progress: 25, lessons: 7 },
                { title: 'Time Management', comp: 'timely', progress: 0, lessons: 3 }
            ].map((lesson, i) => (
                <Card key={i} style={{ padding: '24px' }}>
                    <StaticBadgeSmart competency={lesson.comp} />
                    <h3 className="h3" style={{ margin: '12px 0 8px' }}>{lesson.title}</h3>
                    <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        {lesson.lessons} lessons
                    </p>
                    <Progress now={lesson.progress} style={{ margin: '16px 0' }} />
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
 * LessonDetail
 */
export const LessonDetail = () => (
    <div style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-surface)',
        padding: '24px'
    }}>
        <Breadcrumb>
            <Breadcrumb.Item href="#">Training</Breadcrumb.Item>
            <Breadcrumb.Item href="#">Lessons</Breadcrumb.Item>
            <Breadcrumb.Item active>Building Trust</Breadcrumb.Item>
        </Breadcrumb>

        <div style={{ maxWidth: '800px', margin: '24px auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                    <StaticBadgeSmart competency="specific" />
                    <h1 className="h2" style={{ margin: '12px 0 8px' }}>Building Trust</h1>
                    <p className="body1-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                        Lesson 3 of 6 • 75% complete
                    </p>
                </div>
                <Progress now={75} style={{ width: '150px' }} />
            </div>

            <Card style={{ padding: '32px', marginBottom: '24px' }}>
                <h3 className="h3" style={{ marginBottom: '16px' }}>Establishing Rapport</h3>
                <p className="body1-txt" style={{ marginBottom: '24px' }}>
                    Building trust begins with establishing genuine rapport with your students.
                    In this lesson, you'll learn techniques for creating a welcoming environment
                    where students feel comfortable sharing their challenges and successes.
                </p>

                <div style={{
                    padding: '16px',
                    backgroundColor: 'var(--color-surface-container)',
                    borderRadius: '8px',
                    marginBottom: '24px'
                }}>
                    <h5 className="h5" style={{ marginBottom: '8px' }}>Key Takeaways</h5>
                    <ul className="body2-txt" style={{ paddingLeft: '20px', margin: 0 }}>
                        <li>Active listening techniques</li>
                        <li>Non-verbal communication cues</li>
                        <li>Building consistent routines</li>
                    </ul>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <Button text="Previous" style="ghost" />
                    <Button text="Mark Complete & Continue" style="primary" />
                </div>
            </Card>
        </div>
    </div>
);
