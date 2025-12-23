/**
 * Training/Lessons Specs - Tables
 * 
 * Table components for training lessons.
 * 
 * Components:
 * - LessonListItem: Expandable list item for lessons
 */

import React, { useState } from 'react';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import StaticBadgeSmart from '@/components/StaticBadgeSmart';

export default {
    title: 'Specs/Training/Lessons/Tables',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Table and list components for training lessons interface.',
            },
        },
    },
};

/**
 * Overview
 */
export const Overview = () => (
    <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
        <h2 className="h2" style={{ marginBottom: '24px' }}>Training Lesson Tables</h2>
        <div style={{
            padding: '16px',
            backgroundColor: 'var(--color-surface-container)',
            borderRadius: '8px'
        }}>
            <h4 className="h4">LessonListItem</h4>
            <p className="body2-txt">Expandable list item showing lesson details with header row</p>
        </div>
    </div>
);

/**
 * LessonListItem
 */
export const LessonListItem = () => {
    const [expanded, setExpanded] = useState(null);

    const lessons = [
        { id: 1, title: 'Building Trust', comp: 'specific', status: 'Completed', progress: 100, date: '2024-01-15' },
        { id: 2, title: 'Setting Goals', comp: 'measurable', status: 'In Progress', progress: 60, date: '2024-01-18' },
        { id: 3, title: 'Time Management', comp: 'timely', status: 'Not Started', progress: 0, date: '—' }
    ];

    return (
        <div style={{ padding: '24px' }}>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Lesson List</h6>
            <div style={{
                border: '1px solid var(--color-outline-variant)',
                borderRadius: '8px',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 80px',
                    gap: '16px',
                    padding: '12px 16px',
                    backgroundColor: 'var(--color-surface-container)',
                    borderBottom: '1px solid var(--color-outline-variant)',
                    fontWeight: 600
                }}>
                    <span className="body2-txt">Lesson</span>
                    <span className="body2-txt">Competency</span>
                    <span className="body2-txt">Status</span>
                    <span className="body2-txt">Last Updated</span>
                    <span className="body2-txt">Action</span>
                </div>

                {/* Items */}
                {lessons.map(lesson => (
                    <div key={lesson.id}>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '2fr 1fr 1fr 1fr 80px',
                                gap: '16px',
                                padding: '12px 16px',
                                borderBottom: expanded === lesson.id ? 'none' : '1px solid var(--color-outline-variant)',
                                cursor: 'pointer',
                                backgroundColor: expanded === lesson.id ? 'var(--color-surface-container-low)' : 'transparent'
                            }}
                            onClick={() => setExpanded(expanded === lesson.id ? null : lesson.id)}
                        >
                            <span className="body2-txt" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className={`fas fa-chevron-${expanded === lesson.id ? 'down' : 'right'}`} />
                                {lesson.title}
                            </span>
                            <span><StaticBadgeSmart competency={lesson.comp} /></span>
                            <span>
                                <Badge
                                    text={lesson.status}
                                    style={lesson.status === 'Completed' ? 'success' : lesson.status === 'In Progress' ? 'info' : 'secondary'}
                                />
                            </span>
                            <span className="body2-txt">{lesson.date}</span>
                            <span>
                                <Button text="View" style="ghost" size="small" />
                            </span>
                        </div>

                        {expanded === lesson.id && (
                            <div style={{
                                padding: '16px 16px 16px 48px',
                                backgroundColor: 'var(--color-surface-container-low)',
                                borderBottom: '1px solid var(--color-outline-variant)'
                            }}>
                                <p className="body2-txt">Expanded content for {lesson.title}. Progress: {lesson.progress}%</p>
                                <Button text="Open Lesson" style="primary" size="small" className="mt-2" />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
