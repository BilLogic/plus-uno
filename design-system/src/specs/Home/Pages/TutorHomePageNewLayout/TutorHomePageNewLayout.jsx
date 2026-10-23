import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { PageLayout } from '@/specs/Universal/Pages';
import { HomepageJumbotron } from '@/specs/Home/Sections';
import { BadgeCard, DataVisualizationSkillsProgress, MetricsCard, RecommendedLessons } from '@/specs/Home/Cards';
import { Button } from '@/components';
import PatternSection from '@/patterns/PatternSection';
import { cardsPerRow, homeLayout, useGridMeasure } from './homeGrid';
import './TutorHomePageNewLayout.scss';

/** Today's Home content, unchanged: the Skills (Home Page) frame in the Specs file. */
const DEFAULT_LESSONS = [1, 2, 3].map((n) => ({
    id: String(n),
    badgeType: 'mastering-content',
    title: 'Lesson Title',
    duration: '12 mins',
    status: 'in-progress',
    aiRecommended: true,
}));

/** Today's session links; the Specs frame's tab counts three. */
const DEFAULT_SESSIONS = [
    { id: '1', studentName: 'Jackson', time: '9:05 am - 9:55 am', date: '10/13/2023' },
    { id: '2', studentName: 'Sarah', time: '10:00 am - 10:50 am', date: '10/13/2023' },
    { id: '3', studentName: 'Priya', time: '4:00 pm - 4:50 pm', date: '10/13/2023' },
];

const DEFAULT_PROGRESS = {
    sessionRanges: ['64-68', '74-78', '84-88', '94-98', '104-108'],
    averageScores: [30, 55, 12, 25, 65],
};

/** MetricsCard's pages; the third holds the three rating tiles the Specs frame shows. */
const IMPACT_PAGES = 3;

/** Before the first measure, every block spans the row. */
const STACKED = { main: null, side: null };

/** A grid item spanning `span` of the content grid's columns, or the whole row. */
const spanStyle = (span) => ({ gridColumn: span ? `span ${span}` : '1 / -1' });

/** A reused card sized by its grid cell or strip track rather than by its own fixed width. */
const FILL_CELL = { width: 'auto', maxWidth: 'none', height: '100%' };

/** How many lesson cards one view of the strip holds. */
const lessonsPerView = (width, grid) => cardsPerRow(width, grid, grid.cardMin);

/** Previous and next, for a paged block. */
const PagerControls = ({ label, onPrevious, onNext, previousDisabled, nextDisabled }) => (
    <>
        <Button
            style="primary"
            fill="outline"
            size="small"
            leadingVisual="arrow-left"
            onClick={onPrevious}
            disabled={previousDisabled}
            aria-label={`Previous ${label}`}
        />
        <Button
            style="primary"
            fill="outline"
            size="small"
            leadingVisual="arrow-right"
            onClick={onNext}
            disabled={nextDisabled}
            aria-label={`Next ${label}`}
        />
    </>
);

PagerControls.propTypes = {
    label: PropTypes.string.isRequired,
    onPrevious: PropTypes.func,
    onNext: PropTypes.func,
    previousDisabled: PropTypes.bool,
    nextDisabled: PropTypes.bool,
};

/**
 * TutorHomePageNewLayout: today's tutor Home (the Specs "Skills (Home Page)"
 * frame, 563:207489) rebuilt on the new frame, grid and type. A side-by-side
 * "after" for review; the Home pages beside it are the "before".
 *
 * - The frame is PageLayout on the SurfaceContainer pattern: the 32 topbar, the
 *   tutor sidebar with Home selected, and the surface's 12-column content grid.
 * - Each row is a subgrid of that grid, and each block spans whole columns,
 *   chosen by the formulas in `homeGrid.js` from the section and card
 *   minimums. A row too narrow to split stacks.
 * - The greeting is the page's h1. Your Impact and Personalized
 *   Recommendations are sections (h2), and the My Badge card's title is an h2,
 *   one level below the page it sits on.
 */
const TutorHomePageNewLayout = ({
    id,
    tutorName = 'John',
    userName = 'John Doe',
    userBadge = 'Lead',
    skillsOverviewData,
    skillsProgressData = DEFAULT_PROGRESS,
    recommendedLessons = DEFAULT_LESSONS,
    sessionLinks = DEFAULT_SESSIONS,
    onReviewLesson,
    className = '',
    style,
}) => {
    const rowRef = useRef(null);
    const stripRef = useRef(null);
    const layout = useGridMeasure(rowRef, homeLayout);
    const [impactPage, setImpactPage] = useState(IMPACT_PAGES);
    const [edges, setEdges] = useState({ start: true, end: false });
    const [selectedSession, setSelectedSession] = useState(sessionLinks[0]?.id);

    const greeting = layout?.greeting ?? STACKED;
    const progress = layout?.progress ?? STACKED;

    const readEdges = useCallback(() => {
        const el = stripRef.current;
        if (!el) return;
        // Sub-pixel layout can leave the last view a fraction of a pixel short of the end.
        setEdges({
            start: el.scrollLeft <= 0,
            end: Math.ceil(el.scrollLeft + el.clientWidth) >= el.scrollWidth,
        });
    }, []);

    // The pager reads the strip's edges on scroll, on resize, and when the lessons change.
    const perView = useGridMeasure(stripRef, lessonsPerView, readEdges);
    useEffect(readEdges, [readEdges, perView, recommendedLessons.length]);

    /** Scrolls the strip one view, gutter included, so the next card lands where the first was. */
    const pageLessons = (direction) => {
        const el = stripRef.current;
        if (!el) return;
        const gutter = parseFloat(getComputedStyle(el).columnGap) || 0;
        el.scrollBy({ left: direction * (el.clientWidth + gutter), behavior: 'smooth' });
    };

    return (
        <PageLayout
            id={id}
            topBarConfig={{
                breadcrumbs: [{ text: 'Home', href: '#' }],
                user: { name: userName, type: userBadge === 'Lead' ? 'lead tutor' : 'regular tutor' },
            }}
            sidebarConfig={{ user: 'tutor', activeTabId: 'home' }}
            className={`plus-home-new ${className}`.trim()}
            style={style}
        >
            <div ref={rowRef} className="plus-home-new__row" data-row="greeting">
                <HomepageJumbotron
                    titleLevel={1}
                    tutorName={tutorName}
                    sessionLinks={sessionLinks}
                    selectedSession={selectedSession}
                    onSessionSelect={setSelectedSession}
                    className="plus-home-new__block"
                    style={spanStyle(greeting.main)}
                />
                <div className="plus-home-new__block" style={spanStyle(greeting.side)}>
                    <BadgeCard
                        titleLevel={2}
                        size="M"
                        badgeType="unclaimed"
                        buttonText="Claim"
                        tooltipText="Complete 20/20 lessons to claim your badge"
                        style={FILL_CELL}
                    />
                </div>
            </div>

            <div className="plus-home-new__row" data-row="progress">
                <div className="plus-home-new__block" style={spanStyle(progress.main)}>
                    <DataVisualizationSkillsProgress
                        skillsOverviewData={skillsOverviewData}
                        skillsProgressData={skillsProgressData}
                        defaultActiveTab="skills-progress"
                    />
                </div>
                <PatternSection
                    title="Your Impact"
                    padding="none"
                    gap="sm"
                    className="plus-home-new__block plus-home-new__impact"
                    style={spanStyle(progress.side)}
                    actions={(
                        <PagerControls
                            label="impact page"
                            onPrevious={() => setImpactPage((p) => Math.max(1, p - 1))}
                            onNext={() => setImpactPage((p) => Math.min(IMPACT_PAGES, p + 1))}
                            previousDisabled={impactPage === 1}
                            nextDisabled={impactPage === IMPACT_PAGES}
                        />
                    )}
                >
                    <MetricsCard page={impactPage} onPageChange={setImpactPage} />
                </PatternSection>
            </div>

            <PatternSection
                title="Personalized Recommendations"
                padding="none"
                gap="sm"
                className="plus-home-new__block"
                data-row="recommendations"
                actions={(
                    <PagerControls
                        label="recommendations"
                        onPrevious={() => pageLessons(-1)}
                        onNext={() => pageLessons(1)}
                        previousDisabled={edges.start}
                        nextDisabled={edges.end}
                    />
                )}
            >
                <ul
                    ref={stripRef}
                    className="plus-home-new__lessons"
                    style={perView ? { '--plus-home-new-cards-per-view': perView } : undefined}
                    onScroll={readEdges}
                >
                    {recommendedLessons.map((lesson) => (
                        <li key={lesson.id} className="plus-home-new__lesson">
                            <RecommendedLessons
                                badgeType={lesson.badgeType}
                                title={lesson.title}
                                duration={lesson.duration}
                                status={lesson.status}
                                aiRecommended={lesson.aiRecommended}
                                style={FILL_CELL}
                                onReviewClick={() => onReviewLesson?.(lesson.id)}
                            />
                        </li>
                    ))}
                </ul>
            </PatternSection>
        </PageLayout>
    );
};

TutorHomePageNewLayout.propTypes = {
    id: PropTypes.string,
    /** The name the greeting uses */
    tutorName: PropTypes.string,
    /** The account name in the topbar */
    userName: PropTypes.string,
    /** The role shown beside the account name */
    userBadge: PropTypes.oneOf(['Lead', 'Regular']),
    skillsOverviewData: PropTypes.shape({
        categories: PropTypes.arrayOf(PropTypes.string),
        yourPerformance: PropTypes.arrayOf(PropTypes.number),
        averagePerformance: PropTypes.arrayOf(PropTypes.number),
    }),
    skillsProgressData: PropTypes.shape({
        sessionRanges: PropTypes.arrayOf(PropTypes.string),
        averageScores: PropTypes.arrayOf(PropTypes.number),
    }),
    recommendedLessons: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        badgeType: PropTypes.string,
        title: PropTypes.string.isRequired,
        duration: PropTypes.string,
        status: PropTypes.string,
        aiRecommended: PropTypes.bool,
    })),
    /** Today's session links, which the Session links tab counts and lists */
    sessionLinks: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        studentName: PropTypes.string.isRequired,
        time: PropTypes.string.isRequired,
        date: PropTypes.string.isRequired,
    })),
    /** Called with a lesson's id when its Review button is pressed */
    onReviewLesson: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object,
};

export default TutorHomePageNewLayout;
