import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { PageLayout } from '@/specs/Universal/Pages';
import { Alert, Button, Count, NavTabs, Select, Status, Tag } from '@/components';
import { LineChart, RadarChart } from '@/dataviz';
import PatternCard from '@/patterns/PatternCard';
import PatternSection from '@/patterns/PatternSection';
import badgeThumbnail from '@/assets/images/tutor-badges/unclaimed-v1-thumbnail.png';
import lessonErrors from '@/assets/images/lessons/training-errors.svg';
import lessonExplain from '@/assets/images/lessons/training-explain.svg';
import lessonMindset from '@/assets/images/lessons/training-mindset.svg';
import lessonPraise from '@/assets/images/lessons/training-praise.svg';
import { cardsPerRow, useGridMeasure, useTokenLength } from './homeGrid';
import './TutorHomePageNewLayout.scss';

/** The training lessons with art, each titled as its picture is. */
const LESSONS = [
    { title: 'Reacting to Errors', image: lessonErrors },
    { title: 'Prompting Students to Explain', image: lessonExplain },
    { title: 'Giving Effective Praise', image: lessonPraise },
    { title: 'Supporting a Growth Mindset', image: lessonMindset },
];

/** Today's Home content: the Skills (Home Page) frame in the Specs file, with real lessons. */
const DEFAULT_LESSONS = LESSONS.slice(0, 3).map((lesson, i) => ({
    id: String(i + 1),
    ...lesson,
    category: 'Mastering Content',
    duration: '12 mins',
    inProgress: true,
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

const DEFAULT_OVERVIEW = {
    categories: ['Teaching Math', 'Communicating Clearly', 'Motivating Students', 'Staying Positive', 'Managing Time', 'Fostering Participation', 'Building Rapport'],
    yourPerformance: [60, 55, 80, 90, 70, 85, 75],
    averagePerformance: [70, 70, 65, 75, 60, 70, 60],
};

/** Your impact's pages, first to last, as today's Home holds them. */
const IMPACT_PAGES = [
    [
        { value: '4.8', label: 'Student Interaction Rating', change: true },
        { value: '4.8', label: 'Session Rating', change: true },
        { value: '4.8', label: 'Self Performance Rating', change: true },
    ],
    [
        { value: '100', label: 'Total Sessions Completed' },
        { value: '75 hr', label: 'Total Tutoring Time' },
        { value: '95%', label: 'Reflection Completion', change: true },
    ],
    [
        { value: '2/3', label: 'Sessions Completed This Week' },
    ],
];

/** The curriculum categories' Tag colors, as today's lesson badges show them. */
const CATEGORY_COLOR = {
    'Mastering Content': 'purple',
    'Socio-Emotional': 'magenta',
    Advocacy: 'yellow',
    Relationships: 'teal',
    'Technology Tools': 'blue',
};

/** The skills chart's score axis, 0 to 100 in quarters, as the Specs chart draws it. */
const SCORE_DOMAIN = [0, 100];
const SCORE_TICKS = [0, 25, 50, 75, 100];
/** The score line is one of the page's few blue marks: the Primary role. */
const SCORE_COLOR = 'var(--color-primary)';

/** How many lesson cards one view of the strip holds. */
const lessonsPerView = (width, grid) => cardsPerRow(width, grid, grid.cardMin);

/** Each tab's body copy, from today's Home. */
const SESSION_COPY = {
    'sign-up': 'Your students are counting on you! Click below to sign up for your next session and edit if needed.',
    session: "Your session links for today are ready. Select a session and click 'Join session' to begin.",
    reflection: 'Share your thoughts about the session to ensure a great experience for all.',
};

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

/** A tab label with a glyph or a count after it. */
const TabLabel = ({ children, after }) => (
    <span className="plus-home-new__inline plus-home-new__inline--tight">
        {children}
        {after}
    </span>
);

TabLabel.propTypes = { children: PropTypes.node, after: PropTypes.node };

const infoGlyph = <i className="fa-solid fa-circle-info" aria-hidden="true" />;

/**
 * TutorHomePageNewLayout: today's tutor Home (the Specs "Skills (Home Page)"
 * frame, 563:207489) recomposed as a calm, single-column page. A side-by-side
 * "after" for review; the Home pages beside it are the "before", and nothing
 * here imports their components.
 *
 * - The frame is PageLayout on the SurfaceContainer pattern: the topbar, the
 *   tutor sidebar with Home selected, and the surface's 12-column content grid.
 * - Four flat Sections are the grid's children, one per row, so the DOM order
 *   is the visual order: the page header (h1) with the badge callout, Next
 *   session with its tabs, Your impact with its stats and the Skills
 *   subsection (h3), and Personalized recommendations, whose lesson cards are
 *   the page's only cards.
 * - The page wears a one-off neutral palette, set in its stylesheet.
 */
const TutorHomePageNewLayout = ({
    id,
    tutorName = 'John',
    userName = 'John Doe',
    userBadge = 'Lead',
    skillsOverviewData = DEFAULT_OVERVIEW,
    skillsProgressData = DEFAULT_PROGRESS,
    recommendedLessons = DEFAULT_LESSONS,
    sessionLinks = DEFAULT_SESSIONS,
    onReviewLesson,
    className = '',
    style,
}) => {
    const stripRef = useRef(null);
    // The charts take a pixel height; it is the Size token, read at run time.
    const chartHeight = useTokenLength('--height-2000') ?? undefined;
    const [sessionTab, setSessionTab] = useState('sign-up');
    const [skillsTab, setSkillsTab] = useState('skills-progress');
    const [impactIndex, setImpactIndex] = useState(0);
    const [edges, setEdges] = useState({ start: true, end: false });
    const [selectedSession, setSelectedSession] = useState(sessionLinks[0]?.id);

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

    const sessionOptions = sessionLinks.map((s) => ({ value: s.id, label: `${s.studentName}, ${s.time}, ${s.date}` }));

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
            {/* Page header: Section at page level; the badge is a callout in its body. */}
            <PatternSection
                level="page"
                padding="none"
                title={`Welcome back, ${tutorName}`}
                description="Here's your tutoring at a glance."
                data-block="header"
                className="plus-home-new__header"
                actions={(
                    <>
                        <Button text="Sign up now" style="primary" fill="filled" size="small" leadingVisual="paper-plane" />
                        <Button text="View schedule" style="secondary" fill="tonal" size="small" />
                    </>
                )}
            >
                <div className="plus-home-new__callout">
                    <img className="plus-home-new__callout-art" src={badgeThumbnail} alt="" />
                    <p className="plus-home-new__callout-title">Certified Tutor</p>
                    <p className="plus-home-new__secondary">20/20 lessons complete</p>
                    <Button text="Claim" style="primary" fill="tonal" size="small" className="plus-home-new__callout-action" />
                </div>
            </PatternSection>

            {/* Next session: a flat Section, `_Section header` of the tabs type. */}
            <PatternSection
                padding="none"
                title="Next session"
                data-block="session"
                tabs={(
                    <NavTabs mode="tabs" activeKey={sessionTab} onSelect={setSessionTab} aria-label="Next session">
                        <NavTabs.Item eventKey="sign-up">Sign up / Edit</NavTabs.Item>
                        <NavTabs.Item eventKey="session">
                            <TabLabel after={<Count value={sessionLinks.length} size="small" />}>Session links</TabLabel>
                        </NavTabs.Item>
                        <NavTabs.Item eventKey="reflection">Reflection</NavTabs.Item>
                    </NavTabs>
                )}
            >
                <div className="plus-home-new__stack">
                    <p className="plus-home-new__body">{SESSION_COPY[sessionTab]}</p>
                    {sessionTab === 'sign-up' && (
                        <div className="plus-home-new__inline">
                            <Button text="Edit sign-ups" style="primary" fill="outline" size="small" leadingVisual="pen" />
                        </div>
                    )}
                    {sessionTab === 'session' && (
                        <>
                            <div className="plus-home-new__inline">
                                <Select
                                    aria-label="Today's session"
                                    placeholder="Select a session"
                                    size="small"
                                    options={sessionOptions}
                                    value={selectedSession ?? ''}
                                    onChange={setSelectedSession}
                                />
                                <Button text="Join session" style="primary" fill="filled" size="small" disabled={!selectedSession} />
                            </div>
                            <Alert style="warning" dismissible={false}>
                                Session links will appear 5 minutes before your scheduled start time.
                            </Alert>
                        </>
                    )}
                    {sessionTab === 'reflection' && (
                        <div className="plus-home-new__inline">
                            <Button text="Submit Your Reflection" style="primary" fill="filled" size="small" leadingVisual="paper-plane" />
                        </div>
                    )}
                </div>
            </PatternSection>

            {/* Your impact: a flat Section, the pager in its header; the stats strip, then the Skills subsection. */}
            <PatternSection
                padding="none"
                title="Your impact"
                data-block="impact"
                actions={(
                    <PagerControls
                        label="impact page"
                        onPrevious={() => setImpactIndex((i) => Math.max(0, i - 1))}
                        onNext={() => setImpactIndex((i) => Math.min(IMPACT_PAGES.length - 1, i + 1))}
                        previousDisabled={impactIndex === 0}
                        nextDisabled={impactIndex === IMPACT_PAGES.length - 1}
                    />
                )}
            >
                <div className="plus-home-new__stack plus-home-new__stack--section">
                    <ul className="plus-home-new__stats">
                        {IMPACT_PAGES[impactIndex].map((stat) => (
                            <li key={stat.label} className="plus-home-new__stat">
                                <p className="plus-home-new__stat-value">{stat.value}</p>
                                <p className="plus-home-new__secondary">{stat.label}</p>
                                {stat.change && <Status style="success" leadingVisual="arrow-up">+{'{#}'}% since last week</Status>}
                            </li>
                        ))}
                    </ul>

                    <PatternSection
                        padding="none"
                        title="Skills"
                        data-block="skills"
                        tabs={(
                            <NavTabs mode="tabs" activeKey={skillsTab} onSelect={setSkillsTab} aria-label="Skills">
                                <NavTabs.Item eventKey="skills-overview"><TabLabel after={infoGlyph}>Overview</TabLabel></NavTabs.Item>
                                <NavTabs.Item eventKey="skills-progress"><TabLabel after={infoGlyph}>Progress</TabLabel></NavTabs.Item>
                            </NavTabs>
                        )}
                    >
                        <div className="plus-home-new__chart">
                            {skillsTab === 'skills-progress' ? (
                                <>
                                    <LineChart
                                        height={chartHeight}
                                        yDomain={SCORE_DOMAIN}
                                        yTicks={SCORE_TICKS}
                                        data={[{
                                            name: 'Average score',
                                            data: skillsProgressData.averageScores,
                                            categories: skillsProgressData.sessionRanges,
                                            color: SCORE_COLOR,
                                        }]}
                                    />
                                    <p className="plus-home-new__caption">Each point represents the average score across 5 sessions.</p>
                                </>
                            ) : (
                                <RadarChart
                                    height={chartHeight}
                                    filled
                                    yAxisMax={100}
                                    categories={skillsOverviewData.categories}
                                    series={[
                                        { name: 'Your performance', data: skillsOverviewData.yourPerformance, color: SCORE_COLOR },
                                        { name: 'Average tutor performance', data: skillsOverviewData.averagePerformance, dashStyle: 'Dash' },
                                    ]}
                                />
                            )}
                        </div>
                    </PatternSection>
                </div>
            </PatternSection>

            {/* Recommendations: a flat Section, the pager in its header; the lesson cards are the page's only cards. */}
            <PatternSection
                padding="none"
                title="Personalized recommendations"
                data-block="lessons"
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
                            <PatternCard
                                padding="sm"
                                title={lesson.title}
                                image={lesson.image && <img className="plus-home-new__thumb" src={lesson.image} alt="" />}
                                footer={<Button text="Review" style="primary" fill="filled" size="small" onClick={() => onReviewLesson?.(lesson.id)} />}
                            >
                                <div className="plus-home-new__inline plus-home-new__inline--wrap">
                                    <Tag color={CATEGORY_COLOR[lesson.category] ?? 'gray'}>{lesson.category}</Tag>
                                    {lesson.duration && <span className="plus-home-new__caption">{lesson.duration}</span>}
                                    {lesson.inProgress && <Status style="warning" leadingVisual="spinner">In progress</Status>}
                                    {lesson.aiRecommended && <Status style="info" leadingVisual="wand-magic-sparkles">AI recommended</Status>}
                                </div>
                            </PatternCard>
                        </li>
                    ))}
                </ul>
            </PatternSection>
        </PageLayout>
    );
};

TutorHomePageNewLayout.propTypes = {
    id: PropTypes.string,
    /** The name the header greets */
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
        category: PropTypes.oneOf(Object.keys(CATEGORY_COLOR)),
        title: PropTypes.string.isRequired,
        duration: PropTypes.string,
        /** The card's picture, decorative (empty alt). */
        image: PropTypes.string,
        inProgress: PropTypes.bool,
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
