/**
 * Admin/SessionAdmin Specs
 * 
 * Components for session administration.
 */

import React from 'react';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Modal from '@/components/Modal';

export default {
    title: 'Specs/Admin/Session Admin',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Admin components for managing tutoring sessions.',
            },
        },
    },
};

/**
 * Overview
 */
export const Overview = () => (
    <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
        <h2 className="h2" style={{ marginBottom: '24px' }}>Session Admin Components</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
                { name: 'SessionsTable', desc: 'Table listing all sessions with status' },
                { name: 'SessionBreakdownModal', desc: 'Modal showing session details' },
                { name: 'SessionOverviewSection', desc: 'Overview metrics for sessions' }
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
 * SessionsTable
 */
export const SessionsTable = () => (
    <div style={{ padding: '24px' }}>
        <h6 className="h6" style={{ marginBottom: '16px' }}>Sessions Table</h6>
        <div style={{
            border: '1px solid var(--color-outline-variant)',
            borderRadius: '8px',
            overflow: 'hidden'
        }}>
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 1fr 100px',
                gap: '16px',
                padding: '12px 16px',
                backgroundColor: 'var(--color-surface-container)',
                borderBottom: '1px solid var(--color-outline-variant)',
                fontWeight: 600
            }}>
                <span className="body2-txt">Session</span>
                <span className="body2-txt">Student</span>
                <span className="body2-txt">Tutor</span>
                <span className="body2-txt">Date</span>
                <span className="body2-txt">Status</span>
                <span className="body2-txt">Actions</span>
            </div>

            {[
                { session: 'Session #1234', student: 'Sarah Johnson', tutor: 'John Doe', date: 'Today, 2:00 PM', status: 'Completed' },
                { session: 'Session #1235', student: 'Mike Smith', tutor: 'Jane Wilson', date: 'Today, 3:30 PM', status: 'In Progress' },
                { session: 'Session #1236', student: 'Emily Davis', tutor: 'John Doe', date: 'Tomorrow, 10:00 AM', status: 'Scheduled' }
            ].map((s, i) => (
                <div key={i} style={{
                    display: 'grid',
                    gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 1fr 100px',
                    gap: '16px',
                    padding: '12px 16px',
                    borderBottom: i < 2 ? '1px solid var(--color-outline-variant)' : 'none',
                    alignItems: 'center'
                }}>
                    <span className="body2-txt">{s.session}</span>
                    <span className="body2-txt">{s.student}</span>
                    <span className="body2-txt">{s.tutor}</span>
                    <span className="body3-txt">{s.date}</span>
                    <span>
                        <Badge
                            text={s.status}
                            style={s.status === 'Completed' ? 'success' : s.status === 'In Progress' ? 'info' : 'secondary'}
                        />
                    </span>
                    <span><Button text="View" style="ghost" size="small" /></span>
                </div>
            ))}
        </div>
    </div>
);

/**
 * SessionOverviewSection
 */
export const SessionOverviewSection = () => (
    <div style={{ padding: '24px' }}>
        <h6 className="h6" style={{ marginBottom: '16px' }}>Session Overview Metrics</h6>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {[
                { label: 'Today', value: '24', sub: '+5 from yesterday' },
                { label: 'This Week', value: '156', sub: 'On track' },
                { label: 'Avg Duration', value: '42 min', sub: '+3 min vs last week' },
                { label: 'Completion Rate', value: '94%', sub: 'Excellent' }
            ].map(metric => (
                <Card key={metric.label} style={{ padding: '20px' }}>
                    <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>{metric.label}</p>
                    <p className="h2" style={{ margin: '8px 0 4px' }}>{metric.value}</p>
                    <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>{metric.sub}</p>
                </Card>
            ))}
        </div>
    </div>
);
