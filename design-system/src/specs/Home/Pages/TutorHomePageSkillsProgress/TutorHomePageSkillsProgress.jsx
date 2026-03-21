import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { PageLayout } from '@/specs/Universal/Pages';
import HomepageJumbotron from '@/specs/Home/Sections/HomepageJumbotron';
import DataVisualizationSkillsProgress from '@/specs/Home/Cards/DataVisualization/DataVisualizationSkillsProgress';
import { MetricsCard, RecommendedLessons, BadgeCard } from '@/specs/Home/Cards';
import Button from '@/components/Button';
import Badge from '@/components/Badge';
import './TutorHomePageSkillsProgress.scss';

/**
 * TutorHomePageSkillsProgress component
 * Main tutor home page with Skills Progress tab active and rating metrics impact card
 * Figma Node: 563-206909 (right page)
 */
const TutorHomePageSkillsProgress = ({
    id,
    tutorName = "John Doe",
    userBadge = "Lead",
    skillsOverviewData,
    skillsProgressData,
    recommendedLessons = [],
    className = '',
    style
}) => {
    const [activeImpactPage, setActiveImpactPage] = useState(3);
    const carouselRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const topBarConfig = {
        user: { 
            name: tutorName,
            avatar: null,
            type: userBadge === 'Lead' ? 'lead tutor' : 'regular tutor'
        },
        breadcrumbs: [
            { text: 'Home', href: '#' }
        ]
    };

    const sidebarConfig = {
        user: 'tutor'
    };

    const scrollCarousel = (direction) => {
        if (!carouselRef.current) return;
        
        const scrollAmount = 500;
        const currentScroll = carouselRef.current.scrollLeft;
        const maxScroll = carouselRef.current.scrollWidth - carouselRef.current.clientWidth;
        
        if (direction === 'left') {
            carouselRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        } else {
            carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
        
        // Update scroll state after a brief delay
        setTimeout(() => {
            if (carouselRef.current) {
                setCanScrollLeft(carouselRef.current.scrollLeft > 0);
                setCanScrollRight(carouselRef.current.scrollLeft < maxScroll - 10);
            }
        }, 100);
    };

    // Default recommended lessons if none provided
    const defaultLessons = recommendedLessons.length > 0 ? recommendedLessons : [
        {
            id: '1',
            badgeType: 'mastering-content',
            title: 'Lesson Title',
            duration: '12 mins',
            status: 'in-progress',
            aiRecommended: true
        },
        {
            id: '2',
            badgeType: 'mastering-content',
            title: 'Lesson Title',
            duration: '12 mins',
            status: 'in-progress',
            aiRecommended: true
        },
        {
            id: '3',
            badgeType: 'mastering-content',
            title: 'Lesson Title',
            duration: '12 mins',
            status: 'in-progress',
            aiRecommended: true
        }
    ];

    return (
        <PageLayout
            id={id}
            topBarConfig={topBarConfig}
            sidebarConfig={sidebarConfig}
            className={`plus-tutor-home-page ${className}`}
            style={style}
        >
            <div className="plus-tutor-home-content">
                {/* Jumbotron and Badge Card - Aligned Horizontally */}
                <div className="plus-tutor-home-jumbotron-section">
                    <HomepageJumbotron
                        activeTab="sign-up"
                        tutorName={tutorName}
                        onSignUp={() => console.log('Sign up clicked')}
                        onViewSchedule={() => console.log('View schedule clicked')}
                    />
                    <BadgeCard
                        description=""
                        badgeType="unclaimed"
                        badgeSize="thumbnail"
                        buttonText="Claim"
                        tooltipText="Complete 20/20 lessons to claim your badge"
                    />
                </div>

                {/* Skills and Impact Section */}
                <div className="plus-tutor-home-middle-section">
                    {/* Skills Progress Card */}
                    <div className="plus-tutor-home-skills-card">
                        <DataVisualizationSkillsProgress
                            skillsOverviewData={skillsOverviewData}
                            skillsProgressData={skillsProgressData}
                        />
                    </div>

                    {/* Your Impact Card */}
                    <div className="plus-tutor-home-impact-card">
                        <div className="plus-tutor-home-impact-header">
                            <h4 className="h4">Your Impact</h4>
                            <div className="plus-tutor-home-impact-controls">
                                <Button
                                    style="primary"
                                    fill="outline"
                                    size="small"
                                    leadingVisual="arrow-left"
                                    onClick={() => setActiveImpactPage(Math.max(1, activeImpactPage - 1))}
                                    disabled={activeImpactPage === 1}
                                    title="Previous page"
                                    aria-label="Previous page"
                                />
                                <Button
                                    style="primary"
                                    fill="outline"
                                    size="small"
                                    leadingVisual="arrow-right"
                                    onClick={() => setActiveImpactPage(Math.min(3, activeImpactPage + 1))}
                                    disabled={activeImpactPage === 3}
                                    title="Next page"
                                    aria-label="Next page"
                                />
                            </div>
                        </div>
                        <MetricsCard
                            page={activeImpactPage}
                            onPageChange={setActiveImpactPage}
                        />
                    </div>
                </div>

                {/* Personalized Recommendations Section */}
                <div className="plus-tutor-home-recommendations-section">
                    <div className="plus-tutor-home-recommendations-header">
                        <h4 className="h4">Personalized Recommendations</h4>
                        <div className="plus-tutor-home-recommendations-controls">
                            <Button
                                style="primary"
                                fill="outline"
                                size="small"
                                leadingVisual="arrow-left"
                                onClick={() => scrollCarousel('left')}
                                disabled={!canScrollLeft}
                                title="Scroll left"
                                aria-label="Scroll recommendations left"
                            />
                            <Button
                                style="primary"
                                fill="outline"
                                size="small"
                                leadingVisual="arrow-right"
                                onClick={() => scrollCarousel('right')}
                                disabled={!canScrollRight}
                                title="Scroll right"
                                aria-label="Scroll recommendations right"
                            />
                        </div>
                    </div>
                    <div 
                        ref={carouselRef}
                        className="plus-tutor-home-recommendations-carousel"
                        onScroll={() => {
                            if (carouselRef.current) {
                                const maxScroll = carouselRef.current.scrollWidth - carouselRef.current.clientWidth;
                                setCanScrollLeft(carouselRef.current.scrollLeft > 0);
                                setCanScrollRight(carouselRef.current.scrollLeft < maxScroll - 10);
                            }
                        }}
                    >
                        {defaultLessons.map((lesson) => (
                            <RecommendedLessons
                                key={lesson.id}
                                badgeType={lesson.badgeType}
                                title={lesson.title}
                                duration={lesson.duration}
                                status={lesson.status}
                                aiRecommended={lesson.aiRecommended}
                                breakpoint="< XXL"
                                onReviewClick={() => console.log('Review clicked for', lesson.id)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </PageLayout>
    );
};

TutorHomePageSkillsProgress.propTypes = {
    id: PropTypes.string,
    tutorName: PropTypes.string,
    userBadge: PropTypes.string,
    skillsOverviewData: PropTypes.shape({
        categories: PropTypes.arrayOf(PropTypes.string),
        yourPerformance: PropTypes.arrayOf(PropTypes.number),
        averagePerformance: PropTypes.arrayOf(PropTypes.number)
    }),
    skillsProgressData: PropTypes.shape({
        sessionRanges: PropTypes.arrayOf(PropTypes.string),
        averageScores: PropTypes.arrayOf(PropTypes.number)
    }),
    recommendedLessons: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        badgeType: PropTypes.string,
        title: PropTypes.string.isRequired,
        duration: PropTypes.string,
        status: PropTypes.string,
        aiRecommended: PropTypes.bool
    })),
    className: PropTypes.string,
    style: PropTypes.object
};

export default TutorHomePageSkillsProgress;
