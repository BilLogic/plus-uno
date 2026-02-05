/**
 * LessonWelcomeSection Component
 * 
 * Welcome section with navigation tabs and actionable jumbotron content.
 * Matches Figma design: 63-178182 ("Welcome Row")
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/Button';
import Badge from '@/components/Badge';
import './LessonWelcomeSection.scss';

const defaultTabs = [
    { id: 'sign-up', label: 'Sign Up / Edit', selected: true },
    { id: 'session-links', label: 'Session links' },
    { id: 'reflection', label: 'Reflection' }
];

const LessonWelcomeSection = ({
    userName = 'Tutor',
    tabs = defaultTabs,
    activeTab = 'sign-up',
    title = 'Welcome back, Tutor!',
    description = 'Sign up for your next session to continue your journey.',
    primaryAction = { text: 'Sign up now', leadingVisual: 'square-plus', onClick: () => { } },
    secondaryAction = { text: 'View schedule', style: 'secondary', fill: 'filled', onClick: () => { } },
    onTabChange,
    className = '',
    style
}) => {
    const [selectedTab, setSelectedTab] = useState(activeTab);

    const handleTabClick = (tabId) => {
        setSelectedTab(tabId);
        if (onTabChange) {
            onTabChange(tabId);
        }
    };

    return (
        <section className={`lesson-welcome-section ${className}`} style={style}>
            <div className="lesson-welcome-section__container">
                <div className="lesson-welcome-section__tabs-container">
                    <div className="lesson-welcome-section__tabs">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                className={`lesson-welcome-section__tab ${selectedTab === tab.id ? 'lesson-welcome-section__tab--selected' : ''}`}
                                onClick={() => handleTabClick(tab.id)}
                                aria-selected={selectedTab === tab.id}
                            >
                                <span className="lesson-welcome-section__tab-text">
                                    {tab.label}
                                </span>
                                {tab.count !== undefined && (
                                    <Badge
                                        size="b3"
                                        style="primary"
                                        className="lesson-welcome-section__tab-badge"
                                    >
                                        {tab.count}
                                    </Badge>
                                )}
                                {selectedTab === tab.id && (
                                    <div className="lesson-welcome-section__tab-indicator" />
                                )}
                            </button>
                        ))}
                    </div>
                    <div className="lesson-welcome-section__divider" />
                </div>

                <div className="lesson-welcome-section__content">
                    <div className="lesson-welcome-section__text">
                        <h2 className="lesson-welcome-section__title h2">
                            {title}
                        </h2>
                        {description && (
                            <p className="lesson-welcome-section__description body1-txt">
                                {description}
                            </p>
                        )}
                    </div>

                    <div className="lesson-welcome-section__actions">
                        {primaryAction && (
                            <Button
                                text={primaryAction.text}
                                style="primary"
                                fill="filled"
                                size="medium"
                                leadingVisual={primaryAction.leadingVisual} // Support icon
                                onClick={primaryAction.onClick}
                            />
                        )}
                        {secondaryAction && (
                            <Button
                                text={secondaryAction.text}
                                style={secondaryAction.style || 'secondary'} // Default to secondary logic
                                fill={secondaryAction.fill || 'filled'} // Assume filled/tonal for secondary
                                size="medium"
                                leadingVisual={secondaryAction.leadingVisual}
                                onClick={secondaryAction.onClick}
                            />
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

LessonWelcomeSection.propTypes = {
    userName: PropTypes.string,
    tabs: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        selected: PropTypes.bool,
        count: PropTypes.number
    })),
    activeTab: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    primaryAction: PropTypes.shape({
        text: PropTypes.string,
        onClick: PropTypes.func,
        leadingVisual: PropTypes.any
    }),
    secondaryAction: PropTypes.shape({
        text: PropTypes.string,
        onClick: PropTypes.func,
        style: PropTypes.string,
        fill: PropTypes.string,
        leadingVisual: PropTypes.any
    }),
    onTabChange: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object
};

export default LessonWelcomeSection;
