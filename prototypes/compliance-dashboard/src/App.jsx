import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { PageLayout } from '@/specs/Universal/Pages';
import { NavTabs, Button } from '@/components';
import RankedOption from './options/RankedOption';
import TrendsOption from './options/TrendsOption';
import HeatmapOption from './options/HeatmapOption';
import RankedTrendsOption from './options/RankedTrendsOption';
import RedesignOption from './v2/RedesignOption';
import ImmediateReviewPage from './pages/ImmediateReviewPage';
import RecordingPage from './pages/RecordingPage';
import SessionSearchPage from './pages/SessionSearchPage';
import RepeatPatternsPage from './pages/RepeatPatternsPage';
import TutorPage from './pages/TutorPage';
import { SEED_DECISIONS, SEED_ANNOTATIONS } from './data';
import {
    buildFlags, makeAddedFlag, statusFor, recordingFor, firstUnitOf, isPatternFlag, unitsOf, unitsOnSession,
} from './v2/audit';
import './App.css';

/**
 * Compliance dashboard prototype.
 *
 * Content follows the Admin page pattern (TutorPerformancePage): tabs row,
 * then a section with an h4 header and the date-range filter.
 * The tabs only switch between the design options under comparison.
 */
const OPTIONS = [
    { key: 'ranked', label: 'Option 1: Ranked', Component: RankedOption },
    { key: 'trends', label: 'Option 2: Trends', Component: TrendsOption },
    { key: 'heatmap', label: 'Option 3: Heatmap', Component: HeatmapOption },
    { key: 'ranked-trends', label: 'Option 4: Ranked over time', Component: RankedTrendsOption },
    { key: 'v2', label: 'v2 (working)', Component: RedesignOption },
];

/** Old comparison versions stay reachable at ?dev=1, out of the study's way. */
const DEV_MODE = new URLSearchParams(window.location.search).has('dev');

const App = () => {
    const [currentTab, setCurrentTab] = useState('v2');
    const [annotations, setAnnotations] = useState(SEED_ANNOTATIONS);

    const recordAnnotation = (id, value) =>
        setAnnotations((a) => ({ ...a, [id]: value }));
    const [view, setView] = useState('overview');
    const [recording, setRecording] = useState(null);
    const [decisions, setDecisions] = useState(SEED_DECISIONS);
    const [tutor, setTutor] = useState(null);
    // Which v2 tab is open, and which tab a tutor page was opened from. Kept here,
    // above the page that unmounts, so "back" returns to the tab you came from.
    const [v2Tab, setV2Tab] = useState('overview');
    const [tutorFromTab, setTutorFromTab] = useState('tutors');

    // A flag's compliance as the supervisor set it, when it differs from the AI's.
    const [relabels, setRelabels] = useState({});
    // Violations supervisors found that the AI didn't flag.
    const [added, setAdded] = useState([]);
    const addedCount = React.useRef(0);
    // Sessions with no AI flag that a supervisor watched and found nothing in —
    // the true negatives in AI diagnosis.
    const [cleanChecks, setCleanChecks] = useState([]);

    const markClean = (recordingFlag) => setCleanChecks((c) => (c.some((x) => x.key === recordingFlag.id)
        ? c
        : [...c, { key: recordingFlag.id, flag: recordingFlag }]));

    // Every flag the screens list — the AI's with relabels applied, plus additions.
    const flags = React.useMemo(() => buildFlags(relabels, added), [relabels, added]);

    const recordDecision = (id, verdict) =>
        setDecisions((d) => ({ ...d, [id]: verdict }));

    /** One submit from the recording page: verdict, compliance, reason and notes. */
    const submitAudit = (id, { verdict, categoryId, aiCategoryId, reason = null, note = '' }) => {
        recordDecision(id, verdict);
        recordAnnotation(id, { reason, note });
        setRelabels((r) => {
            const next = { ...r };
            if (verdict === 'confirmed' && categoryId && categoryId !== aiCategoryId) next[id] = categoryId;
            else delete next[id];
            return next;
        });
    };

    const addViolation = (recordingFlag, { at, categoryId, note, lineText }) => {
        addedCount.current += 1;
        const flag = makeAddedFlag({
            id: `m-${addedCount.current}`, recordingFlag, at, categoryId, note, lineText,
        });
        setAdded((a) => [...a, flag]);
        // A session with a violation in it isn't a clean one any more.
        setCleanChecks((c) => c.filter((x) => x.key !== recordingFlag.id));
        // Found by a person, so it's already a violation — no review needed.
        recordDecision(flag.id, 'confirmed');
    };

    const removeViolation = (id) => {
        setAdded((a) => a.filter((f) => f.id !== id));
        setDecisions((d) => {
            const next = { ...d };
            delete next[id];
            return next;
        });
    };
    const { Component } = OPTIONS.find((o) => o.key === currentTab);

    const onRecording = Boolean(recording);
    // The overview only renders when nothing deeper is open — a recording or a
    // tutor opened from the v2 tabs lives inside view === 'overview'.
    const onOverview = view === 'overview' && !onRecording && !tutor;
    const VIEW_TITLES = {
        immediate: 'Flag review',
        repeat: 'Tutors repeating the same mistake',
        search: 'Find a session',
    };
    const pageTitle = onRecording
        ? `${recording.flag.tutor} · ${recording.flag.session}`
        : tutor ? tutor.name : VIEW_TITLES[view];

    const V2_TAB_LABELS = {
        overview: 'Overview',
        tutors: 'Tutors',
        flags: 'Compliance flags',
        diagnosis: 'AI diagnosis',
    };

    const goToCompliance = (tab) => {
        setRecording(null);
        setTutor(null);
        setView('overview');
        if (tab) setV2Tab(tab);
    };

    /** The v2 tab as a crumb — omitted for Overview, which is the Compliance page itself. */
    const tabCrumb = (tab) => (tab && tab !== 'overview'
        ? [{ text: V2_TAB_LABELS[tab], href: '#', onClick: () => goToCompliance(tab) }]
        : []);

    const crumbs = (() => {
        const root = [
            { text: 'Home', href: '#' },
            { text: 'Compliance', href: '#', onClick: () => goToCompliance('overview') },
        ];
        if (onOverview) return [{ text: 'Home', href: '#' }, { text: 'Compliance' }];

        if (onRecording) {
            if (recording.from === 'v2') return [...root, ...tabCrumb(recording.fromTab), { text: pageTitle }];
            if (recording.from === 'tutor') {
                return [
                    ...root,
                    ...(view === 'overview' ? tabCrumb(tutorFromTab) : []),
                    { text: recording.flag.tutor, href: '#', onClick: () => setRecording(null) },
                    { text: pageTitle },
                ];
            }
            return [
                ...root,
                {
                    text: recording.from === 'search' ? 'Find a session' : 'Flag review',
                    href: '#',
                    onClick: () => setRecording(null),
                },
                { text: pageTitle },
            ];
        }

        if (tutor) {
            return [
                ...root,
                ...(view === 'overview'
                    ? tabCrumb(tutorFromTab)
                    : [{ text: VIEW_TITLES.repeat, href: '#', onClick: () => setTutor(null) }]),
                { text: tutor.name },
            ];
        }
        return [...root, { text: pageTitle }];
    })();

    // "Back" goes to the crumb just before the current page.
    const back = crumbs[crumbs.length - 2];

    /*
     * Scroll position per page. The layout scrolls inside its own <main>, not
     * the window, so the browser never restores it: coming back from a video
     * landed at the top of the overview. Each page's position is kept as you
     * scroll and put back when you return; a page you haven't seen starts at the top.
     */
    const pageKey = onOverview ? `overview:${v2Tab}`
        : onRecording ? `recording:${recording.flag.id}`
            : tutor ? `tutor:${tutor.name}` : `view:${view}`;
    const scrollMemory = useRef({});
    const pageKeyRef = useRef(pageKey);
    useEffect(() => {
        const el = document.querySelector('.plus-page-main');
        if (!el) return undefined;
        const remember = () => { scrollMemory.current[pageKeyRef.current] = el.scrollTop; };
        el.addEventListener('scroll', remember, { passive: true });
        // Also on every click, before React handles it: the click that opens a
        // video is the last moment the old page's position can be read.
        document.addEventListener('click', remember, true);
        return () => {
            el.removeEventListener('scroll', remember);
            document.removeEventListener('click', remember, true);
        };
    }, []);
    useLayoutEffect(() => {
        pageKeyRef.current = pageKey;
        const el = document.querySelector('.plus-page-main');
        if (el) el.scrollTop = scrollMemory.current[pageKey] ?? 0;
    }, [pageKey]);

    /** Open one unit (a flag, or one session of a pattern) on the recording page. */
    const openUnit = (u, from, extra = {}) => {
        const subject = recordingFor(u);
        setRecording({
            flag: { ...subject, duration: subject.duration ?? 1590 },
            category: subject.category,
            from,
            ...extra,
        });
    };

    // A pattern opens on one session: the next one waiting on a verdict, or its latest.
    const openV2Recording = (flag, category, queue, fromTab) => {
        if (isPatternFlag(flag) && !flag.flagId) {
            openUnit(firstUnitOf(flag, decisions), 'v2', { fromTab, queue });
            return;
        }
        setRecording({
            flag: { ...flag, duration: flag.duration ?? 1590 },
            category,
            from: 'v2',
            fromTab,
            queue,
        });
    };

    /**
     * Sessions still waiting on a verdict after this one — what "Submit and
     * next" moves to. From a list: in the list's order, starting after this
     * one and wrapping round, so anything skipped higher up still comes back
     * (AI diagnosis has no list, so every flag, most severe first). From a
     * tutor page: that tutor's sessions, newest first.
     */
    const reviewQueue = () => {
        const current = recording.flag.id;
        const waiting = (u) => !decisions[u.key] && (!u.session || u.session.recording) && u.key !== current;
        if (recording.from === 'tutor' && tutor) {
            const seen = new Set();
            return tutor.sessions
                .flatMap((s) => unitsOnSession(tutor.name, s, flags))
                .filter((u) => waiting(u) && !seen.has(u.key) && seen.add(u.key));
        }
        if (recording.from !== 'v2') return [];
        const reviewable = flags.filter((f) => f.source !== 'supervisor');
        const ids = recording.queue ?? [...reviewable]
            .sort((a, b) => b.severityRank - a.severityRank
                || Number(b.severe) - Number(a.severe)
                || b.latestDate - a.latestDate)
            .map((f) => f.id);
        const units = ids.flatMap((id) => {
            const f = reviewable.find((x) => x.id === id);
            return f?.moments ? unitsOf(f).filter((u) => !u.session || u.session.recording) : [];
        });
        let start = units.findIndex((u) => u.key === current) + 1;
        if (start === 0) {
            const at = ids.indexOf(recording.flag.flagId ?? current);
            start = Math.max(0, units.findIndex((u) => ids.indexOf(u.flag.id) > at));
        }
        return [...units.slice(start), ...units.slice(0, start)].filter(waiting);
    };

    const topBarConfig = React.useMemo(() => ({
        breadcrumbs: crumbs,
        user: { name: 'John Doe', counter: true, counterValue: 2 },
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [onOverview, onRecording, pageTitle, tutor, view, v2Tab, tutorFromTab, recording]);

    const sidebarConfig = React.useMemo(() => ({
        user: 'supervisor',
        activeTab: 'compliance-monitor',
    }), []);

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <PageLayout
                title={onOverview ? 'Compliance' : pageTitle}
                topBarConfig={topBarConfig}
                sidebarConfig={sidebarConfig}
                id="compliance-dashboard-page"
                fullscreen
            >
                <div className="compliance-page__content">
                    {onOverview ? (
                        <>
                            {DEV_MODE && (
                                <div className="compliance-page__tabs">
                                    <NavTabs activeKey={currentTab} onSelect={setCurrentTab}>
                                        {OPTIONS.map((o) => (
                                            <NavTabs.Item key={o.key} eventKey={o.key} active={currentTab === o.key}>
                                                {o.label}
                                            </NavTabs.Item>
                                        ))}
                                    </NavTabs>
                                </div>
                            )}

                            <section className="compliance-page__overview-section">
                                <div className="compliance-page__overview-header">
                                    <h2 className="h4" style={{ color: 'var(--color-on-surface)' }}>
                                        Compliance Overview
                                    </h2>
                                    <div className="compliance-page__header-actions">
                                        <Button
                                            text="Find a session"
                                            style="primary"
                                            fill="outline"
                                            size="small"
                                            leadingVisual="magnifying-glass"
                                            onClick={() => setView('search')}
                                        />
                                    </div>
                                </div>
                                <Component
                                    onOpenImmediate={() => setView('immediate')}
                                    onOpenRepeat={() => setView('repeat')}
                                    decisions={decisions}
                                    annotations={annotations}
                                    flags={flags}
                                    relabels={relabels}
                                    cleanChecks={cleanChecks}
                                    onDecide={recordDecision}
                                    tab={v2Tab}
                                    onTabChange={setV2Tab}
                                    onOpenTutor={(t) => {
                                        setTutorFromTab(v2Tab);
                                        setTutor(t);
                                    }}
                                    onOpenRecording={(flag, category, queue) => openV2Recording(flag, category, queue, v2Tab)}
                                />
                            </section>
                        </>
                    ) : (
                        <section className="compliance-page__overview-section">
                            <div className="compliance-page__overview-header">
                                <h2 className="h4" style={{ color: 'var(--color-on-surface)' }}>
                                    {pageTitle}
                                </h2>
                                <Button
                                    text={`Back to ${back?.text ?? 'Compliance'}`}
                                    style="primary"
                                    fill="outline"
                                    size="medium"
                                    leadingVisual="arrow-left"
                                    onClick={() => (back?.onClick ? back.onClick() : goToCompliance())}
                                />
                            </div>
                            {onRecording ? (
                                <RecordingPage
                                    flag={recording.flag}
                                    category={recording.category}
                                    decision={decisions[recording.flag.id]}
                                    annotation={annotations[recording.flag.id]}
                                    // The compliance the AI chose, and the one the supervisor last saved.
                                    aiCategoryId={recording.flag.aiCategoryId ?? recording.flag.categoryId}
                                    savedCategoryId={relabels[recording.flag.id]
                                        ?? recording.flag.aiCategoryId ?? recording.flag.categoryId}
                                    key={recording.flag.id}
                                    // Submitting keeps you on the page; the next flag is one click away.
                                    onSubmit={(audit) => submitAudit(recording.flag.id, audit)}
                                    added={added.filter((f) => f.transcriptId === (recording.flag.transcriptId ?? recording.flag.id))}
                                    onAddViolation={(v) => addViolation(recording.flag, v)}
                                    onRemoveViolation={removeViolation}
                                    cleanChecked={cleanChecks.some((c) => c.key === recording.flag.id)}
                                    onMarkClean={() => markClean(recording.flag)}
                                    queue={reviewQueue()}
                                    onNext={(next) => openUnit(next, recording.from, {
                                        fromTab: recording.fromTab,
                                        queue: recording.queue,
                                    })}
                                    onBack={() => (back?.onClick ? back.onClick() : goToCompliance())}
                                />
                            ) : tutor ? (
                                <TutorPage
                                    tutor={tutor}
                                    status={statusFor(tutor, flags, decisions, relabels)}
                                    flags={flags}
                                    decisions={decisions}
                                    relabels={relabels}
                                    cleanChecks={cleanChecks}
                                    added={flags.filter((f) => f.source === 'supervisor' && f.tutor === tutor.name)}
                                    onOpenSession={(t, session) => {
                                        const when = `${session.date}, ${session.time}`;
                                        // A flagged session opens on its own verdict — the one still
                                        // waiting if there is one — so it reaches every other screen.
                                        const units = unitsOnSession(t.name, session, flags);
                                        const u = units.find((x) => !decisions[x.key]) ?? units[0];
                                        if (u) {
                                            const subject = recordingFor(u);
                                            setRecording({
                                                flag: { ...subject, session: when, duration: subject.duration ?? 1590 },
                                                category: subject.category,
                                                from: 'tutor',
                                            });
                                            return;
                                        }
                                        setRecording({
                                            flag: {
                                                // Its own id, so nothing here lands on an unrelated AI flag.
                                                id: `s-${session.id}`,
                                                transcriptId: session.transcriptId,
                                                sessionId: session.id,
                                                noAiFlag: true,
                                                tutor: t.name,
                                                session: when,
                                                quote: 'No AI flag on this session.',
                                                confidence: 0,
                                                tag: 'Low',
                                                duration: 1590,
                                            },
                                            category: 'Session review',
                                            from: 'tutor',
                                        });
                                    }}
                                />
                            ) : view === 'search' ? (
                                <SessionSearchPage
                                    onOpenSession={(session) => setRecording({
                                        flag: {
                                            // A flagged session opens on its AI flag; any other on its own id.
                                            id: session.state === 'flagged' && session.transcriptId ? session.transcriptId : `s-${session.id}`,
                                            transcriptId: session.transcriptId,
                                            noAiFlag: !(session.state === 'flagged' && session.transcriptId),
                                            tutor: session.tutor,
                                            session: `${session.date}, ${session.time}`,
                                            quote: 'Opened from session search — no AI flag on this session.',
                                            confidence: 0,
                                            tag: 'Low',
                                            duration: 1590,
                                        },
                                        category: 'Session search',
                                        from: 'search',
                                    })}
                                />
                            ) : view === 'immediate' ? (
                                <ImmediateReviewPage
                                    decisions={decisions}
                                    onDecide={recordDecision}
                                    onOpenRecording={(flag, category) => setRecording({ flag, category })}
                                />
                            ) : (
                                <RepeatPatternsPage onOpenTutor={setTutor} />
                            )}
                        </section>
                    )}
                </div>
            </PageLayout>
        </div>
    );
};

export default App;
