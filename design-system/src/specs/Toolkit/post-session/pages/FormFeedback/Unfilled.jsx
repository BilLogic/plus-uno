import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../../../../../components/Button/Button';
import Rating from '../../../../../forms/Rating';
import TextareaVer2 from '../../../../../forms/TextareaVer2';
import { PageLayout } from '../../../../../specs/Universal/Pages';
import SideNavBar from '../../sections/SideNavBar/SideNavBar';

const FormFeedbackUnfilled = ({
    students = [],
    activeTab: initialActiveTab,
}) => {
    const [activeTab, setActiveTab] = useState(initialActiveTab);
    const [formRating, setFormRating] = useState(0);
    const [reflectionExperience, setReflectionExperience] = useState('');
    const [additionalComments, setAdditionalComments] = useState('');

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
                id="form-feedback-unfilled"
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
                            Form Feedback
                        </h4>

                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 'var(--size-section-gap-lg)',
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
                                    On a scale from 1-5, how intuitive did you find the reflection form?
                                </p>
                                <Rating
                                    id="form-feedback-rating"
                                    value={formRating}
                                    onChange={setFormRating}
                                    variant="comments"
                                    showCommentsLabel={false}
                                />
                            </div>

                            {/* Reflection Experience Section */}
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 'var(--size-element-gap-md)',
                                }}
                            >
                                <p className="h6 m-0" style={{ color: 'var(--color-on-surface)' }}>
                                    How was your reflection experience?
                                </p>
                                <p className="body2-txt m-0" style={{ color: 'var(--color-on-surface-variant)' }}>
                                    Were there any questions within the form that you found unclear or unnecessary?
                                </p>
                                <TextareaVer2
                                    id="reflection-experience"
                                    name="reflection-experience"
                                    value={reflectionExperience}
                                    onChange={(e) => setReflectionExperience(e.target.value)}
                                    placeholder=""
                                    variant="long"
                                    rows={6}
                                />
                            </div>

                            {/* Additional Comments Section */}
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 'var(--size-element-gap-md)',
                                }}
                            >
                                <p className="h6 m-0" style={{ color: 'var(--color-on-surface)' }}>
                                    Any additional comments or concerns?
                                </p>
                                <p className="body2-txt m-0" style={{ color: 'var(--color-on-surface-variant)' }}>
                                    If you have any feedback for the session's teacher, please put it here.
                                </p>
                                <TextareaVer2
                                    id="additional-comments"
                                    name="additional-comments"
                                    value={additionalComments}
                                    onChange={(e) => setAdditionalComments(e.target.value)}
                                    placeholder=""
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
                                style="secondary" 
                                fill="tonal" 
                                size="medium" 
                            />
                            <Button 
                                text="Submit" 
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

FormFeedbackUnfilled.propTypes = {
    students: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
            status: PropTypes.string,
        })
    ),
    activeTab: PropTypes.string,
};

FormFeedbackUnfilled.defaultProps = {
    students: [
        { name: 'Kiera Wintervale', status: 'complete' },
        { name: 'Baxter Ellington', status: 'complete' },
        { name: 'Milo Thorne', status: 'complete' },
    ],
    activeTab: 'form-feedback',
};

export default FormFeedbackUnfilled;

