/**
 * GroupTrainingProgressPage Component
 * 
 * Full page layout for Group Training Progress with overview cards and training progress table.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=531-62962
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { PageLayout } from '../../../../Universal/Pages';
import NavTabs from '../../../../../components/NavTabs/NavTabs';
import Button from '../../../../../components/Button/Button';
import GroupTrainingProgressTable from '../../Tables/GroupTrainingProgressTable/GroupTrainingProgressTable';
import '../../Tables/GroupTrainingProgressTable/GroupTrainingProgressTable.scss';
import './GroupTrainingProgressPage.scss';

/**
 * Overview Card Component
 */
const OverviewCard = ({ title, value, description, variant = 'default' }) => {
    const isStudentNeed = variant === 'student-need';
    
    return (
        <div className={`overview-card ${isStudentNeed ? 'overview-card--student-need' : ''}`}>
            <div className="overview-card__header">
                <h5 
                    className="h5" 
                    style={{ 
                        color: isStudentNeed 
                            ? 'var(--color-mastering-content-text)' 
                            : 'var(--color-on-surface-variant)',
                        whiteSpace: 'nowrap'
                    }}
                >
                    {title}
                </h5>
                <i 
                    className="fas fa-circle-info" 
                    style={{ 
                        fontSize: '20px', 
                        color: isStudentNeed 
                            ? 'var(--color-mastering-content-text)' 
                            : 'var(--color-on-surface-variant)' 
                    }} 
                />
            </div>
            <div className="overview-card__body">
                <div className="overview-card__text">
                    <div 
                        className="body2-txt" 
                        style={{ 
                            fontWeight: 'var(--font-weight-bold)', 
                            color: isStudentNeed 
                                ? 'var(--color-mastering-content-text)' 
                                : 'var(--color-on-surface-variant)' 
                        }}
                    >
                        {value}
                    </div>
                    <p 
                        className="body3-txt" 
                        style={{ 
                            fontWeight: 300, 
                            color: isStudentNeed 
                                ? 'var(--color-mastering-content-text)' 
                                : 'var(--color-on-surface-variant)',
                            margin: 0 
                        }}
                    >
                        {description}
                    </p>
                </div>
                {isStudentNeed ? (
                    <SmartBars />
                ) : (
                    <div className="overview-card__progress">
                        <span className="h4" style={{ color: 'var(--color-on-surface-variant)' }}>
                            {value}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * SMART Bars Visualization Component
 */
const SmartBars = () => {
    const bars = [
        { letter: 'S', height: 60, color: 'var(--color-social-emotional-container)', textColor: 'var(--color-social-emotional-text)' },
        { letter: 'M', height: 70, color: 'var(--color-mastering-content)', textColor: 'var(--color-mastering-content-text)' },
        { letter: 'A', height: 60, color: 'var(--color-advocacy-container)', textColor: 'var(--color-advocacy-text)' },
        { letter: 'R', height: 60, color: 'var(--color-relationship-container)', textColor: 'var(--color-relationship-text)' },
        { letter: 'T', height: 60, color: 'var(--color-technology-tools-container)', textColor: 'var(--color-technology-tools-text)' },
    ];

    return (
        <div className="smart-bars">
            {bars.map((bar) => (
                <div key={bar.letter} className="smart-bars__item">
                    <div className="smart-bars__bar-wrapper">
                        <div className="smart-bars__bar-bg" />
                        <div 
                            className="smart-bars__bar" 
                            style={{ height: `${bar.height}px`, backgroundColor: bar.color }} 
                        />
                    </div>
                    <span 
                        className="body3-txt" 
                        style={{ fontWeight: 300, color: bar.textColor, textTransform: 'uppercase' }}
                    >
                        {bar.letter}
                    </span>
                </div>
            ))}
        </div>
    );
};

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
                            title="Student Need"
                            value="Mastering Content"
                            description="3/3 students need mastering content support"
                            variant="student-need"
                        />
                        <OverviewCard
                            title="Completion Rate"
                            value="20%"
                            description="of total lessons have been completed by <first name>."
                        />
                        <OverviewCard
                            title="Avg Accuracy Rate"
                            value="20%"
                            description="is the average accuracy on the completed training lessons."
                        />
                        <OverviewCard
                            title="Avg Time Spent"
                            value="30 / 90 min"
                            description="is the average time <placeholder> spent on training. Edit Goal"
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
