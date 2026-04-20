import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../../../../../components/Button/Button';
import Rating from '../../../../../forms/Rating';
import { PageLayout } from '../../../../../specs/Universal/Pages';
import SideNavBar from '../../sections/SideNavBar/SideNavBar';

const selfRatingCommentsByValue = {
    1: 'I have a lot to improve on.',
    2: 'Not so well, there are things I should adjust.',
    3: "Okay, I could've done better.",
    4: 'Good, with some room for improvement.',
    5: 'Excellent performance!',
};

const SelfReflectionUnfilled = ({
    students = [],
    activeTab: initialActiveTab,
}) => {
    const [activeTab, setActiveTab] = useState(initialActiveTab);
    const [selfRating, setSelfRating] = useState(0);

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
                id="self-reflection-unfilled"
            >
                <div
                    style={{
                        display: 'flex',
                        gap: 'var(--size-surface-gap-md)',
                        width: '100%',
                        height: '100%',
                        alignItems: 'stretch',
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
                            gap: 'var(--size-section-gap-lg)',
                            flex: '1 0 0',
                            minHeight: 0,
                        }}
                    >
                        <h4 className="h4 m-0" style={{ color: 'var(--color-on-surface)' }}>
                            Self Reflection: How do you think you did?
                        </h4>

                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 'var(--size-element-gap-lg)',
                            }}
                        >
                            <p className="h6 m-0" style={{ color: 'var(--color-on-surface)' }}>
                                How was your own performance during the session?
                                <span style={{ color: 'var(--color-danger)' }}> *</span>
                            </p>

                            <Rating
                                id="self-reflection-rating"
                                value={selfRating}
                                onChange={setSelfRating}
                                variant="comments"
                                showCommentsLabel={Boolean(selfRatingCommentsByValue[selfRating])}
                                commentsLabel={selfRatingCommentsByValue[selfRating] || null}
                            />
                        </div>

                        {/* Navigation Buttons */}
                        <div
                            style={{
                                display: 'flex',
                                gap: 'var(--size-element-gap-lg)',
                                alignItems: 'center',
                            }}
                        >
                            <Button 
                                text="Previous" 
                                style="primary" 
                                fill="tonal" 
                                size="medium" 
                            />
                            <Button 
                                text="Next" 
                                style="primary" 
                                fill="filled" 
                                size="medium" 
                                disabled
                            />
                        </div>
                    </div>
                </div>
            </PageLayout>
        </div>
    );
};

SelfReflectionUnfilled.propTypes = {
    students: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
            status: PropTypes.string,
        })
    ),
    activeTab: PropTypes.string,
};

SelfReflectionUnfilled.defaultProps = {
    students: [
        { name: 'Kiera Wintervale', status: 'complete' },
        { name: 'Baxter Ellington', status: 'complete' },
        { name: 'Milo Thorne', status: 'complete' },
    ],
    activeTab: 'self-reflection',
};

export default SelfReflectionUnfilled;

