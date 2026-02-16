/**
 * GroupTrainingProgressPage Component
 * 
 * Full page layout for Group Training Progress with overview cards and training progress table.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=531-62962
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { PageLayout } from '../../../../Universal/Pages';
import { OverviewCard } from '../../../../Universal/Cards';
import NavTabs from '../../../../../components/NavTabs/NavTabs';
import Button from '../../../../../components/Button/Button';
import GroupTrainingProgressTable from '../../Tables/GroupTrainingProgressTable/GroupTrainingProgressTable';
import '../../Tables/GroupTrainingProgressTable/GroupTrainingProgressTable.scss';
import './GroupTrainingProgressPage.scss';

const GroupTrainingProgressPage = ({
    trainingData = [],
    selectedGroup = 'All Groups',
    onTabChange,
    onGroupFilterChange,
    onAssignClick,
    className = '',
    ...props
}) => {
    const [activeTab, setActiveTab] = useState('training-progress');

    const defaultData = [
        {
            id: 1,
            competencyArea: 'socio-emotional',
            completion: '12/16',
            accuracy: '75%',
            rating: '4.5/5',
            timeSpent: '420 mins',
            level: 1,
            children: [
                {
                    id: 11,
                    lessonName: 'Motivation to Learn',
                    completion: '4/4',
                    accuracy: '80%',
                    rating: '4.5/5',
                    timeSpent: '120 mins',
                    level: 2,
                    children: [
                        { id: 111, lessonName: 'Reacting to Errors', completion: '4/4', accuracy: '85%', rating: '5.0/5', timeSpent: '60 mins', level: 3 },
                    ]
                }
            ]
        },
        { id: 2, competencyArea: 'mastering-content', completion: '10/16', accuracy: '65%', rating: '4.0/5', timeSpent: '380 mins', level: 1 },
        { id: 3, competencyArea: 'advocacy', completion: '6/16', accuracy: '55%', rating: '3.5/5', timeSpent: '250 mins', level: 1 },
        { id: 4, competencyArea: 'relationships', completion: '8/16', accuracy: '70%', rating: '4.2/5', timeSpent: '300 mins', level: 1 },
        { id: 5, competencyArea: 'technology-tools', completion: '14/16', accuracy: '85%', rating: '4.8/5', timeSpent: '450 mins', level: 1 },
        { id: 6, competencyArea: 'socio-emotional', completion: '9/16', accuracy: '60%', rating: '3.8/5', timeSpent: '280 mins', level: 1 },
        { id: 7, competencyArea: 'mastering-content', completion: '11/16', accuracy: '72%', rating: '4.1/5', timeSpent: '340 mins', level: 1 },
        { id: 8, competencyArea: 'advocacy', completion: '7/16', accuracy: '58%', rating: '3.6/5', timeSpent: '220 mins', level: 1 },
        { id: 9, competencyArea: 'relationships', completion: '13/16', accuracy: '82%', rating: '4.6/5', timeSpent: '400 mins', level: 1 },
    ];

    const displayData = trainingData.length > 0 ? trainingData : defaultData;

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
        activeTab: 'groups',
    };

    return (
        <PageLayout
            topBarConfig={topBarConfig}
            sidebarConfig={sidebarConfig}
            id="group-training-progress-page"
            className={className}
        >
            <div className="group-training-progress-page__content">
                {/* Tab Navigation */}
                <NavTabs
                    activeKey={activeTab}
                    onSelect={handleTabSelect}
                    className="group-training-progress-page__tabs"
                >
                    <NavTabs.Item eventKey="group-info" active={activeTab === 'group-info'}>
                        Group Info
                    </NavTabs.Item>
                    <NavTabs.Item eventKey="training-progress" active={activeTab === 'training-progress'}>
                        Training Progress
                    </NavTabs.Item>
                </NavTabs>

                {/* Inner Container */}
                <div className="group-training-progress-page__inner">
                    {/* Title Section */}
                    <div className="group-training-progress-page__title-section">
                        <h2 className="h4" style={{ color: 'var(--color-on-surface)' }}>
                            Group Training Progress
                        </h2>
                        <Button
                            text={selectedGroup}
                            style="primary"
                            fill="outline"
                            size="small"
                            trailingVisual="caret-down"
                            onClick={onGroupFilterChange}
                        />
                    </div>

                    {/* Overview Cards */}
                    <div className="group-training-progress-page__cards">
                        <OverviewCard
                            type="mastering-content"
                            subtitle="Mastering Content"
                            description="3/3 students need mastering content support"
                            smartData={{
                                socio: 0.45,
                                mastering: 0.85,
                                advocacy: 0.55,
                                relationships: 0.80,
                                technology: 0.65
                            }}
                        />
                        <OverviewCard
                            type="avg-completion"
                            title="Completion Rate"
                            subtitle="20%"
                            description="of total lessons have been completed by <first name>."
                            chartValue={20}
                            chartColor="#FFD23F"
                        />
                        <OverviewCard
                            type="avg-accuracy"
                            subtitle="20%"
                            description="is the average accuracy on the completed training lessons."
                            chartValue={20}
                            chartColor="#FFD23F"
                        />
                        <OverviewCard
                            type="time-spent"
                            subtitle="30 / 90 min"
                            description="is the average time <placeholder> spent on training. "
                            chartValue={33}
                            editLink={true}
                            chartColor="#FFD23F"
                        />
                    </div>

                    {/* Training Progress Table */}
                    <div className="group-training-progress-page__table-container">
                        <GroupTrainingProgressTable
                            data={displayData}
                            onAssignClick={onAssignClick}
                        />
                    </div>
                </div>
            </div>
        </PageLayout>
    );
};

GroupTrainingProgressPage.propTypes = {
    /** Array of training progress data */
    trainingData: PropTypes.array,
    /** Selected group filter */
    selectedGroup: PropTypes.string,
    /** Callback when tab changes */
    onTabChange: PropTypes.func,
    /** Callback when group filter changes */
    onGroupFilterChange: PropTypes.func,
    /** Callback when Assign is clicked */
    onAssignClick: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default GroupTrainingProgressPage;
