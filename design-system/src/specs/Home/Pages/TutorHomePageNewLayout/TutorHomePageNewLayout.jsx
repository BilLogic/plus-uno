import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { PageLayout } from '@/specs/Universal/Pages';
import { Alert, Button, Count, ListGroup, NavTabs, Select, Status, Tag, Tile } from '@/components';
import { LineChart, RadarChart } from '@/dataviz';
import PatternCard from '@/patterns/PatternCard';
import PatternSection from '@/patterns/PatternSection';
import { cardsPerRow, homeLayout, useGridMeasure, useTokenLength } from './homeGrid';
import './TutorHomePageNewLayout.scss';

/** Today's Home content, unchanged: the Skills (Home Page) frame in the Specs file. */
const DEFAULT_LESSONS = [1, 2, 3].map((n) => ({
    id: String(n),
    category: 'Mastering Content',
    title: 'Lesson Title',
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

/** Your Impact's pages, first to last, as today's Home holds them. */
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
/** The score line's color: the Secondary role, as the Figma chart binds it. */
const SCORE_COLOR = 'var(--color-secondary)';

/** A block's grid placement as an inline style; before the first measure, every block spans the row. */
const placed = (slot) => (slot ? { gridColumn: slot.column, gridRow: slot.row } : { gridColumn: '1 / -1' });

/** How many lesson cards one view of the strip holds. */
const lessonsPerView = (width, grid) => cardsPerRow(width, grid, grid.cardMin);

/** The greeting's copy for each of its tabs, from today's Home. */
const greetingCopy = (tab, name) => ({
    'sign-up': {
        title: `Sign up for your next session, ${name}!`,
        description: 'Your students are counting on you! Click below to sign up for your next session and edit if needed.',
    },
    session: {
        title: `Get ready to shine, ${name}.`,
        description: "Your session links for today are ready. Select a session and click 'Join session' to begin.",
    },
    reflection: {
        title: `How did your session go, ${name}?`,
        description: 'Share your thoughts about the session to ensure a great experience for all.',
    },
})[tab];

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
    <span className="plus-home-new__inline">
        {children}
        {after}
    </span>
);

TabLabel.propTypes = { children: PropTypes.node, after: PropTypes.node };

const infoGlyph = <i className="fa-solid fa-circle-info" aria-hidden="true" />;

/** The week-on-week change a stat carries. */
const change = <Status style="success" leadingVisual="arrow-up">+{'{#}'}% since last week</Status>;

/**
 * TutorHomePageNewLayout: today's tutor Home (the Specs "Skills (Home Page)"
 * frame, 563:207489) rebuilt from the patterns. A side-by-side "after" for
 * review; the Home pages beside it are the "before", and nothing here imports
 * their components.
 *
 * - The frame is PageLayout on the SurfaceContainer pattern: the topbar, the
 *   tutor sidebar with Home selected, and the surface's 12-column content grid.
 * - Every block is a direct child of that grid and is a Section or a Card
 *   pattern, whose header, body and footer slots hold design-system
 *   primitives. `homeGrid.js` places each on whole columns from the section
 *   and card minimums. Spacing comes from the patterns and the grid alone.
 * - The greeting is the page header (h1) with its tabs; My Badge and Your
 *   Impact are cards (h2), Personalized Recommendations a section (h2) whose
 *   lesson cards are h3s.
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
    // The formulas measure the content grid, which is the greeting's parent.
    const gridRef = useRef(null);
    const greetingRef = useCallback((node) => { gridRef.current = node?.parentElement ?? null; }, []);
    const stripRef = useRef(null);
    const layout = useGridMeasure(gridRef, homeLayout);
    // The charts take a pixel height; it is the Size token, read at run time.
    const chartHeight = useTokenLength('--height-2000') ?? undefined;
    const [greetingTab, setGreetingTab] = useState('sign-up');
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

    const copy = greetingCopy(greetingTab, tutorName);
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
            {/* Greeting: Pattern/Section, page level, `_Section header` of the tabs type. */}
            <PatternSection
                ref={greetingRef}
                level="page"
                padding="none"
                title={copy.title}
                description={copy.description}
                data-block="greeting"
                style={placed(layout?.greeting)}
                tabs={(
                    <NavTabs mode="tabs" activeKey={greetingTab} onSelect={setGreetingTab} aria-label="Today">
                        <NavTabs.Item eventKey="sign-up">Sign up / Edit</NavTabs.Item>
                        <NavTabs.Item eventKey="session">
                            <TabLabel after={<Count value={sessionLinks.length} size="small" />}>Session links</TabLabel>
                        </NavTabs.Item>
                        <NavTabs.Item eventKey="reflection">Reflection</NavTabs.Item>
                    </NavTabs>
                )}
            >
                {greetingTab === 'sign-up' && (
                    <div className="plus-home-new__inline">
                        <Button text="Sign up now" style="primary" fill="filled" size="small" leadingVisual="paper-plane" />
                        <Button text="View schedule" style="secondary" fill="tonal" size="small" />
                    </div>
                )}
                {greetingTab === 'session' && (
                    <div className="plus-home-new__stack">
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
                    </div>
                )}
                {greetingTab === 'reflection' && (
                    <Button text="Submit Your Reflection" style="primary" fill="filled" size="small" leadingVisual="paper-plane" />
                )}
            </PatternSection>

            {/* My Badge: Pattern/Card, `_Card header` default; Claim in the footer. */}
            <PatternCard
                padding="sm"
                title="My Badge"
                data-block="badge"
                // The badge card hugs its content rather than stretching to the row's tallest block.
                style={{ ...placed(layout?.badge), alignSelf: 'start' }}
                footer={<Button text="Claim" style="primary" fill="tonal" size="small" />}
            >
                <div className="plus-home-new__inline">
                    <Tile content="icon" icon="award" size={48} color="gray" />
                    <div className="plus-home-new__text">
                        <p className="plus-home-new__strong">Certified Tutor</p>
                        <p className="plus-home-new__caption">Complete 20/20 lessons to claim your badge.</p>
                    </div>
                </div>
            </PatternCard>

            {/* Skills: Pattern/Card, `_Card header` custom, holding the tabs; the chart in the body. */}
            <PatternCard
                // The large card: Figma's small card stops at 304 tall, under the chart's 320.
                padding="lg"
                data-block="skills"
                style={placed(layout?.skills)}
                header={(
                    <NavTabs mode="tabs" activeKey={skillsTab} onSelect={setSkillsTab} aria-label="Skills">
                        <NavTabs.Item eventKey="skills-overview"><TabLabel after={infoGlyph}>Skills Overview</TabLabel></NavTabs.Item>
                        <NavTabs.Item eventKey="skills-progress"><TabLabel after={infoGlyph}>Skills Progress</TabLabel></NavTabs.Item>
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
                                { name: 'Your performance', data: skillsOverviewData.yourPerformance },
                                { name: 'Average tutor performance', data: skillsOverviewData.averagePerformance, dashStyle: 'Dash' },
                            ]}
                        />
                    )}
                </div>
            </PatternCard>

            {/* Your Impact: Pattern/Card, `_Card header` default with the pager in its actions. */}
            <PatternCard
                padding="sm"
                title="Your Impact"
                data-block="impact"
                style={placed(layout?.impact)}
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
                <ListGroup flush as="ul">
                    {IMPACT_PAGES[impactIndex].map((stat) => (
                        <ListGroup.Item key={stat.label} as="li">
                            <div className="plus-home-new__text">
                                <p className="plus-home-new__stat">{stat.value}</p>
                                <p className="plus-home-new__label">{stat.label}</p>
                                {stat.change && change}
                            </div>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            </PatternCard>

            {/* Recommendations: Pattern/Section, `_Section header` default with the pager; a row of Pattern/Cards. */}
            <PatternSection
                title="Personalized Recommendations"
                padding="none"
                data-block="lessons"
                style={placed(layout?.lessons)}
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
        category: PropTypes.oneOf(Object.keys(CATEGORY_COLOR)),
        title: PropTypes.string.isRequired,
        duration: PropTypes.string,
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
