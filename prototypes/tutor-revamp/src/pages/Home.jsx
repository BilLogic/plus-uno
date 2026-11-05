import React from 'react';
import { Link } from 'react-router-dom';
import { Button, DateTag, Illustration, SmartTag, StatusTag } from '@/components';
import { PatternCard } from '@/patterns';
import {
    Agenda,
    Avatar,
    AvatarGroup,
    GoalMeter,
    PageHeader,
    PrepChecklist,
    ProgressSteps,
    RevealRow,
    RevealRows,
    Sparkline,
    StatTile,
} from '../kit';
import { AppShell, LinkButton } from '../shell';
import { AGENDA, ALGEBRA_1, MATH_7, PAID_HOURS, PICKED_LESSON, STUDENTS, TODAY, TUTOR } from '../data/mock';
import './Home.css';

const sessionPath = `/sessions/${MATH_7.id}`;
const firstName = (name) => name.split(' ')[0];

/** A card's header row: its h2, and something at the end (a link, a status, a count). */
const CardHead = ({ id, title, end }) => (
    <div className="tr-home__card-head">
        <h2 id={id}>{title}</h2>
        {end}
    </div>
);

/**
 * Home: the tutor's day at a glance, after the vision's Main board.
 *
 * - The greeting (PageHeader, the date as its eyebrow) with an empty
 *   illustration slot.
 * - Four StatTiles: next session, waiting on you, Math 7 students and paid
 *   hours with a target tick.
 * - The Math 7 card: when it starts, the class, the prep checklist and Join
 *   session, locked until 12:45 pm. It is the screen's one primary button.
 * - Overdue (the Algebra I reflection) over today's Agenda.
 * - The students this week, with practice sparklines and a focus status; Open
 *   shows on hover and focus.
 * - Picked for you: one lesson.
 */
const Home = () => {
    const students = STUDENTS.filter((s) => MATH_7.studentIds.includes(s.id));
    const needSupport = students.filter((s) => s.focus.style !== 'success').length;
    const agendaDone = AGENDA.filter((a) => a.state === 'done').length;
    const firstOpen = MATH_7.prep.find((p) => !p.done)?.id;

    return (
        <AppShell breadcrumbs={[{ text: 'Home' }]}>
            <PageHeader
                className="tr-home__hello"
                eyebrow={<time dateTime={TODAY.iso}>{TODAY.long}</time>}
                title={`${TODAY.greeting}, ${TUTOR.firstName}`}
                aside={(
                    <span className="tr-home__illustration">
                        <Illustration character="mastering-content" size={96} />
                    </span>
                )}
            />

            <nav className="tr-home__tiles" aria-label="At a glance">
                <StatTile as={Link} to={sessionPath} tone="teal" icon="clock" label="Next session" value={MATH_7.start} caption={`${MATH_7.title}, ${MATH_7.school}`} />
                <StatTile as="a" href="#home-overdue" tone="yellow" icon="inbox" label="Waiting on you" value="2" caption="A reflection and a lesson" />
                <StatTile as={Link} to="/students" tone="blue" icon="user-group" label={`${MATH_7.title} students`} value={String(students.length)} caption={`${needSupport} need support this week`} />
                <StatTile
                    as={Link}
                    to="/reviews"
                    tone="green"
                    icon="chart-simple"
                    label="Paid hours this week"
                    value={String(PAID_HOURS.value)}
                    unit={`of ${PAID_HOURS.target}`}
                    caption={PAID_HOURS.caption}
                    meter={(
                        <GoalMeter
                            value={PAID_HOURS.value}
                            max={PAID_HOURS.target}
                            target={PAID_HOURS.target}
                            size={6}
                            tone="success"
                            interactive={false}
                            label={`${PAID_HOURS.value} of ${PAID_HOURS.target} paid hours`}
                        />
                    )}
                />
            </nav>

            <PatternCard className="tr-home__card tr-home__span-8 tr-home__next" padding="lg" role="region" aria-labelledby="home-next">
                <div className="tr-home__next-head">
                    <div className="tr-home__next-title">
                        <div className="tr-home__next-h">
                            <h2 id="home-next">{MATH_7.title}</h2>
                            <DateTag appearance="warning">{MATH_7.startsIn}</DateTag>
                        </div>
                        <div className="tr-home__next-meta">
                            <span>{`${MATH_7.school}, ${MATH_7.teacher}’s class`}</span>
                            <AvatarGroup people={students} label={`Your students: ${students.map((s) => firstName(s.name)).join(', ')}`} />
                        </div>
                    </div>
                    <LinkButton to={sessionPath} text="Open session" appearance="subtle" spacing="compact" iconAfter="chevron-right" />
                </div>

                <div className="tr-home__prep">
                    <div className="tr-home__prep-head">
                        <h3>Your prep</h3>
                        <span className="tr-home__ai">
                            <i className="fa-solid fa-wand-magic-sparkles" aria-hidden="true" />
                            From your last reflection
                        </span>
                    </div>
                    <PrepChecklist items={MATH_7.prep} defaultOpenId={firstOpen} />
                </div>

                <div className="tr-home__join">
                    <Button text="Join session" appearance="primary" isDisabled aria-describedby="home-join-note" />
                    <span id="home-join-note" className="tr-home__note">{`Join opens at ${MATH_7.joinOpensAt}`}</span>
                </div>
            </PatternCard>

            <PatternCard className="tr-home__card tr-home__span-4 tr-home__todo" padding="lg" role="region" aria-labelledby="home-overdue">
                <div className="tr-home__stack">
                    <CardHead id="home-overdue" title="Overdue" end={<StatusTag appearance="warning">{ALGEBRA_1.reflection}</StatusTag>} />
                    <div className="tr-home__overdue">
                        <span className="tr-home__overdue-text">
                            <b>{`Reflect on ${ALGEBRA_1.title}`}</b>
                            <span>{`${ALGEBRA_1.shortDate} session`}</span>
                        </span>
                        <LinkButton to={`/sessions/${ALGEBRA_1.id}/after`} text="Continue reflection" appearance="default" spacing="compact" />
                    </div>
                </div>
                <div className="tr-home__stack tr-home__stack--tight">
                    <CardHead id="home-today" title="Today" end={<span className="tr-home__note">{`${agendaDone} of ${AGENDA.length} done`}</span>} />
                    <Agenda
                        label="Today"
                        linkAs={Link}
                        items={AGENDA.map((a) => ({ ...a, status: a.status ? <StatusTag appearance="info">{a.status}</StatusTag> : undefined }))}
                    />
                </div>
            </PatternCard>

            <PatternCard className="tr-home__card tr-home__span-8" padding="lg" role="region" aria-labelledby="home-students">
                <CardHead id="home-students" title="Your students this week" end={<LinkButton to="/students" text="All students" appearance="subtle" spacing="compact" />} />
                <RevealRows columns="minmax(0, 1fr) 136px 150px 64px" label="Your students">
                    {students.map((s) => (
                        <RevealRow
                            key={s.id}
                            action={<LinkButton to={`/students/${s.id}`} text="Open" appearance="default" spacing="compact" aria-label={`Open ${s.name}`} />}
                        >
                            <span className="tr-home__student">
                                <Avatar initials={s.initials} tone={s.tone} size={32} />
                                <b>{s.name}</b>
                            </span>
                            <Sparkline points={s.practice} domain={[0, 24]} label={`${firstName(s.name)}’s practice minutes, last 7 sessions`} />
                            <span><StatusTag appearance={s.focus.style}>{s.focus.label}</StatusTag></span>
                        </RevealRow>
                    ))}
                </RevealRows>
            </PatternCard>

            <PatternCard className="tr-home__card tr-home__span-4" padding="lg" role="region" aria-labelledby="home-picked">
                <CardHead id="home-picked" title="Picked for you" end={<LinkButton to="/lessons" text="All lessons" appearance="subtle" spacing="compact" />} />
                <Link className="tr-home__pick" to={`/lessons/${PICKED_LESSON.id}`}>
                    <img src={PICKED_LESSON.image} alt="" />
                    <span className="tr-home__pick-title">{PICKED_LESSON.title}</span>
                    <span className="tr-home__pick-meta">
                        <SmartTag subject={PICKED_LESSON.area} />
                        <span>{PICKED_LESSON.duration}</span>
                    </span>
                    <ProgressSteps total={PICKED_LESSON.steps} done={PICKED_LESSON.stepsDone} />
                </Link>
            </PatternCard>
        </AppShell>
    );
};

export default Home;
