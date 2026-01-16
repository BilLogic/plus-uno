/**
 * TutorTrainingProgressPage Component
 * 
 * Full page layout for Tutor Training Progress with tabs, overview cards, and training details table.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=367-146235
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { PageLayout } from '../../../../Universal/Pages';
import Button from '../../../../../components/Button/Button';
import ButtonGroup from '../../../../../components/ButtonGroup/ButtonGroup';
import NavTabs from '../../../../../components/NavTabs/NavTabs';
import Pagination from '../../../../../components/Pagination/Pagination';
import OverviewCard from '../../../../Universal/Cards/OverviewCard/OverviewCard';
import TutorsTrainingProgressTable from '../../Tables/TutorsTrainingProgressTable/TutorsTrainingProgressTable';
import ExportSearchFilterBar from '../../Elements/ExportSearchFilterBar/ExportSearchFilterBar';
import './TutorTrainingProgressPage.scss';

const TutorTrainingProgressPage = ({
    tutors = [],
    tutorNeedData = { advocacy: 5, categories: ['S', 'M', 'A', 'R', 'T'] },
    avgCompletionRate = 20,
    tutorBadgeCompletions = 20,
    onboardingCompletion = 20,
    currentPage = 1,
    totalPages = 20,
    totalEntries = 200,
    activeTab = 'trainingProgress',
    viewMode = 'By Tutor',
    searchQuery = '',
    onPageChange,
    onRowClick,
    onTabChange,
    onViewModeChange,
    onEmailTutors,
    onExportData,
    onExportCSV,
    onSearchChange,
    className = '',
    ...props
}) => {
    const [currentTab, setCurrentTab] = useState(activeTab);
    const [currentViewMode, setCurrentViewMode] = useState(viewMode);

    useEffect(() => {
        setCurrentTab(activeTab);
    }, [activeTab]);

    useEffect(() => {
        setCurrentViewMode(viewMode);
    }, [viewMode]);

    // Default 10 rows of sample data
    const defaultTutors = [
        {
            id: 1,
            tutorName: 'Ben Green',
            email: 'dummy@gmail.com',
            completion: '8/18',
            accuracy: '30%',
            badgeClaimed: 'Yes',
            timeSpent: 328
        },
        {
            id: 2,
            tutorName: 'Albert Flores',
            email: 'albert@gmail.com',
            completion: '18/18',
            accuracy: '95%',
            badgeClaimed: 'Yes',
            timeSpent: 520
        },
        {
            id: 3,
            tutorName: 'Brooklyn Simmons',
            email: 'brooklyn@gmail.com',
            completion: '5/18',
            accuracy: '60%',
            badgeClaimed: 'No',
            timeSpent: 120
        },
        {
            id: 4,
            tutorName: 'Cody Fisher',
            email: 'cody@gmail.com',
            completion: '12/18',
            accuracy: '80%',
            badgeClaimed: 'No',
            timeSpent: 340
        },
        {
            id: 5,
            tutorName: 'Darlene Robertson',
            email: 'darlene@gmail.com',
            completion: '18/18',
            accuracy: '100%',
            badgeClaimed: 'Yes',
            timeSpent: 600
        },
        {
            id: 6,
            tutorName: 'Esther Howard',
            email: 'esther@gmail.com',
            completion: '2/18',
            accuracy: '10%',
            badgeClaimed: 'No',
            timeSpent: 45
        },
        {
            id: 7,
            tutorName: 'Guy Hawkins',
            email: 'guy@gmail.com',
            completion: '15/18',
            accuracy: '88%',
            badgeClaimed: 'No',
            timeSpent: 410
        },
        {
            id: 8,
            tutorName: 'Jacob Jones',
            email: 'jacob@gmail.com',
            completion: '10/18',
            accuracy: '75%',
            badgeClaimed: 'No',
            timeSpent: 280
        },
        {
            id: 9,
            tutorName: 'Jane Cooper',
            email: 'jane@gmail.com',
            completion: '18/18',
            accuracy: '92%',
            badgeClaimed: 'Yes',
            timeSpent: 550
        },
        {
            id: 10,
            tutorName: 'Jenny Wilson',
            email: 'jenny@gmail.com',
            completion: '6/18',
            accuracy: '50%',
            badgeClaimed: 'No',
            timeSpent: 180
        }
    ];

    const displayTutors = tutors.length > 0 ? tutors : defaultTutors; // I should make sure defaultTutors is available or not mess it up. Wait, replacing lines means I need to provide content.
    // I can avoid replacing the data definition if I target specific blocks.

    // Handler for row click - no modal anymore
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

    const handleViewModeChange = (mode) => {
        setCurrentViewMode(mode);
        if (onViewModeChange) {
            onViewModeChange(mode);
        }
    };

    const entriesStart = (currentPage - 1) * 10 + 1;
    const entriesEnd = Math.min(currentPage * 10, totalEntries);

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
            id="tutor-training-progress-page"
            className={className}
        >
            <div className="tutor-training-progress-page__content">
                {/* Tab Navigation */}
                <div className="tutor-training-progress-page__tabs">
                    <NavTabs
                        activeKey={currentTab}
                        onSelect={handleTabSelect}
                        className="tutor-training-progress-page__nav-tabs"
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
                <div className="tutor-training-progress-page__actions">
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

                {/* Training Progress Overview Section */}
                <div className="tutor-training-progress-page__overview-section">
                    <div className="tutor-training-progress-page__overview-header">
                        <h2 className="h4" style={{ color: 'var(--color-on-surface)' }}>
                            Training Progress Overview
                        </h2>
                        <ButtonGroup size="small" style="primary" fill="tonal" className="tutor-training-progress-page__toggle">
                            <Button
                                text="By Tutor"
                                active={currentViewMode === 'By Tutor'}
                                onClick={() => handleViewModeChange('By Tutor')}
                            />
                            <Button
                                text="By Lesson"
                                active={currentViewMode === 'By Lesson'}
                                onClick={() => handleViewModeChange('By Lesson')}
                            />
                        </ButtonGroup>
                    </div>

                    {/* Overview Cards */}
                    <div className="tutor-training-progress-page__overview-cards">
                        {/* Tutor Need Card */}
                        <OverviewCard
                            type="advocacy"
                            title="Tutor Need"
                            subtitle="Advocacy"
                            description="is where tutors had received least training."
                            smartData={{
                                socio: 0.8,
                                mastering: 0.6,
                                advocacy: 0.2,
                                relationships: 0.9,
                                technology: 0.7
                            }}
                        />

                        {/* Avg Completion Rate Card */}
                        <OverviewCard
                            type="avg-completion"
                            title="Avg Completion Rate"
                            chartValue={avgCompletionRate}
                            chartColor="#f5d061"
                            subtitle={`${avgCompletionRate}%`}
                            description="of total lessons have been completed"
                        />

                        {/* Tutor Badge Completions Card */}
                        <OverviewCard
                            type="completion"
                            title="Tutor Badge Completions"
                            chartValue={tutorBadgeCompletions}
                            chartColor="#f5d061"
                            subtitle={`${tutorBadgeCompletions}%`}
                            description="of eligible tutors have finished"
                        />

                        {/* Onboarding Completion Card */}
                        <OverviewCard
                            type="completion"
                            title="Onboarding Completion"
                            chartValue={onboardingCompletion}
                            chartColor="#f5d061"
                            subtitle={`${onboardingCompletion}%`}
                            description="of tutors had finished"
                        />
                    </div>
                </div>

                {/* Training Progress Details Section */}
                <div className="tutor-training-progress-page__details-section">
                    <div className="tutor-training-progress-page__details-header">
                        <h2 className="h4" style={{ color: 'var(--color-on-surface)' }}>
                            Training Progress Details
                        </h2>
                    </div>

                    {/* Search Bar */}
                    <ExportSearchFilterBar
                        searchPlaceholder="Search"
                        onSearch={onSearchChange}
                        onExport={onExportCSV}
                        filters={[
                            { key: 'group', label: 'All Groups' },
                            { key: 'date', label: 'All Dates' },
                            { key: 'status', label: 'All Status' }
                        ]}
                    />

                    {/* Tutors Training Progress Table */}
                    <TutorsTrainingProgressTable
                        tutors={displayTutors}
                        onRowClick={handleRowClick}
                    />

                    {/* Pagination Footer */}
                    <div className="tutor-training-progress-page__pagination">
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


            </div>
        </PageLayout>
    );
};

TutorTrainingProgressPage.propTypes = {
    /** Array of tutor objects */
    tutors: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        tutorName: PropTypes.string,
        email: PropTypes.string,
        completion: PropTypes.string,
        accuracy: PropTypes.string,
        badgeClaimed: PropTypes.string,
        timeSpent: PropTypes.number,
        action: PropTypes.string,
    })),
    /** Tutor need data */
    tutorNeedData: PropTypes.shape({
        advocacy: PropTypes.number,
        categories: PropTypes.arrayOf(PropTypes.string),
    }),
    /** Average completion rate percentage */
    avgCompletionRate: PropTypes.number,
    /** Tutor badge completions percentage */
    tutorBadgeCompletions: PropTypes.number,
    /** Onboarding completion percentage */
    onboardingCompletion: PropTypes.number,
    /** Current page number for pagination */
    currentPage: PropTypes.number,
    /** Total number of pages */
    totalPages: PropTypes.number,
    /** Total number of entries */
    totalEntries: PropTypes.number,
    /** Active tab key */
    activeTab: PropTypes.oneOf(['performance', 'statusWarnings', 'toolUsage', 'trainingProgress']),
    /** View mode ('By Tutor' or 'By Lesson') */
    viewMode: PropTypes.oneOf(['By Tutor', 'By Lesson']),
    /** Search query */
    searchQuery: PropTypes.string,
    /** Callback when page changes */
    onPageChange: PropTypes.func,
    /** Callback when row is clicked */
    onRowClick: PropTypes.func,
    /** Callback when tab changes */
    onTabChange: PropTypes.func,
    /** Callback when view mode changes */
    onViewModeChange: PropTypes.func,
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

export default TutorTrainingProgressPage;
