/**
 * LessonsOverviewPage Component
 * 
 * Full page layout for Lessons Overview with filter bar, lesson list table, and navigation.
 * Matches Figma design: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=63-178237
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { PageLayout } from '../../../../Universal/Pages';
import Button from '@/components/Button';
import TrainingLessonStatusSelect from '../../Elements/TrainingLessonStatusSelect/TrainingLessonStatusSelect';
import SortControl from '../../Elements/SortControl/SortControl';
import LessonsTable from '../../Tables/LessonsTable/LessonsTable';
import './LessonsOverviewPage.scss';

const LessonsOverviewPage = ({
    lessons = [],
    statusFilter = 'all',
    sortBy = 'Name',
    sortOrder = 'A-Z',
    currentView = 'list',
    onStatusChange,
    onSortByChange,
    onOrderChange,
    onViewToggle,
    onExpandAll,
    onLessonContinue,
    onLessonClick,
}) => {
    // Default sample lessons
    const defaultLessons = [
        { 
            id: 1, 
            title: 'Giving Effective Praise', 
            competencyArea: 'socio-emotional', 
            status: 'not-started', 
            duration: '12mins', 
            showAiIndicator: true,
            description: 'Learn how to give effective praise to increase student motivation.'
        },
        { 
            id: 2, 
            title: 'Building Rapport', 
            competencyArea: 'relationships', 
            status: 'in-progress', 
            duration: '15mins', 
            showAiIndicator: false,
            description: 'Strategies for building strong relationships with students.'
        },
        { 
            id: 3, 
            title: 'Goal Setting', 
            competencyArea: 'advocacy', 
            status: 'completed', 
            duration: '10mins', 
            showAiIndicator: true,
            description: 'Help students set and achieve meaningful goals.'
        },
        { 
            id: 4, 
            title: 'Active Listening', 
            competencyArea: 'socio-emotional', 
            status: 'not-started', 
            duration: '18mins', 
            showAiIndicator: false,
            description: 'Master the art of active listening in tutoring sessions.'
        },
    ];

    const displayLessons = lessons.length > 0 ? lessons : defaultLessons;

    const topBarConfig = {
        breadcrumbs: [
            { text: 'Home', href: '#' },
            { text: 'Lessons' }
        ],
        user: {
            name: 'John Doe',
            counter: true,
            counterValue: 2
        }
    };

    const sidebarConfig = {
        user: 'tutor',
    };

    return (
        <PageLayout
            topBarConfig={topBarConfig}
            sidebarConfig={sidebarConfig}
            id="lessons-overview-page"
        >
            <div className="lessons-overview-page">
                {/* Filter Bar */}
                <div className="lessons-overview-page__filter-bar">
                    {/* Filter Left - Status Select */}
                    <div className="lessons-overview-page__filter-left">
                        <TrainingLessonStatusSelect
                            selectedStatus={statusFilter === 'all' ? 'All' : statusFilter}
                            onStatusChange={onStatusChange}
                        />
                    </div>

                    {/* Filter Right - Controls */}
                    <div className="lessons-overview-page__filter-right">
                        {/* Expand All Button */}
                        <Button
                            text="Expand All"
                            style="secondary"
                            fill="outline"
                            size="small"
                            onClick={onExpandAll}
                        />

                        {/* Sort Control */}
                        <SortControl
                            sortBy={sortBy}
                            sortOrder={sortOrder}
                            onChange={(newState) => {
                                if (onSortByChange) onSortByChange(newState.sortBy);
                                if (onOrderChange) onOrderChange(newState.sortOrder);
                            }}
                        />

                        {/* View Toggle Buttons */}
                        <div className="lessons-overview-page__view-toggle">
                            <Button
                                text=""
                                style="primary"
                                fill={currentView === 'list' ? 'tonal' : 'ghost'}
                                size="small"
                                leadingVisual="list-ul"
                                onClick={() => onViewToggle && onViewToggle('list')}
                            />
                            <Button
                                text=""
                                style="primary"
                                fill={currentView === 'grid' ? 'tonal' : 'ghost'}
                                size="small"
                                leadingVisual="table-cells-large"
                                onClick={() => onViewToggle && onViewToggle('grid')}
                            />
                        </div>
                    </div>
                </div>

                {/* Lesson List */}
                <div className="lessons-overview-page__lesson-list-wrapper">
                    <LessonsTable
                        lessons={displayLessons}
                        onLessonContinue={onLessonContinue}
                        onLessonClick={onLessonClick}
                        usePills={true}
                    />
                </div>
            </div>
        </PageLayout>
    );
};

LessonsOverviewPage.propTypes = {
    /** Array of lesson objects */
    lessons: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        title: PropTypes.string,
        description: PropTypes.string,
        competencyArea: PropTypes.string,
        status: PropTypes.string,
        duration: PropTypes.string,
        showAiIndicator: PropTypes.bool,
    })),
    /** Status filter value */
    statusFilter: PropTypes.string,
    /** Sort by value */
    sortBy: PropTypes.string,
    /** Sort order */
    sortOrder: PropTypes.string,
    /** Current view mode */
    currentView: PropTypes.oneOf(['list', 'grid']),
    /** Status filter change handler */
    onStatusChange: PropTypes.func,
    /** Sort by change handler */
    onSortByChange: PropTypes.func,
    /** Order change handler */
    onOrderChange: PropTypes.func,
    /** View toggle handler */
    onViewToggle: PropTypes.func,
    /** Expand all handler */
    onExpandAll: PropTypes.func,
    /** Lesson continue handler */
    onLessonContinue: PropTypes.func,
    /** Lesson click handler */
    onLessonClick: PropTypes.func,
};

export default LessonsOverviewPage;
