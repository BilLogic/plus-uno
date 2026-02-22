import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../../../../../components/Button/Button';
import { PageLayout } from '../../../../../specs/Universal/Pages';
import SideNavBar from '../../sections/SideNavBar/SideNavBar';
import FormReflection from '../../sections/FormReflection/FormReflection';
import { StudentRatingField } from '../../elements/StudentRating.stories';

const reflectionPrompt = [
    {
        id: 'student-reflection-part-1',
        question: "What's one thing another tutor should know about this student?",
        warning: "Please do not include students' name in the response.",
        example: 'Eg. This student excels in [subject/topic] but may need encouragement with challenging tasks.',
        switchLabel: 'Escalate this request to tutor supervisors for immediate attention.',
    },
];

const studentRatingCommentsByValue = {
    1: 'Lots of room for improvement.',
    2: 'Not so well, adjustments are needed.',
    3: "Ok, could've been better.",
    4: 'Good, with some room for improvement',
    5: 'Wonderful interactions!',
};

const StudentReflectionPart1 = ({
    studentName,
    students,
    activeTab: initialActiveTab,
}) => {
    const [activeTab, setActiveTab] = useState(initialActiveTab);
    const [studentRating, setStudentRating] = useState(0);

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
                id="student-reflection-part-1"
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
                            Student Reflection
                        </h4>

                        <h5 className="h5 m-0" style={{ color: 'var(--color-on-surface)' }}>
                            {studentName}
                        </h5>

                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 'var(--size-element-gap-lg)',
                            }}
                        >
                            <p className="h6 m-0" style={{ color: 'var(--color-on-surface)' }}>
                                How were your interactions with this student during this session?
                                <span style={{ color: 'var(--color-danger)' }}> *</span>
                            </p>

                            <StudentRatingField
                                id="student-reflection-part-1-rating"
                                value={studentRating}
                                onChange={setStudentRating}
                                commentsLabel={studentRatingCommentsByValue[studentRating] || null}
                            />

                            <FormReflection prompts={reflectionPrompt} />
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                gap: 'var(--size-element-gap-lg)',
                                alignItems: 'center',
                            }}
                        >
                            <Button text="Previous" style="primary" fill="tonal" size="medium" />
                            <Button text="Next Section" style="primary" fill="tonal" size="medium" />
                            <Button text="Next Student" style="primary" fill="tonal" size="medium" disabled />
                        </div>
                    </div>
                </div>
            </PageLayout>
        </div>
    );
};

StudentReflectionPart1.propTypes = {
    studentName: PropTypes.string,
    students: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
            status: PropTypes.string,
        })
    ),
    activeTab: PropTypes.string,
};

StudentReflectionPart1.defaultProps = {
    studentName: 'Kiera Wintervale',
    students: [
        { name: 'Kiera Wintervale', status: 'incomplete' },
        { name: 'Baxter Ellington', status: 'incomplete' },
        { name: 'Milo Thorne', status: 'incomplete' },
    ],
    activeTab: 'student-0',
};

export default StudentReflectionPart1;
