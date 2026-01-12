/**
 * WelcomeRowSection Component
 * 
 * Welcome section with tabs and jumbotron content.
 * Matches Figma design exactly: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=63-178182
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/Button';
import Badge from '@/components/Badge';
import './WelcomeRowSection.scss';

const defaultTabs = [
    { id: 'signup', label: 'Sign Up / Edit', selected: true },
    { id: 'session', label: 'Session links', count: 20 },
    { id: 'reflection', label: 'Reflection' }
];

const WelcomeRowSection = ({
    userName = 'Charmaine',
    tabs = defaultTabs,
    activeTab = 'signup',
    onTabChange,
    onSignUp,
    onViewSchedule,
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
        <section className={`welcome-row ${className}`} style={style}>
            {/* Homepage Jumbotron container */}
            <div className="welcome-row__jumbotron">
                {/* Nav Horizontal */}
                <div className="welcome-row__nav">
                    <div className="welcome-row__tabs">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                className={`welcome-row__tab ${selectedTab === tab.id ? 'welcome-row__tab--selected' : ''}`}
                                onClick={() => handleTabClick(tab.id)}
                                aria-selected={selectedTab === tab.id}
                            >
                                <div className="welcome-row__tab-inner">
                                    <div className="welcome-row__tab-content">
                                        <span className={`welcome-row__tab-text ${selectedTab === tab.id ? 'welcome-row__tab-text--selected' : ''}`}>
                                            {tab.label}
                                        </span>
                                        {tab.count !== undefined && (
                                            <Badge 
                                                size="b3" 
                                                style="primary"
                                                className="welcome-row__tab-badge"
                                            >
                                                {tab.count}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                    {/* Divider line extends to fill remaining width */}
                    <div className="welcome-row__divider" />
                </div>
                
                {/* Jumbotron content */}
                <div className="welcome-row__content">
                    {/* Header */}
                    <div className="welcome-row__header">
                        <h2 className="welcome-row__title">
                            Sign up for your next session, {userName}!
                        </h2>
                    </div>
                    
                    {/* Body */}
                    <div className="welcome-row__body">
                        <p className="welcome-row__description">
                            Your students are counting on you! Click below to sign up for your next session and edit if needed.
                        </p>
                        
                        {/* Button container */}
                        <div className="welcome-row__buttons">
                            <Button
                                text="Sign up now"
                                style="primary"
                                fill="filled"
                                size="medium"
                                leadingVisual="plus"
                                onClick={onSignUp}
                            />
                            <Button
                                text="View schedule"
                                style="secondary"
                                fill="tonal"
                                size="medium"
                                onClick={onViewSchedule}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

WelcomeRowSection.propTypes = {
    /** User name for greeting */
    userName: PropTypes.string,
    /** Tab configuration array */
    tabs: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        selected: PropTypes.bool,
        count: PropTypes.number
    })),
    /** Currently active tab ID */
    activeTab: PropTypes.string,
    /** Callback when tab changes */
    onTabChange: PropTypes.func,
    /** Callback for Sign up button */
    onSignUp: PropTypes.func,
    /** Callback for View schedule button */
    onViewSchedule: PropTypes.func,
    /** Additional CSS class */
    className: PropTypes.string,
    /** Inline styles */
    style: PropTypes.object
};

export default WelcomeRowSection;
