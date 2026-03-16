/**
 * LessonsDetailPage Component
 * 
 * Individual lesson detail page with 5 variants (P1-P5).
 * Matches Figma design: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=63-178289
 * 
 * Variants:
 * - P1: Intro/Content with Likert Scale ratings
 * - P2: Research Says with comparison table
 * - P3: Conclusion & Feedback with references
 * - P4: Scenario Assessment with questions
 * - P5: Congratulations completion page
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { PageLayout } from '../../../../Universal/Pages';
import Button from '../../../../../components/Button/Button';
import Rating from '../../Elements/Rating/Rating';
import './LessonsDetailPage.scss';

const imgMain = "http://localhost:3845/assets/735e5e5eb60dd6430d7cbe12333e91485b70612b.png";
const imgScenario = "http://localhost:3845/assets/5818981c2f06827056286762399990264177b960.png"; // Assuming scenario image from context if available, otherwise reuse or keep placeholder

/**
 * Progress Bar Component - Shows lesson progress with 9 segments
 */
const LessonProgressBar = ({ variant }) => {
    const getProgressBars = () => {
        switch (variant) {
            case 'P1': return [1, 0, 0, 0, 0, 0, 0, 0, 0];
            case 'P2': return [1, 0, 0, 0, 0, 0, 0, 0, 0];
            case 'P3': return [1, 1, 1, 1, 1, 1, 1, 0, 0];
            case 'P4': return [1, 1, 1, 1, 1, 1, 0, 0, 0];
            case 'P5': return [1, 1, 1, 1, 1, 1, 1, 1, 1];
            default: return [1, 0, 0, 0, 0, 0, 0, 0, 0];
        }
    };

    const bars = getProgressBars();

    return (
        <div className="lesson-progress-bar">
            {bars.map((filled, index) => (
                <div key={index} className="lesson-progress-bar__segment">
                    <div className={`lesson-progress-bar__track ${filled ? 'lesson-progress-bar__track--filled' : ''}`} />
                </div>
            ))}
        </div>
    );
};

LessonProgressBar.propTypes = {
    variant: PropTypes.oneOf(['P1', 'P2', 'P3', 'P4', 'P5']).isRequired
};

/**
 * Alert for Supervisors Component
 */
const AlertForSupervisors = ({ onClose }) => (
    <div className="supervisor-alert">
        <div className="supervisor-alert__icon">
            <i className="fas fa-info-circle" />
        </div>
        <div className="supervisor-alert__content">
            <p className="body2-txt">
                Please complete all questions on this page to proceed.
            </p>
        </div>
        <button className="supervisor-alert__close" onClick={onClose} aria-label="Close alert">
            <i className="fas fa-times" />
        </button>
    </div>
);

/**
 * Likert Scale Component
 */
const LikertScale = ({ leftLabel, rightLabel, value, onChange }) => (
    <div className="likert-scale">
        <span className="likert-scale__label body2-txt">{leftLabel}</span>
        <div className="likert-scale__ratings">
            <Rating rating={value || 'rest'} onRatingChange={onChange} />
        </div>
        <span className="likert-scale__label body2-txt">{rightLabel}</span>
    </div>
);

/**
 * Quote Card Component
 */
const QuoteCard = ({ text }) => (
    <div className="quote-card">
        <div className="quote-card__inner">
            <p className="body1-txt">{text}</p>
        </div>
    </div>
);

QuoteCard.propTypes = {
    text: PropTypes.string.isRequired
};

/**
 * P1 Content - Intro/Content with Ratings
 */
const P1Content = ({ lessonTitle, estimatedTime, onRatingChange }) => {
    const [confidenceRating, setConfidenceRating] = useState('rest');
    const [experienceRating, setExperienceRating] = useState('rest');

    return (
        <div className="lesson-content lesson-content--p1">
            {/* Title Section */}
            <div className="lesson-content__title-section">
                <h4 className="h4">{lessonTitle}</h4>
                <div className="lesson-content__subtitle">
                    <i className="far fa-clock" />
                    <span className="h6">Estimate Time: {estimatedTime}</span>
                </div>
            </div>

            {/* Content Section */}
            <div className="lesson-content__body">
                {/* Image */}
                <div className="lesson-content__image">
                    <img
                        src={imgMain}
                        alt="Lesson Intro"
                        style={{ maxWidth: '100%', height: 'auto', maxHeight: '300px' }}
                    />
                </div>

                {/* Text content */}
                <div className="lesson-content__text">
                    <p className="body1-txt">
                        Praising students for working hard and putting forth effort is a great way to increase student motivation. When the learning gets tough, giving effective praise is a powerful strategy to encourage students to keep going.
                    </p>
                    <p className="body1-txt">Upon completion you will be able to:</p>
                    <ul className="body1-txt">
                        <li>Explain how to increase student motivation by giving praise</li>
                        <li>Identify features of effective praise</li>
                        <li>Apply strategies by responding to students through praise</li>
                    </ul>
                </div>
            </div>

            {/* Question 1: Confidence Rating */}
            <div className="lesson-content__question">
                <h4 className="h4">How confident are you in your knowledge of this topic?</h4>
                <LikertScale
                    leftLabel="Not at all confident"
                    rightLabel="Extremely confident"
                    value={confidenceRating}
                    onChange={(val) => {
                        setConfidenceRating(val);
                        onRatingChange && onRatingChange({ type: 'confidence', value: val });
                    }}
                />
            </div>

            {/* Question 2: Experience Rating */}
            <div className="lesson-content__question">
                <h4 className="h4">How would you describe your tutoring experience and skills?</h4>
                <LikertScale
                    leftLabel="Beginner Tutor"
                    rightLabel="Expert Tutor"
                    value={experienceRating}
                    onChange={(val) => {
                        setExperienceRating(val);
                        onRatingChange && onRatingChange({ type: 'experience', value: val });
                    }}
                />
            </div>

            {/* Actions */}
            <div className="lesson-content__actions lesson-content__actions--single">
                <Button
                    text="Next"
                    style="primary"
                    fill="filled"
                    size="medium"
                    disabled={confidenceRating === 'rest' || experienceRating === 'rest'}
                />
            </div>
        </div>
    );
};

/**
 * P2 Content - Research Says
 */
const P2Content = ({ onPrevious, onNext }) => (
    <div className="lesson-content lesson-content--p2">
        {/* Title */}
        <div className="lesson-content__title-section">
            <h4 className="h4">Research says...</h4>
        </div>

        {/* Research text */}
        <p className="body1-txt">
            Research supports praising students when they achieve a goal, demonstrate perseverance, or are exhibiting a desired behavior. For this reason, an example of the most desired response is:
        </p>

        {/* Quote card */}
        <QuoteCard text={"\"Kevin, fantastic job solving the math problem. I'm impressed with your hard work in persevering through the problem!\""} />

        {/* Research details */}
        <div className="lesson-content__research-details">
            <p className="body1-txt">Studies show praise is most effective when it has certain qualities.</p>
            <p className="body1-txt">Praise should be:</p>
            <ul className="body1-txt">
                <li>perceived as sincere, earned, and truthful.</li>
                <li>specific by giving details of what the student did well.</li>
                <li>immediate with praise given right after the student action.</li>
                <li>authentic and is not repeated often, such as "great job" which loses meaning and becomes predictable.</li>
                <li>focused on the learning process, not ability</li>
            </ul>
            <p className="body2-txt" style={{ fontStyle: 'italic' }}>(AJTutoring.com, 2022)</p>
        </div>

        {/* Additional text */}
        <p className="body1-txt">
            Giving students consistent, specific praise when they perform in a desired manner is important to motivate students and increase their engagement to learn.
        </p>

        {/* Comparison Table */}
        <div className="lesson-content__table-wrapper">
            <table className="lesson-content__table">
                <thead>
                    <tr>
                        <th className="body2-txt">Ability-Focused Praise</th>
                        <th className="body2-txt">Process-Focused Praise</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="body2-txt">"Great job! You are a genius!"</td>
                        <td className="body2-txt">"Great job on solving that math problem. You persevered through solving by using a new math concept."</td>
                    </tr>
                    <tr>
                        <td className="body2-txt">"Fantastic! You are so talented!"</td>
                        <td className="body2-txt">"I love how you tried very hard and focused on the problem!"</td>
                    </tr>
                    <tr>
                        <td className="body2-txt">"You are so smart and almost got the problem correct."</td>
                        <td className="body2-txt">"You are almost there! I am proud of how you are persevering through and striving to solve the problem. Keep going!"</td>
                    </tr>
                </tbody>
            </table>
        </div>

        {/* Actions */}
        <div className="lesson-content__actions">
            <Button text="Previous" style="primary" fill="outline" size="medium" onClick={onPrevious} />
            <Button text="Next" style="primary" fill="filled" size="medium" onClick={onNext} />
        </div>
    </div>
);

/**
 * P3 Content - Conclusion & Feedback
 */
const P3Content = ({ onPrevious, onNext }) => (
    <div className="lesson-content lesson-content--p3">
        {/* Title */}
        <div className="lesson-content__title-section">
            <h4 className="h4">Conclusion & Feedback</h4>
        </div>

        <p className="body1-txt">Experts believe that the best approach is:</p>

        {/* Quote card */}
        <QuoteCard text='"Carla, you are doing a great job in continuing on the assignment. Your understanding is improving as we work through it."' />

        {/* Conclusion text */}
        <div className="lesson-content__research-details">
            <p className="body1-txt">
                This approach recognizes Carla's effort towards the math assignment and is process-focused.
            </p>
            <p className="body1-txt">
                For more information about how to give effective praise to increase student motivation, check out the following resources:
            </p>
        </div>

        {/* Feedback Section */}
        <div className="lesson-content__title-section">
            <h4 className="h4">Feedback</h4>
        </div>

        <div className="lesson-content__feedback">
            <p className="body1-txt">Please provide any feedback or comments related to this training module.</p>
            <p className="body1-txt">For more information regarding how to give effective praise, check out the resources below:</p>
            <ul className="lesson-content__links">
                <li><a href="#" className="body1-txt">The Power of Effective Praise</a></li>
                <li><a href="#" className="body1-txt">How to Give Effective Praise in Tutoring</a></li>
                <li><a href="#" className="body1-txt">Tutoring Tips: How to Give Meaningful Praise</a></li>
            </ul>
        </div>

        {/* References Section */}
        <div className="lesson-content__title-section">
            <h4 className="h4">References</h4>
        </div>

        <div className="lesson-content__references">
            <p className="body1-txt">
                AJ Tutoring. (2022). How to Give Effective Praise. Retrieved from{' '}
                <a href="#">https://www.ajtutoring.com/blog/effective-praise/</a>
            </p>
            <p className="body1-txt">
                Dweck, C. S. (2008). Mindset: The new psychology of success. Random House.
            </p>
        </div>

        {/* Actions */}
        <div className="lesson-content__actions">
            <Button text="Previous" style="primary" fill="outline" size="medium" onClick={onPrevious} />
            <Button text="Next" style="primary" fill="filled" size="medium" onClick={onNext} />
        </div>
    </div>
);

/**
 * P4 Content - Scenario Assessment
 */
const P4Content = ({ onPrevious, onNext }) => {
    const [selectedOption, setSelectedOption] = useState(null);

    const options = [
        '"Carla, we really need to continue this assignment. You can\'t quit on me now. Keep going!"',
        '"Carla, you are doing a great job in continuing on the assignment. Your understanding is improving as we work through it."',
        '"Carla, you are doing a fantastic job! Don\'t quit like some of my other students do when they have assignments."',
        '"Carla, you are the best student! I know you can finish this assignment as you are the smartest student I work with."'
    ];

    return (
        <div className="lesson-content lesson-content--p4">
            {/* Title */}
            <div className="lesson-content__title-section">
                <h4 className="h4">Scenario 2</h4>
            </div>

            {/* Scenario description */}
            <p className="body1-txt">
                You are tutoring a student named Carla, who came to you for help with solving a story problem from her algebra homework. As her tutor, you are providing feedback and asking Carla prompting questions to help her solve the word problem. You are trying to encourage her to continue trying to solve the problem.
            </p>

            {/* Scenario Image */}
            <div className="lesson-content__image">
                <img
                    src={imgScenario}
                    alt="Student Scenario"
                    style={{ maxWidth: '100%', height: 'auto', maxHeight: '300px' }}
                />
            </div>

            {/* Question 7: Textarea */}
            <div className="lesson-content__question">
                <p className="body1-txt" style={{ fontWeight: 'var(--font-weight-bold)' }}>
                    7. What exactly would you say to Carla to provide effective praise that will increase her motivation to complete her math work and increase engagement?
                </p>
                <textarea
                    className="form-control lesson-content__textarea"
                    placeholder="Enter your response..."
                    rows={4}
                />
            </div>

            {/* Question 8: Radio buttons */}
            <div className="lesson-content__question">
                <p className="body1-txt" style={{ fontWeight: 'var(--font-weight-bold)' }}>
                    8. Which of the following strategies below do you think would best support and increase Carla's motivation to complete her assignment and increase engagement?
                </p>
                <p className="body1-txt">I would say to the student:</p>
                <div className="lesson-content__radio-group">
                    {options.map((option, index) => (
                        <label key={index} className="lesson-content__radio-option">
                            <input
                                type="radio"
                                name="q8"
                                value={index}
                                checked={selectedOption === index}
                                onChange={() => setSelectedOption(index)}
                            />
                            <span className="lesson-content__radio-custom" />
                            <span className="body1-txt">{option}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Question 9: Textarea */}
            <div className="lesson-content__question">
                <p className="body1-txt" style={{ fontWeight: 'var(--font-weight-bold)' }}>
                    9. Why do you think the approach you selected in the above question will best support and increase Carla's motivation to complete her math work and increase engagement?
                </p>
                <textarea
                    className="form-control lesson-content__textarea"
                    placeholder="Enter your response..."
                    rows={4}
                />
            </div>

            {/* Actions */}
            <div className="lesson-content__actions">
                <Button text="Previous" style="primary" fill="outline" size="medium" onClick={onPrevious} />
                <Button text="Next" style="primary" fill="filled" size="medium" onClick={onNext} />
            </div>
        </div>
    );
};

/**
 * P5 Content - Congratulations
 */
const P5Content = ({ lessonTitle, onPrevious, onNext }) => {
    const [finalRating, setFinalRating] = useState('rest');

    return (
        <div className="lesson-content lesson-content--p5">
            {/* Congratulations title */}
            <div className="lesson-content__congrats">
                <h1 className="h1">Congratulations on finishing the Lesson!</h1>
                <div className="lesson-content__score">
                    <h1 className="h1">0/2</h1>
                    <p className="h4">Answered Correctly</p>
                </div>
            </div>

            {/* Final Question */}
            <div className="lesson-content__question lesson-content__question--centered">
                <h4 className="h4">Now that you've completed the module, how confident are you in your knowledge of this topic?</h4>
                <LikertScale
                    leftLabel="Not at all confident"
                    rightLabel="Extremely confident"
                    value={finalRating}
                    onChange={setFinalRating}
                />
            </div>

            {/* Actions */}
            <div className="lesson-content__actions">
                <Button text="Previous" style="primary" fill="filled" size="medium" onClick={onPrevious} />
                <Button
                    text="Next"
                    style="primary"
                    fill="filled"
                    size="medium"
                    disabled={finalRating === 'rest'}
                    onClick={onNext}
                />
            </div>
        </div>
    );
};

/**
 * Footer Component
 */
const LessonFooter = () => (
    <div className="lesson-footer">
        <p className="body3-txt">v5.2.0 | Copyright © Carnegie Mellon University 2026 | Terms of Use</p>
    </div>
);

/**
 * Main LessonsDetailPage Component
 */
const LessonsDetailPage = ({
    variant = 'P1',
    lessonTitle = 'Giving Effective Praise',
    estimatedTime = '15 Minutes',
    onBack,
    onPrevious,
    onNext,
    onRatingChange,
    className = '',
    style
}) => {
    const renderVariantContent = () => {
        switch (variant) {
            case 'P1':
                return <P1Content lessonTitle={lessonTitle} estimatedTime={estimatedTime} onRatingChange={onRatingChange} />;
            case 'P2':
                return <P2Content onPrevious={onPrevious} onNext={onNext} />;
            case 'P3':
                return <P3Content onPrevious={onPrevious} onNext={onNext} />;
            case 'P4':
                return <P4Content onPrevious={onPrevious} onNext={onNext} />;
            case 'P5':
                return <P5Content lessonTitle={lessonTitle} onPrevious={onPrevious} onNext={onNext} />;
            default:
                return <P1Content lessonTitle={lessonTitle} estimatedTime={estimatedTime} onRatingChange={onRatingChange} />;
        }
    };

    const getBreadcrumbText = () => {
        if (variant === 'P1' || variant === 'P5') return 'Page Now';
        return lessonTitle;
    };

    const topBarConfig = {
        breadcrumbs: [
            { text: 'Home', href: '#' },
            { text: 'Lessons', href: '#' },
            { text: getBreadcrumbText() }
        ],
        user: {
            name: 'John Doe',
            counter: true,
            counterValue: 2,
            type: 'lead tutor'
        }
    };

    const sidebarConfig = {
        user: 'tutor',
        activeTab: 'lessons',
    };

    return (
        <PageLayout
            topBarConfig={topBarConfig}
            sidebarConfig={sidebarConfig}
            id="lessons-detail-page"
            style={{
                '--size-surface-pad-x': '24px',
                '--size-surface-pad-y': '24px'
            }}
        >
            <div className={`lessons-detail-page__content-container ${className}`} style={style}>
                {/* Content Wrapper */}
                <div className="lessons-detail-page__content-wrapper">
                    {/* Progress Bar */}
                    <LessonProgressBar variant={variant} />

                    {/* Alert - Hidden by default to match clean design, can be enabled if needed */}
                    {/* <AlertForSupervisors /> */}

                    {/* Variant Content */}
                    {renderVariantContent()}
                </div>

                {/* Footer */}
                <LessonFooter />
            </div>
        </PageLayout>
    );
};

LessonsDetailPage.propTypes = {
    /** Page variant: P1, P2, P3, P4, or P5 */
    variant: PropTypes.oneOf(['P1', 'P2', 'P3', 'P4', 'P5']),
    /** Lesson title */
    lessonTitle: PropTypes.string,
    /** Estimated time to complete */
    estimatedTime: PropTypes.string,
    /** Back button click handler */
    onBack: PropTypes.func,
    /** Previous button click handler */
    onPrevious: PropTypes.func,
    /** Next button click handler */
    onNext: PropTypes.func,
    /** Rating change handler */
    onRatingChange: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
    /** Additional inline styles */
    style: PropTypes.object
};

export default LessonsDetailPage;
