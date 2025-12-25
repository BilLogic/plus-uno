import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { InputGroup as BootstrapInputGroup, Form } from 'react-bootstrap';
import NavTabs from '@/components/NavTabs';
import Button from '@/components/Button';
import Divider from '@/components/Divider';
import Select from '@/forms/Select';
import Badge from '@/components/Badge';
import './HomepageJumbotron.scss';

/**
 * HomepageJumbotron component for Home page
 * Displays a jumbotron with tabs for sign-up, session, and reflection views
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

    const renderSignUpContent = () => (
        <div className="plus-homepage-jumbotron-content">
            <h2 className="plus-homepage-jumbotron-title h4">
                Sign up for your next session, {tutorName}!
            </h2>
            <div className="plus-homepage-jumbotron-body">
                <p className="body1-txt">
                    Your students are counting on you! Click below to sign up for your next session and edit if needed.
                </p>
                <div className="plus-homepage-jumbotron-actions">
                    <Button
                        text="Sign up now"
                        style="primary"
                        fill="filled"
                        size="medium"
                        leadingVisual="location-arrow"
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
    );

    const renderSessionContent = () => (
        <div className="plus-homepage-jumbotron-content">
            <h2 className="plus-homepage-jumbotron-title h4">
                Get ready to shine, {tutorName}.
            </h2>
            <div className="plus-homepage-jumbotron-body">
                <p className="body1-txt">
                    Your session links for today are ready. Select a session and click 'Join session' to begin.
                </p>
                <div className="plus-homepage-jumbotron-session-controls">
                    <BootstrapInputGroup className="plus-homepage-jumbotron-input-group">
                        <BootstrapInputGroup.Text className="plus-homepage-jumbotron-button-wrapper">
                            <Button
                                text="Join session"
                                style="secondary"
                                fill="outline"
                                size="medium"
                                onClick={onJoinSession}
                                disabled={!selectedSession}
                                className="plus-homepage-jumbotron-join-btn"
                            />
                        </BootstrapInputGroup.Text>
                        <Form.Select
                            id="session-select"
                            value={selectedSession || ''}
                            onChange={(e) => onSessionSelect && onSessionSelect(e.target.value)}
                            className="plus-homepage-jumbotron-select body2-txt"
                            disabled={!sessionLinks.length}
                        >
                            {!selectedSession && <option value="">Select a session</option>}
                            {sessionLinks.map(session => (
                                <option key={session.id} value={session.id}>
                                    {session.studentName}, {session.time}, {session.date}
                                </option>
                            ))}
                        </Form.Select>
                    </BootstrapInputGroup>
                    <div className="plus-homepage-jumbotron-info">
                        <i className="fa-solid fa-circle-info"></i>
                        <p className="body3-txt">
                            Session links will appear 5 minutes before your scheduled start time.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderReflectionContent = () => (
        <div className="plus-homepage-jumbotron-content">
            <h2 className="plus-homepage-jumbotron-title h4">
                How did your session go, {tutorName}?
            </h2>
            <div className="plus-homepage-jumbotron-body">
                <p className="body1-txt">
                    Share your thoughts about the session to ensure a great experience for all.
                </p>
                <div className="plus-homepage-jumbotron-actions">
                    <Button
                        text="Submit Your Reflection"
                        style="primary"
                        fill="filled"
                        size="medium"
                        leadingVisual="location-arrow"
                        onClick={onSubmitReflection}
                    />
                </div>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (currentTab) {
            case 'session':
                return renderSessionContent();
            case 'reflection':
                return renderReflectionContent();
            default:
                return renderSignUpContent();
        }
    };

    return (
        <div
            id={id}
            className={`plus-homepage-jumbotron ${className}`}
            style={style}
        >
            <div className="plus-homepage-jumbotron-tabs">
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
                        {currentTab === 'session' && (
                            <Badge
                                counter={sessionLinks.length}
                                style="primary"
                                size="b3"
                                className="plus-homepage-jumbotron-tab-badge"
                            />
                        )}
                    </NavTabs.Item>
                    <NavTabs.Item
                        eventKey="reflection"
                        active={currentTab === 'reflection'}
                    >
                        Reflection
                    </NavTabs.Item>
                </NavTabs>
            </div>
            <Divider size="sm" style="light" />
            <div className="plus-homepage-jumbotron-jumbotron">
                {renderContent()}
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
    className: PropTypes.string,
    style: PropTypes.object
};

export default HomepageJumbotron;

