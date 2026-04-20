/**
 * Tutor Performance prototype — matches Figma node 481-163968.
 * Clicking the Attendance card opens a modal listing assigned sessions with Attended/Absent badges.
 * Filters use the PLUS Dropdown component via AdminDateRangeFilter (same as the spec Tutor Performance page).
 */
import React, { useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import PageLayout from '@/components/PageLayout/PageLayout';
import NavTabs from '@/components/NavTabs/NavTabs';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Pagination from '@/components/Pagination';
import { DonutChart } from '@/DataViz';
import AdminDateRangeFilter from '@/specs/Admin/Tutor Admin/Elements/AdminDateRangeFilter/AdminDateRangeFilter';
import TutorsPerformanceTable from '@/specs/Admin/Tutor Admin/Tables/TutorsPerformanceTable/TutorsPerformanceTable';
import AttendanceModal from './AttendanceModal';
import TutorLessonDetailsModal from './TutorLessonDetailsModal';
import '@/specs/Admin/Tutor Admin/Elements/AdminDateRangeFilter/AdminDateRangeFilter.scss';
import '@/specs/Admin/Tutor Admin/Tables/TutorsPerformanceTable/TutorsPerformanceTable.scss';
import './TutorPerformancePage.scss';

const TUTORS = [
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

const TutorPerformancePage = () => {
    const [activeTab, setActiveTab] = useState('performance');
    const [currentPage, setCurrentPage] = useState(1);
    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
    const [isLessonDetailsModalOpen, setIsLessonDetailsModalOpen] = useState(false);
    const [selectedTutorForLessons, setSelectedTutorForLessons] = useState(null);
    const [selectedSchool, setSelectedSchool] = useState('All Schools');
    const [selectedTutor, setSelectedTutor] = useState('All Tutors');
    const [dateFrom, setDateFrom] = useState('01/10/25');
    const [dateTo, setDateTo] = useState('02/10/25');
    const totalPages = 10;
    const totalEntries = 36;
    const entriesStart = (currentPage - 1) * 20 + 1;
    const entriesEnd = Math.min(currentPage * 20, totalEntries);

    return (
        <>
            <PageLayout
                sidebarConfig={{
                    user: 'supervisor',
                    onHomeClick: () => {},
                    onTabClick: () => {},
                }}
                topBarConfig={{
                    brand: 'Home / Tutor Admin',
                    items: [{ text: 'John Doe', href: '#' }],
                    backgroundColor: 'light',
                }}
            >
                <Container fluid className="tutor-performance-page__content">
                    {/* Tabs */}
                    <div className="tutor-performance-page__tabs">
                        <NavTabs activeKey={activeTab} onSelect={setActiveTab}>
                            <NavTabs.Item eventKey="performance" active={activeTab === 'performance'}>
                                Tutor Performance
                            </NavTabs.Item>
                            <NavTabs.Item eventKey="statusWarnings" active={activeTab === 'statusWarnings'}>
                                Status And Warnings
                            </NavTabs.Item>
                            <NavTabs.Item eventKey="toolUsage" active={activeTab === 'toolUsage'}>
                                Tool Usage
                            </NavTabs.Item>
                            <NavTabs.Item eventKey="trainingProgress" active={activeTab === 'trainingProgress'}>
                                Training Progress
                            </NavTabs.Item>
                        </NavTabs>
                    </div>

                    {/* Action buttons */}
                    <div className="tutor-performance-page__actions">
                        <Button text="Email Tutors" style="primary" fill="outline" size="medium" onClick={() => {}} />
                        <Button text="Export Reflection Data" style="primary" fill="outline" size="medium" onClick={() => {}} />
                    </div>

                    {/* Performance Overview */}
                    <div className="tutor-performance-page__overview-section">
                        <div className="tutor-performance-page__overview-header">
                            <h2 className="h4">Performance Overview</h2>
                            <AdminDateRangeFilter
                                selectedSchool={selectedSchool}
                                selectedTutor={selectedTutor}
                                dateFrom={dateFrom}
                                dateTo={dateTo}
                                schoolOptions={[
                                    { text: 'All Schools', onClick: () => setSelectedSchool('All Schools') },
                                    { text: 'Lincoln High School', onClick: () => setSelectedSchool('Lincoln High School') },
                                    { text: 'Washington Middle School', onClick: () => setSelectedSchool('Washington Middle School') },
                                ]}
                                tutorOptions={[
                                    { text: 'All Tutors', onClick: () => setSelectedTutor('All Tutors') },
                                    { text: 'John Smith', onClick: () => setSelectedTutor('John Smith') },
                                    { text: 'Jane Doe', onClick: () => setSelectedTutor('Jane Doe') },
                                ]}
                                dateFromOptions={[
                                    { text: '01/10/25', onClick: () => setDateFrom('01/10/25') },
                                    { text: '12/01/24', onClick: () => setDateFrom('12/01/24') },
                                ]}
                                dateToOptions={[
                                    { text: '02/10/25', onClick: () => setDateTo('02/10/25') },
                                    { text: '12/31/24', onClick: () => setDateTo('12/31/24') },
                                ]}
                                onSchoolChange={setSelectedSchool}
                                onTutorChange={setSelectedTutor}
                                onDateFromChange={() => {}}
                                onDateToChange={() => {}}
                            />
                        </div>
                        <Row>
                            <Col md={6} className="mb-3">
                                <Card
                                    paddingSize="lg"
                                    onClick={() => setIsAttendanceModalOpen(true)}
                                    style={{ cursor: 'pointer', height: '100%' }}
                                >
                                    <div className="tutor-performance-page__card-header">
                                        <h4 className="h4">Attendance</h4>
                                        <button type="button" className="tutor-performance-page__info-btn" aria-label="Info" title="Percentage of tutors who attended">
                                            <i className="fas fa-circle-info" />
                                        </button>
                                    </div>
                                    <div className="tutor-performance-page__donut-wrapper">
                                        <DonutChart
                                            size={227}
                                            value="95%"
                                            label="Attended"
                                            segments={[
                                                { value: 95, color: '#61b5cf', label: 'Attended' },
                                                { value: 5, color: '#85ecd5', label: 'Missed' },
                                            ]}
                                            centerTextSize="h4"
                                        />
                                        <div className="tutor-performance-page__legend">
                                            <span className="tutor-performance-page__legend-item">
                                                <span className="tutor-performance-page__legend-color" style={{ backgroundColor: '#61b5cf' }} />
                                                Attended
                                            </span>
                                            <span className="tutor-performance-page__legend-item">
                                                <span className="tutor-performance-page__legend-color" style={{ backgroundColor: '#85ecd5' }} />
                                                Missed
                                            </span>
                                        </div>
                                    </div>
                                </Card>
                            </Col>
                            <Col md={6} className="mb-3">
                                <Card paddingSize="lg" style={{ height: '100%' }}>
                                    <div className="tutor-performance-page__card-header">
                                        <h4 className="h4">Sign-Up Rate</h4>
                                        <button type="button" className="tutor-performance-page__info-btn" aria-label="Info" title="Percentage who signed up">
                                            <i className="fas fa-circle-info" />
                                        </button>
                                    </div>
                                    <div className="tutor-performance-page__donut-wrapper">
                                        <DonutChart
                                            size={227}
                                            value="85%"
                                            label="Signed Up"
                                            segments={[
                                                { value: 85, color: '#61b5cf', label: 'Signed Up' },
                                                { value: 15, color: '#3f484a', label: 'Not Signed Up' },
                                            ]}
                                            centerTextSize="h4"
                                        />
                                        <div className="tutor-performance-page__legend">
                                            <span className="tutor-performance-page__legend-item">
                                                <span className="tutor-performance-page__legend-color" style={{ backgroundColor: '#61b5cf' }} />
                                                Signed Up
                                            </span>
                                            <span className="tutor-performance-page__legend-item">
                                                <span className="tutor-performance-page__legend-color" style={{ backgroundColor: '#3f484a' }} />
                                                Not Signed Up
                                            </span>
                                        </div>
                                    </div>
                                </Card>
                            </Col>
                        </Row>
                    </div>

                    {/* Performance Details */}
                    <div className="tutor-performance-page__details-section">
                        <div className="tutor-performance-page__details-header">
                            <h2 className="h4">Performance Details</h2>
                            <Button text="Add Tutor" style="primary" fill="filled" size="medium" leadingVisual="user-plus" onClick={() => {}} />
                        </div>
                        <TutorsPerformanceTable
                            tutors={TUTORS}
                            onRowClick={(tutor) => {
                                setSelectedTutorForLessons(tutor);
                                setIsLessonDetailsModalOpen(true);
                            }}
                        />
                        <div className="tutor-performance-page__pagination">
                            <span className="body2-txt" style={{ fontWeight: 300 }}>
                                Showing {entriesStart} to {entriesEnd} of {totalEntries} entries
                            </span>
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                type="icon"
                                size="small"
                            />
                        </div>
                    </div>
                </Container>
            </PageLayout>

            {isAttendanceModalOpen && <AttendanceModal onClose={() => setIsAttendanceModalOpen(false)} />}
            {isLessonDetailsModalOpen && (
                <TutorLessonDetailsModal
                    tutor={selectedTutorForLessons}
                    onClose={() => {
                        setIsLessonDetailsModalOpen(false);
                        setSelectedTutorForLessons(null);
                    }}
                />
            )}
        </>
    );
};

export default TutorPerformancePage;
