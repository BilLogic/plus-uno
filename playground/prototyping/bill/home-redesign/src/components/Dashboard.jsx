import React, { useRef, useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShellContext } from '../context/ShellContext';
import { motion, AnimatePresence } from 'framer-motion';
import ChatSimulationCard from './ChatSimulationCard';
import HomepageJumbotron from '@/specs/Home/Sections/HomepageJumbotron';
import DataVisualizationSkillsProgress from '@/specs/Home/Cards/DataVisualization/DataVisualizationSkillsProgress';
import { RecommendedLessons } from '@/specs/Home/Cards';
import Button from '@/components/Button';
import DonutChart from '@/DataViz/PartToWhole/DonutChart/DonutChart';
import { BarChart } from '@/DataViz';
import Progress from '@/components/Progress/Progress';

import imgGivingEffectivePraise from '../assets/giving-effective-praise.png';
import imgReactingToErrors from '../assets/reacting-to-errors.png';
import imgPromptingStudentsToExplain from '../assets/prompting-students-to-explain.png';
import imgSupportingGrowthMindset from '../assets/supporting-growth-mindset.png';

/** Y-axis max for momentum bar charts (reference: 0, 5, 10) */
const MOMENTUM_Y_MAX = 10;

function colorToRgba(color, alpha = 0.6) {
    const hexMatch = color.match(/#([0-9a-fA-F]{6})/);
    const hex = hexMatch ? hexMatch[1] : '000000';
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

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

const WEEKLY_LOAD_SEGMENTS = [
    { label: 'Direct tutoring', hours: 8.0, color: '#0472a8' },
    { label: 'Student support & follow-ups', hours: 4.0, color: '#8659a9' },
    { label: 'Prep & planning', hours: 2.5, color: '#c70b77' },
    { label: 'Training & reflection', hours: 2.3, color: '#8c6600' },
];
const TOTAL_HOURS = 20;
const SCHEDULED_HOURS = 16.8;
const SCHEDULED_PCT = 84;
const WEEKLY_REVEAL_DELAY = 640;
const MOMENTUM_REVEAL_DELAY = 960;

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

const PERSONALIZED_TRAININGS = [
    { id: '1', title: 'Giving Effective Praise', category: 'Social-Emotional Learning', duration: '12 mins', badgeType: 'socio-emotional', image: imgGivingEffectivePraise },
    { id: '2', title: 'Reacting to Errors', category: 'Advocacy', duration: '12 mins', badgeType: 'advocacy', image: imgReactingToErrors },
    { id: '3', title: 'Prompting Students to Explain', category: 'Technology Tools', duration: '12 mins', badgeType: 'technology-tools', image: imgPromptingStudentsToExplain },
    { id: '4', title: 'Supporting a Growth Mindset', category: 'Social-Emotional Learning', duration: '12 mins', badgeType: 'socio-emotional', image: imgSupportingGrowthMindset },
];

function WeeklyTutoringLoadCard() {
    const donutSegments = useMemo(() => [
        ...WEEKLY_LOAD_SEGMENTS.map((s) => ({ value: (s.hours / TOTAL_HOURS) * 100, color: s.color, label: s.label })),
        { value: 100 - SCHEDULED_PCT, color: '#bec8ca', label: 'Unscheduled' },
    ], []);
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
                        size={130}
                        segments={donutSegments}
                        value="84%"
                        label="scheduled"
                        centerTextSize="h4"
                    />
                </div>
            </div>
            <ul className="home-redesign-breakdown">
                {WEEKLY_LOAD_SEGMENTS.slice(0, 3).map((segment, index) => (
                    <li key={segment.label} className="home-redesign-breakdown-row">
                        <div className="home-redesign-breakdown-label-line">
                            <span className="home-redesign-breakdown-label">{segment.label}</span>
                            <span className="home-redesign-breakdown-hrs">{segment.hours.toFixed(1)} hrs</span>
                        </div>
                        <div
                            className="home-redesign-breakdown-progress-wrap"
                            style={{ ['--color-primary']: segment.color, ['--progress-delay']: `${WEEKLY_REVEAL_DELAY + index * 160}ms` }}
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

function MomentumChartCell({ student, delay = 0 }) {
    const wrapRef = useRef(null);
    const [chartHeight, setChartHeight] = useState(null);
    const categories = useMemo(() => student.data.map(() => ''), [student.data]);
    const series = useMemo(() => ([
        { name: student.name, data: student.data, color: colorToRgba(student.color, 0.6) },
    ]), [student.name, student.data, student.color]);

    useEffect(() => {
        if (!wrapRef.current) return;
        const el = wrapRef.current;
        const updateHeight = () => {
            if (!el) return;
            const nextHeight = Math.max(60, Math.round(el.clientHeight));
            setChartHeight((prev) => (prev === nextHeight ? prev : nextHeight));
        };
        updateHeight();
        const ro = new ResizeObserver(updateHeight);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    return (
        <div ref={wrapRef} className="home-redesign-momentum-chart-wrap">
            {chartHeight !== null && (
                <BarChart
                    categories={categories}
                    series={series}
                    height={chartHeight}
                    showLegend={false}
                    yAxisMax={MOMENTUM_Y_MAX}
                    hideXAxisLabels={true}
                    hideYAxisLabels={false}
                    yAxisTickPositions={[0, 5, 10]}
                    chartSpacing={[12, 36, 12, 4]}
                    columnPointPadding={0}
                    animate={true}
                    animationDelay={delay}
                    animationDuration={900}
                />
            )}
        </div>
    );
}

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
                {displayList.map((student, index) => (
                    <div
                        key={student.name}
                        className="home-redesign-momentum-cell"
                    >
                        <span className="body2-txt home-redesign-momentum-name" style={{ transition: 'color 0.2s ease' }}>{student.name}</span>
                        <MomentumChartCell student={student} delay={MOMENTUM_REVEAL_DELAY + index * 140} />
                    </div>
                ))}
            </div>
        </div>
    );
}

export const Dashboard = () => {
    const navigate = useNavigate();
    const [activeSimulation, setActiveSimulation] = useState(null);
    const carouselRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const [hasEntered, setHasEntered] = useState(false);
    const { setBreadcrumbs, setActiveTabOverride } = useContext(ShellContext) || {};

    // Update breadcrumbs and active tab based on simulation state
    useEffect(() => {
        if (setBreadcrumbs) {
            setBreadcrumbs(activeSimulation
                ? [
                    { text: 'Training', href: '#' },
                    { text: 'Lessons', href: '#' },
                    { text: 'Supporting a Growth Mindset', href: '#' }
                ]
                : [{ text: 'Home', href: '#' }]
            );
        }
        // Set lessons tab active when simulation is shown
        if (setActiveTabOverride) {
            setActiveTabOverride(activeSimulation ? 'lessons' : null);
        }
    }, [activeSimulation, setBreadcrumbs, setActiveTabOverride]);

    // Trigger animation on first render
    useEffect(() => {
        requestAnimationFrame(() => setHasEntered(true));
    }, []);


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
        <div id="home-redesign-page" style={{ position: 'relative', width: '100%', minHeight: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
                        className={`home-redesign-reveal-root${hasEntered ? ' has-entered' : ''}`}
                        style={{ display: 'contents' }}
                    >
                        <div className="home-redesign-jumbotron-section">
                            <HomepageJumbotron
                                tutorName="Boyuan"
                                onSignUp={() => { }}
                                onViewSchedule={() => { }}
                                onSubmitReflection={() => navigate('/reflection')}
                            />
                        </div>
                        <div className="home-redesign-three-cards">
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
                                    radarChartSpacing={[8, 16, 24, 16]}
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

                        <div className="home-redesign-trainings-section">
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
    );
};
