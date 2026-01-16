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
import TutorsStatusTable from '../../Tables/TutorsStatusTable/TutorsStatusTable';

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
    const defaultTutors = [
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
    ];

    // Default status trend data (Weekly)
    const defaultStatusTrendData = statusTrendData.length > 0 ? statusTrendData : [
        { label: 'Week 1', values: [17, 20, 22, 25, 28, 30] },
        { label: 'Week 2', values: [20, 22, 23, 25, 26, 28] },
        { label: 'Week 3', values: [22, 25, 26, 27, 28, 30] },
        { label: 'Week 4', values: [25, 26, 27, 28, 29, 30] },
    ];

    const displayTutors = tutors.length > 0 ? tutors : defaultTutors;
    const entriesStart = (currentPage - 1) * 10 + 1;
    const entriesEnd = Math.min(currentPage * 10, totalEntries);

    // Calculate total tutors for status distribution
    const totalTutors = Object.values(statusDistribution).reduce((sum, val) => sum + val, 0);

    // Prepare pie chart data
    const pieChartData = [
        { label: 'On Track', value: statusDistribution.onTrack, color: '#85ecd5' },
        { label: 'Check-In Needed', value: statusDistribution.checkInNeeded, color: '#61b5cf' },
        { label: 'On Watch', value: statusDistribution.onWatch, color: '#445c6a' },
        { label: 'On TIP', value: statusDistribution.onTIP, color: '#f5d061' },
        { label: 'Recommended for Termination', value: statusDistribution.recommendedForTermination, color: '#f7b8a7' },
        { label: 'Inactive', value: statusDistribution.inactive, color: '#3b525f' },
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
    };

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

                    {/* Status Charts */}
                    <div className="tutor-status-warnings-page__charts">
                        {/* Status Distribution (Latest) - Pie Chart */}
                        <TutorDataCard
                            title="Status Distribution (Latest)"
                            tooltip="Current distribution of tutor statuses"
                        >
                            <TutorChartsElement
                                variant="Pie"
                                data={pieChartData}
                                centerText={totalTutors.toString()}
                                centerSubtext="Total Tutors"
                                legend={pieChartData.map(item => ({
                                    label: `${item.label} (${Math.round((item.value / totalTutors) * 100)}%)`,
                                    color: item.color
                                }))}
                            />
                        </TutorDataCard>

                        {/* Status Trend (Weekly) - Stacked Bar Chart */}
                        <TutorDataCard
                            title="Status Trend (Weekly)"
                            tooltip="Weekly trend of tutor statuses"
                        >
                            <TutorChartsElement
                                variant="StackedBar"
                                data={defaultStatusTrendData}
                                legend={[
                                    { label: 'On Track', color: '#85ecd5' },
                                    { label: 'Check-In Needed', color: '#61b5cf' },
                                    { label: 'On Watch', color: '#445c6a' },
                                    { label: 'On TIP', color: '#f5d061' },
                                    { label: 'Recommended for Termination', color: '#f7b8a7' },
                                    { label: 'Inactive', color: '#3b525f' },
                                ]}
                            />
                        </TutorDataCard>
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
                    <TutorsStatusTable
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
                            size="default"
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
