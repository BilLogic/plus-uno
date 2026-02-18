import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../../../../../components/Button/Button';
import { PageLayout } from '../../../../../specs/Universal/Pages';
import SideNavBar from '../../sections/SideNavBar/SideNavBar';
import { SessionRatingField } from '../../elements/SessionRating.stories';

const sessionRatingCommentsByValue = {
    1: 'Lots of room for improvement.',
    2: 'Not so well, adjustments are needed.',
    3: "Okay, could've gone better.",
    4: 'Good, with some room for improvement.',
    5: 'Excellent session!',
};

const SessionReflectionPart1 = ({
    students,
    activeTab: initialActiveTab,
    initialRating,
}) => {
    const [activeTab, setActiveTab] = useState(initialActiveTab);
    const [sessionRating, setSessionRating] = useState(initialRating);

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <PageLayout
                topBarConfig={{
                    breadcrumbs: [
                        { text: 'Toolkit', href: '#' },
                        { text: 'Sessions', href: '#' },
                        { text: 'Reflection Form' },
                    ],
                    user: { name: 'John Doe', type: 'lead tutor' },
                }}
                sidebarConfig={{
                    user: 'tutor',
                    activeTab: 'sessions',
                }}
                id="session-reflection-part-1"
            >
                <div
                    style={{
                        display: 'flex',
                        gap: 'var(--size-surface-gap-md)',
                        width: '100%',
                        minHeight: '100%',
                    }}
                >
                    <SideNavBar
                        state="default"
                        students={students}
                        activeTab={activeTab}
                        onTabClick={setActiveTab}
                    />

                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--size-section-gap-md)',
                            flex: '1 0 0',
                        }}
                    >
                        <h4 className="h4 m-0" style={{ color: 'var(--color-on-surface)' }}>
                            Session Evaluation: How did the session go?
                        </h4>

                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 'var(--size-element-gap-lg)',
                            }}
                        >
                            <p className="h6 m-0" style={{ color: 'var(--color-on-surface)' }}>
                                How was the overall session?
                                <span style={{ color: 'var(--color-danger)' }}> *</span>
                            </p>

                            <SessionRatingField
                                id="session-reflection-part-1-rating"
                                value={sessionRating}
                                onChange={setSessionRating}
                                commentsLabel={sessionRatingCommentsByValue[sessionRating] || null}
                            />
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                gap: 'var(--size-section-gap-lg)',
                                alignItems: 'center',
                            }}
                        >
                            <Button text="Previous" style="primary" fill="tonal" size="medium" />
                            <Button text="Next" style="primary" fill="tonal" size="medium" disabled />
                        </div>
                    </div>
                </div>
            </PageLayout>
        </div>
    );
};

SessionReflectionPart1.propTypes = {
    students: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
            status: PropTypes.string,
        })
    ),
    activeTab: PropTypes.string,
    initialRating: PropTypes.number,
};

SessionReflectionPart1.defaultProps = {
    students: [
        { name: 'Kiera Wintervale', status: 'complete' },
        { name: 'Baxter Ellington', status: 'complete' },
        { name: 'Milo Thorne', status: 'incomplete' },
    ],
    activeTab: 'session-reflection',
    initialRating: 0,
};

export default SessionReflectionPart1;
