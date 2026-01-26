/**
 * TutorPerformancePage Component
 * 
 * Full page layout for Tutor Performance with tabs, overview charts, and performance table.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=258-262669
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { PageLayout } from '../../../../Universal/Pages';
import Button from '../../../../../components/Button/Button';
import NavTabs from '../../../../../components/NavTabs/NavTabs';
import Pagination from '../../../../../components/Pagination/Pagination';
import AdminDateRangeFilter from '../../Elements/AdminDateRangeFilter/AdminDateRangeFilter';
import TutorPerformanceSection from '../../Sections/TutorPerformanceSection/TutorPerformanceSection';
import TutorsPerformanceTable from '../../Tables/TutorsPerformanceTable/TutorsPerformanceTable';
import TutorModal from '../../Modals/TutorModal/TutorModal';
import '../../Elements/AdminDateRangeFilter/AdminDateRangeFilter.scss';
import '../../Sections/TutorPerformanceSection/TutorPerformanceSection.scss';
import '../../Tables/TutorsPerformanceTable/TutorsPerformanceTable.scss';
import '../../Modals/TutorModal/TutorModal.scss';
import './TutorPerformancePage.scss';

const TutorPerformancePage = ({
    tutors = [],
    attendancePercentage = 95,
    signUpRatePercentage = 85,
    loading = false,
    currentPage = 1,
    totalPages = 20,
    totalEntries = 200,
    selectedSchool = 'All Schools',
    selectedTutor = 'All Tutors',
    dateFrom = '01/10/25',
    dateTo = '02/10/25',
    activeTab = 'performance',
    modalOpen = false,
    modalTab = 'info',
    modalMode = 'edit',
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
    const [showModal, setShowModal] = useState(modalOpen);
    const [selectedTutorData, setSelectedTutorData] = useState(null);
    const [currentTab, setCurrentTab] = useState(activeTab);
    const [currentModalTab, setCurrentModalTab] = useState(modalTab);

    // Sync modal state with props
    useEffect(() => {
        setShowModal(modalOpen);
    }, [modalOpen]);

    useEffect(() => {
        setCurrentTab(activeTab);
    }, [activeTab]);

    useEffect(() => {
        setCurrentModalTab(modalTab);
    }, [modalTab]);

    // Default 9 rows of sample data
    const defaultTutors = [
        { id: 1, tutorName: 'Amelia Blue', signedUp: 'Yes', attendance: 92, sessions: 25, students: 18, badge: null },
        { id: 2, tutorName: 'Ava Silver', signedUp: 'Yes', attendance: 22, sessions: 34, students: 12, badge: null },
        { id: 3, tutorName: 'Elijah Orange', signedUp: 'Yes', attendance: 68, sessions: 22, students: 7, badge: null },
        { id: 4, tutorName: 'Ethan Black', signedUp: 'Yes', attendance: 49, sessions: 65, students: 5, badge: null },
        { id: 5, tutorName: 'Ethan Cole', signedUp: 'Yes', attendance: 90, sessions: 52, students: 21, badge: 'Lead' },
        { id: 6, tutorName: 'Floyd Miles', signedUp: 'No', attendance: null, sessions: null, students: 13, badge: null },
        { id: 7, tutorName: 'Hannah Brown', signedUp: 'Yes', attendance: 94, sessions: 54, students: 7, badge: null },
        { id: 8, tutorName: 'Henry Gold', signedUp: 'Yes', attendance: 92, sessions: 33, students: 10, badge: null },
        { id: 9, tutorName: 'Liam Brown', signedUp: 'Yes', attendance: 50, sessions: 3, students: 8, badge: null },
    ];

    const displayTutors = tutors.length > 0 ? tutors : defaultTutors;
    const entriesStart = (currentPage - 1) * 10 + 1;
    const entriesEnd = Math.min(currentPage * 10, totalEntries);

    const handleRowClick = (tutor) => {
        setSelectedTutorData(tutor);
        setShowModal(true);
        if (onRowClick) {
            onRowClick(tutor);
        }
        if (onModalChange) {
            onModalChange(true, 'info');
        }
    };

    const handleModalHide = () => {
        setShowModal(false);
        if (onModalChange) {
            onModalChange(false, currentModalTab);
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
        activeTab: 'tutors',
    };

    return (
        <PageLayout
            topBarConfig={topBarConfig}
            sidebarConfig={sidebarConfig}
            id="tutor-performance-page"
            className={className}
        >
            <div className="tutor-performance-page__content">
                {/* Tab Navigation */}
                <div className="tutor-performance-page__tabs">
                    <NavTabs
                        activeKey={currentTab}
                        onSelect={handleTabSelect}
                        className="tutor-performance-page__nav-tabs"
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
                <div className="tutor-performance-page__actions">
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

                {/* Performance Overview Section */}
                <div className="tutor-performance-page__overview-section">
                    <div className="tutor-performance-page__overview-header">
                        <h2 className="h4" style={{ color: 'var(--color-on-surface)' }}>
                            Performance Overview
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

                    {/* Performance Charts */}
                    <TutorPerformanceSection
                        attendancePercentage={attendancePercentage}
                        signUpRatePercentage={signUpRatePercentage}
                        loading={loading}
                    />
                </div>

                {/* Performance Details Section */}
                <div className="tutor-performance-page__details-section">
                    <div className="tutor-performance-page__details-header">
                        <h2 className="h4" style={{ color: 'var(--color-on-surface)' }}>
                            Performance Details
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

                    {/* Tutors Table */}
                    <TutorsPerformanceTable
                        tutors={displayTutors}
                        onRowClick={handleRowClick}
                    />

                    {/* Pagination Footer */}
                    <div className="tutor-performance-page__pagination">
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
                <TutorModal
                    show={showModal}
                    mode={modalMode}
                    tutor={selectedTutorData || { name: 'Amelia Blue' }}
                    initialTab={currentModalTab}
                    onHide={handleModalHide}
                    onSave={() => console.log('Save tutor')}
                    onDelete={() => console.log('Delete tutor')}
                    onTabChange={(tab) => setCurrentModalTab(tab)}
                />
            </div>
        </PageLayout>
    );
};

TutorPerformancePage.propTypes = {
    /** Array of tutor objects */
    tutors: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        tutorName: PropTypes.string,
        signedUp: PropTypes.string,
        attendance: PropTypes.number,
        sessions: PropTypes.number,
        students: PropTypes.number,
        badge: PropTypes.string,
    })),
    /** Attendance percentage */
    attendancePercentage: PropTypes.number,
    /** Sign-up rate percentage */
    /** Sign-up rate percentage */
    signUpRatePercentage: PropTypes.number,
    /** Loading state for charts */
    loading: PropTypes.bool,
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
    /** Whether modal is open */
    modalOpen: PropTypes.bool,
    /** Modal tab ('info' or 'sessions') */
    modalTab: PropTypes.oneOf(['info', 'sessions']),
    /** Modal mode ('edit' or 'add') */
    modalMode: PropTypes.oneOf(['edit', 'add']),
    /** Callback when page changes */
    onPageChange: PropTypes.func,
    /** Callback when row is clicked */
    onRowClick: PropTypes.func,
    /** Callback when school filter changes */
    onSchoolFilterChange: PropTypes.func,
    /** Callback when tutor filter changes */
    onTutorFilterChange: PropTypes.func,
    /** Callback when date filter changes */
    onDateFilterChange: PropTypes.func,
    /** Callback when tab changes */
    onTabChange: PropTypes.func,
    /** Callback when modal state changes */
    onModalChange: PropTypes.func,
    /** Callback when Add Tutor is clicked */
    onAddTutor: PropTypes.func,
    /** Callback when Email Tutors is clicked */
    onEmailTutors: PropTypes.func,
    /** Callback when Export Data is clicked */
    onExportData: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default TutorPerformancePage;
