import React from 'react';
import PageLayout from '@plus-ds/specs/Universal/Pages/PageLayout/PageLayout';
import Card from '@plus-ds/components/Card';
import Table from '@plus-ds/components/Table';
import Badge from '@plus-ds/components/Badge';
import Button from '@plus-ds/components/Button';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

const StudentGoalsDashboard = ({ student, onBack }) => {
    // Fallback if no student was clicked (e.g., initial load dev testing)
    const studentName = student ? student.name : 'Amanda Novak';

    const chartOptions = {
        chart: {
            type: 'pie',
            backgroundColor: 'transparent',
            height: 250
        },
        title: {
            text: 'Goal Progress',
            style: {
                fontFamily: 'var(--font-family-body)',
                fontSize: 'var(--font-size-body1)'
            }
        },
        credits: { enabled: false },
        plotOptions: {
            pie: {
                innerSize: '60%',
                dataLabels: { enabled: false },
                showInLegend: true
            }
        },
        series: [{
            name: 'Goals',
            data: [
                { name: 'Achieved', y: 3, color: 'var(--color-success)' },
                { name: 'In Progress', y: 2, color: 'var(--color-warning)' },
                { name: 'Not Started', y: 1, color: 'var(--color-outline)' }
            ]
        }]
    };

    const goalHeaders = [
        { text: 'Goal Description', width: '40%' },
        { text: 'Target Date', width: '20%' },
        { text: 'Status', width: '20%' },
        { text: 'Action', width: '20%' }
    ];

    const goalRows = [
        [
            'Improve math fraction scores to 85%',
            '12/15/2026',
            <Badge style="success" fill="tonal">Achieved</Badge>,
            <Button size="small" style="primary" fill="outline" text="View Details" />
        ],
        [
            'Read 3 books per month',
            '11/30/2026',
            <Badge style="warning" fill="tonal">In Progress</Badge>,
            <Button size="small" style="primary" fill="outline" text="View Details" />
        ],
        [
            'Participate in classroom discussions',
            '12/01/2026',
            <Badge style="info" fill="tonal">On Track</Badge>,
            <Button size="small" style="primary" fill="outline" text="View Details" />
        ]
    ];

    return (
        <PageLayout
            topBarConfig={{
                breadcrumbs: [
                    { text: 'Dashboard', href: '#', onClick: (e) => { e.preventDefault(); onBack(); } },
                    { text: `${studentName}'s Goals`, active: true }
                ],
                user: { name: 'Admin', role: 'admin' }
            }}
            sidebarConfig={{
                activeTabId: 'students'
            }}
        >
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-section-gap-md)',
                width: '100%'
            }}>

                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 className="h3-txt" style={{ margin: 0 }}>{studentName}'s Objectives</h1>
                        <p className="body1-txt" style={{
                            color: 'var(--color-on-surface-variant)',
                            marginTop: 'var(--size-element-gap-xs)'
                        }}>
                            Track and manage student progress tracking and learning outcomes.
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 'var(--size-section-gap-md)' }}>
                    {/* Goal Progress Chart */}
                    <div style={{ flex: 1 }}>
                        <Card title="Goal Progress Overview">
                            <HighchartsReact highcharts={Highcharts} options={chartOptions} />
                        </Card>
                    </div>

                    {/* Quick Stats */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-md)' }}>
                        <Card title="Total Active Goals">
                            <div className="display3-txt" style={{ color: 'var(--color-primary)' }}>6</div>
                        </Card>
                        <Card title="Recent Activity">
                            <p className="body1-txt" style={{ marginTop: 'var(--size-element-gap-sm)' }}>
                                {studentName} successfully completed a reading goal on 11/05!
                            </p>
                        </Card>
                    </div>
                </div>

                {/* Goals Table */}
                <Card
                    title="Current Action Plan"
                    actions={<Button size="small" style="primary" fill="filled" text="Assign New Goal" />}
                >
                    <Table
                        headers={goalHeaders}
                        rows={goalRows}
                        hover={true}
                    />
                </Card>
            </div>
        </PageLayout>
    );
};

export default StudentGoalsDashboard;
