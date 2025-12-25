/**
 * Admin/GroupAdmin Specs
 * 
 * Components for group administration.
 */

import React, { useState } from 'react';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Progress from '@/components/Progress';
import Breadcrumb from '@/components/Breadcrumb';

export default {
    title: 'Specs/Admin/Group Admin',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Admin components for managing groups of students/tutors.',
            },
        },
    },
};

/**
 * Overview
 */
export const Overview = () => (
    <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
        <h2 className="h2" style={{ marginBottom: '24px' }}>Group Admin Components</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
                { name: 'GroupsTable', desc: 'Table listing all groups with actions' },
                { name: 'GroupInfoCard', desc: 'Card showing group details' },
                { name: 'GroupTrainingProgress', desc: 'Group training progress overview' },
                { name: 'GroupAdminPage', desc: 'Full admin page for group management' }
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
 * GroupsTable
 */
export const GroupsTable = () => (
    <div style={{ padding: '24px' }}>
        <h6 className="h6" style={{ marginBottom: '16px' }}>Groups Table</h6>
        <div style={{
            border: '1px solid var(--color-outline-variant)',
            borderRadius: '8px',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 100px',
                gap: '16px',
                padding: '12px 16px',
                backgroundColor: 'var(--color-surface-container)',
                borderBottom: '1px solid var(--color-outline-variant)',
                fontWeight: 600
            }}>
                <span className="body2-txt">Group Name</span>
                <span className="body2-txt">Members</span>
                <span className="body2-txt">Status</span>
                <span className="body2-txt">Completion</span>
                <span className="body2-txt">Last Active</span>
                <span className="body2-txt">Actions</span>
            </div>

            {/* Rows */}
            {[
                { name: 'Math Tutors A', members: 12, status: 'Active', completion: 85, date: 'Today' },
                { name: 'Reading Group B', members: 8, status: 'Active', completion: 72, date: 'Yesterday' },
                { name: 'Summer Session', members: 15, status: 'Inactive', completion: 100, date: 'Dec 15' }
            ].map((group, i) => (
                <div key={i} style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 100px',
                    gap: '16px',
                    padding: '12px 16px',
                    borderBottom: i < 2 ? '1px solid var(--color-outline-variant)' : 'none',
                    alignItems: 'center'
                }}>
                    <span className="body2-txt">{group.name}</span>
                    <span className="body2-txt">{group.members}</span>
                    <span>
                        <Badge text={group.status} style={group.status === 'Active' ? 'success' : 'secondary'} />
                    </span>
                    <span>
                        <Progress now={group.completion} style={{ width: '80px', height: '6px' }} />
                    </span>
                    <span className="body3-txt">{group.date}</span>
                    <span>
                        <Button text="View" style="ghost" size="small" />
                    </span>
                </div>
            ))}
        </div>
    </div>
);

/**
 * GroupInfoCard
 */
export const GroupInfoCard = () => (
    <div style={{ padding: '24px', maxWidth: '400px' }}>
        <h6 className="h6" style={{ marginBottom: '16px' }}>Group Info Card</h6>
        <Card style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                    <h3 className="h3">Math Tutors A</h3>
                    <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>Created Sep 1, 2024</p>
                </div>
                <Badge text="Active" style="success" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '20px' }}>
                {[
                    { label: 'Members', value: '12' },
                    { label: 'Avg Completion', value: '85%' },
                    { label: 'Sessions', value: '48' },
                    { label: 'Avg Score', value: '92%' }
                ].map(stat => (
                    <div key={stat.label}>
                        <p className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>{stat.label}</p>
                        <p className="h4">{stat.value}</p>
                    </div>
                ))}
            </div>

            <Button text="Manage Group" style="primary" className="w-100" />
        </Card>
    </div>
);
