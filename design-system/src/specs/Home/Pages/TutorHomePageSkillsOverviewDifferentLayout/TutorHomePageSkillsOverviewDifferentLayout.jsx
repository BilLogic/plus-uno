import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { PageLayout } from '@/specs/Universal/Pages';
import HomepageJumbotron from '@/specs/Home/Sections/HomepageJumbotron';
import DataVisualizationTrainingProgress from '@/specs/Home/Cards/DataVisualization/DataVisualizationTrainingProgress';
import { MetricsCard, RecommendedLessons } from '@/specs/Home/Cards';
import Button from '@/components/Button';
import './TutorHomePageSkillsOverviewDifferentLayout.scss';

/**
 * TutorHomePageSkillsOverviewDifferentLayout component
 * Alternative layout for tutor home page with Training Progress section
 * Figma Node: 563-192630
 */
const TutorHomePageSkillsOverviewDifferentLayout = ({
    id,
    tutorName = "John Doe",
    userBadge = "Lead",
    trainingProgressData,
    onboardingLessons = [],
    className = '',
    style
}) => {
    const [activeImpactPage, setActiveImpactPage] = useState(4); // Page 4 shows stacked metric cards
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

    // Default onboarding lessons if none provided
    const defaultLessons = onboardingLessons.length > 0 ? onboardingLessons : [
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
            className={`plus-tutor-home-page-different-layout ${className}`}
            style={style}
        >
            <div className="plus-tutor-home-content-different-layout">
                {/* Jumbotron Section */}
                <div className="plus-tutor-home-jumbotron-section-different">
                    <HomepageJumbotron
                        activeTab="sign-up"
                        tutorName={tutorName}
                        onSignUp={() => console.log('Sign up clicked')}
                        onViewSchedule={() => console.log('View schedule clicked')}
                    />
                </div>

                {/* Training Progress Section */}
                <div className="plus-tutor-home-training-progress-section">
                    <div className="plus-tutor-home-training-progress-left">
                        <DataVisualizationTrainingProgress
                            title="Training Progress"
                            tooltip="Training progress information"
                            trainingProgressData={trainingProgressData}
                        />
                    </div>
                    <div className="plus-tutor-home-training-progress-right">
                        <MetricsCard
                            page={activeImpactPage}
                            onPageChange={setActiveImpactPage}
                        />
                    </div>
                </div>

                {/* Complete Your Onboarding Section */}
                <div className="plus-tutor-home-onboarding-section">
                    <div className="plus-tutor-home-onboarding-header">
                        <h4 className="h4">Complete Your Onboarding</h4>
                        <div className="plus-tutor-home-onboarding-controls">
                            <Button
                                style="primary"
                                fill="outline"
                                size="small"
                                leadingVisual="arrow-left"
                                onClick={() => scrollCarousel('left')}
                                disabled={!canScrollLeft}
                                title="Scroll left"
                                aria-label="Scroll onboarding left"
                            />
                            <Button
                                style="primary"
                                fill="outline"
                                size="small"
                                leadingVisual="arrow-right"
                                onClick={() => scrollCarousel('right')}
                                disabled={!canScrollRight}
                                title="Scroll right"
                                aria-label="Scroll onboarding right"
                            />
                        </div>
                    </div>
                    <div 
                        ref={carouselRef}
                        className="plus-tutor-home-onboarding-carousel"
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

TutorHomePageSkillsOverviewDifferentLayout.propTypes = {
    id: PropTypes.string,
    tutorName: PropTypes.string,
    userBadge: PropTypes.string,
    trainingProgressData: PropTypes.shape({
        categories: PropTypes.arrayOf(PropTypes.string),
        completionPercentages: PropTypes.arrayOf(PropTypes.number)
    }),
    onboardingLessons: PropTypes.arrayOf(PropTypes.shape({
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

export default TutorHomePageSkillsOverviewDifferentLayout;
