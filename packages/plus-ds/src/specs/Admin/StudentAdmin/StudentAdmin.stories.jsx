/**
 * Admin/StudentAdmin Specs
 * 
 * Components for student administration.
 */

import React from 'react';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Progress from '@/components/Progress';
import UserAvatar from '@/components/UserAvatar';

export default {
    title: 'Specs/Admin/Student Admin',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Admin components for managing students.',
            },
        },
    },
};

/**
 * Overview
 */
export const Overview = () => (
    <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
        <h2 className="h2" style={{ marginBottom: '24px' }}>Student Admin Components</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
                { name: 'StudentsTable', desc: 'Table listing all students with progress' },
                { name: 'StudentDetailModal', desc: 'Modal showing student details' },
                { name: 'StudentAdminContainer', desc: 'Container section for student admin' }
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
 * StudentsTable
 */
export const StudentsTable = () => (
    <div style={{ padding: '24px' }}>
        <h6 className="h6" style={{ marginBottom: '16px' }}>Students Table</h6>
        <div style={{
            border: '1px solid var(--color-outline-variant)',
            borderRadius: '8px',
            overflow: 'hidden'
        }}>
            <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 100px',
                gap: '16px',
                padding: '12px 16px',
                backgroundColor: 'var(--color-surface-container)',
                borderBottom: '1px solid var(--color-outline-variant)',
                fontWeight: 600
            }}>
                <span className="body2-txt">Student</span>
                <span className="body2-txt">Grade</span>
                <span className="body2-txt">Progress</span>
                <span className="body2-txt">Last Session</span>
                <span className="body2-txt">Status</span>
                <span className="body2-txt">Actions</span>
            </div>

            {[
                { name: 'Sarah Johnson', grade: '8th', progress: 85, session: 'Today', status: 'Active' },
                { name: 'Mike Smith', grade: '7th', progress: 62, session: 'Yesterday', status: 'Active' },
                { name: 'Emily Davis', grade: '9th', progress: 45, session: 'Dec 18', status: 'At Risk' },
                { name: 'James Brown', grade: '8th', progress: 92, session: 'Today', status: 'Active' }
            ].map((student, i) => (
                <div key={i} style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 100px',
                    gap: '16px',
                    padding: '12px 16px',
                    borderBottom: i < 3 ? '1px solid var(--color-outline-variant)' : 'none',
                    alignItems: 'center'
                }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <UserAvatar firstChar={student.name.charAt(0)} name={student.name} />
                        <span className="body2-txt">{student.name}</span>
                    </span>
                    <span className="body2-txt">{student.grade}</span>
                    <span>
                        <Progress now={student.progress} style={{ width: '80px', height: '6px' }} />
                    </span>
                    <span className="body3-txt">{student.session}</span>
                    <span>
                        <Badge text={student.status} style={student.status === 'Active' ? 'success' : 'danger'} />
                    </span>
                    <span><Button text="View" style="ghost" size="small" /></span>
                </div>
            ))}
        </div>
    </div>
);

/**
 * StudentAdminContainer
 */
export const StudentAdminContainer = () => (
    <div style={{ padding: '24px' }}>
        <h6 className="h6" style={{ marginBottom: '16px' }}>Student Admin Container</h6>
        <Card style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h3 className="h3">Student Management</h3>
                    <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>Manage and monitor student progress</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Button text="Export" style="secondary" />
                    <Button text="Add Student" style="primary" />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                {[
                    { label: 'Total Students', value: '156' },
                    { label: 'Active', value: '142' },
                    { label: 'At Risk', value: '8' },
                    { label: 'Inactive', value: '6' }
                ].map(stat => (
                    <div key={stat.label} style={{
                        padding: '16px',
                        backgroundColor: 'var(--color-surface-container-low)',
                        borderRadius: '8px',
                        textAlign: 'center'
                    }}>
                        <p className="h2">{stat.value}</p>
                        <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>{stat.label}</p>
                    </div>
                ))}
            </div>
        </Card>
    </div>
);
