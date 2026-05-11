import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../../../../../components/Button/Button';
import Rating from '../../../../../forms/Rating';
import Checkbox from '../../../../../forms/Checkbox';
import Textarea from '../../../../../forms/Textarea';
import { PageLayout } from '../../../../../specs/Universal/Pages';
import SideNavBar from '../../sections/SideNavBar/SideNavBar';

const improvementAreas = [
    { id: 'math-proficiency', label: 'Build my math teaching proficiency.' },
    { id: 'know-students', label: 'Get to know students better.' },
    { id: 'motivate-students', label: 'Learn what motivates students.' },
    { id: 'time-management', label: 'Practice better time management.' },
    { id: 'encourage-participation', label: "Encourage students' participation." },
    { id: 'communication-skills', label: 'Enhance communication skills.' },
    { id: 'stay-positive', label: 'Stay positive and supportive.' },
    { id: 'other', label: 'Other:' },
];

const SelfReflectionFilled = ({
    students = [],
    activeTab: initialActiveTab,
}) => {
    const [activeTab, setActiveTab] = useState(initialActiveTab);
    const selfRating = 5;
    const selectedAreas = ['math-proficiency', 'know-students', 'time-management', 'encourage-participation', 'communication-skills', 'stay-positive'];
    const otherAreaText = '';
    const trainingMaterialsText = 'I would benefit from materials focused on explaining complex math concepts in simpler terms, especially for students who struggle with abstract thinking.';

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
                id="self-reflection-filled"
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
                                gap: 'var(--size-section-gap-md)',
                            }}
                        >
                            {/* Rating Section */}
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
                                    variant="comments"
                                    showCommentsLabel={true}
                                    commentsLabel="Excellent performance!"
                                />
                            </div>

                            {/* Improvement Areas Section */}
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 'var(--size-section-gap-md)',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 'var(--size-section-gap-sm)',
                                    }}
                                >
                                    <p className="h6 m-0" style={{ color: 'var(--color-on-surface)' }}>
                                        Select one or more areas where I can improve as a tutor.
                                        <span style={{ color: 'var(--color-danger)' }}> *</span>
                                    </p>
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 'var(--size-section-gap-sm)',
                                        }}
                                    >
                                        {improvementAreas.map((area) => {
                                            if (area.id === 'other') {
                                                return (
                                                    <div
                                                        key={area.id}
                                                        style={{
                                                            display: 'flex',
                                                            gap: 'var(--size-section-gap-md)',
                                                            alignItems: 'center',
                                                        }}
                                                    >
                                                        <Checkbox
                                                            id={`self-reflection-area-${area.id}`}
                                                            name={`self-reflection-area-${area.id}`}
                                                            label={area.label}
                                                            checked={selectedAreas.includes(area.id)}
                                                            onChange={() => {}}
                                                        />
                                                        <div style={{ flex: '1 0 0', minWidth: 0 }}>
                                                            <Textarea
                                                                id="self-reflection-other-input"
                                                                name="self-reflection-other-input"
                                                                variant="short"
                                                                rows={1}
                                                                value={otherAreaText}
                                                                onChange={() => {}}
                                                                placeholder=""
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <Checkbox
                                                    key={area.id}
                                                    id={`self-reflection-area-${area.id}`}
                                                    name={`self-reflection-area-${area.id}`}
                                                    label={area.label}
                                                    checked={selectedAreas.includes(area.id)}
                                                    onChange={() => {}}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Training Materials Section */}
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 'var(--size-element-gap-md)',
                                }}
                            >
                                <p className="h6 m-0" style={{ color: 'var(--color-on-surface)' }}>
                                    Based on the areas for improvement identified above, what types of training materials can we offer to best support your development?
                                </p>
                                <p className="body2-txt m-0" style={{ color: 'var(--color-on-surface-variant)' }}>
                                    E.g. I struggle to explain concepts I know so I need materials to enhance math teaching proficiency.
                                </p>
                                <Textarea
                                    id="training-materials"
                                    name="training-materials"
                                    value={trainingMaterialsText}
                                    onChange={() => {}}
                                    variant="long"
                                    rows={6}
                                />
                            </div>
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
                            />
                        </div>
                    </div>
                </div>
            </PageLayout>
        </div>
    );
};

SelfReflectionFilled.propTypes = {
    students: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
            status: PropTypes.string,
        })
    ),
    activeTab: PropTypes.string,
};

SelfReflectionFilled.defaultProps = {
    students: [
        { name: 'Kiera Wintervale', status: 'complete' },
        { name: 'Baxter Ellington', status: 'complete' },
        { name: 'Milo Thorne', status: 'complete' },
    ],
    activeTab: 'self-reflection',
};

export default SelfReflectionFilled;

