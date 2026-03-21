/**
 * TutorToolUsagePage Component
 * 
 * Full page layout for Tutor Tool Usage with tabs, usage charts, and usage details table.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=258-263367
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { PageLayout } from '../../../../Universal/Pages';
import Button from '../../../../../components/Button/Button';
import NavTabs from '../../../../../components/NavTabs/NavTabs';
import Pagination from '../../../../../components/Pagination/Pagination';
import AdminDateRangeFilter from '../../Elements/AdminDateRangeFilter/AdminDateRangeFilter';
import TutorToolUsageSection from '../../Sections/TutorToolUsageSection/TutorToolUsageSection';
import TutorsToolUsageTable from '../../Tables/TutorsToolUsageTable/TutorsToolUsageTable';
import ExportSearchFilterBar from '../../Elements/ExportSearchFilterBar/ExportSearchFilterBar';

import './TutorToolUsagePage.scss';

const TutorToolUsagePage = ({
    tutors = [],
    recordingUploadData = [],
    reflectionCompletionData = [],
    helpCenterData = [],
    currentPage = 1,
    totalPages = 20,
    totalEntries = 200,
    selectedSchool = 'All Schools',
    selectedTutor = 'All Tutors',
    dateFrom = '01/10/25',
    dateTo = '02/10/25',
    activeTab = 'toolUsage',
    modalOpen = false,
    modalTab = 'info',
    searchQuery = '',
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
    onExportCSV,
    onSearchChange,
    className = '',
    ...props
}) => {
    const [currentTab, setCurrentTab] = useState(activeTab);

    useEffect(() => {
        setCurrentTab(activeTab);
    }, [activeTab]);

    // Default 10 rows of sample data
    const defaultTutors = React.useMemo(() => [
        { id: 1, tutorName: 'Floyd Miles', helpCenterVisits: 'No', recording: null, reflection: null, dashboardAdoption: null },
        { id: 2, tutorName: 'Floyd Miles', helpCenterVisits: 'No', recording: null, reflection: null, dashboardAdoption: null },
        { id: 3, tutorName: 'Floyd Miles', helpCenterVisits: 'No', recording: null, reflection: null, dashboardAdoption: null },
        { id: 4, tutorName: 'Floyd Miles', helpCenterVisits: 'No', recording: null, reflection: null, dashboardAdoption: null },
        { id: 5, tutorName: 'Floyd Miles', helpCenterVisits: 'No', recording: null, reflection: null, dashboardAdoption: null },
        { id: 6, tutorName: 'Floyd Miles', helpCenterVisits: 'No', recording: null, reflection: null, dashboardAdoption: null },
        { id: 7, tutorName: 'Floyd Miles', helpCenterVisits: 'No', recording: null, reflection: null, dashboardAdoption: null },
        { id: 8, tutorName: 'Floyd Miles', helpCenterVisits: 'No', recording: null, reflection: null, dashboardAdoption: null },
        { id: 9, tutorName: 'Floyd Miles', helpCenterVisits: 'No', recording: null, reflection: null, dashboardAdoption: null },
        { id: 10, tutorName: 'Floyd Miles', helpCenterVisits: 'No', recording: null, reflection: null, dashboardAdoption: null },
    ], []);

    const displayTutors = React.useMemo(() => tutors.length > 0 ? tutors : defaultTutors, [tutors, defaultTutors]);
    const entriesStart = (currentPage - 1) * 10 + 1;
    const entriesEnd = Math.min(currentPage * 10, totalEntries);

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
            id="tutor-tool-usage-page"
            className={className}
        >
            <div className="tutor-tool-usage-page__content">
                {/* Tab Navigation */}
                <div className="tutor-tool-usage-page__tabs">
                    <NavTabs
                        activeKey={currentTab}
                        onSelect={handleTabSelect}
                        className="tutor-tool-usage-page__nav-tabs"
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
                <div className="tutor-tool-usage-page__actions">
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

                {/* Tool Usage Section */}
                <div className="tutor-tool-usage-page__overview-section">
                    <div className="tutor-tool-usage-page__overview-header">
                        <h2 className="h4" style={{ color: 'var(--color-on-surface)' }}>
                            Tool Usage
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

                    {/* Tool Usage Charts */}
                    <TutorToolUsageSection
                        recordingUploadData={recordingUploadData}
                        reflectionCompletionData={reflectionCompletionData}
                        checkInCompletionData={helpCenterData}
                    />
                </div>

                {/* Tool Usage Details Section */}
                <div className="tutor-tool-usage-page__details-section">
                    <div className="tutor-tool-usage-page__details-header">
                        <h2 className="h4" style={{ color: 'var(--color-on-surface)' }}>
                            Tool Usage Details
                        </h2>

                    </div>



                    {/* Tutors Tool Usage Table */}
                    <TutorsToolUsageTable
                        tutors={displayTutors}
                        onRowClick={handleRowClick}
                    />

                    {/* Pagination Footer */}
                    <div className="tutor-tool-usage-page__pagination">
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

TutorToolUsagePage.propTypes = {
    /** Array of tutor objects */
    tutors: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        tutorName: PropTypes.string,
        helpCenterVisits: PropTypes.string,
        recording: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        reflection: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        dashboardAdoption: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    })),
    /** Recording upload data for bar chart */
    recordingUploadData: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string,
        values: PropTypes.arrayOf(PropTypes.number)
    })),
    /** Reflection completion data for line chart */
    reflectionCompletionData: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string,
        values: PropTypes.arrayOf(PropTypes.number)
    })),
    /** Help center data for line chart */
    helpCenterData: PropTypes.arrayOf(PropTypes.shape({
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
    /** Callback when Export CSV is clicked */
    onExportCSV: PropTypes.func,
    /** Callback when search query changes */
    onSearchChange: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default TutorToolUsagePage;
