/**
 * GroupInfoPage Component
 * 
 * Full page layout for Group Info with groups table.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=258-263800
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { PageLayout } from '../../../../Universal/Pages';
import NavTabs from '../../../../../components/NavTabs/NavTabs';
import Button from '../../../../../components/Button/Button';
import Pagination from '../../../../../components/Pagination/Pagination';
import GroupsTable from '../../Tables/GroupsTable/GroupsTable';
import '../../Tables/GroupsTable/GroupsTable.scss';
import './GroupInfoPage.scss';

const GroupInfoPage = ({
    groups = [],
    currentPage = 1,
    totalPages = 20,
    totalEntries = 200,
    onPageChange,
    onTabChange,
    onAddGroup,
    onEditGroup,
    onViewProgress,
    className = '',
    ...props
}) => {
    const [activeTab, setActiveTab] = useState('group-info');

    const defaultGroups = [
        { id: 1, name: 'Math Masters', size: 4 },
        { id: 2, name: 'Science Explorers', size: 6 },
        { id: 3, name: 'Reading Champions', size: 5 },
        { id: 4, name: 'Writing Warriors', size: 3 },
        { id: 5, name: 'History Buffs', size: 7 },
        { id: 6, name: 'Art Appreciation', size: 4 },
        { id: 7, name: 'Music Makers', size: 5 },
        { id: 8, name: 'Coding Club', size: 8 },
        { id: 9, name: 'Language Learners', size: 6 },
        { id: 10, name: 'Study Group Alpha', size: 4 },
    ];

    const displayGroups = groups.length > 0 ? groups : defaultGroups;
    const entriesStart = (currentPage - 1) * 10 + 1;
    const entriesEnd = Math.min(currentPage * 10, totalEntries);

    const handleTabSelect = (key) => {
        setActiveTab(key);
        if (onTabChange) {
            onTabChange(key);
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
    };

    return (
        <PageLayout
            topBarConfig={topBarConfig}
            sidebarConfig={sidebarConfig}
            id="group-info-page"
            className={className}
        >
            <div className="group-info-page__content">
                {/* Tab Navigation */}
                <NavTabs
                    activeKey={activeTab}
                    onSelect={handleTabSelect}
                    className="group-info-page__tabs"
                >
                    <NavTabs.Item eventKey="group-info" active={activeTab === 'group-info'}>
                        Group Info
                    </NavTabs.Item>
                    <NavTabs.Item eventKey="training-progress" active={activeTab === 'training-progress'}>
                        Training Progress
                    </NavTabs.Item>
                </NavTabs>

                {/* Title Section */}
                <div className="group-info-page__title-section">
                    <h2 className="h4" style={{ color: 'var(--color-on-surface)' }}>
                        Group Info
                    </h2>
                    <Button
                        text="Add Group"
                        style="primary"
                        fill="filled"
                        size="medium"
                        leadingVisual="user-plus"
                        onClick={onAddGroup}
                    />
                </div>

                {/* Groups Table */}
                <GroupsTable
                    groups={displayGroups}
                    onEditClick={onEditGroup}
                    onViewProgressClick={onViewProgress}
                />

                {/* Pagination Footer */}
                <div className="group-info-page__pagination">
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
        </PageLayout>
    );
};

GroupInfoPage.propTypes = {
    /** Array of group objects */
    groups: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        name: PropTypes.string,
        size: PropTypes.number,
    })),
    /** Current page number for pagination */
    currentPage: PropTypes.number,
    /** Total number of pages */
    totalPages: PropTypes.number,
    /** Total number of entries */
    totalEntries: PropTypes.number,
    /** Callback when page changes */
    onPageChange: PropTypes.func,
    /** Callback when tab changes */
    onTabChange: PropTypes.func,
    /** Callback when Add Group is clicked */
    onAddGroup: PropTypes.func,
    /** Callback when Edit is clicked */
    onEditGroup: PropTypes.func,
    /** Callback when View Progress is clicked */
    onViewProgress: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default GroupInfoPage;
