import React, { useState } from 'react';
import PropTypes from 'prop-types';
import NavTabs from '@/components/navigation/NavTabs';
import Button from '@/components/actions/Button';
import Divider from '@/components/layout-and-structure/Divider';
import Badge from '@/components/status-and-loading/Badge';
import { ButtonContainer } from '@/specs/Home/Elements/ButtonContainer';
import './HomepageJumbotron.scss';
import { headingTag } from '@/lib/headingLevel';

/**
 * HomepageJumbotron component for Home page
 * Displays a jumbotron with tabs for sign-up, session, and reflection views
 * Matches Figma design specifications
 */
const HomepageJumbotron = ({
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
    titleLevel = 2,
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

    // Level 1 makes the greeting the page's h1, at Heading/large; level 2 keeps
    // the h2 the Home pages have always drawn.
    const Title = headingTag(titleLevel);
    const titleClass = titleLevel === 1
        ? 'plus-homepage-jumbotron-title plus-homepage-jumbotron-title--page'
        : 'plus-homepage-jumbotron-title h2';

    return (
        <div
            id={id}
            className={`plus-homepage-jumbotron ${className}`}
            style={style}
        >
            {/* Tab Navigation */}
            <div className="plus-homepage-jumbotron-tabs-wrapper">
                <NavTabs
                    activeKey={currentTab}
                    onSelect={handleTabChange}
                    className="plus-homepage-jumbotron-nav-tabs"
                >
                    <NavTabs.Item
                        eventKey="sign-up"
                        active={currentTab === 'sign-up'}
                    >
                        Sign up / Edit
                    </NavTabs.Item>
                    <NavTabs.Item
                        eventKey="session"
                        active={currentTab === 'session'}
                    >
                        Session links
                        {' '}
                        <Badge
                            counter={sessionLinks.length}
                            style="primary"
                            size="b3"
                            className="plus-homepage-jumbotron-tab-badge"
                        />
                    </NavTabs.Item>
                    <NavTabs.Item
                        eventKey="reflection"
                        active={currentTab === 'reflection'}
                    >
                        Reflection
                    </NavTabs.Item>
                </NavTabs>
                <Divider size="sm" style="light" className="plus-homepage-jumbotron-divider" />
            </div>

            {/* Content Area */}
            <div className="plus-homepage-jumbotron-content">
                {currentTab === 'sign-up' && (
                    <>
                        <Title className={titleClass}>
                            Sign up for your next session, {tutorName}!
                        </Title>
                        <p className="plus-homepage-jumbotron-description body1-txt">
                            Your students are counting on you! Click below to sign up for your next session and edit if needed.
                        </p>
                        <div className="plus-homepage-jumbotron-actions">
                            <Button
                                text="Sign up now"
                                style="primary"
                                fill="filled"
                                size="small"
                                leadingVisual="paper-plane"
                                onClick={onSignUp}
                            />
                            <Button
                                text="View schedule"
                                style="secondary"
                                fill="tonal"
                                size="small"
                                onClick={onViewSchedule}
                            />
                        </div>
                    </>
                )}

                {currentTab === 'session' && (
                    <>
                        <Title className={titleClass}>
                            Get ready to shine, {tutorName}.
                        </Title>
                        <p className="plus-homepage-jumbotron-description body1-txt">
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
                        <Title className={titleClass}>
                            How did your session go, {tutorName}?
                        </Title>
                        <p className="plus-homepage-jumbotron-description body1-txt">
                            Share your thoughts about the session to ensure a great experience for all.
                        </p>
                        <div className="plus-homepage-jumbotron-actions">
                            <Button
                                text="Submit Your Reflection"
                                style="primary"
                                fill="filled"
                                size="small"
                                leadingVisual="paper-plane"
                                onClick={onSubmitReflection}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

HomepageJumbotron.propTypes = {
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
    /** 1: the greeting is the page's h1, at Heading/large 24. 2 (default): an h2 in the older h2 style. */
    titleLevel: PropTypes.oneOf([1, 2]),
    className: PropTypes.string,
    style: PropTypes.object
};

export default HomepageJumbotron;
