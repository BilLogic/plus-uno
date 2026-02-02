import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ChatSimulationCard from './components/ChatSimulationCard';
/** Same as TutorTrainingProgressPage: PageLayout from Universal/Pages (TopBar + Sidebar from Sections) */
import { PageLayout } from '@/specs/Universal/Pages';
import HomepageJumbotron from '@/specs/Home/Sections/HomepageJumbotron';
import DataVisualizationSkillsProgress from '@/specs/Home/Cards/DataVisualization/DataVisualizationSkillsProgress';
import { RecommendedLessons } from '@/specs/Home/Cards';
import Button from '@/components/Button';
import DonutChart from '@/DataViz/PartToWhole/DonutChart/DonutChart';
import { BarChart } from '@/DataViz';
import Progress from '@/components/Progress/Progress';
import './App.css';

/** Training card images – imported so paths resolve when app runs from repo root or home-redesign. */
import imgGivingEffectivePraise from './assets/giving-effective-praise.png';
import imgReactingToErrors from './assets/reacting-to-errors.png';
import imgPromptingStudentsToExplain from './assets/prompting-students-to-explain.png';
import imgSupportingGrowthMindset from './assets/supporting-growth-mindset.png';

/** Y-axis max for momentum bar charts (reference: 0, 5, 10) */
const MOMENTUM_Y_MAX = 10;

/**
 * Converts hex color to rgba with given alpha (for Highcharts opacity).
 * Handles "var(--token, #hex)" by extracting the hex fallback.
 * @param {string} color - Hex like #8c6600 or "var(--x, #8c6600)"
 * @param {number} alpha - 0–1
 * @returns {string} rgba(r,g,b,alpha)
 */
function colorToRgba(color, alpha = 0.6) {
    const hexMatch = color.match(/#([0-9a-fA-F]{6})/);
    const hex = hexMatch ? hexMatch[1] : '000000';
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Home Redesign prototype – builds on existing homepage per Figma APPLICATION-PROTOTYPES node 158-21725.
 * Uses Figma MCP (get_design_context, get_screenshot) for design reference and PLUS DataViz framework.
 * Sections: Jumbotron, Tutoring Performance, Weekly Tutoring Load, Student Momentum, Personalized Trainings.
 */

/** Radar: 5 axes; icons at corners, full names in tooltip on hover. */
const DEFAULT_SKILLS_OVERVIEW = {
    categories: [
        'Teaching Math',
        'Communicating Clearly',
        'Motivating Students',
        'Staying Positive',
        'Managing Time',
    ],
    categoryIcons: ['fa-calculator', 'fa-comments', 'fa-hand-holding-heart', 'fa-face-smile', 'fa-clock'],
    yourPerformance: [80, 80, 90, 70, 60],
    averagePerformance: [90, 90, 100, 80, 70],
};

/** Weekly load: 5-segment donut (4 activities + unscheduled). Colors match breakdown bars. Use hex for Progress to avoid var() resolution issues. */
const WEEKLY_LOAD_SEGMENTS = [
    { label: 'Direct tutoring', hours: 8.0, color: '#0472a8' },
    { label: 'Student support & follow-ups', hours: 4.0, color: '#8659a9' },
    { label: 'Prep & planning', hours: 2.5, color: '#c70b77' },
    { label: 'Training & reflection', hours: 2.3, color: '#8c6600' },
];
const TOTAL_HOURS = 20;
const SCHEDULED_HOURS = 16.8;
const SCHEDULED_PCT = 84;

/** Student momentum: 8 students in 4x2 grid, each with mini column chart (6–7 data points, scale 0–10). */
const STUDENT_MOMENTUM_DATA = [
    { name: 'Alex P.', color: 'var(--color-social-emotional, #8c6600)', data: [3, 4, 5, 6, 7, 8, 8] },
    { name: 'Priya J.', color: 'var(--color-primary, #0472a8)', data: [6, 6, 7, 7, 6, 7, 7] },
    { name: 'Maya L.', color: 'var(--color-mastering-content, #8659a9)', data: [7, 8, 6, 5, 6, 7, 8] },
    { name: 'Sam K.', color: 'var(--color-relationship, #c70b77)', data: [0, 1, 4, 5, 6, 7, 7] },
    { name: 'Jordan K.', color: 'var(--color-advocacy, #167745)', data: [7, 8, 6, 5, 5, 6, 5] },
    { name: 'Nina Z.', color: 'var(--color-tertiary, #0e8175)', data: [6, 6, 7, 7, 6, 6, 7] },
    { name: 'Luis L.', color: '#a81a5c', data: [3, 4, 5, 6, 7, 8, 8] },
    { name: 'Ethan M.', color: '#6b9b6b', data: [4, 5, 5, 6, 8, 6, 7] },
];
/** Personalized Trainings – illustrations imported from src/assets so paths work from repo root or home-redesign. */
const PERSONALIZED_TRAININGS = [
    { id: '1', title: 'Giving Effective Praise', category: 'Social-Emotional Learning', duration: '12 mins', badgeType: 'socio-emotional', image: imgGivingEffectivePraise },
    { id: '2', title: 'Reacting to Errors', category: 'Advocacy', duration: '12 mins', badgeType: 'advocacy', image: imgReactingToErrors },
    { id: '3', title: 'Prompting Students to Explain', category: 'Technology Tools', duration: '12 mins', badgeType: 'technology-tools', image: imgPromptingStudentsToExplain },
    { id: '4', title: 'Supporting a Growth Mindset', category: 'Social-Emotional Learning', duration: '12 mins', badgeType: 'socio-emotional', image: imgSupportingGrowthMindset },
];

/**
 * Weekly Tutoring Load – single card (no inner Card). Left: 16.8 hrs / of 20.0 hrs; right: donut 84% / scheduled;
 * breakdown rows with colored progress bars and hours on the right.
 */
function WeeklyTutoringLoadCard() {
    const donutSegments = [
        ...WEEKLY_LOAD_SEGMENTS.map((s) => ({ value: (s.hours / TOTAL_HOURS) * 100, color: s.color, label: s.label })),
        { value: 100 - SCHEDULED_PCT, color: '#bec8ca', label: 'Unscheduled' },
    ];
    return (
        <div className="home-redesign-section-card home-redesign-weekly-load-inner">
            <h4 className="h4 home-redesign-card-title">Weekly Tutoring Load</h4>
            <div className="home-redesign-weekly-top">
                <div className="home-redesign-weekly-summary">
                    <span className="h1 home-redesign-weekly-value">{SCHEDULED_HOURS} hrs</span>
                    <span className="body2-txt home-redesign-weekly-of">of {TOTAL_HOURS.toFixed(1)} hrs</span>
                </div>
                <div className="home-redesign-donut-wrap">
                    <DonutChart
                        size={160}
                        segments={donutSegments}
                        value="84%"
                        label="scheduled"
                        centerTextSize="h4"
                    />
                </div>
            </div>
            <ul className="home-redesign-breakdown">
                {WEEKLY_LOAD_SEGMENTS.slice(0, 3).map((segment) => (
                    <li key={segment.label} className="home-redesign-breakdown-row">
                        <div className="home-redesign-breakdown-label-line">
                            <span className="home-redesign-breakdown-label">{segment.label}</span>
                            <span className="home-redesign-breakdown-hrs">{segment.hours.toFixed(1)} hrs</span>
                        </div>
                        <div
                            className="home-redesign-breakdown-progress-wrap"
                            style={{ ['--color-primary']: segment.color }}
                        >
                            <Progress
                                value={(segment.hours / TOTAL_HOURS) * 100}
                                min={0}
                                max={100}
                                size="small"
                                showLabel={false}
                                className="home-redesign-breakdown-progress"
                            />
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

/**
 * Resize-aware chart wrapper: measures container and passes height to BarChart so it fills available space.
 */
function MomentumChartCell({ student }) {
    const wrapRef = useRef(null);
    const [chartHeight, setChartHeight] = useState(70);

    useEffect(() => {
        if (!wrapRef.current) return;
        const el = wrapRef.current;
        const updateHeight = () => {
            if (el) setChartHeight(Math.max(60, el.clientHeight));
        };
        updateHeight();
        const ro = new ResizeObserver(updateHeight);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    return (
        <div ref={wrapRef} className="home-redesign-momentum-chart-wrap">
            <BarChart
                categories={student.data.map(() => '')}
                series={[
                    { name: student.name, data: student.data, color: colorToRgba(student.color, 0.6) },
                ]}
                height={chartHeight}
                showLegend={false}
                yAxisMax={MOMENTUM_Y_MAX}
                hideXAxisLabels={true}
                hideYAxisLabels={false}
                yAxisTickPositions={[0, 5, 10]}
                chartSpacing={[12, 36, 12, 4]}
                columnPointPadding={0}
            />
        </div>
    );
}

/**
 * Student Momentum – single card. 4x2 grid, 8 students, each with name + BarChart (DataViz) 0–10 scale.
 * Grid fills section height; charts resize to fill cells; bars wider, 60% opacity; y-axis labels have room.
 */
function StudentMomentumCard() {
    const [page, setPage] = useState(0);
    const maxPage = 0;
    const displayList = STUDENT_MOMENTUM_DATA.slice(0, 6);
    return (
        <div className="home-redesign-section-card home-redesign-student-momentum-inner">
            <div className="home-redesign-card-header-with-nav">
                <h4 className="h4 home-redesign-card-title">Student Momentum</h4>
                <div className="home-redesign-nav-buttons">
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
            <div className="home-redesign-momentum-grid">
                {displayList.map((student) => (
                    <div key={student.name} className="home-redesign-momentum-cell">
                        <span className="body2-txt home-redesign-momentum-name">{student.name}</span>
                        <MomentumChartCell student={student} />
                    </div>
                ))}
            </div>
        </div>
    );
}

function App() {
    // Same layout pattern as TutorTrainingProgressPage (specs/Admin/.../TutorTrainingProgressPage.jsx)
    /** Same as reference tutor-training-progress-page (TutorAdminWithChatView). */
    const navigate = useNavigate();

    // State must be declared before using in config
    const [activeSimulation, setActiveSimulation] = useState(null);

    // Spotlight state for horizontal scrolling
    const [isSpotlightActive, setIsSpotlightActive] = useState(false);

    // Dynamic config based on whether chat simulation is active
    const topBarConfig = {
        breadcrumbs: activeSimulation
            ? [
                { text: 'Training', href: '#' },
                { text: 'Lessons', href: '#' },
                { text: 'Supporting a Growth Mindset', href: '#' }
            ]
            : [{ text: 'Home', href: '#' }],
        user: { name: 'Boyuan Guo', counter: null, counterValue: null, type: 'lead tutor' },
    };

    const sidebarConfig = {
        user: 'tutor',
        activeTab: activeSimulation ? 'lessons' : 'home',
        onHomeClick: () => navigate('/home'),
        onTabClick: (id) => {
            if (id === 'sessions') navigate('/sessions');
            if (id === 'tutors') navigate('/admin');
        }
    };

    const carouselRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    const [shellLoading, setShellLoading] = useState(true);
    const [shellReady, setShellReady] = useState(false);
    const [shellEntered, setShellEntered] = useState(false);
    const [contentReady, setContentReady] = useState(false);
    const [contentVisible, setContentVisible] = useState(false);

    const [hasEntered, setHasEntered] = useState(false);

    /** Shell + content: one sync point at 600ms (1.5× exaggerated) – shell skeleton ends, content skeleton starts exiting; then shell reveals, then content reveals after brief fade. */
    useEffect(() => {
        const t = setTimeout(() => {
            setShellLoading(false);
            setShellReady(true);
            setContentReady(true);
        }, 600);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (!shellReady) return;
        const id = requestAnimationFrame(() => setShellEntered(true));
        return () => cancelAnimationFrame(id);
    }, [shellReady]);

    /** Content skeleton exit is 0.2s; show real content and start reveal when fade completes (1.5× = 330ms). */
    useEffect(() => {
        if (!contentReady) return;
        const t = setTimeout(() => setContentVisible(true), 330);
        return () => clearTimeout(t);
    }, [contentReady]);

    useEffect(() => {
        if (!contentVisible) return;
        const id = requestAnimationFrame(() => setHasEntered(true));
        return () => cancelAnimationFrame(id);
    }, [contentVisible]);

    const scrollCarousel = (direction) => {
        if (!carouselRef.current) return;

        // Trigger spotlight effect
        setIsSpotlightActive(true);
        setTimeout(() => setIsSpotlightActive(false), 2000); // Wait for scroll + transition

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
            id="home-redesign-page"
            mainClassName="home-redesign-content"
            shellLoading={shellLoading}
            shellEntered={shellEntered}
        >
            {!contentVisible ? (
                <div
                    className={`home-redesign-skeleton-root${contentReady ? ' is-exiting' : ''}`}
                    style={{ display: 'contents' }}
                    aria-busy="true"
                    aria-label="Loading content"
                >
                    <div className="home-redesign-jumbotron-section">
                        <div className="home-redesign-skeleton-jumbotron">
                            <div className="home-redesign-skeleton-tabs-row">
                                <span className="home-redesign-skeleton-block home-redesign-skeleton-pill" />
                                <span className="home-redesign-skeleton-block home-redesign-skeleton-pill" />
                                <span className="home-redesign-skeleton-block home-redesign-skeleton-pill" />
                            </div>
                            <div className="home-redesign-skeleton-divider" />
                            <div className="home-redesign-skeleton-block home-redesign-skeleton-title" />
                            <div className="home-redesign-skeleton-block home-redesign-skeleton-line" />
                            <div className="home-redesign-skeleton-block home-redesign-skeleton-line home-redesign-skeleton-line-short" />
                            <div className="home-redesign-skeleton-actions">
                                <span className="home-redesign-skeleton-block home-redesign-skeleton-btn" />
                                <span className="home-redesign-skeleton-block home-redesign-skeleton-btn home-redesign-skeleton-btn-sm" />
                            </div>
                        </div>
                    </div>
                    <div className="home-redesign-three-cards">
                        <div className="home-redesign-card-tutoring">
                            <div className="home-redesign-skeleton-card">
                                <div className="home-redesign-skeleton-block home-redesign-skeleton-card-title" />
                                <div className="home-redesign-skeleton-block home-redesign-skeleton-card-content" />
                            </div>
                        </div>
                        <div className="home-redesign-card-weekly">
                            <div className="home-redesign-skeleton-card">
                                <div className="home-redesign-skeleton-block home-redesign-skeleton-card-title" />
                                <div className="home-redesign-skeleton-block home-redesign-skeleton-card-content" />
                            </div>
                        </div>
                        <div className="home-redesign-card-momentum">
                            <div className="home-redesign-skeleton-card">
                                <div className="home-redesign-skeleton-block home-redesign-skeleton-card-title" />
                                <div className="home-redesign-skeleton-block home-redesign-skeleton-card-content" />
                            </div>
                        </div>
                    </div>
                    <div className="home-redesign-trainings-section">
                        <div className="home-redesign-skeleton-trainings">
                            <div className="home-redesign-skeleton-trainings-header">
                                <div className="home-redesign-skeleton-block home-redesign-skeleton-trainings-title" />
                                <div className="home-redesign-skeleton-trainings-controls">
                                    <span className="home-redesign-skeleton-block home-redesign-skeleton-icon" />
                                    <span className="home-redesign-skeleton-block home-redesign-skeleton-icon" />
                                </div>
                            </div>
                            <div className="home-redesign-skeleton-carousel">
                                {[1, 2, 3, 4].map((i) => (
                                    <span key={i} className="home-redesign-skeleton-block home-redesign-skeleton-carousel-card" />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <AnimatePresence mode="wait">
                        {activeSimulation ? (
                            <ChatSimulationCard
                                key="simulation"
                                onClose={() => setActiveSimulation(null)}
                                onComplete={() => setActiveSimulation(null)}
                                coverImage={imgSupportingGrowthMindset}
                            />
                        ) : (
                            <motion.div
                                key="dashboard"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className={`home-redesign-reveal-root${hasEntered ? ' has-entered' : ''} ${isSpotlightActive ? 'spotlight-active' : ''}`}
                                style={{ display: 'contents' }}
                            >
                                <div className={`home-redesign-jumbotron-section ${isSpotlightActive ? 'is-dimmed' : ''}`}>
                                    <HomepageJumbotron
                                        activeTab="sign-up"
                                        tutorName="Boyuan"
                                        onSignUp={() => { }}
                                        onViewSchedule={() => { }}
                                    />
                                </div>
                                <div className={`home-redesign-three-cards ${isSpotlightActive ? 'is-dimmed' : ''}`}>
                                    <div className="home-redesign-card-tutoring">
                                        <DataVisualizationSkillsProgress
                                            unwrapCard={true}
                                            title="Tutoring Performance"
                                            skillsOverviewData={DEFAULT_SKILLS_OVERVIEW}
                                            skillsProgressData={{
                                                sessionRanges: ['64-68', '74-78', '84-88', '94-98', '104-108'],
                                                averageScores: [30, 55, 12, 25, 65],
                                            }}
                                            defaultActiveTab="skills-overview"
                                            variant="buttonGroup"
                                            hideRadarYAxisLabels={true}
                                            radarCategoryLabelBody3Regular={true}
                                            radarCategoryIcons={DEFAULT_SKILLS_OVERVIEW.categoryIcons}
                                            radarChartSpacing={[16, 20, 52, 20]}
                                            radarHeight="100%"
                                        />
                                    </div>
                                    <div className="home-redesign-card-weekly">
                                        <WeeklyTutoringLoadCard />
                                    </div>
                                    <div className="home-redesign-card-momentum">
                                        <StudentMomentumCard />
                                    </div>
                                </div>

                                <div className={`home-redesign-trainings-section ${isSpotlightActive ? 'spotlight-active' : ''}`}>
                                    <div className="home-redesign-trainings-header">
                                        <h4 className="h4">Personalized Trainings</h4>
                                        <div className="home-redesign-trainings-controls">
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
                                        className="home-redesign-trainings-carousel"
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
                                                data-training-id={item.id}
                                                breakpoint="XXL & above"
                                                badgeType={item.badgeType}
                                                title={item.title}
                                                duration={item.duration}
                                                status="in-progress"
                                                aiRecommended={false}
                                                image={item.image}
                                                actionLabel={item.id === '4' ? 'Start' : 'Review'}
                                                onReviewClick={() => {
                                                    if (item.id === '4') {
                                                        setActiveSimulation(item.id);
                                                    }
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

        </PageLayout>
    );
}

export default App;
