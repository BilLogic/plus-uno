import React, { useRef, useState } from 'react';
import { PageLayout } from '@/specs/Universal/Pages';
import HomepageJumbotron from '@/specs/Home/Sections/HomepageJumbotron';
import DataVisualizationSkillsProgress from '@/specs/Home/Cards/DataVisualization/DataVisualizationSkillsProgress';
import { BadgeCard, RecommendedLessons } from '@/specs/Home/Cards';
import Card from '@/components/Card';
import Button from '@/components/Button';
import DonutChart from '@/DataViz/PartToWhole/DonutChart/DonutChart';
import './App.css';

/**
 * Application Prototype – Homepage variant
 * Builds on the existing homepage design per Figma APPLICATION-PROTOTYPES node 158-21725.
 * Includes: Jumbotron (sign-up), three cards (Tutoring Performance, Weekly Tutoring Load, Student Momentum),
 * and Personalized Trainings carousel.
 */

/** Default skills data for Tutoring Performance radar (Your vs Average) */
const DEFAULT_SKILLS_OVERVIEW = {
    categories: [
        'Teaching Math',
        'Communicating Clearly',
        'Motivating Students',
        'Staying Positive',
        'Managing Time',
        'Fostering Participation',
        'Building Rapport',
    ],
    yourPerformance: [72, 68, 85, 88, 70, 82, 78],
    averagePerformance: [70, 70, 65, 75, 60, 70, 60],
};

/** Weekly load breakdown for donut card */
const WEEKLY_LOAD_BREAKDOWN = [
    { label: 'Direct tutoring', hours: 8.0 },
    { label: 'Student support & follow-ups', hours: 4.0 },
    { label: 'Prep & planning', hours: 2.5 },
    { label: 'Training & reflection', hours: 2.3 },
];

/** Student momentum list with bar value 0–10 */
const STUDENT_MOMENTUM = [
    { name: 'Alex P.', value: 7, color: 'var(--color-social-emotional, #8c6600)' },
    { name: 'Priya J.', value: 9, color: 'var(--color-mastering-content, #8659a9)' },
    { name: 'Jordan K.', value: 5, color: 'var(--color-advocacy, #167745)' },
    { name: 'Sam L.', value: 8, color: 'var(--color-relationship, #c70b77)' },
];

/** Personalized training items for carousel */
const PERSONALIZED_TRAININGS = [
    { id: '1', title: 'Giving Effective Praise', category: 'Social-Emotional Learning', duration: '12 mins', badgeType: 'socio-emotional', image: null },
    { id: '2', title: 'Reacting to Errors', category: 'Advocacy', duration: '12 mins', badgeType: 'advocacy', image: null },
    { id: '3', title: 'Prompting Students to Explain', category: 'Technology Tools', duration: '12 mins', badgeType: 'technology-tools', image: null },
    { id: '4', title: 'Supporting a Growth Mindset', category: 'Social-Emotional Learning', duration: '12 mins', badgeType: 'socio-emotional', image: null },
];

/**
 * Weekly Tutoring Load card: donut (84% scheduled of 20 hrs), center 16.8 hrs, breakdown list.
 */
function WeeklyTutoringLoadCard() {
    const segments = [
        { value: 84, color: 'var(--color-primary, #005cbd)', label: 'Scheduled' },
        { value: 16, color: 'var(--color-outline-variant, #e0e0e0)', label: 'Remaining' },
    ];
    return (
        <Card
            className="app-prototype-card app-prototype-weekly-load"
            paddingSize="md"
            gapSize="lg"
            radiusSize="sm"
            borderSize="sm"
            showBorder={true}
        >
            <h4 className="h4 app-prototype-card-title">Weekly Tutoring Load</h4>
            <div className="app-prototype-weekly-load-content">
                <div className="app-prototype-donut-wrap">
                    <DonutChart
                        size={180}
                        segments={segments}
                        value="16.8"
                        label="hrs"
                        centerTextSize="h4"
                    />
                    <p className="body3-txt app-prototype-donut-sub">84% scheduled of 20.0 hrs</p>
                </div>
                <ul className="app-prototype-breakdown">
                    {WEEKLY_LOAD_BREAKDOWN.map((row) => (
                        <li key={row.label} className="app-prototype-breakdown-row">
                            <span className="body2-txt">{row.label}</span>
                            <span className="body2-txt">{row.hours} hrs</span>
                        </li>
                    ))}
                </ul>
            </div>
        </Card>
    );
}

/**
 * Student Momentum card: list of students with horizontal bar (0–10).
 */
function StudentMomentumCard() {
    const [page, setPage] = useState(0);
    const maxPage = Math.max(0, Math.ceil(STUDENT_MOMENTUM.length / 3) - 1);
    const displayList = STUDENT_MOMENTUM.slice(page * 3, page * 3 + 3);
    return (
        <Card
            className="app-prototype-card app-prototype-student-momentum"
            paddingSize="md"
            gapSize="lg"
            radiusSize="sm"
            borderSize="sm"
            showBorder={true}
        >
            <div className="app-prototype-card-header-with-nav">
                <h4 className="h4 app-prototype-card-title">Student Momentum</h4>
                <div className="app-prototype-nav-buttons">
                    <Button
                        style="primary"
                        fill="outline"
                        size="small"
                        leadingVisual="arrow-left"
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0}
                        aria-label="Previous"
                    />
                    <Button
                        style="primary"
                        fill="outline"
                        size="small"
                        leadingVisual="arrow-right"
                        onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
                        disabled={page >= maxPage}
                        aria-label="Next"
                    />
                </div>
            </div>
            <ul className="app-prototype-momentum-list">
                {displayList.map((student) => (
                    <li key={student.name} className="app-prototype-momentum-row">
                        <span className="body2-txt app-prototype-momentum-name">{student.name}</span>
                        <div className="app-prototype-momentum-bar-wrap">
                            <div
                                className="app-prototype-momentum-bar"
                                style={{
                                    width: `${(student.value / 10) * 100}%`,
                                    backgroundColor: student.color,
                                }}
                            />
                        </div>
                    </li>
                ))}
            </ul>
        </Card>
    );
}

function App() {
    const topBarConfig = {
        user: { name: 'Boyuan Guo', avatar: null, type: 'lead tutor' },
        breadcrumbs: [{ text: 'Home', href: '#' }],
    };
    const sidebarConfig = { user: 'tutor' };

    const carouselRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const scrollCarousel = (direction) => {
        if (!carouselRef.current) return;
        const scrollAmount = 320;
        carouselRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
        setTimeout(() => {
            if (carouselRef.current) {
                const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
                const maxScroll = scrollWidth - clientWidth;
                setCanScrollLeft(scrollLeft > 0);
                setCanScrollRight(scrollLeft < maxScroll - 10);
            }
        }, 150);
    };

    return (
        <PageLayout
            topBarConfig={topBarConfig}
            sidebarConfig={sidebarConfig}
            className="app-prototype-page"
        >
            <div className="app-prototype-content">
                {/* Jumbotron + Badge (same as existing homepage) */}
                <div className="app-prototype-jumbotron-section">
                    <HomepageJumbotron
                        activeTab="sign-up"
                        tutorName="Boyuan"
                        onSignUp={() => {}}
                        onViewSchedule={() => {}}
                    />
                    <BadgeCard
                        description=""
                        badgeType="unclaimed"
                        badgeSize="thumbnail"
                        buttonText="Claim"
                        tooltipText="Complete 20/20 lessons to claim your badge"
                    />
                </div>

                {/* Three cards: Tutoring Performance, Weekly Tutoring Load, Student Momentum */}
                <div className="app-prototype-three-cards">
                    <div className="app-prototype-card-tutoring">
                        <h4 className="h4 app-prototype-card-title">Tutoring Performance</h4>
                        <DataVisualizationSkillsProgress
                            skillsOverviewData={DEFAULT_SKILLS_OVERVIEW}
                            skillsProgressData={{
                                sessionRanges: ['64-68', '74-78', '84-88', '94-98', '104-108'],
                                averageScores: [30, 55, 12, 25, 65],
                            }}
                            defaultActiveTab="skills-overview"
                        />
                    </div>
                    <div className="app-prototype-card-weekly">
                        <WeeklyTutoringLoadCard />
                    </div>
                    <div className="app-prototype-card-momentum">
                        <StudentMomentumCard />
                    </div>
                </div>

                {/* Personalized Trainings carousel */}
                <div className="app-prototype-trainings-section">
                    <div className="app-prototype-trainings-header">
                        <h4 className="h4">Personalized Trainings</h4>
                        <div className="app-prototype-trainings-controls">
                            <Button
                                style="primary"
                                fill="outline"
                                size="small"
                                leadingVisual="arrow-left"
                                onClick={() => scrollCarousel('left')}
                                disabled={!canScrollLeft}
                                aria-label="Scroll left"
                            />
                            <Button
                                style="primary"
                                fill="outline"
                                size="small"
                                leadingVisual="arrow-right"
                                onClick={() => scrollCarousel('right')}
                                disabled={!canScrollRight}
                                aria-label="Scroll right"
                            />
                        </div>
                    </div>
                    <div
                        ref={carouselRef}
                        className="app-prototype-trainings-carousel"
                        onScroll={() => {
                            if (carouselRef.current) {
                                const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
                                setCanScrollLeft(scrollLeft > 0);
                                setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
                            }
                        }}
                    >
                        {PERSONALIZED_TRAININGS.map((item) => (
                            <RecommendedLessons
                                key={item.id}
                                breakpoint="< XXL"
                                badgeType={item.badgeType}
                                title={item.title}
                                duration={item.duration}
                                status="in-progress"
                                aiRecommended={false}
                                onReviewClick={() => {}}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}

export default App;
