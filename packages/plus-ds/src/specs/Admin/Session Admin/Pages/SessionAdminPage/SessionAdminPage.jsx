/**
 * SessionAdminPage Component
 * 
 * Full page layout for Session Admin with tabs, overview charts, and sessions table.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=987-128734
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { PageLayout } from '../../../../Universal/Pages';
import Button from '../../../../../components/Button/Button';
import NavTabs from '../../../../../components/NavTabs/NavTabs';
import Pagination from '../../../../../components/Pagination/Pagination';
import AdminDateRangeFilter from '../../../../Admin/Elements/AdminDateRangeFilter/AdminDateRangeFilter';
import SessionsTable from '../../Tables/SessionsTable/SessionsTable';
import SessionOverviewSection from '../../Sections/SessionOverviewSection/SessionOverviewSection';
import SessionModal from '../../Modals/SessionModal/SessionModal';
import '../../Tables/SessionsTable/SessionsTable.scss';
import '../../Sections/SessionOverviewSection/SessionOverviewSection.scss';
import '../../Modals/SessionModal/SessionModal.scss';
import './SessionAdminPage.scss';

const SessionAdminPage = ({
    sessions = [],
    timeAllocation = 60,
    studentAttendance = 99,
    studentEngagement = 99,
    tutorAttendance = 99,
    checkInCompletion = 99,
    currentPage = 1,
    totalPages = 20,
    totalEntries = 200,
    selectedSchool = 'All Schools',
    selectedTutor = 'All Tutors',
    dateFrom = '11/01/12',
    dateTo = '12/20/12',
    activeTab = 'warnings',
    modalOpen = false,
    onPageChange,
    onRowClick,
    onSchoolFilterChange,
    onTutorFilterChange,
    onDateFilterChange,
    onTabChange,
    onModalChange,
    className = '',
    ...props
}) => {
    const [showModal, setShowModal] = useState(modalOpen);
    const [selectedSession, setSelectedSession] = useState(null);
    const [currentTab, setCurrentTab] = useState(activeTab);

    // Sync modal state with props
    useEffect(() => {
        setShowModal(modalOpen);
    }, [modalOpen]);

    useEffect(() => {
        setCurrentTab(activeTab);
    }, [activeTab]);

    // Default 9 rows of sample data
    const defaultSessions = [
        { id: 1, date: 'Mon (01/06/25)', shift: '2:25 PM - 3:15 PM', school: 'Hogwarts', teacher: 'Snape', attendedStudents: 85, engagedStudent: 92, attendedTutors: 100, completedCheckIn: 88 },
        { id: 2, date: 'Tue (01/07/25)', shift: '2:25 PM - 3:15 PM', school: 'Hogwarts', teacher: 'Snape', attendedStudents: 78, engagedStudent: 85, attendedTutors: 95, completedCheckIn: 82 },
        { id: 3, date: 'Wed (01/08/25)', shift: '2:25 PM - 3:15 PM', school: 'Hogwarts', teacher: 'Snape', attendedStudents: 45, engagedStudent: 52, attendedTutors: 88, completedCheckIn: 48 },
        { id: 4, date: 'Thu (01/09/25)', shift: '2:25 PM - 3:15 PM', school: 'Hogwarts', teacher: 'Snape', attendedStudents: 8, engagedStudent: 8, attendedTutors: 8, completedCheckIn: 8 },
        { id: 5, date: 'Fri (01/10/25)', shift: '2:25 PM - 3:15 PM', school: 'Hogwarts', teacher: 'Snape', attendedStudents: 92, engagedStudent: 95, attendedTutors: 100, completedCheckIn: 90 },
        { id: 6, date: 'Mon (01/13/25)', shift: '2:25 PM - 3:15 PM', school: 'Hogwarts', teacher: 'Snape', attendedStudents: 65, engagedStudent: 70, attendedTutors: 85, completedCheckIn: 68 },
        { id: 7, date: 'Tue (01/14/25)', shift: '2:25 PM - 3:15 PM', school: 'Hogwarts', teacher: 'Snape', attendedStudents: 35, engagedStudent: 40, attendedTutors: 75, completedCheckIn: 38 },
        { id: 8, date: 'Wed (01/15/25)', shift: '2:25 PM - 3:15 PM', school: 'Hogwarts', teacher: 'Snape', attendedStudents: 88, engagedStudent: 90, attendedTutors: 98, completedCheckIn: 85 },
        { id: 9, date: 'Thu (01/16/25)', shift: '2:25 PM - 3:15 PM', school: 'Hogwarts', teacher: 'Snape', attendedStudents: 55, engagedStudent: 60, attendedTutors: 82, completedCheckIn: 58 },
    ];

    const displaySessions = sessions.length > 0 ? sessions : defaultSessions;
    const entriesStart = (currentPage - 1) * 10 + 1;
    const entriesEnd = Math.min(currentPage * 10, totalEntries);

    const handleRowClick = (session) => {
        setSelectedSession(session);
        setShowModal(true);
        if (onRowClick) {
            onRowClick(session);
        }
        if (onModalChange) {
            onModalChange(true);
        }
    };

    const handleModalHide = () => {
        setShowModal(false);
        if (onModalChange) {
            onModalChange(false);
        }
    };


    const topBarConfig = {
        breadcrumbs: [
            { text: 'Home', href: '#' },
            { text: 'Session Admin' }
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

    const handleTabSelect = (selectedKey) => {
        setCurrentTab(selectedKey);
        if (onTabChange) {
            onTabChange(selectedKey);
        }
    };

    return (
        <PageLayout
            topBarConfig={topBarConfig}
            sidebarConfig={sidebarConfig}
            id="session-admin-page"
            className={className}
        >
            <div className="session-admin-page__content">
                {/* Tab Navigation */}
                <div className="session-admin-page__tabs">
                    <NavTabs
                        activeKey={currentTab}
                        onSelect={handleTabSelect}
                        className="session-admin-page__nav-tabs"
                    >
                        <NavTabs.Item eventKey="warnings" active={currentTab === 'warnings'}>
                            Warnings
                        </NavTabs.Item>
                        <NavTabs.Item eventKey="currentTutors" active={currentTab === 'currentTutors'}>
                            Current Tutors
                        </NavTabs.Item>
                        <NavTabs.Item eventKey="incomingTutors" active={currentTab === 'incomingTutors'}>
                            Incoming Tutors
                        </NavTabs.Item>
                        <NavTabs.Item eventKey="details" active={currentTab === 'details'}>
                            Details
                        </NavTabs.Item>
                    </NavTabs>
                </div>

                {/* Session Overview Section */}
                <div className="session-admin-page__overview-section">
                    <div className="session-admin-page__overview-header">
                        <h2 className="h4" style={{ color: 'var(--color-on-surface)' }}>
                            Session Overview
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

                    {/* Charts Section */}
                    <SessionOverviewSection
                        timeAllocation={timeAllocation}
                        studentAttendance={studentAttendance}
                        studentEngagement={studentEngagement}
                        tutorAttendance={tutorAttendance}
                        checkInCompletion={checkInCompletion}
                    />
                </div>

                {/* Session Details Section */}
                <div className="session-admin-page__details-section">
                    <div className="session-admin-page__details-header">
                        <h2 className="h4" style={{ color: 'var(--color-on-surface)' }}>
                            Session Details
                        </h2>
                    </div>

                    {/* Sessions Table */}
                    <SessionsTable
                        sessions={displaySessions}
                        onRowClick={handleRowClick}
                    />

                    {/* Pagination Footer */}
                    <div className="session-admin-page__pagination">
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

                {/* Session Modal */}
                <SessionModal
                    show={showModal}
                    sessionDate={selectedSession?.date || '11/02/12'}
                    onHide={handleModalHide}
                />
            </div>
        </PageLayout>
    );
};

SessionAdminPage.propTypes = {
    /** Array of session objects */
    sessions: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        date: PropTypes.string,
        shift: PropTypes.string,
        school: PropTypes.string,
        teacher: PropTypes.string,
        attendedStudents: PropTypes.number,
        engagedStudent: PropTypes.number,
        attendedTutors: PropTypes.number,
        completedCheckIn: PropTypes.number,
    })),
    /** Time Allocation percentage */
    timeAllocation: PropTypes.number,
    /** Student Attendance percentage */
    studentAttendance: PropTypes.number,
    /** Student Engagement percentage */
    studentEngagement: PropTypes.number,
    /** Tutor Attendance percentage */
    tutorAttendance: PropTypes.number,
    /** Check-in Completion percentage */
    checkInCompletion: PropTypes.number,
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
    activeTab: PropTypes.oneOf(['warnings', 'currentTutors', 'incomingTutors', 'details']),
    /** Whether modal is open */
    modalOpen: PropTypes.bool,
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
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default SessionAdminPage;
