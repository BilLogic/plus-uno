/**
 * TutorRiskInterventionsPage Component
 * 
 * High-fidelity prototype for "Tutor Risk & Interventions" page under Tutor Admin section.
 * Based on wireframe specifications:
 * - Tab navigation (4 tabs: XXXX)
 * - Two summary stat cards at top
 * - Two chart cards (line chart + bar chart)
 * - Filter bar with 3 dropdowns (Group, Risk Level, Date Range)
 * - Risk data table with 20 rows and pagination
 * 
 * Reference patterns: TutorDataCard, TutorsPerformanceTable, TutorCompliance2Page layout
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { PageLayout } from '@/specs/Universal/Pages';
import NavTabs from '@/components/NavTabs/NavTabs';
import Dropdown from '@/components/Dropdown/Dropdown';
import Pagination from '@/components/Pagination/Pagination';
import TutorChartsElement from '@/specs/Admin/Tutor Admin/Elements/TutorChartsElement/TutorChartsElement';
import { Table } from 'react-bootstrap';
import Badge from '@/components/Badge/Badge';
import './TutorRiskInterventionsPage.scss';

const TutorRiskInterventionsPage = ({
    activeTab = 'riskInterventions',
    tutors = [],
    // Summary stats
    totalAtRisk = 12,
    totalInterventions = 28,
    // Chart data
    riskTrendData = [],
    interventionDistributionData = [],
    // Filters
    selectedGroup = 'All Groups',
    selectedRiskLevel = 'All Risk Levels',
    selectedDateRange = 'Last 30 Days',
    // Pagination
    currentPage = 1,
    totalPages = 1,
    totalEntries = 20,
    // Callbacks
    onTabChange,
    onRowClick,
    onPageChange,
    onGroupChange,
    onRiskLevelChange,
    onDateRangeChange,
    className = '',
    ...props
}) => {
    const [currentTab, setCurrentTab] = useState(activeTab);

    // Default tutor risk data - 20 rows as specified
    const defaultTutors = [
        { id: 1, name: 'Amelia Blue', group: 'Lincoln Elementary', riskLevel: 'High', riskScore: 85, interventionType: 'Performance Review', interventionDate: 'Jan 15, 2026', status: 'In Progress' },
        { id: 2, name: 'Ava Silver', group: 'Washington Middle', riskLevel: 'Medium', riskScore: 62, interventionType: 'Coaching Session', interventionDate: 'Jan 18, 2026', status: 'Scheduled' },
        { id: 3, name: 'Benjamin Green', group: 'Jefferson High', riskLevel: 'High', riskScore: 78, interventionType: 'Training Required', interventionDate: 'Jan 12, 2026', status: 'Completed' },
        { id: 4, name: 'Charlotte Rose', group: 'Lincoln Elementary', riskLevel: 'Low', riskScore: 32, interventionType: 'Check-in Call', interventionDate: 'Jan 20, 2026', status: 'Scheduled' },
        { id: 5, name: 'Daniel Black', group: 'Washington Middle', riskLevel: 'High', riskScore: 91, interventionType: 'Immediate Review', interventionDate: 'Jan 10, 2026', status: 'In Progress' },
        { id: 6, name: 'Eleanor White', group: 'Jefferson High', riskLevel: 'Medium', riskScore: 55, interventionType: 'Mentoring Assigned', interventionDate: 'Jan 22, 2026', status: 'Scheduled' },
        { id: 7, name: 'Ethan Cole', group: 'Lincoln Elementary', riskLevel: 'Low', riskScore: 28, interventionType: 'Observation', interventionDate: 'Jan 25, 2026', status: 'Scheduled' },
        { id: 8, name: 'Fiona Gray', group: 'Washington Middle', riskLevel: 'High', riskScore: 82, interventionType: 'Performance Plan', interventionDate: 'Jan 08, 2026', status: 'In Progress' },
        { id: 9, name: 'Gabriel Stone', group: 'Jefferson High', riskLevel: 'Medium', riskScore: 48, interventionType: 'Training Session', interventionDate: 'Jan 19, 2026', status: 'Completed' },
        { id: 10, name: 'Hannah Brown', group: 'Lincoln Elementary', riskLevel: 'Low', riskScore: 22, interventionType: 'Monthly Check-in', interventionDate: 'Jan 28, 2026', status: 'Scheduled' },
        { id: 11, name: 'Isaac Miller', group: 'Washington Middle', riskLevel: 'High', riskScore: 88, interventionType: 'Supervisor Meeting', interventionDate: 'Jan 11, 2026', status: 'In Progress' },
        { id: 12, name: 'Julia Davis', group: 'Jefferson High', riskLevel: 'Medium', riskScore: 58, interventionType: 'Resource Support', interventionDate: 'Jan 21, 2026', status: 'Scheduled' },
        { id: 13, name: 'Kevin Lee', group: 'Lincoln Elementary', riskLevel: 'Low', riskScore: 35, interventionType: 'Peer Collaboration', interventionDate: 'Jan 26, 2026', status: 'Scheduled' },
        { id: 14, name: 'Lily Chen', group: 'Washington Middle', riskLevel: 'High', riskScore: 79, interventionType: 'Urgent Coaching', interventionDate: 'Jan 09, 2026', status: 'Completed' },
        { id: 15, name: 'Mason Wright', group: 'Jefferson High', riskLevel: 'Medium', riskScore: 52, interventionType: 'Progress Review', interventionDate: 'Jan 23, 2026', status: 'Scheduled' },
        { id: 16, name: 'Nora Evans', group: 'Lincoln Elementary', riskLevel: 'High', riskScore: 86, interventionType: 'Intervention Plan', interventionDate: 'Jan 07, 2026', status: 'In Progress' },
        { id: 17, name: 'Oliver Scott', group: 'Washington Middle', riskLevel: 'Low', riskScore: 25, interventionType: 'Observation', interventionDate: 'Jan 29, 2026', status: 'Scheduled' },
        { id: 18, name: 'Penelope Adams', group: 'Jefferson High', riskLevel: 'Medium', riskScore: 61, interventionType: 'Skills Workshop', interventionDate: 'Jan 17, 2026', status: 'Completed' },
        { id: 19, name: 'Quinn Taylor', group: 'Lincoln Elementary', riskLevel: 'High', riskScore: 92, interventionType: 'Critical Review', interventionDate: 'Jan 06, 2026', status: 'In Progress' },
        { id: 20, name: 'Rachel Kim', group: 'Washington Middle', riskLevel: 'Medium', riskScore: 45, interventionType: 'Support Session', interventionDate: 'Jan 24, 2026', status: 'Scheduled' },
    ];

    const displayTutors = tutors.length > 0 ? tutors : defaultTutors;

    // Default trend data for line chart (risk trends over 6 weeks)
    const defaultTrendData = [
        { label: 'Week 1', values: [8, 15] },
        { label: 'Week 2', values: [10, 18] },
        { label: 'Week 3', values: [12, 22] },
        { label: 'Week 4', values: [11, 25] },
        { label: 'Week 5', values: [14, 28] },
        { label: 'Week 6', values: [12, 28] },
    ];

    // Default distribution data for bar chart (interventions by type)
    const defaultDistributionData = [
        { label: 'Review', values: [8, 4, 2] },
        { label: 'Coaching', values: [6, 3, 1] },
        { label: 'Training', values: [5, 4, 2] },
        { label: 'Support', values: [4, 3, 1] },
    ];

    const chartTrendData = riskTrendData.length > 0 ? riskTrendData : defaultTrendData;
    const chartDistributionData = interventionDistributionData.length > 0 ? interventionDistributionData : defaultDistributionData;

    const handleTabSelect = (selectedKey) => {
        setCurrentTab(selectedKey);
        if (onTabChange) {
            onTabChange(selectedKey);
        }
    };

    const topBarConfig = {
        breadcrumbs: [
            { text: 'Home', href: '#' },
            { text: 'Tutor Admin' }
        ],
        user: {
            name: 'John Doe',
            counter: true,
            counterValue: 2
        }
    };

    const sidebarConfig = {
        user: 'supervisor',
        activeTab: 'tutors',
    };

    // Get risk level badge style
    const getRiskLevelStyle = (level) => {
        switch (level) {
            case 'High': return 'danger';
            case 'Medium': return 'warning';
            case 'Low': return 'success';
            default: return 'secondary';
        }
    };

    // Get risk score badge style based on score value
    const getRiskScoreStyle = (score) => {
        if (score >= 70) return 'danger';
        if (score >= 40) return 'warning';
        return 'success';
    };

    // Get intervention status badge style
    const getStatusStyle = (status) => {
        switch (status) {
            case 'In Progress': return 'info';
            case 'Completed': return 'success';
            case 'Scheduled': return 'secondary';
            default: return 'secondary';
        }
    };

    const entriesStart = (currentPage - 1) * 20 + 1;
    const entriesEnd = Math.min(currentPage * 20, totalEntries);

    // Filter dropdown options
    const groupOptions = [
        { text: 'All Groups', onClick: () => onGroupChange && onGroupChange('All Groups') },
        { text: 'Lincoln Elementary', onClick: () => onGroupChange && onGroupChange('Lincoln Elementary') },
        { text: 'Washington Middle', onClick: () => onGroupChange && onGroupChange('Washington Middle') },
        { text: 'Jefferson High', onClick: () => onGroupChange && onGroupChange('Jefferson High') },
    ];

    const riskLevelOptions = [
        { text: 'All Risk Levels', onClick: () => onRiskLevelChange && onRiskLevelChange('All Risk Levels') },
        { text: 'High', onClick: () => onRiskLevelChange && onRiskLevelChange('High') },
        { text: 'Medium', onClick: () => onRiskLevelChange && onRiskLevelChange('Medium') },
        { text: 'Low', onClick: () => onRiskLevelChange && onRiskLevelChange('Low') },
    ];

    const dateRangeOptions = [
        { text: 'Last 7 Days', onClick: () => onDateRangeChange && onDateRangeChange('Last 7 Days') },
        { text: 'Last 30 Days', onClick: () => onDateRangeChange && onDateRangeChange('Last 30 Days') },
        { text: 'Last 90 Days', onClick: () => onDateRangeChange && onDateRangeChange('Last 90 Days') },
        { text: 'This Year', onClick: () => onDateRangeChange && onDateRangeChange('This Year') },
    ];

    return (
        <PageLayout
            topBarConfig={topBarConfig}
            sidebarConfig={sidebarConfig}
            id="tutor-risk-interventions-page"
            className={className}
        >
            <div className="tutor-risk-interventions-page__content">
                {/* Tab Navigation - matches wireframe XXXX */}
                <div className="tutor-risk-interventions-page__tabs">
                    <NavTabs
                        activeKey={currentTab}
                        onSelect={handleTabSelect}
                        className="tutor-risk-interventions-page__nav-tabs"
                    >
                        <NavTabs.Item eventKey="performance" active={currentTab === 'performance'}>
                            Tutor Performance
                        </NavTabs.Item>
                        <NavTabs.Item eventKey="statusWarnings" active={currentTab === 'statusWarnings'}>
                            Status And Warnings
                        </NavTabs.Item>
                        <NavTabs.Item eventKey="riskInterventions" active={currentTab === 'riskInterventions'}>
                            Risk & Interventions
                        </NavTabs.Item>
                        <NavTabs.Item eventKey="trainingProgress" active={currentTab === 'trainingProgress'}>
                            Training Progress
                        </NavTabs.Item>
                    </NavTabs>
                </div>

                {/* Summary Stats Row - matches wireframe: two boxes at top */}
                <div className="tutor-risk-interventions-page__stats-row">
                    <div className="tutor-risk-interventions-page__stat-card">
                        <div className="tutor-risk-interventions-page__stat-value">{totalAtRisk}</div>
                        <div className="tutor-risk-interventions-page__stat-label">Tutors At Risk</div>
                    </div>
                    <div className="tutor-risk-interventions-page__stat-card">
                        <div className="tutor-risk-interventions-page__stat-value">{totalInterventions}</div>
                        <div className="tutor-risk-interventions-page__stat-label">Active Interventions</div>
                    </div>
                </div>

                {/* Charts Row - matches wireframe: two side-by-side charts */}
                <div className="tutor-risk-interventions-page__charts-row">
                    {/* Line Chart - Left card */}
                    <div className="tutor-risk-interventions-page__chart-card">
                        <div className="tutor-risk-interventions-page__chart-header">
                            <h5 className="h5">Risk & Intervention Trends</h5>
                        </div>
                        <TutorChartsElement
                            variant="Line"
                            data={chartTrendData}
                            legend={[
                                { label: 'At Risk Tutors', color: 'var(--color-error, #ba1a1a)' },
                                { label: 'Active Interventions', color: 'var(--color-primary, #006b5e)' }
                            ]}
                        />
                    </div>

                    {/* Bar Chart - Right card */}
                    <div className="tutor-risk-interventions-page__chart-card">
                        <div className="tutor-risk-interventions-page__chart-header">
                            <h5 className="h5">Interventions by Type</h5>
                        </div>
                        <TutorChartsElement
                            variant="Bar"
                            data={chartDistributionData}
                            legend={[
                                { label: 'High Risk', color: 'var(--color-error, #ba1a1a)' },
                                { label: 'Medium Risk', color: 'var(--color-warning, #f5a623)' },
                                { label: 'Low Risk', color: 'var(--color-success, #1a7f37)' }
                            ]}
                        />
                    </div>
                </div>

                {/* Filter Bar - matches wireframe: XXX title with 3 dropdowns */}
                <div className="tutor-risk-interventions-page__filter-bar">
                    {/* Title - Left side */}
                    <div className="tutor-risk-interventions-page__filter-title">
                        <h5 className="h5">Tutor Risk Details</h5>
                    </div>
                    
                    {/* Filter Dropdowns - Right side */}
                    <div className="tutor-risk-interventions-page__filter-controls">
                        <Dropdown
                            buttonText={selectedGroup}
                            items={groupOptions}
                            style="secondary"
                            fill="ghost"
                            size="small"
                            className="tutor-risk-interventions-page__filter-dropdown"
                        />
                        <Dropdown
                            buttonText={selectedRiskLevel}
                            items={riskLevelOptions}
                            style="secondary"
                            fill="ghost"
                            size="small"
                            className="tutor-risk-interventions-page__filter-dropdown"
                        />
                        <Dropdown
                            buttonText={selectedDateRange}
                            items={dateRangeOptions}
                            style="secondary"
                            fill="ghost"
                            size="small"
                            className="tutor-risk-interventions-page__filter-dropdown"
                        />
                    </div>
                </div>

                {/* Risk Table - matches wireframe: data table at bottom with 20 rows */}
                <div className="tutor-risk-interventions-page__table-section">
                    <div className="tutor-risk-interventions-page__table-wrapper">
                        <Table hover className="tutor-risk-interventions-page__table">
                            <thead>
                                <tr>
                                    <th className="body3-txt">Tutor Name</th>
                                    <th className="body3-txt">Group</th>
                                    <th className="body3-txt">Risk Level</th>
                                    <th className="body3-txt">Risk Score</th>
                                    <th className="body3-txt">Intervention Type</th>
                                    <th className="body3-txt">Intervention Date</th>
                                    <th className="body3-txt">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayTutors.map((tutor) => (
                                    <tr
                                        key={tutor.id}
                                        onClick={() => onRowClick && onRowClick(tutor)}
                                        className={onRowClick ? 'tutor-risk-interventions-page__row--clickable' : ''}
                                    >
                                        <td className="body3-txt">{tutor.name}</td>
                                        <td className="body3-txt">{tutor.group}</td>
                                        <td>
                                            <Badge style={getRiskLevelStyle(tutor.riskLevel)} size="b3">
                                                {tutor.riskLevel}
                                            </Badge>
                                        </td>
                                        <td>
                                            <Badge style={getRiskScoreStyle(tutor.riskScore)} size="b3">
                                                {tutor.riskScore}
                                            </Badge>
                                        </td>
                                        <td className="body3-txt">{tutor.interventionType}</td>
                                        <td className="body3-txt">{tutor.interventionDate}</td>
                                        <td>
                                            <Badge style={getStatusStyle(tutor.status)} size="b3">
                                                {tutor.status}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="tutor-risk-interventions-page__pagination">
                        <div className="body2-txt" style={{ fontWeight: 300, color: 'var(--color-on-surface)' }}>
                            Showing {entriesStart} to {entriesEnd} of {totalEntries} entries
                        </div>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={onPageChange}
                            type="icon"
                            size="small"
                        />
                    </div>
                </div>
            </div>
        </PageLayout>
    );
};

TutorRiskInterventionsPage.propTypes = {
    /** Active tab key */
    activeTab: PropTypes.oneOf(['performance', 'statusWarnings', 'riskInterventions', 'trainingProgress']),
    /** Array of tutor risk data */
    tutors: PropTypes.array,
    /** Total tutors at risk count */
    totalAtRisk: PropTypes.number,
    /** Total active interventions count */
    totalInterventions: PropTypes.number,
    /** Risk trend chart data */
    riskTrendData: PropTypes.array,
    /** Intervention distribution chart data */
    interventionDistributionData: PropTypes.array,
    /** Selected group filter value */
    selectedGroup: PropTypes.string,
    /** Selected risk level filter value */
    selectedRiskLevel: PropTypes.string,
    /** Selected date range filter value */
    selectedDateRange: PropTypes.string,
    /** Current page number */
    currentPage: PropTypes.number,
    /** Total number of pages */
    totalPages: PropTypes.number,
    /** Total number of entries */
    totalEntries: PropTypes.number,
    /** Callback when tab changes */
    onTabChange: PropTypes.func,
    /** Callback when row is clicked */
    onRowClick: PropTypes.func,
    /** Callback when page changes */
    onPageChange: PropTypes.func,
    /** Callback when group filter changes */
    onGroupChange: PropTypes.func,
    /** Callback when risk level filter changes */
    onRiskLevelChange: PropTypes.func,
    /** Callback when date range filter changes */
    onDateRangeChange: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default TutorRiskInterventionsPage;
