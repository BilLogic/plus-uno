/**
 * StudentAdminPage Component
 * 
 * Full page layout for Student Admin with overview charts and students table.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=1006-258597
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { PageLayout } from '../../../../Universal/Pages';
import Button from '../../../../../components/Button/Button';
import Pagination from '../../../../../components/Pagination/Pagination';
import StudentsTable from '../../Tables/StudentsTable/StudentsTable';
import StudentOverviewSection from '../../Sections/StudentOverviewSection/StudentOverviewSection';
import StudentModal from '../../Modals/StudentModal/StudentModal';
import { AdminDateRangeFilter } from '../../../Tutor Admin/Elements';
import '../../Tables/StudentsTable/StudentsTable.scss';
import '../../Sections/StudentOverviewSection/StudentOverviewSection.scss';
import '../../Modals/StudentModal/StudentModal.scss';
import './StudentAdminPage.scss';

const StudentAdminPage = ({
    students = [],
    needsData = [],
    attendanceData = [],
    engagementData = [],
    currentPage = 1,
    totalPages = 20,
    totalEntries = 200,
    selectedSchool = 'All Schools',
    dateFrom = '11/01/12',
    dateTo = '12/20/12',
    modalOpen = false,
    modalVariant = 'info',
    onPageChange,
    onAddStudent,
    onViewGoals,
    onStudentClick,
    onSchoolFilterChange,
    onDateFilterChange,
    onModalChange,
    className = '',
    ...props
}) => {
    const [showModal, setShowModal] = useState(modalOpen);
    const [modalTab, setModalTab] = useState(modalVariant);
    const [selectedStudent, setSelectedStudent] = useState(null);

    // Sync modal state with props
    useEffect(() => {
        setShowModal(modalOpen);
    }, [modalOpen]);

    useEffect(() => {
        setModalTab(modalVariant);
    }, [modalVariant]);

    // Default 9 rows data matching Figma design
    const defaultStudents = [
        { id: 1, name: 'Jose Dolus', school: 'Langley', teacher: 'Jose Mura', status: 'Needs to set goals' },
        { id: 2, name: 'Chris Hudson', school: 'Langley', teacher: 'Ruth Perez', status: 'Needs to set goals' },
        { id: 3, name: 'Irene White', school: 'Langley', teacher: 'Ruth Perez', status: 'Needs to set goals' },
        { id: 4, name: 'Jacqueline Traine', school: 'Langley', teacher: 'Erin Hunter', status: 'Needs to set goals' },
        { id: 5, name: 'Jerome Brown', school: 'Langley', teacher: 'Katie Strong', status: 'Needs to set goals' },
        { id: 6, name: 'Jose Darrell', school: 'Langley', teacher: 'Tisha Bryan', status: 'Needs to set goals' },
        { id: 7, name: 'Joy Jones', school: 'Langley', teacher: 'Aaron Zhang', status: 'Needs to set goals' },
        { id: 8, name: 'Ksenia Gato', school: 'Langley', teacher: 'Ruth Perez', status: 'Needs to set goals' },
        { id: 9, name: 'Lesley Mora', school: 'Langley', teacher: 'Tisha Bryan', status: 'Needs to set goals' },
    ];

    const displayStudents = students.length > 0 ? students : defaultStudents;
    const entriesStart = (currentPage - 1) * 10 + 1;
    const entriesEnd = Math.min(currentPage * 10, totalEntries);

    const handleStudentClick = (student) => {
        setSelectedStudent(student);
        setShowModal(true);
        if (onStudentClick) {
            onStudentClick(student);
        }
        if (onModalChange) {
            onModalChange(true, modalTab);
        }
    };

    const handleModalHide = () => {
        setShowModal(false);
        if (onModalChange) {
            onModalChange(false, modalTab);
        }
    };

    const handleViewGoals = (student) => {
        if (onViewGoals) {
            onViewGoals(student);
        }
    };

    const topBarConfig = {
        breadcrumbs: [
            { text: 'Home', href: '#' },
            { text: 'Student Admin' }
        ],
        user: {
            name: 'John Doe',
            counter: true,
            counterValue: 2
        }
    };

    const sidebarConfig = {
        user: 'supervisor',
        activeTab: 'students',
    };

    return (
        <PageLayout
            topBarConfig={topBarConfig}
            sidebarConfig={sidebarConfig}
            id="student-admin-page"
            className={className}
        >
            <div className="student-admin-page__content">
                {/* Student Overview Section */}
                <div className="student-admin-page__overview-section">
                    <div className="student-admin-page__overview-header">
                        <h2 className="h4" style={{ color: 'var(--color-on-surface)' }}>
                            Student Overview
                        </h2>
                        <div className="student-admin-page__filters">
                            <AdminDateRangeFilter
                                selectedSchool={selectedSchool}
                                selectedTutor={null}
                                dateFrom={dateFrom}
                                dateTo={dateTo}
                                onSchoolChange={onSchoolFilterChange}
                                onDateFromChange={(date) => onDateFilterChange && onDateFilterChange('from', date)}
                                onDateToChange={(date) => onDateFilterChange && onDateFilterChange('to', date)}
                            />
                        </div>
                    </div>

                    {/* Charts Section */}
                    <StudentOverviewSection
                        needsData={needsData}
                        attendanceData={attendanceData}
                        engagementData={engagementData}
                    />
                </div>

                {/* Student Details Section */}
                <div className="student-admin-page__details-section">
                    <div className="student-admin-page__details-header">
                        <h2 className="h4" style={{ color: 'var(--color-on-surface)' }}>
                            Student Details
                        </h2>
                        <Button
                            text="Add Student"
                            style="primary"
                            fill="filled"
                            size="medium"
                            leadingVisual="user-plus"
                            onClick={onAddStudent}
                        />
                    </div>

                    {/* Students Table */}
                    <StudentsTable
                        students={displayStudents}
                        onViewGoalsClick={handleViewGoals}
                        onStudentClick={handleStudentClick}
                    />

                    {/* Pagination Footer */}
                    <div className="student-admin-page__pagination">
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

                {/* Student Modal */}
                <StudentModal
                    show={showModal}
                    student={selectedStudent || {}}
                    initialTab={modalTab}
                    onHide={handleModalHide}
                    onSave={(data) => {
                        console.log('Save student:', data);
                        setShowModal(false);
                    }}
                    onDelete={(student) => {
                        console.log('Delete student:', student);
                        setShowModal(false);
                    }}
                />
            </div>
        </PageLayout>
    );
};

StudentAdminPage.propTypes = {
    /** Array of student objects */
    students: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        name: PropTypes.string,
        school: PropTypes.string,
        teacher: PropTypes.string,
        status: PropTypes.string,
    })),
    /** Data for Student Needs Distribution chart */
    needsData: PropTypes.array,
    /** Data for Student Attendance chart */
    attendanceData: PropTypes.array,
    /** Data for Student Engagement chart */
    engagementData: PropTypes.array,
    /** Current page number for pagination */
    currentPage: PropTypes.number,
    /** Total number of pages */
    totalPages: PropTypes.number,
    /** Total number of entries */
    totalEntries: PropTypes.number,
    /** Selected school filter */
    selectedSchool: PropTypes.string,
    /** From date filter */
    dateFrom: PropTypes.string,
    /** To date filter */
    dateTo: PropTypes.string,
    /** Whether modal is open */
    modalOpen: PropTypes.bool,
    /** Modal variant ('info' or 'sessions') */
    modalVariant: PropTypes.oneOf(['info', 'sessions']),
    /** Callback when page changes */
    onPageChange: PropTypes.func,
    /** Callback when Add Student is clicked */
    onAddStudent: PropTypes.func,
    /** Callback when View Goals is clicked */
    onViewGoals: PropTypes.func,
    /** Callback when student row is clicked */
    onStudentClick: PropTypes.func,
    /** Callback when school filter changes */
    onSchoolFilterChange: PropTypes.func,
    /** Callback when date filter changes */
    onDateFilterChange: PropTypes.func,
    /** Callback when modal state changes (open, variant) */
    onModalChange: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default StudentAdminPage;
