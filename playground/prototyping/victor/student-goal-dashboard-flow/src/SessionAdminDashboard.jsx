import React, { useState } from 'react';
import Card from '@plus-ds/components/Card';
import NavTabs from '@plus-ds/components/NavTabs';
import Badge from '@plus-ds/components/Badge';
import Table from '@plus-ds/components/Table';
import TopBar from '@plus-ds/specs/Universal/Sections/TopBar/TopBar';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import Button from '@plus-ds/components/Button';

// Mock Data
const sessionData = [
    ...Array(12).fill().map((_, i) => ({
        id: i,
        date: 'DoW (00/00/00)',
        shift: '2:25 PM - 3:15 PM',
        school: 'Hogwarts',
        teacher: 'Snape',
        attended: '8%',
        entries: '8'
    }))
];

const SessionAdminDashboard = ({ onRowClick, onAssignClick }) => {
    const [activeTab, setActiveTab] = useState('Details');

    const tabs = [
        { label: 'Warnings', id: 'Warnings' },
        { label: 'Current Tutors', id: 'Current Tutors' },
        { label: 'Incoming Tutors', id: 'Incoming Tutors' },
        { label: 'Details', id: 'Details' }
    ];

    // Chart configs
    const timeAllocationOptions = {
        chart: { type: 'pie', height: 200, style: { fontFamily: 'var(--font-family-body)' } },
        title: { text: null },
        plotOptions: {
            pie: {
                innerSize: '70%',
                dataLabels: { enabled: false }
            }
        },
        series: [{
            name: 'Needs',
            data: [
                { name: 'Motivation', y: 60, color: '#CFA7CD' }, // roughly matched figma
                { name: 'Content', y: 30, color: '#97E6D7' },
                { name: 'Other', y: 10, color: '#666' }
            ]
        }],
        credits: { enabled: false }
    };

    const attendanceOptions = {
        chart: { type: 'pie', height: 200, style: { fontFamily: 'var(--font-family-body)' } },
        title: { text: null },
        plotOptions: {
            pie: {
                innerSize: '70%',
                dataLabels: { enabled: false }
            }
        },
        series: [{
            name: 'Attendance',
            data: [
                { name: 'Joined', y: 99, color: '#68C477' },
                { name: 'Didn\'t join', y: 1, color: '#E5E5E5' }
            ]
        }],
        credits: { enabled: false }
    };

    const engagementOptions = {
        chart: { type: 'pie', height: 200, style: { fontFamily: 'var(--font-family-body)' } },
        title: { text: null },
        plotOptions: {
            pie: {
                innerSize: '70%',
                dataLabels: { enabled: false }
            }
        },
        series: [{
            name: 'Engagement',
            data: [
                { name: 'Fully Engaged', y: 80, color: '#68C477' },
                { name: 'Partially', y: 20, color: '#F1D86E' }
            ]
        }],
        credits: { enabled: false }
    };

    return (
        <div style={{ backgroundColor: 'var(--base-color-neutral-100)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

            <TopBar
                mode="expanded"
                breadcrumbs={[{ text: 'Home', href: '#' }, { text: 'Session Admin' }]}
                user={{ name: 'John Doe', counter: true, counterValue: 2, type: 'regular tutor' }}
            />

            <div style={{ padding: 'var(--size-element-pad-y-lg) var(--size-section-gap-lg)', flex: 1 }}>
                <NavTabs tabs={tabs} activeTab={activeTab} onClick={(id) => setActiveTab(id)} />

                {activeTab === 'Details' && (
                    <div style={{ marginTop: 'var(--size-element-pad-y-lg)' }}>

                        {/* Session Overview Section */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--size-element-pad-y-md)' }}>
                            <h3 style={{ margin: 0, fontSize: 'var(--font-size-heading4)', fontWeight: 'bold' }}>Session Overview</h3>
                            <div style={{ display: 'flex', gap: 'var(--size-element-pad-x-sm)', fontSize: '13px', color: 'var(--color-text-subtle)' }}>
                                <span>All Schools ▾</span>
                                <span>All Tutors ▾</span>
                                <span style={{ color: 'var(--color-text-link)' }}>11/01/12 ▾</span> to <span style={{ color: 'var(--color-text-link)' }}>12/20/12 ▾</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 'var(--size-element-pad-x-md)', marginBottom: 'var(--size-section-gap-md)' }}>
                            <Card style={{ flex: 1 }}>
                                <div style={{ padding: 'var(--size-element-pad-y-md)', textAlign: 'center' }}>
                                    <h4 style={{ fontSize: 'var(--font-size-body2)', fontWeight: 'bold', marginBottom: 'var(--size-element-pad-y-sm)' }}>Time Allocation by Student Needs Info</h4>
                                    <HighchartsReact highcharts={Highcharts} options={timeAllocationOptions} />
                                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', marginTop: '10px' }}>
                                        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>60%</div>
                                        <div style={{ fontSize: '11px', color: 'var(--color-text-subtle)', lineHeight: 1.2 }}>on addressing<br />Motivation<br />Needs</div>
                                    </div>
                                </div>
                            </Card>
                            <Card style={{ flex: 1 }}>
                                <div style={{ padding: 'var(--size-element-pad-y-md)', textAlign: 'center' }}>
                                    <h4 style={{ fontSize: 'var(--font-size-body2)', fontWeight: 'bold', marginBottom: 'var(--size-element-pad-y-sm)' }}>Student Attendance Info</h4>
                                    <HighchartsReact highcharts={Highcharts} options={attendanceOptions} />
                                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', marginTop: '10px' }}>
                                        <div style={{ fontSize: '32px', fontWeight: 'bold' }}>99%</div>
                                        <div style={{ fontSize: '11px', color: 'var(--color-text-subtle)', lineHeight: 1.2 }}>attended the<br />session</div>
                                    </div>
                                </div>
                            </Card>
                            <Card style={{ flex: 1 }}>
                                <div style={{ padding: 'var(--size-element-pad-y-md)', textAlign: 'center' }}>
                                    <h4 style={{ fontSize: 'var(--font-size-body2)', fontWeight: 'bold', marginBottom: 'var(--size-element-pad-y-sm)' }}>Student Engagement Info</h4>
                                    <HighchartsReact highcharts={Highcharts} options={engagementOptions} />
                                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', marginTop: '10px' }}>
                                        {/* Placeholder for engagement data */}
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Session Details Section */}
                        <h3 style={{ margin: 0, marginBottom: 'var(--size-element-pad-y-md)', fontSize: 'var(--font-size-heading4)', fontWeight: 'bold' }}>Session Details</h3>
                        <Card>
                            <Table
                                headers={[
                                    { text: 'Day (Date) ↑', width: '20%' },
                                    { text: 'Shift (ET) ↑', width: '15%' },
                                    { text: 'School ↑', width: '15%' },
                                    { text: 'Teacher ↑', width: '15%' },
                                    { text: 'Attended students ↑', width: '15%' },
                                    { text: 'Entries ↑', width: '10%' },
                                    { text: 'Action', width: '10%' }
                                ]}
                                rows={sessionData.map(row => [
                                    row.date,
                                    row.shift,
                                    row.school,
                                    row.teacher,
                                    <span style={{ color: 'var(--color-text-danger)' }}>{row.attended}</span>,
                                    <span style={{ color: 'var(--color-text-danger)' }}>{row.entries}</span>,
                                    <Button
                                        size="small"
                                        style="primary"
                                        fill="outline"
                                        text="Assign"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onAssignClick) onAssignClick(row, e);
                                        }}
                                    />
                                ])}
                                onRowClick={(rowIndex) => onRowClick(sessionData[rowIndex])}
                                hover
                                style={{ cursor: 'pointer' }}
                            />
                        </Card>

                    </div>
                )}
            </div>
        </div>
    );
};

export default SessionAdminDashboard;
