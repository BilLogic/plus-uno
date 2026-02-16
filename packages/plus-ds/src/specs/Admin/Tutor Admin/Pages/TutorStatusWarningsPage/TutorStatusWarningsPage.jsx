/**
 * TutorStatusWarningsPage Component
 * 
 * Full page layout for Tutor Status and Warnings with tabs, overview charts, and status table.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=258-263229
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { PageLayout } from '../../../../Universal/Pages';
import Button from '../../../../../components/Button/Button';
import NavTabs from '../../../../../components/NavTabs/NavTabs';
import Pagination from '../../../../../components/Pagination/Pagination';
import AdminDateRangeFilter from '../../Elements/AdminDateRangeFilter/AdminDateRangeFilter';
import TutorDataCard from '../../Cards/TutorDataCard/TutorDataCard';
import TutorChartsElement from '../../Elements/TutorChartsElement/TutorChartsElement';
import TutorsStatusAndWarningsTable from '../../Tables/TutorsStatusAndWarningsTable/TutorsStatusAndWarningsTable';

import './TutorStatusWarningsPage.scss';

const TutorStatusWarningsPage = ({
    tutors = [],
    statusDistribution = { onTrack: 170, checkInNeeded: 30, onWatch: 50, onTIP: 20, recommendedForTermination: 20, inactive: 10 },
    statusTrendData = [],
    currentPage = 1,
    totalPages = 20,
    totalEntries = 200,
    selectedSchool = 'All Schools',
    selectedTutor = 'All Tutors',
    dateFrom = '01/10/25',
    dateTo = '02/10/25',
    activeTab = 'statusWarnings',
    modalOpen = false,
    modalTab = 'info',
    onPageChange,
    onRowClick,
    onSchoolFilterChange,
    onTutorFilterChange,
    onDateFilterChange,
    onTabChange,
    onModalChange,
    onAddTutor,
    onEmailTutors,
    onExportData,
    className = '',
    ...props
}) => {
    const [currentTab, setCurrentTab] = useState(activeTab);

    useEffect(() => {
        setCurrentTab(activeTab);
    }, [activeTab]);

    // Default 10 rows of sample data
    const defaultTutors = React.useMemo(() => [
        { id: 1, tutorName: 'Floyd Miles', status: 'Check-In Needed', totalWarnings: 16, micOff: 4, camOff: 4, absence: 4, lateCall: 4 },
        { id: 2, tutorName: 'Floyd Miles', status: 'Check-In Needed', totalWarnings: 16, micOff: 4, camOff: 4, absence: 4, lateCall: 4 },
        { id: 3, tutorName: 'Floyd Miles', status: 'Check-In Needed', totalWarnings: 16, micOff: 4, camOff: 4, absence: 4, lateCall: 4 },
        { id: 4, tutorName: 'Floyd Miles', status: 'Check-In Needed', totalWarnings: 16, micOff: 4, camOff: 4, absence: 4, lateCall: 4 },
        { id: 5, tutorName: 'Floyd Miles', status: 'Check-In Needed', totalWarnings: 16, micOff: 4, camOff: 4, absence: 4, lateCall: 4 },
        { id: 6, tutorName: 'Floyd Miles', status: 'Check-In Needed', totalWarnings: 16, micOff: 4, camOff: 4, absence: 4, lateCall: 4 },
        { id: 7, tutorName: 'Floyd Miles', status: 'Check-In Needed', totalWarnings: 16, micOff: 4, camOff: 4, absence: 4, lateCall: 4 },
        { id: 8, tutorName: 'Floyd Miles', status: 'Check-In Needed', totalWarnings: 16, micOff: 4, camOff: 4, absence: 4, lateCall: 4 },
        { id: 9, tutorName: 'Floyd Miles', status: 'Check-In Needed', totalWarnings: 16, micOff: 4, camOff: 4, absence: 4, lateCall: 4 },
        { id: 10, tutorName: 'Floyd Miles', status: 'Check-In Needed', totalWarnings: 16, micOff: 4, camOff: 4, absence: 4, lateCall: 4 },
    ], []);

    // Default status trend data (Weekly) - Segment values matching Figma visual
    const defaultStatusTrendData = React.useMemo(() => statusTrendData.length > 0 ? statusTrendData : [
        { label: 'Week 1', values: [17, 3, 2, 3, 2, 3] },
        { label: 'Week 2', values: [22, 2, 2, 2, 1, 1] },
        { label: 'Week 3', values: [24, 2, 1, 1, 1, 1] },
        { label: 'Week 4', values: [20, 3, 3, 2, 1, 1] },
    ], [statusTrendData]);

    const displayTutors = React.useMemo(() => tutors.length > 0 ? tutors : defaultTutors, [tutors, defaultTutors]);
    const entriesStart = (currentPage - 1) * 10 + 1;
    const entriesEnd = Math.min(currentPage * 10, totalEntries);

    // Calculate total tutors for status distribution
    const totalTutors = Object.values(statusDistribution).reduce((sum, val) => sum + val, 0);

    // Prepare pie chart data
    const pieChartData = [
        { label: 'On Track', value: statusDistribution.onTrack, color: '#A1EB83' },
        { label: 'Check-In Needed', value: statusDistribution.checkInNeeded, color: '#85ECD5' },
        { label: 'On Watch', value: statusDistribution.onWatch, color: '#5E849B' },
        { label: 'On TIP', value: statusDistribution.onTIP, color: '#FFE17A' },
        { label: 'Recommended for Termination', value: statusDistribution.recommendedForTermination, color: '#FFDAD6' },
        { label: 'Inactive', value: statusDistribution.inactive, color: '#807878' },
    ];

    const handleRowClick = (tutor) => {
        if (onRowClick) {
            onRowClick(tutor);
        }
    };



    const handleTabSelect = (selectedKey) => {
        setCurrentTab(selectedKey);
        if (onTabChange) {
            onTabChange(selectedKey);
        }
    };

    const topBarConfig = React.useMemo(() => ({
        breadcrumbs: [
            { text: 'Home', href: '#' },
            { text: 'Tutor Admin' }
        ],
        user: {
            name: 'John Doe',
            counter: true,
            counterValue: 2
        }
    }), []);

    const sidebarConfig = React.useMemo(() => ({
        user: 'supervisor',
        activeTab: 'tutors',
    }), []);

    return (
        <PageLayout
            topBarConfig={topBarConfig}
            sidebarConfig={sidebarConfig}
            id="tutor-status-warnings-page"
            className={className}
        >
            <div className="tutor-status-warnings-page__content">
                {/* Tab Navigation */}
                <div className="tutor-status-warnings-page__tabs">
                    <NavTabs
                        activeKey={currentTab}
                        onSelect={handleTabSelect}
                        className="tutor-status-warnings-page__nav-tabs"
                    >
                        <NavTabs.Item eventKey="performance" active={currentTab === 'performance'}>
                            Tutor Performance
                        </NavTabs.Item>
                        <NavTabs.Item eventKey="statusWarnings" active={currentTab === 'statusWarnings'}>
                            Status And Warnings
                        </NavTabs.Item>
                        <NavTabs.Item eventKey="toolUsage" active={currentTab === 'toolUsage'}>
                            Tool Usage
                        </NavTabs.Item>
                        <NavTabs.Item eventKey="trainingProgress" active={currentTab === 'trainingProgress'}>
                            Training Progress
                        </NavTabs.Item>
                    </NavTabs>
                </div>

                {/* Action Buttons */}
                <div className="tutor-status-warnings-page__actions">
                    <Button
                        text="Email Tutors"
                        style="primary"
                        fill="outline"
                        size="medium"
                        onClick={onEmailTutors}
                    />
                    <Button
                        text="Export Reflection Data"
                        style="primary"
                        fill="outline"
                        size="medium"
                        onClick={onExportData}
                    />
                </div>

                {/* Status Overview Section */}
                <div className="tutor-status-warnings-page__overview-section">
                    <div className="tutor-status-warnings-page__overview-header">
                        <h2 className="h4" style={{ color: 'var(--color-on-surface)' }}>
                            Status Overview
                        </h2>
                        <AdminDateRangeFilter
                            selectedSchool={selectedSchool}
                            selectedTutor={selectedTutor}
                            dateFrom={dateFrom}
                            dateTo={dateTo}
                            onSchoolChange={onSchoolFilterChange}
                            onTutorChange={onTutorFilterChange}
                            onDateFromChange={() => onDateFilterChange && onDateFilterChange('from')}
                            onDateToChange={() => onDateFilterChange && onDateFilterChange('to')}
                        />
                    </div>

                    {/* Status Charts - Unified Card */}
                    <div className="tutor-status-overview-card">
                        <div className="tutor-status-overview-card__row">
                            {/* Status Distribution (Latest) */}
                            <div className="tutor-status-overview-card__section">
                                <div className="tutor-status-overview-card__header">
                                    <h4 className="title-h4">Status Distribution (Latest)</h4>
                                    <i className="fas fa-circle-question help-icon" title="Current distribution of tutor statuses" />
                                </div>
                                <div className="tutor-status-overview-card__content">
                                    <TutorChartsElement
                                        variant="Pie"
                                        data={pieChartData}
                                        centerText="300"
                                        centerSubtext="Total Tutors"
                                        legend={[]} // Hide internal legend
                                        className="tutor-status-overview-card__chart"
                                    />
                                </div>
                            </div>

                            {/* Status Trend (Weekly) */}
                            <div className="tutor-status-overview-card__section">
                                <div className="tutor-status-overview-card__header">
                                    <h4 className="title-h4">Status Trend (Weekly)</h4>
                                    <i className="fas fa-circle-question help-icon" title="Weekly trend of tutor statuses" />
                                </div>
                                <div className="tutor-status-overview-card__content">
                                    <TutorChartsElement
                                        variant="Bar"
                                        data={defaultStatusTrendData}
                                        // Legend ordered by Stack Order (Bottom to Top)
                                        legend={[
                                            { label: 'On Track', color: '#A1EB83' }, // Green
                                            { label: 'On Watch', color: '#5E849B' }, // Blue
                                            { label: 'Check-In Needed', color: '#85ECD5' }, // Cyan
                                            { label: 'Recommended for Termination', color: '#FFDAD6' }, // Pink
                                            { label: 'On TIP', color: '#FFE17A' }, // Yellow
                                            { label: 'Inactive', color: '#807878' }, // Grey
                                        ]}
                                        hideLegend={true} // Hide internal visual legend, but keep data for colors
                                        className="tutor-status-overview-card__chart"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Shared Legend */}
                        <div className="tutor-status-overview-card__legend">
                            {[
                                { label: 'On Track', color: '#A1EB83' },
                                { label: 'Check-In Needed', color: '#85ECD5' },
                                { label: 'On Watch', color: '#5E849B' },
                                { label: 'On TIP', color: '#FFE17A' },
                                { label: 'Recommended for Termination', color: '#FFDAD6' },
                                { label: 'Inactive', color: '#807878' }
                            ].map((item, index) => (
                                <div key={index} className="legend-item">
                                    <span className="legend-color" style={{ backgroundColor: item.color }} />
                                    <span className="legend-label">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Status Details Section */}
                <div className="tutor-status-warnings-page__details-section">
                    <div className="tutor-status-warnings-page__details-header">
                        <h2 className="h4" style={{ color: 'var(--color-on-surface)' }}>
                            Status Details
                        </h2>
                        <Button
                            text="Add Tutor"
                            style="primary"
                            fill="filled"
                            size="medium"
                            leadingVisual="user-plus"
                            onClick={onAddTutor}
                        />
                    </div>

                    {/* Tutors Status Table */}
                    <TutorsStatusAndWarningsTable
                        tutors={displayTutors}
                        onRowClick={handleRowClick}
                    />

                    {/* Pagination Footer */}
                    <div className="tutor-status-warnings-page__pagination">
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

                {/* Tutor Modal */}

            </div>
        </PageLayout>
    );
};

TutorStatusWarningsPage.propTypes = {
    /** Array of tutor objects */
    tutors: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        tutorName: PropTypes.string,
        status: PropTypes.string,
        totalWarnings: PropTypes.number,
        micOff: PropTypes.number,
        camOff: PropTypes.number,
        absence: PropTypes.number,
        lateCall: PropTypes.number,
    })),
    /** Status distribution data */
    statusDistribution: PropTypes.shape({
        onTrack: PropTypes.number,
        checkInNeeded: PropTypes.number,
        onWatch: PropTypes.number,
        onTIP: PropTypes.number,
        recommendedForTermination: PropTypes.number,
        inactive: PropTypes.number,
    }),
    /** Status trend data for stacked bar chart */
    statusTrendData: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string,
        values: PropTypes.arrayOf(PropTypes.number)
    })),
    /** Current page number for pagination */
    currentPage: PropTypes.number,
    /** Total number of pages */
    totalPages: PropTypes.number,
    /** Total number of entries */
    totalEntries: PropTypes.number,
    /** Selected school filter */
    selectedSchool: PropTypes.string,
    /** Selected tutor filter */
    selectedTutor: PropTypes.string,
    /** From date filter */
    dateFrom: PropTypes.string,
    /** To date filter */
    dateTo: PropTypes.string,
    /** Active tab key */
    activeTab: PropTypes.oneOf(['performance', 'statusWarnings', 'toolUsage', 'trainingProgress']),
    /** Callback when tab changes */
    onTabChange: PropTypes.func,
    /** Callback when Add Tutor is clicked */
    onAddTutor: PropTypes.func,
    /** Callback when Email Tutors is clicked */
    onEmailTutors: PropTypes.func,
    /** Callback when Export Data is clicked */
    onExportData: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default TutorStatusWarningsPage;
