import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Tabs from '@/components/navigation/Tabs';
import Button from '@/components/forms-and-inputs/Button';
import CountTag from '@/components/labels/CountTag';
import { ButtonContainer } from '@/specs/Home/Elements/ButtonContainer';
import './HomeHero.scss';

/**
 * HomeHero component for Home page
 * Displays a jumbotron with tabs for sign-up, session, and reflection views
 * Matches Figma design specifications
 */
const HomeHero = ({
    id,
    activeTab: controlledTab,
    onTabChange,
    tutorName = "[Tutor's Name]",
    sessionLinks = [],
    selectedSession,
    onSessionSelect,
    onJoinSession,
    onSignUp,
    onViewSchedule,
    onSubmitReflection,
    className = '',
    style
}) => {
    const [internalTab, setInternalTab] = useState('sign-up');
    const currentTab = controlledTab !== undefined ? controlledTab : internalTab;

    const handleTabChange = (tabKey) => {
        if (controlledTab === undefined) {
            setInternalTab(tabKey);
        }
        if (onTabChange) {
            onTabChange(tabKey);
        }
    };

    // Today's session links, as the options ButtonContainer's Select offers
    const sessionOptions = sessionLinks.map((s) => ({
        value: s.id,
        label: `${s.studentName}, ${s.time}, ${s.date}`,
    }));
    
    const isSessionEnabled = !!selectedSession && sessionLinks.length > 0;

    return (
        <div
            id={id}
            className={`plus-home-hero ${className}`}
            style={style}
        >
            {/* Tab Navigation */}
            <div className="plus-home-hero-tabs-wrapper">
                <Tabs
                    activeKey={currentTab}
                    onSelect={handleTabChange}
                    className="plus-home-hero-nav-tabs"
                >
                    <Tabs.Tab
                        eventKey="sign-up"
                    >
                        Sign up / Edit
                    </Tabs.Tab>
                    <Tabs.Tab
                        eventKey="session"
                    >
                        Session links
                        {' '}
                        <CountTag value={sessionLinks.length} className="plus-home-hero-tab-badge" />
                    </Tabs.Tab>
                    <Tabs.Tab
                        eventKey="reflection"
                    >
                        Reflection
                    </Tabs.Tab>
                </Tabs>
                <div className="plus-home-hero-divider" role="separator" />
            </div>

            {/* Content Area */}
            <div className="plus-home-hero-content">
                {currentTab === 'sign-up' && (
                    <>
                        <h2 className="plus-home-hero-title h2">
                            Sign up for your next session, {tutorName}!
                        </h2>
                        <p className="plus-home-hero-description body1-txt">
                            Your students are counting on you! Click below to sign up for your next session and edit if needed.
                        </p>
                        <div className="plus-home-hero-actions">
                            <Button
                                text="Sign up now"
                                appearance="primary"
                                spacing="compact"
                                iconBefore="paper-plane"
                                onClick={onSignUp}
                            />
                            <Button
                                text="View schedule"
                                spacing="compact"
                                onClick={onViewSchedule}
                            />
                        </div>
                    </>
                )}

                {currentTab === 'session' && (
                    <>
                        <h2 className="plus-home-hero-title h2">
                            Get ready to shine, {tutorName}.
                        </h2>
                        <p className="plus-home-hero-description body1-txt">
                            Your session links for today are ready. Select a session and click 'Join session' to begin.
                        </p>
                        <ButtonContainer
                            enabled={isSessionEnabled}
                            buttonText="Join session"
                            sessions={sessionOptions}
                            selectedSession={selectedSession}
                            message="Session links will appear 5 minutes before your scheduled start time."
                            messageType="warning"
                            onButtonClick={onJoinSession}
                            onSelectChange={onSessionSelect}
                        />
                    </>
                )}

                {currentTab === 'reflection' && (
                    <>
                        <h2 className="plus-home-hero-title h2">
                            How did your session go, {tutorName}?
                        </h2>
                        <p className="plus-home-hero-description body1-txt">
                            Share your thoughts about the session to ensure a great experience for all.
                        </p>
                        <div className="plus-home-hero-actions">
                            <Button
                                text="Submit Your Reflection"
                                appearance="primary"
                                spacing="compact"
                                iconBefore="paper-plane"
                                onClick={onSubmitReflection}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

HomeHero.propTypes = {
    id: PropTypes.string,
    activeTab: PropTypes.oneOf(['sign-up', 'session', 'reflection']),
    onTabChange: PropTypes.func,
    tutorName: PropTypes.string,
    sessionLinks: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        studentName: PropTypes.string.isRequired,
        time: PropTypes.string.isRequired,
        date: PropTypes.string.isRequired
    })),
    selectedSession: PropTypes.string,
    onSessionSelect: PropTypes.func,
    onJoinSession: PropTypes.func,
    onSignUp: PropTypes.func,
    onViewSchedule: PropTypes.func,
    onSubmitReflection: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object
};

export default HomeHero;
