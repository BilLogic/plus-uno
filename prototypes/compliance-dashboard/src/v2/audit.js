import { FLAG_CATEGORIES, FLAG_INSTANCES, REPEAT_TUTORS, THIS_WEEK } from '../data';

/**
 * Audit state, shared by every screen.
 *
 * The app keeps four pieces of state — `decisions` (verdict per unit),
 * `annotations` (reason and notes), `relabels` (the compliance a supervisor
 * moved a unit to) and `added` (violations a supervisor found that the AI
 * didn't). Everything a screen shows is worked out from those here, so a
 * verdict given on a recording reaches the lists, the tutor groups and AI
 * diagnosis without each screen re-deriving it.
 *
 * A *unit* is one thing a supervisor gives a verdict on: one session.
 *  - A single flag (Communication & Conduct, a one-off) is one unit, keyed by its id.
 *  - A pattern flag is one unit per flagged session, keyed `flagId@sessionId`.
 *    The pattern itself has no verdict: it's a violation once confirmed sessions
 *    are more than the threshold share of the tutor's sessions.
 *
 * The charts read FLAG_INSTANCES directly and stay AI-only on purpose.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const THRESHOLD = THIS_WEEK.patternThreshold / 100;

export const categoryById = (id) => FLAG_CATEGORIES.find((c) => c.id === id);

/** Same rule as FLAG_INSTANCES: priority → High, pattern → Medium, one-off → Low. */
const severityOf = (category, isPattern) => {
    if (category.group === 'priority') return { severity: 'High', severityRank: 3 };
    if (isPattern) return { severity: 'Medium', severityRank: 2 };
    return { severity: 'Low', severityRank: 1 };
};

export const severityFor = (categoryId, isPattern) => severityOf(categoryById(categoryId), isPattern).severity;

/** "Sep 15, 1:40–2:30 PM" or "Sep 12, 2026" → a Date (2026). */
const sessionDate = (text = '') => {
    const m = text.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{1,2})/);
    return m ? new Date(2026, MONTHS.indexOf(m[1]), Number(m[2])) : new Date(2026, 8, 15);
};

const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export const tutorSessions = (name) => REPEAT_TUTORS.find((t) => t.name === name)?.sessions ?? [];

/**
 * The sessions behind a pattern flag: the tutor's sessions the AI flagged for
 * that compliance. Sessions without a recording can't be verified, so they
 * stay listed but never wait on anyone.
 */
const OCCURRENCES = Object.fromEntries(FLAG_INSTANCES
    .filter((f) => f.tag === 'Pattern')
    .map((f) => {
        const flagged = tutorSessions(f.tutor).filter((s) => s.flags.includes(f.category));
        return [f.id, flagged.map((s, i) => ({ key: `${f.id}@${s.id}`, session: s, index: i, of: flagged.length }))];
    }));

export const isPatternFlag = (f) => f.tag === 'Pattern' && f.source !== 'supervisor';

/** Every unit of a flag, newest session first. */
export const unitsOf = (f) => {
    if (f.source === 'supervisor') return [{ key: f.id, flag: f }];
    if (isPatternFlag(f)) return (OCCURRENCES[f.id] ?? []).map((o) => ({ ...o, flag: f }));
    return [{ key: f.id, flag: f }];
};

const verifiable = (u) => !u.session || u.session.recording;

/** Units still waiting on a verdict. */
export const openUnitsOf = (f, decisions) => (f.source === 'supervisor'
    ? []
    : unitsOf(f).filter((u) => verifiable(u) && !decisions[u.key]));

/** The compliance a unit counts toward: the supervisor's, if they moved it. */
const effectiveCategory = (u, relabels) => relabels[u.key] ?? u.flag.aiCategoryId ?? u.flag.categoryId;

/**
 * Where a pattern stands from its session verdicts. Its rate is confirmed
 * sessions over all of the tutor's sessions; past the threshold it's a pattern.
 */
export const patternState = (f, decisions, relabels = {}) => {
    const units = unitsOf(f);
    const total = tutorSessions(f.tutor).length || units.length;
    const confirmed = units.filter((u) => decisions[u.key] === 'confirmed'
        && effectiveCategory(u, relabels) === (f.aiCategoryId ?? f.categoryId)).length;
    const dismissed = units.filter((u) => decisions[u.key] === 'dismissed').length;
    const open = openUnitsOf(f, decisions).length;
    const rate = total ? confirmed / total : 0;
    return { units, total, confirmed, dismissed, open, rate, isPattern: rate > THRESHOLD };
};

/**
 * One status for a row in the flags list.
 *  Single flag: its verdict.
 *  Pattern: Violation once past the threshold; otherwise Not reviewed while any
 *  session is waiting; then Below threshold (some confirmed) or Not a violation.
 */
export const flagStatus = (f, decisions, relabels = {}) => {
    if (f.source === 'supervisor') return 'Violation';
    if (!isPatternFlag(f)) {
        const v = decisions[f.id];
        if (v === 'confirmed') return 'Violation';
        if (v === 'dismissed') return 'Not a violation';
        return 'Not reviewed';
    }
    const p = patternState(f, decisions, relabels);
    if (p.isPattern) return 'Violation';
    if (p.open > 0) return 'Not reviewed';
    return p.confirmed > 0 ? 'Below threshold' : 'Not a violation';
};

export const isOpen = (f, decisions) => openUnitsOf(f, decisions).length > 0;

/** "Sep 12, 2026" → "Sep 12". */
const shortDate = (d) => d.replace(/, \d{4}$/, '');

/**
 * The recording page's subject for a unit: the flag, narrowed to one session
 * when it's part of a pattern.
 */
export const recordingFor = (u) => {
    if (!u.session) return { ...u.flag, transcriptId: u.flag.transcriptId ?? u.flag.id };
    const s = u.session;
    return {
        ...u.flag,
        id: u.key,
        flagId: u.flag.id,
        sessionId: s.id,
        transcriptId: s.transcriptId,
        session: `${s.date}, ${s.time}`,
        dateLabel: `${shortDate(s.date)} · ${s.time.split('–')[0]}${/PM|AM/.test(s.time) ? ` ${s.time.match(/(AM|PM)/)[1]}` : ''}`,
        latestDate: sessionDate(s.date),
        patternPosition: `Session ${u.of - u.index} of ${u.of} in this pattern`,
    };
};

/** What opening a flag from a list should show: its next session to verify, or its latest. */
export const firstUnitOf = (f, decisions) => openUnitsOf(f, decisions)[0] ?? unitsOf(f)[0];

/**
 * A violation the supervisor added on a recording, shaped like a flag row.
 * `transcriptId` points at the recording it was found in, so opening it from
 * the list lands on the same video.
 */
export const makeAddedFlag = ({ id, recordingFlag, at, categoryId, note, lineText }) => {
    const category = categoryById(categoryId);
    const latestDate = recordingFlag.latestDate ?? sessionDate(recordingFlag.session);
    const day = `${MONTHS[latestDate.getMonth()]} ${latestDate.getDate()}`;
    return {
        id,
        source: 'supervisor',
        transcriptId: recordingFlag.transcriptId ?? recordingFlag.id,
        sessionId: recordingFlag.sessionId ?? null,
        tutor: recordingFlag.tutor,
        session: recordingFlag.session,
        duration: recordingFlag.duration,
        at,
        lineText: lineText ?? null,
        quote: note || (lineText ? `${lineText}` : `Found at ${fmtTime(at)} in the recording.`),
        note,
        confidence: null,
        tag: 'Added',
        moments: [{ at, flagged: true }],
        categoryId,
        category: category.name,
        group: category.group,
        severe: Boolean(category.severe),
        ...severityOf(category, false),
        basis: 'Added by supervisor',
        occurrences: 1,
        ofSessions: 1,
        latestDate,
        // The moment in the recording, not a clock time — added flags have no session start.
        dateLabel: `${day} · at ${fmtTime(at)}`,
    };
};

/**
 * Every flag the screens list: the AI's, with any relabel applied, then the
 * supervisor's additions. A relabelled single flag keeps what the AI said in
 * `aiCategory`. A pattern's basis counts its flagged sessions against all of
 * the tutor's sessions, from the same session list the tutor page shows.
 */
export const buildFlags = (relabels = {}, added = []) => [
    ...FLAG_INSTANCES.map((f) => {
        let flag = f;
        if (isPatternFlag(f)) {
            const n = (OCCURRENCES[f.id] ?? []).length;
            const total = tutorSessions(f.tutor).length;
            flag = { ...f, occurrences: n, ofSessions: total, basis: `${n} of ${total} sessions` };
        }
        const to = relabels[f.id];
        if (!to || to === f.categoryId) return flag;
        const category = categoryById(to);
        return {
            ...flag,
            categoryId: category.id,
            category: category.name,
            group: category.group,
            severe: Boolean(category.severe),
            ...severityOf(category, f.tag === 'Pattern'),
            aiCategoryId: f.categoryId,
            aiCategory: f.category,
        };
    }),
    ...added,
];

/**
 * What an audit says about the AI, four ways:
 *  right       — flagged, and it was that violation
 *  relabelled  — flagged a real violation, but under the wrong compliance
 *  wrong       — flagged, and it wasn't a violation
 *  missed      — the AI said nothing; the supervisor found it
 */
export const OUTCOMES = {
    right: { label: 'AI was right', tone: 'success' },
    relabelled: { label: 'Wrong compliance', tone: 'warning' },
    wrong: { label: 'AI was wrong', tone: 'danger' },
    missed: { label: 'AI missed it', tone: 'danger' },
    // No flag, and the supervisor who watched it found nothing.
    clean: { label: 'AI was right', tone: 'success' },
};

const outcomeOfUnit = (u, decisions, relabels) => {
    if (u.flag.source === 'supervisor') return 'missed';
    const verdict = decisions[u.key];
    if (!verdict) return null;
    if (verdict === 'dismissed') return 'wrong';
    const moved = (relabels[u.key] && relabels[u.key] !== (u.flag.aiCategoryId ?? u.flag.categoryId))
        || Boolean(u.flag.aiCategory);
    return moved ? 'relabelled' : 'right';
};

/**
 * Every unit with a verdict, as audit rows for AI diagnosis: one per session,
 * so a pattern contributes one audit for each session a supervisor judged.
 */
export const auditUnits = (flags, decisions, relabels = {}, annotations = {}) => flags.flatMap((f) => unitsOf(f)
    .map((u) => ({ u, outcome: outcomeOfUnit(u, decisions, relabels) }))
    .filter(({ outcome }) => outcome)
    .map(({ u, outcome }) => {
        const subject = recordingFor(u);
        const moved = relabels[u.key] && relabels[u.key] !== (f.aiCategoryId ?? f.categoryId)
            ? categoryById(relabels[u.key]) : null;
        return {
            ...subject,
            verdict: decisions[u.key] ?? 'confirmed',
            outcome,
            ...(moved ? { category: moved.name, categoryId: moved.id, aiCategory: f.aiCategory ?? f.category } : {}),
            reason: annotations[u.key]?.reason ?? null,
            note: annotations[u.key]?.note ?? f.note ?? '',
        };
    }));

/**
 * A tutor's group, from session verdicts:
 *  a confirmed Communication & Conduct violation, or any compliance with
 *  confirmed sessions past the threshold        → Check-In Needed
 *  a flagged session still waiting on a verdict  → Verification Needed
 *  everything reviewed, nothing past threshold   → On Track
 * Tutors with no flags this term keep the status they came with.
 */
export const statusFor = (tutor, flags, decisions, relabels = {}) => {
    const mine = flags.filter((f) => f.tutor === tutor.name);
    if (mine.length === 0) return tutor.status;
    const units = mine.flatMap(unitsOf);
    const total = tutorSessions(tutor.name).length;

    const confirmedBy = {};
    units.forEach((u) => {
        const confirmed = u.flag.source === 'supervisor' || decisions[u.key] === 'confirmed';
        if (!confirmed) return;
        const cat = effectiveCategory(u, relabels);
        confirmedBy[cat] = (confirmedBy[cat] ?? 0) + 1;
    });
    if (Object.keys(confirmedBy).some((cat) => categoryById(cat)?.severe)) return 'Check-In Needed';
    if (total && Object.values(confirmedBy).some((n) => n / total > THRESHOLD)) return 'Check-In Needed';

    if (mine.some((f) => isPatternFlag(f) && isOpen(f, decisions))) return 'Verification Needed';
    if (mine.every((f) => !isOpen(f, decisions))) return 'On Track';
    return tutor.status === 'Check-In Needed' ? 'Verification Needed' : tutor.status;
};

/** One tutor's units: reviewed / total and how the reviewed ones went. */
export const tutorReview = (name, flags, decisions) => {
    const units = flags.filter((f) => f.tutor === name && f.source !== 'supervisor')
        .flatMap(unitsOf).filter(verifiable);
    const violations = units.filter((u) => decisions[u.key] === 'confirmed').length;
    const notViolations = units.filter((u) => decisions[u.key] === 'dismissed').length;
    return { total: units.length, reviewed: violations + notViolations, violations, notViolations };
};

/** The units on one of a tutor's sessions — what "Verify" on that session opens. */
export const unitsOnSession = (tutorName, session, flags) => flags
    .filter((f) => f.tutor === tutorName && f.source !== 'supervisor')
    .flatMap(unitsOf)
    .filter((u) => (u.session ? u.session.id === session.id : session.transcriptId === u.flag.id
        && session.flags.includes(u.flag.aiCategory ?? u.flag.category)));
