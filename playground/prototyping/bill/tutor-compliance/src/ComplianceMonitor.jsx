import React, { useState } from 'react';
import {
    Table,
    Badge,
    Button,
    Select
} from '@tutors.plus/design-system';

const ComplianceMonitor = () => {
    // ---- Mock Data ----
    const [filterTime, setFilterTime] = useState('24h');
    const [filterCompliance, setFilterCompliance] = useState('all');
    const [filterSchool, setFilterSchool] = useState('all');
    const [filterTutor, setFilterTutor] = useState('all');

    const sessions = [
        {
            id: 1,
            date: '2024-01-15',
            time: '14:30',
            school: 'Lincoln HS',
            teacher: 'Ms. Kim',
            tutors: ['Sarah Johnson', 'Michael Chen'],
            issues: [
                { type: 'Camera off', count: 1 },
                { type: 'Language', count: 1 }
            ]
        },
        {
            id: 2,
            date: '2024-01-15',
            time: '15:45',
            school: 'Washington Elementary',
            teacher: 'Mr. Davis',
            tutors: ['David Lee'],
            issues: [
                { type: 'Late Arrival', count: 5 },
                { type: 'Inappropriate Content', count: 1 }
            ]
        },
        {
            id: 3,
            date: '2024-01-16',
            time: '09:00',
            school: 'Jefferson Middle',
            teacher: 'Mrs. Garcia',
            tutors: ['Emily Wilson', 'James Taylor', 'Olivia Brown'],
            issues: [] // Clean session
        },
        {
            id: 4,
            date: '2024-01-16',
            time: '10:15',
            school: 'Roosevelt HS',
            teacher: 'Mr. Smith',
            tutors: ['Sophia Anderson'],
            issues: [
                { type: 'Camera off', count: 1 }
            ]
        }
    ];

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            height: '100%'
        }}>
            {/* Header */}
            <div>
                <h1 style={{ marginBottom: '8px', fontFamily: 'var(--font-family-header)' }}>Compliance Monitor</h1>
                <p className="body1-txt" style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
                    AI-powered session triage and review
                </p>
            </div>

            {/* Filters */}
            <div style={{
                display: 'flex',
                gap: '12px',
                paddingBottom: '24px',
                borderBottom: '1px solid var(--color-outline-variant)'
            }}>
                <div style={{ width: '160px' }}>
                    <Select
                        value={filterTime}
                        onChange={(e) => setFilterTime(e.target.value)}
                        options={[
                            { value: '24h', label: 'Last 24 Hours' },
                            { value: '7d', label: 'Last 7 Days' },
                            { value: '30d', label: 'Last 30 Days' }
                        ]}
                    />
                </div>
                <div style={{ width: '160px' }}>
                    <Select
                        value={filterCompliance}
                        onChange={(e) => setFilterCompliance(e.target.value)}
                        options={[
                            { value: 'all', label: 'All Compliance' },
                            { value: 'flagged', label: 'Flagged' },
                            { value: 'clean', label: 'Clean' }
                        ]}
                    />
                </div>
                <div style={{ width: '200px' }}>
                    <Select
                        value={filterSchool}
                        onChange={(e) => setFilterSchool(e.target.value)}
                        options={[
                            { value: 'all', label: 'All Schools / Teachers' },
                            { value: 'lincoln', label: 'Lincoln HS' },
                            { value: 'washington', label: 'Washington Elementary' }
                        ]}
                    />
                </div>
                <div style={{ width: '160px' }}>
                    <Select
                        value={filterTutor}
                        onChange={(e) => setFilterTutor(e.target.value)}
                        options={[
                            { value: 'all', label: 'All Tutors' },
                            { value: 'sarah', label: 'Sarah Johnson' },
                            { value: 'michael', label: 'Michael Chen' }
                        ]}
                    />
                </div>
            </div>

            {/* Main Table */}
            <div style={{
                border: '1px solid var(--color-outline-variant)',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: 'var(--color-surface)'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: 'var(--color-surface-container-low)' }}>
                        <tr>
                            <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid var(--color-outline-variant)', width: '25%' }}>Session</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid var(--color-outline-variant)', width: '25%' }}>Tutors</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid var(--color-outline-variant)', width: '35%' }}>Issues</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid var(--color-outline-variant)', width: '15%' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sessions.map(session => (
                            <tr key={session.id} style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span className="subtitle2-txt">{session.date} {session.time}</span>
                                        <span className="body2-txt" style={{ color: 'var(--color-text-secondary)' }}>
                                            {session.school} · {session.teacher}
                                        </span>
                                    </div>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {session.tutors.map((tutor, idx) => (
                                            <span key={idx} style={{
                                                backgroundColor: 'var(--color-surface-variant)',
                                                color: 'var(--color-on-surface-variant)',
                                                padding: '4px 8px',
                                                borderRadius: '16px',
                                                fontSize: '12px',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {tutor}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {session.issues.length > 0 ? (
                                            session.issues.map((issue, idx) => (
                                                <Badge
                                                    key={idx}
                                                    text={`${issue.type} ${issue.count}`}
                                                    style="danger"
                                                />
                                            ))
                                        ) : (
                                            <span className="body2-txt" style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>No issues detected</span>
                                        )}
                                    </div>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <Button style="secondary" size="small">Review session</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ComplianceMonitor;
