import React from 'react';
import PropTypes from 'prop-types';
import Card from '@/components/Card';
import Table from '@/components/Table';
import Button from '@/components/Button';
import Badge from '@/components/Badge';
import './BottomDiv.scss';

/**
 * OverviewCard component for displaying metrics
 */
const OverviewCard = ({
    type,
    title,
    value,
    label,
    visualization,
    className = ''
}) => {
    const cardClasses = [
        'plus-overview-card',
        `plus-overview-card--${type}`,
        className
    ].filter(Boolean).join(' ');

    return (
        <Card
            className={cardClasses}
            paddingSize="md"
            gapSize="md"
            radiusSize="md"
            showBorder={true}
        >
            <div className="plus-overview-card-header">
                <h5 className="plus-overview-card-title h5">{title}</h5>
                <i className="fa-solid fa-circle-info"></i>
            </div>
            <div className="plus-overview-card-body">
                <div className="plus-overview-card-text">
                    <div className="plus-overview-card-value body2-txt font-weight-bold">
                        {value}
                    </div>
                    <p className="body3-txt">{label}</p>
                </div>
                {visualization && (
                    <div className="plus-overview-card-visualization">
                        {visualization}
                    </div>
                )}
            </div>
        </Card>
    );
};

OverviewCard.propTypes = {
    type: PropTypes.oneOf(['status', 'effort', 'progress', 'relationships']),
    title: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    visualization: PropTypes.node,
    className: PropTypes.string
};

/**
 * BottomDiv component for Home page
 * Displays overview cards and students table
 */
const BottomDiv = ({
    id,
    variant = 'default', // 'default' or 'variant2'
    overviewCards = [],
    students = [],
    onViewAll,
    className = '',
    style
}) => {
    const renderStatusCard = (card) => (
        <OverviewCard
            key="status"
            type="status"
            title="Status"
            value={card.value || "37.5%"}
            label={card.label || "students has status: outstanding."}
            visualization={
                <div className="plus-overview-card-chart">
                    <div className="plus-overview-card-chart-value h4">37.5%</div>
                    <div className="plus-overview-card-chart-graph">
                        {/* Circular chart visualization - simplified */}
                        <svg viewBox="0 0 96 96" width="96" height="96">
                            <circle
                                cx="48"
                                cy="48"
                                r="40"
                                fill="none"
                                stroke="var(--color-outline-variant)"
                                strokeWidth="8"
                            />
                            <circle
                                cx="48"
                                cy="48"
                                r="40"
                                fill="none"
                                stroke="var(--color-primary)"
                                strokeWidth="8"
                                strokeDasharray={`${0.375 * 251.2} 251.2`}
                                transform="rotate(-90 48 48)"
                            />
                        </svg>
                    </div>
                </div>
            }
        />
    );

    const renderEffortCard = (card) => (
        <OverviewCard
            key="effort"
            type="effort"
            title="Effort"
            value={card.value || "2/10"}
            label={card.label || "students have fulfilled their effort goals."}
            visualization={
                <div className="plus-overview-card-chart">
                    <div className="plus-overview-card-chart-graph">
                        <svg viewBox="0 0 96 80" width="96" height="80">
                            <circle
                                cx="48"
                                cy="40"
                                r="35"
                                fill="none"
                                stroke="var(--color-outline-variant)"
                                strokeWidth="6"
                            />
                            <circle
                                cx="48"
                                cy="40"
                                r="35"
                                fill="none"
                                stroke="var(--color-primary)"
                                strokeWidth="6"
                                strokeDasharray={`${0.2 * 219.9} 219.9`}
                                transform="rotate(-90 48 40)"
                            />
                        </svg>
                    </div>
                    <div className="plus-overview-card-chart-value h4">20%</div>
                </div>
            }
        />
    );

    const renderProgressCard = (card) => (
        <OverviewCard
            key="progress"
            type="progress"
            title="Progress"
            value={card.value || "2/10"}
            label={card.label || "students have fulfilled their progress goals."}
            visualization={
                <div className="plus-overview-card-chart">
                    <div className="plus-overview-card-chart-graph">
                        <svg viewBox="0 0 96 80" width="96" height="80">
                            <circle
                                cx="48"
                                cy="40"
                                r="35"
                                fill="none"
                                stroke="var(--color-outline-variant)"
                                strokeWidth="6"
                            />
                            <circle
                                cx="48"
                                cy="40"
                                r="35"
                                fill="none"
                                stroke="var(--color-primary)"
                                strokeWidth="6"
                                strokeDasharray={`${0.2 * 219.9} 219.9`}
                                transform="rotate(-90 48 40)"
                            />
                        </svg>
                    </div>
                    <div className="plus-overview-card-chart-value h4">20%</div>
                </div>
            }
        />
    );

    const renderRelationshipsCard = (card) => (
        <OverviewCard
            key="relationships"
            type="relationships"
            title="Student Need"
            value={card.value || "Relationships"}
            label={card.label || "3/3 students need relationship support"}
            visualization={
                <div className="plus-overview-card-smart-bars">
                    {['S', 'M', 'A', 'R', 'T'].map((letter, index) => (
                        <div key={letter} className="plus-overview-card-smart-bar">
                            <div className="plus-overview-card-smart-bar-bg">
                                <div
                                    className="plus-overview-card-smart-bar-fill"
                                    style={{
                                        width: letter === 'R' ? '100%' : '0%',
                                        backgroundColor: letter === 'R' 
                                            ? 'var(--color-relationship-container)' 
                                            : 'transparent'
                                    }}
                                />
                            </div>
                            <span className="body3-txt">{letter}</span>
                        </div>
                    ))}
                </div>
            }
        />
    );

    const renderOverviewCard = (card) => {
        switch (card.type) {
            case 'status':
                return renderStatusCard(card);
            case 'effort':
                return renderEffortCard(card);
            case 'progress':
                return renderProgressCard(card);
            case 'relationships':
                return renderRelationshipsCard(card);
            default:
                return null;
        }
    };

    const tableHeaders = [
        {
            text: (
                <div className="plus-students-table-header">
                    <span>Name</span>
                    <i className="fa-solid fa-arrow-up"></i>
                </div>
            ),
            width: '33.33%'
        },
        {
            text: (
                <div className="plus-students-table-header">
                    <span>Status</span>
                    <i className="fa-solid fa-arrow-up"></i>
                </div>
            ),
            width: '33.33%'
        },
        {
            text: (
                <div className="plus-students-table-header">
                    <span>Focus Area</span>
                    <i className="fa-solid fa-arrow-up"></i>
                </div>
            ),
            width: '33.33%'
        }
    ];

    const tableRows = students.map((student) => [
        {
            content: <span className="body2-txt">{student.name}</span>
        },
        {
            content: (
                <Badge
                    text={student.status}
                    style="danger"
                    size="b3"
                />
            )
        },
        {
            content: student.focusArea ? (
                <Badge
                    text={student.focusArea}
                    style={student.focusArea.toLowerCase().replace(/\s+/g, '-')}
                    size="b3"
                    leadingVisual="circle-dot"
                />
            ) : (
                <span className="body1-txt">-</span>
            )
        }
    ]);

    const sectionClasses = [
        'plus-bottom-div',
        `plus-bottom-div--${variant}`,
        className
    ].filter(Boolean).join(' ');

    if (variant === 'variant2') {
        return (
            <div id={id} className={sectionClasses} style={style}>
                <div className="plus-bottom-div-overview">
                    <h5 className="plus-bottom-div-title h5">
                        Students Overview
                    </h5>
                    <div className="plus-bottom-div-cards">
                        <div className="plus-bottom-div-cards-row">
                            {overviewCards.filter(c => c.type === 'relationships').map(renderOverviewCard)}
                            {overviewCards.filter(c => c.type === 'status').map(renderOverviewCard)}
                        </div>
                        <div className="plus-bottom-div-cards-row">
                            {overviewCards.filter(c => c.type === 'effort').map(renderOverviewCard)}
                            {overviewCards.filter(c => c.type === 'progress').map(renderOverviewCard)}
                        </div>
                    </div>
                </div>
                <div className="plus-bottom-div-students">
                    <div className="plus-bottom-div-students-header">
                        <h5 className="plus-bottom-div-title h5">
                            My Students
                        </h5>
                        <Button
                            text="View all"
                            style="primary"
                            fill="ghost"
                            size="medium"
                            onClick={onViewAll}
                        />
                    </div>
                    <Table
                        headers={tableHeaders}
                        rows={tableRows}
                        density="md"
                        className="plus-students-table"
                    />
                </div>
            </div>
        );
    }

    return (
        <div id={id} className={sectionClasses} style={style}>
            <div className="plus-bottom-div-overview">
                <h5 className="plus-bottom-div-title h5">
                    Students Overview
                </h5>
                <div className="plus-bottom-div-cards">
                    <div className="plus-bottom-div-cards-row">
                        {overviewCards.filter(c => c.type === 'relationships').map(renderOverviewCard)}
                        {overviewCards.filter(c => c.type === 'status').map(renderOverviewCard)}
                    </div>
                    <div className="plus-bottom-div-cards-row">
                        {overviewCards.filter(c => c.type === 'effort').map(renderOverviewCard)}
                        {overviewCards.filter(c => c.type === 'progress').map(renderOverviewCard)}
                    </div>
                </div>
            </div>
            <div className="plus-bottom-div-students">
                <div className="plus-bottom-div-students-header">
                    <h5 className="plus-bottom-div-title h5">
                        My Students
                    </h5>
                    <Button
                        text="View all"
                        style="primary"
                        fill="ghost"
                        size="medium"
                        onClick={onViewAll}
                    />
                </div>
                <Table
                    headers={tableHeaders}
                    rows={tableRows}
                    density="md"
                    className="plus-students-table"
                />
            </div>
        </div>
    );
};

BottomDiv.propTypes = {
    id: PropTypes.string,
    variant: PropTypes.oneOf(['default', 'variant2']),
    overviewCards: PropTypes.arrayOf(PropTypes.shape({
        type: PropTypes.oneOf(['status', 'effort', 'progress', 'relationships']).isRequired,
        value: PropTypes.string,
        label: PropTypes.string
    })),
    students: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
        status: PropTypes.string.isRequired,
        focusArea: PropTypes.string
    })),
    onViewAll: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object
};

export default BottomDiv;

