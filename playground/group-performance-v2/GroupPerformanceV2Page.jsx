/**
 * GroupPerformanceV2Page Component - Prototype
 * 
 * Full page layout for Group Performance v2 with pie chart, bar chart, and 20-row table.
 * Based on wireframe and TutorPerformancePage / TutorsPerformanceTable patterns.
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { PageLayout } from '@/specs/Universal/Pages';
import Button from '@/components/Button/Button';
import NavTabs from '@/components/NavTabs/NavTabs';
import Pagination from '@/components/Pagination/Pagination';
import Badge from '@/components/Badge/Badge';
import Dropdown from '@/components/Dropdown/Dropdown';
import { Table } from 'react-bootstrap';
import TutorDataCard from '@/specs/Admin/Tutor Admin/Cards/TutorDataCard/TutorDataCard';
import TutorChartsElement from '@/specs/Admin/Tutor Admin/Elements/TutorChartsElement/TutorChartsElement';
import './GroupPerformanceV2Page.scss';

/**
 * Get badge style based on percentage value
 * ≥80% → success (green)
 * 50-79% → warning (yellow)
 * <50% → danger (red)
 */
const getAttendanceStyle = (value) => {
    if (!value || value === 'Null') return 'secondary';
    const numValue = parseInt(value);
    if (numValue >= 80) return 'success';
    if (numValue >= 50) return 'warning';
    return 'danger';
};

const GroupPerformanceV2Page = ({
    groups = [],
    attendancePercentage = 87,
    loading = false,
    currentPage = 1,
    totalPages = 10,
    totalEntries = 200,
    selectedGroup = 'All Groups',
    activeTab = 'performance',
    onPageChange,
    onRowClick,
    onGroupFilterChange,
    onTabChange,
    onEmailGroups,
    onExportData,
    className = '',
    ...props
}) => {
    const [currentTab, setCurrentTab] = useState(activeTab);

    // Default 20 rows of sample data (matching wireframe requirement)
    const defaultGroups = [
        { id: 1, groupName: 'Morning Cohort A', signedUp: 'Yes', attendance: 92, sessions: 45, students: 28, badge: 'Lead' },
        { id: 2, groupName: 'Afternoon Cohort B', signedUp: 'Yes', attendance: 85, sessions: 42, students: 25, badge: null },
        { id: 3, groupName: 'Evening Cohort C', signedUp: 'Yes', attendance: 78, sessions: 38, students: 22, badge: null },
        { id: 4, groupName: 'Weekend Cohort D', signedUp: 'Yes', attendance: 88, sessions: 40, students: 26, badge: null },
        { id: 5, groupName: 'Advanced Math Group', signedUp: 'Yes', attendance: 94, sessions: 48, students: 30, badge: 'Lead' },
        { id: 6, groupName: 'Beginning Reading', signedUp: 'Yes', attendance: 81, sessions: 36, students: 20, badge: null },
        { id: 7, groupName: 'Science Explorers', signedUp: 'No', attendance: null, sessions: null, students: 18, badge: null },
        { id: 8, groupName: 'Writing Workshop', signedUp: 'Yes', attendance: 89, sessions: 44, students: 27, badge: null },
        { id: 9, groupName: 'Creative Arts Studio', signedUp: 'Yes', attendance: 76, sessions: 32, students: 19, badge: null },
        { id: 10, groupName: 'STEM Innovators', signedUp: 'Yes', attendance: 91, sessions: 46, students: 29, badge: 'Lead' },
        { id: 11, groupName: 'Language Learners', signedUp: 'Yes', attendance: 83, sessions: 39, students: 24, badge: null },
        { id: 12, groupName: 'History Buffs', signedUp: 'Yes', attendance: 72, sessions: 34, students: 21, badge: null },
        { id: 13, groupName: 'Music Makers', signedUp: 'Yes', attendance: 87, sessions: 41, students: 23, badge: null },
        { id: 14, groupName: 'Drama Club', signedUp: 'No', attendance: null, sessions: null, students: 17, badge: null },
        { id: 15, groupName: 'Chess Champions', signedUp: 'Yes', attendance: 95, sessions: 50, students: 15, badge: 'Lead' },
        { id: 16, groupName: 'Debate Society', signedUp: 'Yes', attendance: 79, sessions: 37, students: 16, badge: null },
        { id: 17, groupName: 'Environmental Club', signedUp: 'Yes', attendance: 84, sessions: 43, students: 22, badge: null },
        { id: 18, groupName: 'Coding Academy', signedUp: 'Yes', attendance: 90, sessions: 47, students: 28, badge: null },
        { id: 19, groupName: 'Photography Guild', signedUp: 'Yes', attendance: 68, sessions: 30, students: 14, badge: null },
        { id: 20, groupName: 'Book Club', signedUp: 'Yes', attendance: 86, sessions: 35, students: 20, badge: null },
    ];

    // Session distribution data for bar chart
    const sessionDistributionData = [
        { label: 'Week 1', values: [18, 12, 8] },
        { label: 'Week 2', values: [20, 15, 10] },
        { label: 'Week 3', values: [22, 14, 9] },
        { label: 'Week 4', values: [19, 16, 11] },
    ];

    // Dropdown items for All Groups filter
    const groupFilterItems = [
        { text: 'All Groups', selected: selectedGroup === 'All Groups', onClick: () => onGroupFilterChange && onGroupFilterChange('All Groups') },
        { text: 'Morning Cohorts', selected: selectedGroup === 'Morning Cohorts', onClick: () => onGroupFilterChange && onGroupFilterChange('Morning Cohorts') },
        { text: 'Afternoon Cohorts', selected: selectedGroup === 'Afternoon Cohorts', onClick: () => onGroupFilterChange && onGroupFilterChange('Afternoon Cohorts') },
        { text: 'Evening Cohorts', selected: selectedGroup === 'Evening Cohorts', onClick: () => onGroupFilterChange && onGroupFilterChange('Evening Cohorts') },
        { text: 'Weekend Cohorts', selected: selectedGroup === 'Weekend Cohorts', onClick: () => onGroupFilterChange && onGroupFilterChange('Weekend Cohorts') },
    ];

    const displayGroups = groups.length > 0 ? groups : defaultGroups;
    const entriesStart = (currentPage - 1) * 20 + 1;
    const entriesEnd = Math.min(currentPage * 20, totalEntries);

    const handleRowClick = (group) => {
        if (onRowClick) {
            onRowClick(group);
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
            { text: 'Group Admin' }
        ],
        user: {
            name: 'John Doe',
            counter: true,
            counterValue: 2
        }
    };

    const sidebarConfig = {
        user: 'supervisor',
        activeTab: 'groups',
    };

    return (
        <PageLayout
            topBarConfig={topBarConfig}
            sidebarConfig={sidebarConfig}
            id="group-performance-v2-page"
            className={className}
        >
            <div className="group-performance-v2-page__content">
                {/* Tab Navigation */}
                <div className="group-performance-v2-page__tabs">
                    <NavTabs
                        activeKey={currentTab}
                        onSelect={handleTabSelect}
                        className="group-performance-v2-page__nav-tabs"
                    >
                        <NavTabs.Item eventKey="groupInfo" active={currentTab === 'groupInfo'}>
                            Group Info
                        </NavTabs.Item>
                        <NavTabs.Item eventKey="trainingProgress" active={currentTab === 'trainingProgress'}>
                            Training Progress
                        </NavTabs.Item>
                        <NavTabs.Item eventKey="performance" active={currentTab === 'performance'}>
                            Performance
                        </NavTabs.Item>
                        <NavTabs.Item eventKey="reports" active={currentTab === 'reports'}>
                            Reports
                        </NavTabs.Item>
                    </NavTabs>
                </div>

                {/* Action Buttons */}
                <div className="group-performance-v2-page__actions">
                    <Button
                        text="Email Groups"
                        style="primary"
                        fill="outline"
                        size="medium"
                        onClick={onEmailGroups}
                    />
                    <Button
                        text="Export Data"
                        style="primary"
                        fill="outline"
                        size="medium"
                        onClick={onExportData}
                    />
                </div>

                {/* Performance Overview Section */}
                <div className="group-performance-v2-page__overview-section">
                    {/* Performance Charts */}
                    <div className="group-performance-v2-page__charts-section">
                        <TutorDataCard
                            title="Group Attendance"
                            tooltip="Percentage of groups with high attendance rates"
                            loading={loading}
                        >
                            <TutorChartsElement
                                variant="Pie"
                                donutPercentage={attendancePercentage}
                                donutSubtitle="High Attendance"
                                legend={[
                                    { color: '#61b5cf', label: 'High Attendance' },
                                    { color: '#85ecd5', label: 'Low Attendance' },
                                ]}
                            />
                        </TutorDataCard>
                        <TutorDataCard
                            title="Session Distribution"
                            tooltip="Distribution of sessions across groups over time"
                            loading={loading}
                        >
                            <TutorChartsElement
                                variant="Bar"
                                data={sessionDistributionData}
                                legend={[
                                    { label: 'Morning', color: '#61b5cf' },
                                    { label: 'Afternoon', color: '#85ecd5' },
                                    { label: 'Evening', color: '#5E849B' },
                                ]}
                            />
                        </TutorDataCard>
                    </div>
                </div>

                {/* Performance Details Section */}
                <div className="group-performance-v2-page__details-section">
                    <div className="group-performance-v2-page__details-header">
                        <h2 className="h4" style={{ color: 'var(--color-on-surface)' }}>
                            Performance Details
                        </h2>
                        <Dropdown
                            id="group-filter-dropdown"
                            buttonText={selectedGroup}
                            items={groupFilterItems}
                            style="secondary"
                            fill="outline"
                            size="default"
                        />
                    </div>

                    {/* Groups Table - Following TutorsPerformanceTable pattern */}
                    <div className="group-performance-v2-page__table-wrapper">
                        <Table hover className="group-performance-v2-page__table">
                            <thead>
                                <tr>
                                    <th>
                                        <div className="group-performance-v2-page__th-content">
                                            <span className="body3-txt">Group Name</span>
                                            <i className="fas fa-arrow-up group-performance-v2-page__sort-icon" />
                                        </div>
                                    </th>
                                    <th>
                                        <div className="group-performance-v2-page__th-content">
                                            <span className="body3-txt">Signed-Up</span>
                                        </div>
                                    </th>
                                    <th>
                                        <div className="group-performance-v2-page__th-content">
                                            <span className="body3-txt">% Attendance</span>
                                            <i className="fas fa-arrow-up group-performance-v2-page__sort-icon" />
                                        </div>
                                    </th>
                                    <th>
                                        <div className="group-performance-v2-page__th-content">
                                            <span className="body3-txt">Sessions</span>
                                            <i className="fas fa-arrow-up group-performance-v2-page__sort-icon" />
                                        </div>
                                    </th>
                                    <th>
                                        <div className="group-performance-v2-page__th-content">
                                            <span className="body3-txt">Students</span>
                                            <i className="fas fa-arrow-up group-performance-v2-page__sort-icon" />
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayGroups.map((group) => (
                                    <tr
                                        key={group.id}
                                        onClick={() => handleRowClick(group)}
                                        className="group-performance-v2-page__row--clickable"
                                    >
                                        <td>
                                            <div className="group-performance-v2-page__group-cell">
                                                <span className="body3-txt">{group.groupName}</span>
                                                {group.badge && (
                                                    <Badge style="info" size="b3">
                                                        {group.badge}
                                                    </Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <Badge
                                                style={group.signedUp === 'Yes' ? 'info' : 'secondary'}
                                                size="b3"
                                            >
                                                {group.signedUp}
                                            </Badge>
                                        </td>
                                        <td>
                                            {group.attendance !== null ? (
                                                <Badge style={getAttendanceStyle(group.attendance)} size="b3">
                                                    {group.attendance}%
                                                </Badge>
                                            ) : (
                                                <Badge style="secondary" size="b3">Null</Badge>
                                            )}
                                        </td>
                                        <td>
                                            {group.sessions !== null ? (
                                                <Badge style="secondary" size="b3">{group.sessions}</Badge>
                                            ) : (
                                                <Badge style="secondary" size="b3">Null</Badge>
                                            )}
                                        </td>
                                        <td>
                                            {group.students !== null ? (
                                                <Badge style="secondary" size="b3">{group.students}</Badge>
                                            ) : (
                                                <Badge style="secondary" size="b3">Null</Badge>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="group-performance-v2-page__pagination">
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

GroupPerformanceV2Page.propTypes = {
    /** Array of group objects */
    groups: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        groupName: PropTypes.string,
        signedUp: PropTypes.string,
        attendance: PropTypes.number,
        sessions: PropTypes.number,
        students: PropTypes.number,
        badge: PropTypes.string,
    })),
    /** Attendance percentage for pie chart */
    attendancePercentage: PropTypes.number,
    /** Loading state for charts */
    loading: PropTypes.bool,
    /** Current page number for pagination */
    currentPage: PropTypes.number,
    /** Total number of pages */
    totalPages: PropTypes.number,
    /** Total number of entries */
    totalEntries: PropTypes.number,
    /** Selected group filter */
    selectedGroup: PropTypes.string,
    /** Active tab key */
    activeTab: PropTypes.oneOf(['groupInfo', 'trainingProgress', 'performance', 'reports']),
    /** Callback when page changes */
    onPageChange: PropTypes.func,
    /** Callback when row is clicked */
    onRowClick: PropTypes.func,
    /** Callback when group filter changes */
    onGroupFilterChange: PropTypes.func,
    /** Callback when tab changes */
    onTabChange: PropTypes.func,
    /** Callback when Email Groups is clicked */
    onEmailGroups: PropTypes.func,
    /** Callback when Export Data is clicked */
    onExportData: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default GroupPerformanceV2Page;
