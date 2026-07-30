import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { PageLayout } from '@/specs/Universal/Pages';
import SideNavBar from '@/specs/Toolkit/Post-Session/Sections/SideNavBar/SideNavBar';
import LinearScale from '@/specs/Toolkit/Post-Session/Sections/LinearScale/LinearScale';
import NavigationButtons from '@/specs/Toolkit/Post-Session/Elements/NavigationButtons/NavigationButtons';
import LastUpdated from '@/specs/Toolkit/Post-Session/Elements/LastUpdated/LastUpdated';

/**
 * Self Reflection page — unfilled (Linear Scale, not star rating).
 *
 * @param {object} props
 * @param {{ name: string, status?: string }[]} [props.students]
 * @param {string} [props.activeTab]
 */
const SelfReflectionUnfilled = ({
    students = [],
    activeTab: initialActiveTab = 'self-reflection',
}) => {
    const [activeTab, setActiveTab] = useState(initialActiveTab);
    const [rating, setRating] = useState(0);

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
                        state="in-progress"
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
                            minHeight: 0,
                            minWidth: 0,
                        }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-xs)' }}>
                            <h4 className="h4 m-0" style={{ color: 'var(--color-on-surface)' }}>
                                Self Reflection
                            </h4>
                            <LastUpdated />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-sm)' }}>
                            <p className="body1-txt font-weight-semibold m-0" style={{ color: 'var(--color-on-surface)' }}>
                                How do you feel about your performance this session?
                                <span style={{ color: 'var(--color-danger)' }}> *</span>
                            </p>
                            <LinearScale
                                name="self-reflection-rating"
                                value={rating}
                                onChange={setRating}
                            />
                        </div>

                        <NavigationButtons
                            showPrevious
                            canSave={rating >= 1}
                            canNext={rating >= 1}
                        />
                    </div>
                </div>
            </PageLayout>
        </div>
    );
};

SelfReflectionUnfilled.propTypes = {
    students: PropTypes.array,
    activeTab: PropTypes.string,
};

export default SelfReflectionUnfilled;
