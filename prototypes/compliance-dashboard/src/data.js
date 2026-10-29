/**
 * Mock compliance data for the overview options.
 * Unit throughout: share of tutors flagged at least once in the week (%),
 * except Communication & Conduct, which is a raw count of flags.
 */

export const TOTAL_TUTORS = 70;

export const WEEKS = ['Jul 27', 'Aug 3', 'Aug 10', 'Aug 17', 'Aug 24', 'Aug 31', 'Sep 7', 'Sep 14'];

/** Weekly share of tutors flagged, oldest → newest. */
export const METRICS = [
    // Each rule moves differently: greetings improving after a reminder, engagement
    // climbing, camera dropping off sharply, coverage spiking in one bad week.
    { id: 'greeting', name: 'Greeting & Transitions', weekly: [46, 44, 41, 33, 30, 31, 34, 38] },
    { id: 'engagement', name: 'Conversational Engagement', weekly: [14, 17, 19, 24, 23, 28, 25, 27] },
    { id: 'camera', name: 'Camera On', weekly: [31, 29, 30, 24, 17, 15, 16, 19] },
    { id: 'non-compliance', name: 'Student Non-Compliance', weekly: [8, 11, 10, 18, 22, 19, 12, 16] },
    { id: 'rotation', name: 'Rotation Patterns', weekly: [19, 15, 9, 10, 14, 12, 7, 11] },
    { id: 'coverage', name: 'Assigned Student Coverage', weekly: [4, 6, 13, 5, 4, 9, 8, 7] },
];

export const CONDUCT = {
    id: 'conduct',
    name: 'Communication & Conduct',
    weeklyFlags: [0, 1, 4, 1, 0, 3, 1, 2],
    highSeverityThisWeek: 1,
};

export const THIS_WEEK = {
    sessionsReviewed: 412,
    sessionsTotal: 480,
    tutorsFlagged: 23,
    /** Severe conduct flags: acted on individually, no pattern needed. */
    needsImmediateReview: 2,
    /** Tutors whose repeat flags on one metric crossed the pattern threshold. */
    tutorsPastPatternThreshold: 5,
    /** Share of a tutor's sessions flagged on one metric that counts as a pattern. */
    patternThreshold: 25,
};

/**
 * Flags awaiting a decision, by category.
 *
 * `group: 'priority'` is the set supervisors said they care about most;
 * `group: 'other'` is everything else. Conduct is the only category acted on
 * flag by flag — the rest arrive as patterns.
 */
export const FLAG_GROUPS = [
    { id: 'priority', name: 'Priority' },
    { id: 'other', name: 'Other' },
];

export const FLAG_CATEGORIES = [
    {
        id: 'conduct',
        group: 'priority',
        name: 'Communication & Conduct',
        /** The only category acted on from a single flag — marked severe in the UI. */
        severe: true,
        flags: [
            {
                id: 'f-1042',
                tutor: 'Owen Hartley',
                tag: 'High',
                tone: 'danger',
                session: 'Sep 15, 1:40–2:30 PM',
                quote: 'Dismissive language toward a student who asked for help twice.',
                confidence: 0.86,
                duration: 1590,
                moments: [
                    { at: 848, line: 'Tutor: "I already explained this. Are you even trying?"', flagged: true },
                    { at: 912, line: 'Student: "Sorry, I just don\'t get step three."', flagged: false },
                    { at: 1104, line: 'Tutor: "Figure it out, I have other students."', flagged: true },
                ],
            },
            {
                id: 'f-1039',
                tutor: 'Anika Morrow',
                tag: 'High',
                tone: 'danger',
                session: 'Sep 14, 10:05–10:55 AM',
                quote: '"You should know this by now" said twice during one breakout visit.',
                confidence: 0.72,
                duration: 1402,
                moments: [
                    { at: 402, line: 'Tutor: "You should know this by now."', flagged: true },
                    { at: 655, line: 'Tutor: "We covered this last week — you should know this by now."', flagged: true },
                ],
            },
        ],
    },
    {
        id: 'greeting',
        group: 'priority',
        name: 'Greeting & Transitions',
        flags: [
            {
                id: 'f-1031',
                firstFlagged: 'Sep 1',
                tutor: 'Laura Benning',
                tag: 'Pattern',
                tone: 'warning',
                session: '6 of 14 sessions · latest Sep 15',
                quote: 'Left breakout rooms without a verbal or chat transition signal.',
                confidence: 0.81,
                duration: 1498,
                moments: [{ at: 612, flagged: true }, { at: 1210, flagged: true }],
            },
            {
                id: 'f-1024',
                firstFlagged: 'Aug 25',
                tutor: 'Devon Marsh',
                tag: 'Pattern',
                tone: 'warning',
                session: '4 of 11 sessions · latest Sep 12',
                quote: 'No greeting on the first visit to an assigned student.',
                confidence: 0.77,
                duration: 1404,
                moments: [{ at: 95, flagged: true }],
            },
        ],
    },
    {
        id: 'engagement',
        group: 'priority',
        name: 'Conversational Engagement',
        flags: [
            {
                id: 'f-1028',
                firstFlagged: 'Sep 9',
                tutor: 'Anika Morrow',
                tag: 'Pattern',
                tone: 'warning',
                session: '5 of 16 sessions · latest Sep 14',
                quote: 'No audio or chat activity for 3+ minutes during a breakout visit.',
                confidence: 0.69,
                duration: 1560,
                moments: [{ at: 740, flagged: true }],
            },
            {
                id: 'f-1033',
                firstFlagged: 'Sep 3',
                tutor: 'Laura Benning',
                tag: 'Pattern',
                tone: 'warning',
                session: '2 of 8 sessions · latest Sep 12',
                quote: 'No audio or chat activity for 3+ minutes while a student was waiting.',
                confidence: 0.64,
                duration: 1500,
                moments: [{ at: 650, flagged: true }],
            },
        ],
    },
    {
        id: 'camera',
        group: 'other',
        name: 'Camera On',
        flags: [
            {
                id: 'f-1019',
                firstFlagged: 'Sep 2',
                tutor: 'Priya Raman',
                tag: 'Pattern',
                tone: 'warning',
                session: '7 of 15 sessions · latest Sep 15',
                quote: 'Camera off for the full breakout period, no technical issue reported.',
                confidence: 0.9,
                duration: 1515,
                moments: [{ at: 180, flagged: true }],
            },
        ],
    },
    {
        id: 'non-compliance',
        group: 'other',
        name: 'Student Non-Compliance',
        flags: [
            {
                id: 'f-1012',
                firstFlagged: 'Aug 25',
                tutor: 'Devon Marsh',
                tag: 'Pattern',
                tone: 'warning',
                session: '4 of 11 sessions · latest Sep 11',
                quote: 'Student idle 5+ minutes with no prompt from the tutor.',
                confidence: 0.74,
                duration: 1450,
                moments: [{ at: 905, flagged: true }],
            },
        ],
    },
    {
        id: 'attendance',
        group: 'priority',
        name: 'Session Attendance',
        flags: [
            {
                id: 'f-1047',
                firstFlagged: 'Sep 12',
                tutor: 'Marcus Webb',
                tag: 'Pattern',
                tone: 'warning',
                session: '3 of 9 sessions · latest Sep 16',
                quote: 'Joined for under 2 minutes total, then left the session.',
                confidence: 0.94,
                duration: 1500,
                moments: [{ at: 70, flagged: true }],
            },
        ],
    },
    {
        id: 'rotation',
        group: 'other',
        name: 'Rotation Patterns',
        flags: [
            {
                id: 'f-1051',
                tutor: 'Avery Nguyen',
                tag: 'Single',
                tone: 'secondary',
                session: 'Sep 16, 2:25–3:15 PM',
                quote: 'Visited students out of the suggested order for the whole session.',
                confidence: 0.64,
                duration: 1500,
                moments: [{ at: 420, flagged: true }],
            },
        ],
    },
    {
        id: 'coverage',
        group: 'other',
        name: 'Assigned Student Coverage',
        flags: [
            {
                id: 'f-1053',
                tutor: 'Jordan Nguyen',
                tag: 'Single',
                tone: 'secondary',
                session: 'Sep 15, 10:05–10:55 AM',
                quote: 'One assigned student stayed in the main room for 7 minutes.',
                confidence: 0.79,
                duration: 1500,
                moments: [{ at: 310, flagged: true }],
            },
        ],
    },
];

export const latest = (arr) => arr[arr.length - 1];
export const previous = (arr) => arr[arr.length - 2];

/**
 * Full session transcripts for the two conduct flags.
 *
 * Lines the AI flagged carry `flagged: true` and the metric it matched.
 * Everything else is ordinary session talk — the context a supervisor needs
 * to judge whether the flagged line was actually a violation.
 */
const line = (at, speaker, text, flagged = false) => ({ at, speaker, text, flagged });

export const TRANSCRIPTS = {
    'f-1042': [
        line(0, 'Tutor', 'Alright, joining the room now. Give me one second.'),
        line(42, 'Tutor', 'Hey Ezra, hey Milo. Can you both hear me okay?'),
        line(61, 'Ezra', 'Yeah, we can hear you.'),
        line(95, 'Tutor', "Great. Let's start with the warm-up set on page two."),
        line(190, 'Milo', 'I finished the first three already.'),
        line(214, 'Tutor', 'Nice work. Ezra, how far did you get?'),
        line(243, 'Ezra', "I'm stuck on the second one."),
        line(268, 'Tutor', 'Okay, walk me through what you tried.'),
        line(455, 'Ezra', 'I multiplied both sides but the fraction is still there.'),
        line(480, 'Tutor', 'Right, so what cancels the denominator?'),
        line(690, 'Ezra', "I don't know, that's why I'm asking."),
        line(742, 'Tutor', 'We went through this on Tuesday.'),
        line(800, 'Ezra', 'I know, I just forgot the step.'),
        line(848, 'Tutor', '"I already explained this. Are you even trying?"', true),
        line(880, 'Ezra', '...'),
        line(912, 'Ezra', "Sorry, I just don't get step three."),
        line(960, 'Tutor', 'Look at the example again.'),
        line(1020, 'Milo', 'I can show him how I did it?'),
        line(1058, 'Tutor', 'Sure, go ahead.'),
        line(1104, 'Tutor', '"Figure it out, I have other students."', true),
        line(1160, 'Ezra', 'Okay.'),
        line(1245, 'Tutor', "I'm rotating to the next room. Keep working."),
        line(1400, 'Milo', 'Did you get it?'),
        line(1470, 'Ezra', 'Kind of.'),
        line(1560, 'Tutor', "Time's up everyone, good work today."),
    ],
    'f-1039': [
        line(0, 'Tutor', 'Good morning, everyone. Starting the timer now.'),
        line(55, 'Tutor', 'Nora, how did the practice set go?'),
        line(88, 'Nora', 'I got through half of it.'),
        line(150, 'Tutor', "Let's look at the ones you skipped."),
        line(290, 'Nora', 'This one with the exponents.'),
        line(330, 'Tutor', 'What does a negative exponent mean again?'),
        line(370, 'Nora', 'Um... flip it?'),
        line(402, 'Tutor', '"You should know this by now."', true),
        line(430, 'Nora', "I do, I just wasn't sure about the negative."),
        line(480, 'Tutor', 'Okay. Flip the base and drop the sign.'),
        line(560, 'Nora', 'So it becomes one over x squared.'),
        line(590, 'Tutor', 'Correct.'),
        line(655, 'Tutor', '"We covered this last week — you should know this by now."', true),
        line(700, 'Nora', 'Got it.'),
        line(820, 'Tutor', 'Try the next two on your own.'),
        line(1010, 'Nora', 'Done with both.'),
        line(1080, 'Tutor', 'Good. Check your signs on the second one.'),
        line(1290, 'Tutor', "That's time. See you Thursday."),
    ],
};

/**
 * Every session a supervisor can look up, flagged or not.
 *
 * `state` is what the pipeline did, and the three values are not the same
 * thing to someone investigating a report:
 *   flagged       — analysed, the AI raised something
 *   clean         — analysed, the AI raised nothing
 *   not-processed — no transcript yet, so the AI has said nothing at all
 * `transcriptId` links to TRANSCRIPTS when one exists.
 */

export const SESSIONS = [
    { id: 's-901', date: 'Sep 16, 2026', time: '1:40–2:30 PM', tutor: 'Marcus Webb', students: ['Aaliyah R.', 'Dane P.'], state: 'flagged', flags: 1, recording: true },
    { id: 's-899', date: 'Sep 15, 2026', time: '1:40–2:30 PM', tutor: 'Owen Hartley', students: ['Ezra M.', 'Milo G.'], state: 'flagged', flags: 2, recording: true, transcriptId: 'f-1042' },
    { id: 's-897', date: 'Sep 15, 2026', time: '10:05–10:55 AM', tutor: 'Priya Raman', students: ['Jalen B.', 'Sofia M.'], state: 'flagged', flags: 1, recording: true },
    { id: 's-894', date: 'Sep 14, 2026', time: '10:05–10:55 AM', tutor: 'Anika Morrow', students: ['Nora V.', 'Ava D.'], state: 'flagged', flags: 1, recording: true, transcriptId: 'f-1039' },
    { id: 's-892', date: 'Sep 14, 2026', time: '2:25–3:15 PM', tutor: 'Laura Benning', students: ['Theo R.', 'Caleb W.'], state: 'clean', flags: 0, recording: true },
    { id: 's-889', date: 'Sep 12, 2026', time: '1:40–2:30 PM', tutor: 'Devon Marsh', students: ['Darius N.', 'Felix O.'], state: 'clean', flags: 0, recording: true },
    { id: 's-886', date: 'Sep 11, 2026', time: '2:25–3:15 PM', tutor: 'Owen Hartley', students: ['Ezra M.', 'Leo S.'], state: 'clean', flags: 0, recording: true, transcriptId: 'c-886' },
    { id: 's-884', date: 'Sep 11, 2026', time: '10:05–10:55 AM', tutor: 'Marcus Webb', students: ['Aaliyah R.'], state: 'not-processed', flags: 0, recording: true },
    { id: 's-881', date: 'Sep 10, 2026', time: '1:40–2:30 PM', tutor: 'Laura Benning', students: ['Theo R.', 'Imani F.'], state: 'clean', flags: 0, recording: true, transcriptId: 'c-881' },
    { id: 's-878', date: 'Sep 9, 2026', time: '2:25–3:15 PM', tutor: 'Anika Morrow', students: ['Lila K.', 'Ava D.'], state: 'not-processed', flags: 0, recording: false },
    { id: 's-875', date: 'Sep 8, 2026', time: '1:40–2:30 PM', tutor: 'Priya Raman', students: ['Sofia M.', 'Jalen B.'], state: 'clean', flags: 0, recording: true },
    { id: 's-872', date: 'Sep 8, 2026', time: '10:05–10:55 AM', tutor: 'Devon Marsh', students: ['Darius N.'], state: 'flagged', flags: 1, recording: true },
];

/**
 * Tutors whose repeat flags crossed the pattern threshold.
 *
 * `patterns[].flagged / of` is the rate that put them here; `sessions` is the
 * tutor's full history, flagged and clean, so a supervisor can see the spread
 * rather than only the hits.
 */
export const REPEAT_TUTORS = [
    {
        id: 't-01',
        name: 'Laura Benning',
        status: 'Check-In Needed',
        since: 'Aug 18, 2026',
        patterns: [
            { metric: 'Greeting & Transitions', flagged: 6, of: 14, confirmed: 1, dismissed: 0 },
            { metric: 'Conversational Engagement', flagged: 4, of: 14, confirmed: 0, dismissed: 1 },
        ],
        sessions: [
            { id: 'ts-1', date: 'Sep 15, 2026', time: '2:25–3:15 PM', students: ['Theo R.', 'Caleb W.'], flags: ['Greeting & Transitions'], recording: true, transcriptId: 'f-1031' },
            { id: 'ts-2', date: 'Sep 12, 2026', time: '1:40–2:30 PM', students: ['Theo R.', 'Imani F.'], flags: ['Greeting & Transitions', 'Conversational Engagement'], recording: true, transcriptId: 'c-ts-2' },
            { id: 'ts-3', date: 'Sep 10, 2026', time: '2:25–3:15 PM', students: ['Caleb W.'], flags: [], recording: true },
            { id: 'ts-4', date: 'Sep 8, 2026', time: '1:40–2:30 PM', students: ['Theo R.', 'Caleb W.'], flags: ['Greeting & Transitions'], recording: true },
            { id: 'ts-5', date: 'Sep 5, 2026', time: '2:25–3:15 PM', students: ['Imani F.'], flags: [], recording: true },
            { id: 'ts-6', date: 'Sep 3, 2026', time: '1:40–2:30 PM', students: ['Theo R.'], flags: ['Conversational Engagement'], recording: true },
            { id: 'ts-7', date: 'Sep 1, 2026', time: '2:25–3:15 PM', students: ['Caleb W.', 'Imani F.'], flags: ['Greeting & Transitions'], recording: false },
            { id: 'ts-8', date: 'Aug 29, 2026', time: '1:40–2:30 PM', students: ['Theo R.'], flags: [], recording: true },
        ],
    },
    {
        id: 't-02',
        name: 'Devon Marsh',
        status: 'Verification Needed',
        since: 'Aug 25, 2026',
        patterns: [
            { metric: 'Greeting & Transitions', flagged: 4, of: 11, confirmed: 2, dismissed: 0 },
            { metric: 'Student Non-Compliance', flagged: 4, of: 11, confirmed: 0, dismissed: 0 },
        ],
        sessions: [
            { id: 'td-1', date: 'Sep 12, 2026', time: '1:40–2:30 PM', students: ['Darius N.', 'Felix O.'], flags: ['Greeting & Transitions'], recording: true },
            { id: 'td-2', date: 'Sep 11, 2026', time: '10:05–10:55 AM', students: ['Darius N.'], flags: ['Student Non-Compliance'], recording: true },
            { id: 'td-3', date: 'Sep 10, 2026', time: '1:40–2:30 PM', students: ['Darius N.', 'Felix O.'], flags: [], recording: true },
            { id: 'td-4', date: 'Sep 8, 2026', time: '10:05–10:55 AM', students: ['Darius N.'], flags: ['Greeting & Transitions'], recording: true },
            { id: 'td-5', date: 'Sep 5, 2026', time: '1:40–2:30 PM', students: ['Darius N.', 'Felix O.'], flags: [], recording: true },
            { id: 'td-6', date: 'Sep 3, 2026', time: '10:05–10:55 AM', students: ['Darius N.'], flags: ['Student Non-Compliance'], recording: true },
            { id: 'td-7', date: 'Sep 1, 2026', time: '1:40–2:30 PM', students: ['Darius N.', 'Felix O.'], flags: ['Greeting & Transitions'], recording: false },
            { id: 'td-8', date: 'Aug 27, 2026', time: '10:05–10:55 AM', students: ['Darius N.'], flags: ['Greeting & Transitions'], recording: true },
        ],
    },
    {
        id: 't-03',
        name: 'Priya Raman',
        status: 'Check-In Needed',
        since: 'Sep 2, 2026',
        patterns: [{ metric: 'Camera On', flagged: 7, of: 15, confirmed: 3, dismissed: 1 }],
        sessions: [
            { id: 'tp-1', date: 'Sep 15, 2026', time: '10:05–10:55 AM', students: ['Jalen B.', 'Sofia M.'], flags: ['Camera On'], recording: true },
            { id: 'tp-2', date: 'Sep 12, 2026', time: '1:40–2:30 PM', students: ['Jalen B.', 'Sofia M.'], flags: ['Camera On'], recording: true },
            { id: 'tp-3', date: 'Sep 10, 2026', time: '10:05–10:55 AM', students: ['Jalen B.', 'Sofia M.'], flags: [], recording: true },
            { id: 'tp-4', date: 'Sep 8, 2026', time: '1:40–2:30 PM', students: ['Jalen B.', 'Sofia M.'], flags: [], recording: true },
            { id: 'tp-5', date: 'Sep 5, 2026', time: '10:05–10:55 AM', students: ['Jalen B.', 'Sofia M.'], flags: ['Camera On'], recording: true },
            { id: 'tp-6', date: 'Sep 3, 2026', time: '1:40–2:30 PM', students: ['Jalen B.', 'Sofia M.'], flags: ['Camera On'], recording: true },
            { id: 'tp-7', date: 'Sep 2, 2026', time: '10:05–10:55 AM', students: ['Jalen B.', 'Sofia M.'], flags: ['Camera On'], recording: false },
            { id: 'tp-8', date: 'Aug 29, 2026', time: '1:40–2:30 PM', students: ['Jalen B.', 'Sofia M.'], flags: [], recording: true },
        ],
    },
    {
        id: 't-04',
        name: 'Anika Morrow',
        status: 'On Track',
        since: 'Sep 9, 2026',
        patterns: [{ metric: 'Conversational Engagement', flagged: 5, of: 16, confirmed: 0, dismissed: 2 }],
        sessions: [
            { id: 'tn-1', date: 'Sep 14, 2026', time: '10:05–10:55 AM', students: ['Nora V.', 'Ava D.'], flags: ['Communication & Conduct', 'Conversational Engagement'], recording: true },
            { id: 'tn-2', date: 'Sep 12, 2026', time: '2:25–3:15 PM', students: ['Nora V.', 'Ava D.'], flags: ['Conversational Engagement'], recording: true },
            { id: 'tn-3', date: 'Sep 9, 2026', time: '2:25–3:15 PM', students: ['Lila K.', 'Ava D.'], flags: [], recording: false },
            { id: 'tn-4', date: 'Sep 7, 2026', time: '10:05–10:55 AM', students: ['Nora V.', 'Ava D.'], flags: ['Conversational Engagement'], recording: true },
            { id: 'tn-5', date: 'Sep 4, 2026', time: '2:25–3:15 PM', students: ['Nora V.', 'Ava D.'], flags: [], recording: true },
            { id: 'tn-6', date: 'Sep 2, 2026', time: '10:05–10:55 AM', students: ['Nora V.', 'Ava D.'], flags: ['Conversational Engagement'], recording: true },
            { id: 'tn-7', date: 'Aug 29, 2026', time: '2:25–3:15 PM', students: ['Nora V.', 'Ava D.'], flags: [], recording: true },
        ],
    },
    {
        id: 't-05',
        name: 'Marcus Webb',
        status: 'Verification Needed',
        since: 'Sep 12, 2026',
        patterns: [{ metric: 'Session Attendance', flagged: 3, of: 9, confirmed: 1, dismissed: 0 }],
        sessions: [
            { id: 'tm-1', date: 'Sep 16, 2026', time: '1:40–2:30 PM', students: ['Aaliyah R.', 'Dane P.'], flags: ['Session Attendance'], recording: true },
            { id: 'tm-2', date: 'Sep 11, 2026', time: '10:05–10:55 AM', students: ['Aaliyah R.'], flags: [], recording: true },
            { id: 'tm-3', date: 'Sep 9, 2026', time: '1:40–2:30 PM', students: ['Aaliyah R.', 'Dane P.'], flags: [], recording: true },
            { id: 'tm-4', date: 'Sep 4, 2026', time: '1:40–2:30 PM', students: ['Aaliyah R.', 'Dane P.'], flags: ['Session Attendance'], recording: true },
            { id: 'tm-5', date: 'Sep 2, 2026', time: '10:05–10:55 AM', students: ['Aaliyah R.'], flags: [], recording: true },
            { id: 'tm-6', date: 'Aug 28, 2026', time: '1:40–2:30 PM', students: ['Aaliyah R.', 'Dane P.'], flags: [], recording: false },
            { id: 'tm-7', date: 'Aug 26, 2026', time: '10:05–10:55 AM', students: ['Aaliyah R.'], flags: [], recording: true },
        ],
    },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Sep 1" + "Sep 15" → "Sep 1 – 15"; across months → "Aug 25 – Sep 12". */
function dateRange(first, last) {
    if (!first || !last) return last ?? first ?? '';
    const [m1, d1] = first.split(' ');
    const [m2, d2] = last.split(' ');
    return m1 === m2 ? `${m1} ${d1} – ${d2}` : `${first} – ${last}`;
}

/** "Sep 15, 1:40–2:30 PM" or "6 of 14 sessions · latest Sep 15" → a Date. */
function flagDate(f) {
    const m = f.session.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{1,2})/);
    return m ? new Date(2026, MONTHS.indexOf(m[1]), Number(m[2])) : new Date(0);
}

/**
 * One flat list of flag instances — the shape the v2 screens filter over.
 * Category and group become attributes of a row, not places a row lives.
 */
export const FLAG_INSTANCES = FLAG_CATEGORIES.flatMap((c) =>
    c.flags.map((f) => ({
        ...f,
        categoryId: c.id,
        category: c.name,
        group: c.group,
        severe: Boolean(c.severe),
        /** Severity is a conduct judgement; basis is how the flag was reached. */
        /**
         * High: any flag in a priority compliance. Medium: an established pattern
         * elsewhere. Low: a one-off that hasn't become a pattern yet.
         */
        severity: c.group === 'priority' ? 'High' : f.tag === 'Pattern' ? 'Medium' : 'Low',
        basis: f.tag === 'Pattern' ? f.session.split(' · ')[0] : 'Single session',
        /** How many times it happened: a pattern's "6 of 14" is six occurrences. */
        occurrences: f.tag === 'Pattern' ? Number(f.session.split(' ')[0]) : 1,
        ofSessions: f.tag === 'Pattern' ? Number(f.session.split(' ')[2]) : 1,
        when: f.tag === 'Pattern' ? (f.session.split(' · ')[1] ?? '') : f.session,
        /** Most recent session date, for sorting by recency. */
        latestDate: flagDate(f),
        /**
         * For the Date column, on one line: the session for a single flag, the
         * span of flagged sessions for a pattern ("Sep 1 – 15", "Aug 25 – Sep 12").
         */
        dateLabel: f.tag === 'Pattern'
            ? dateRange(f.firstFlagged, f.session.match(/latest (.+)$/)?.[1])
            : `${f.session.split(', ')[0]} · ${(f.session.split(', ')[1] ?? '').split('–')[0]}${/PM|AM/.test(f.session) ? ` ${f.session.match(/(AM|PM)/)[1]}` : ''}`,
        /** Severity rank for sorting: High, then Low, then patterns (no severity). */
        severityRank: c.group === 'priority' ? 3 : f.tag === 'Pattern' ? 2 : 1,
    })));

/** Assumptions shown on screen until Bill settles them. */
export const ASSUMPTIONS = [
    'Showing only your assigned tutors (70 of 300)',
    'Reviews = flags still open · Audited = flags already decided',
    'Compliance is its own tab, separate from Admin › Tutors',
];

/**
 * Why a supervisor disagreed with the AI, grouped by the part of the pipeline
 * that would have to change — so each group points a developer somewhere.
 */
export const REASON_GROUPS = [
    {
        id: 'transcript',
        name: 'Transcript error',
        fix: 'Speech-to-text or speaker labelling',
        reasons: [
            'Wrong tutor or student identified',
            'Words misheard or missing',
            'Timestamp does not match',
        ],
    },
    {
        id: 'video',
        name: 'Video error',
        fix: 'What the system reads from the screen',
        reasons: [
            'Camera or screen state misread',
            'Recording incomplete or cut off',
        ],
    },
    {
        id: 'judgement',
        name: 'AI judgement error',
        fix: 'The model\'s reasoning or prompt — the facts were right, the call was not',
        reasons: [
            'Context makes it acceptable',
            'Student absent or disengaged',
            'Tutor responded in chat',
            'Claimed something that did not happen',
        ],
    },
    {
        id: 'rule',
        name: 'Rule mismatch',
        fix: 'The compliance rubric itself',
        reasons: [
            'Wrong compliance matched',
            'Below the rule\'s threshold',
        ],
    },
    {
        id: 'other',
        name: 'Other',
        fix: 'Read the note',
        reasons: ['Other'],
    },
];

/** Flat list, for anything that only needs the reasons. */
export const REASON_CODES = REASON_GROUPS.flatMap((g) => g.reasons);

/** Which group a reason belongs to. */
export const reasonGroupOf = (reason) => REASON_GROUPS.find((g) => g.reasons.includes(reason));

/** Weekly flag counts per metric — the stacked view of where flags come from. */
export const WEEKLY_BY_METRIC = METRICS.map((m) => ({
    name: m.name,
    data: m.weekly.map((pct) => Math.round((pct / 100) * TOTAL_TUTORS)),
}));

/** Flags per tutor, highest first — "who has the most problems right now". */
export const TUTOR_FLAG_COUNTS = REPEAT_TUTORS
    .map((t) => ({
        name: t.name,
        flags: t.patterns.reduce((n, p) => n + p.flagged, 0),
    }))
    .sort((a, b) => b.flags - a.flags);

/**
 * Per compliance this week: the share of tutors flagged, and the volume behind it.
 *
 * Conduct is counted in occurrences because each one is acted on; the rest are
 * only acted on once they repeat, so their volume is "tutors over the threshold".
 */
export const COMPLIANCE_SUMMARY = [
    {
        id: 'conduct',
        name: CONDUCT.name,
        severe: true,
        countsOccurrences: true,
        pctTutors: Math.round((latest(CONDUCT.weeklyFlags) / TOTAL_TUTORS) * 100),
        tutors: latest(CONDUCT.weeklyFlags),
        occurrences: latest(CONDUCT.weeklyFlags),
        patternTutors: 0,
    },
    ...METRICS.map((m) => ({
        id: m.id,
        name: m.name,
        severe: false,
        countsOccurrences: false,
        pctTutors: latest(m.weekly),
        tutors: Math.round((latest(m.weekly) / 100) * TOTAL_TUTORS),
        occurrences: null,
        patternTutors: REPEAT_TUTORS.filter((t) => t.patterns.some((p) => p.metric === m.name)).length,
    })),
].sort((a, b) => b.pctTutors - a.pctTutors);

/** Tutors worth a conversation, with what they were flagged for. */
export const TUTORS_TO_TALK_TO = Object.values(
    FLAG_INSTANCES.reduce((acc, f) => {
        acc[f.tutor] = acc[f.tutor] ?? { name: f.tutor, total: 0, severe: false, breakdown: [] };
        acc[f.tutor].total += f.occurrences;
        acc[f.tutor].severe = acc[f.tutor].severe || f.severe;
        acc[f.tutor].breakdown.push({ name: f.category, n: f.occurrences, basis: f.basis });
        return acc;
    }, {}),
).sort((a, b) => b.total - a.total);

/** Weekly flag counts per compliance, for the over-time chart. */
export const WEEKLY_BY_COMPLIANCE = [
    { id: 'conduct', name: CONDUCT.name, data: [...CONDUCT.weeklyFlags] },
    ...METRICS.map((m) => ({
        id: m.id,
        name: m.name,
        data: m.weekly.map((pct) => Math.round((pct / 100) * TOTAL_TUTORS)),
    })),
];

/**
 * What happened to the flags raised each week: decided a violation, dismissed,
 * or still waiting. Answers "am I keeping up, and is the AI worth the time".
 */
export const WEEKLY_RESOLUTION = [
    { week: 'Jul 27', violation: 5, notViolation: 3, notReviewed: 0 },
    { week: 'Aug 3', violation: 4, notViolation: 4, notReviewed: 0 },
    { week: 'Aug 10', violation: 6, notViolation: 2, notReviewed: 0 },
    { week: 'Aug 17', violation: 3, notViolation: 5, notReviewed: 1 },
    { week: 'Aug 24', violation: 5, notViolation: 3, notReviewed: 1 },
    { week: 'Aug 31', violation: 4, notViolation: 2, notReviewed: 2 },
    { week: 'Sep 7', violation: 3, notViolation: 3, notReviewed: 3 },
    { week: 'Sep 14', violation: 1, notViolation: 1, notReviewed: 6 },
];

/**
 * Every week of compliance data, oldest first.
 *
 * `null` is a break week with no sessions — not a week with no flags. The last
 * week is still being processed, so its counts are incomplete.
 */
export const HISTORY_WEEKS = ["Apr 6", "Apr 13", "Apr 20", "Apr 27", "May 4", "May 11", "May 18", "May 25", "Jun 1", "Jun 8", "Jun 15", "Jun 22", "Jun 29", "Jul 6", "Jul 13", "Jul 20", "Jul 27", "Aug 3", "Aug 10", "Aug 17", "Aug 24", "Aug 31", "Sep 7", "Sep 14"];
export const BREAK_WEEKS = ["Jun 15", "Jun 8"];
export const IN_PROGRESS_WEEK = "Sep 14";
export const HISTORY_BY_COMPLIANCE = [
    { id: 'conduct', name: CONDUCT.name, data: [2, 0, 1, 3, 0, 1, 2, 1, 1, null, null, 0, 2, 1, 0, 1, 0, 1, 4, 1, 0, 3, 1, 2] },
    { id: 'greeting', name: METRICS.find((m) => m.id === 'greeting').name, data: [36, 38, 35, 34, 33, 36, 34, 32, 31, null, null, 34, 33, 32, 32, 33, 32, 31, 29, 23, 21, 22, 24, 27] },
    { id: 'engagement', name: METRICS.find((m) => m.id === 'engagement').name, data: [15, 13, 13, 15, 14, 12, 11, 10, 9, null, null, 8, 10, 10, 9, 10, 10, 12, 13, 17, 16, 20, 18, 19] },
    { id: 'camera', name: METRICS.find((m) => m.id === 'camera').name, data: [13, 14, 15, 18, 19, 18, 20, 22, 23, null, null, 21, 20, 22, 21, 22, 22, 20, 21, 17, 12, 10, 11, 13] },
    { id: 'non-compliance', name: METRICS.find((m) => m.id === 'non-compliance').name, data: [8, 7, 9, 8, 6, 6, 7, 5, 6, null, null, 4, 6, 5, 6, 6, 6, 8, 7, 13, 15, 13, 8, 11] },
    { id: 'rotation', name: METRICS.find((m) => m.id === 'rotation').name, data: [17, 15, 18, 15, 16, 14, 15, 13, 13, null, null, 15, 14, 13, 13, 14, 13, 10, 6, 7, 10, 8, 5, 8] },
    { id: 'coverage', name: METRICS.find((m) => m.id === 'coverage').name, data: [6, 6, 5, 7, 6, 4, 5, 4, 4, null, null, 3, 4, 4, 3, 4, 3, 4, 9, 4, 3, 6, 6, 5] },
];

/** Eight-week windows, newest first — the readable limit for a stacked chart. */
export const HISTORY_WINDOWS = (() => {
    const out = [];
    for (let end = HISTORY_WEEKS.length; end > 0; end -= 8) {
        const start = Math.max(0, end - 8);
        out.push({
            start,
            end,
            label: `${HISTORY_WEEKS[start]} – ${HISTORY_WEEKS[end - 1]}`,
        });
    }
    return out;
})();

/**
 * Flags a supervisor had already reviewed before this session — two violations,
 * two not — so every tab opens with some history. Both Communication & Conduct
 * flags are deliberately left open: they are the first job on the page.
 */
export const SEED_DECISIONS = {
    // Verdicts are per session (`flagId@sessionId`); a pattern is worked out from them.
    // Laura Benning · Greeting & Transitions — 3 of 8 sessions confirmed, past 25%.
    'f-1031@ts-1': 'confirmed',
    'f-1031@ts-2': 'confirmed',
    'f-1031@ts-4': 'confirmed',
    // Priya Raman · Camera On — 3 of 8 confirmed, one dismissed.
    'f-1019@tp-1': 'confirmed',
    'f-1019@tp-2': 'confirmed',
    'f-1019@tp-5': 'confirmed',
    'f-1019@tp-6': 'dismissed',
    // Anika Morrow · Conversational Engagement — none were violations.
    'f-1028@tn-1': 'dismissed',
    'f-1028@tn-2': 'dismissed',
    'f-1028@tn-4': 'dismissed',
    'f-1028@tn-6': 'dismissed',
    // Devon Marsh · Greeting & Transitions — none were violations. His Student
    // Non-Compliance sessions, and Marcus Webb's attendance ones, are left to verify.
    'f-1024@td-1': 'dismissed',
    'f-1024@td-4': 'dismissed',
    'f-1024@td-8': 'dismissed',
};

export const SEED_ANNOTATIONS = {
    'f-1031@ts-2': {
        reason: null,
        note: 'Left two breakouts without saying anything. Greeted students fine, so this is transitions only.',
    },
    'f-1031@ts-4': { reason: null, note: 'Same again — rotated out of room 3 with no message.' },
    'f-1019@tp-2': {
        reason: null,
        note: 'Camera off for the whole breakout; no tech issue mentioned in chat.',
    },
    'f-1019@tp-6': {
        reason: 'Camera or screen state misread',
        note: 'Camera was on — a dark room read as a blank feed.',
    },
    'f-1028@tn-2': {
        reason: 'Student absent or disengaged',
        note: 'The silence was the student muted and away from the screen; tutor prompted twice in chat.',
    },
    'f-1024@td-1': {
        reason: 'Wrong tutor or student identified',
        note: 'The greeting was there — the transcript gave it to the co-tutor in the same room.',
    },
    // Every dismissal has a reason: the recording page won't submit one without it.
    'f-1028@tn-1': { reason: 'Tutor responded in chat', note: 'Quiet on audio, but answering questions in chat the whole time.' },
    'f-1028@tn-4': { reason: 'Student absent or disengaged', note: 'Student had stepped away; tutor checked in twice.' },
    'f-1028@tn-6': { reason: 'Context makes it acceptable', note: 'Silent while the student worked a timed problem set, as planned.' },
    'f-1024@td-4': { reason: 'Recording incomplete or cut off', note: 'Recording starts after the greeting.' },
    'f-1024@td-8': { reason: 'Words misheard or missing', note: 'Greeting is there; the transcript dropped the first sentence.' },
};

/**
 * Transcripts for the flags that are patterns or system-detected. A pattern opens
 * on its most recent flagged session; camera and attendance evidence is a system
 * event in the recording, not something anyone said.
 */
Object.assign(TRANSCRIPTS, {
    'f-1031': [
        line(0, 'Tutor', 'Okay, starting the rotation now.'),
        line(48, 'Tutor', 'Hi Theo, good to see you. Where did we leave off?'),
        line(90, 'Theo', 'The fractions worksheet.'),
        line(240, 'Tutor', 'Great, try number four and talk me through it.'),
        line(470, 'Theo', 'I got three-eighths.'),
        line(505, 'Tutor', 'Nice, that\'s right.'),
        line(612, '[System]', 'Tutor left breakout room 2 — no message to the student.', true),
        line(660, 'Tutor', 'Hey Caleb, how\'s it going?'),
        line(720, 'Caleb', 'I\'m stuck on the word problem.'),
        line(905, 'Tutor', 'Underline what it\'s asking first.'),
        line(1130, 'Caleb', 'Oh, so it\'s per hour.'),
        line(1210, '[System]', 'Tutor left breakout room 3 — no message to the student.', true),
        line(1262, 'Tutor', 'Back with Theo. Done with five?'),
        line(1480, 'Tutor', 'That\'s time, good work everyone.'),
    ],
    'f-1024': [
        line(0, 'Tutor', 'Joining room 1.'),
        line(95, 'Tutor', '"Okay, open page six."', true),
        line(130, 'Darius', 'Which problem?'),
        line(160, 'Tutor', 'Start at the top.'),
        line(410, 'Co-tutor', 'Hi Darius! Glad you\'re here today.'),
        line(600, 'Darius', 'Is it times or divide?'),
        line(640, 'Tutor', 'Read the second sentence again.'),
        line(980, 'Darius', 'Divide.'),
        line(1010, 'Tutor', 'Right.'),
        line(1380, 'Tutor', 'Wrapping up, see you Thursday.'),
    ],
    'f-1028': [
        line(0, 'Tutor', 'Hi Nora, can you hear me?'),
        line(60, 'Nora', 'Yes.'),
        line(210, 'Tutor', 'Let\'s look at question two.'),
        line(400, 'Nora', 'Hold on, I need to get my notebook.'),
        line(470, '[Chat]', 'Tutor: Take your time, I\'m here when you\'re back.'),
        line(740, '[System]', 'No audio or chat for 3m 40s.', true),
        line(960, '[Chat]', 'Tutor: Nora, are you still there?'),
        line(1010, 'Nora', 'Sorry, I\'m back.'),
        line(1100, 'Tutor', 'No problem. Question two — what\'s the first step?'),
        line(1540, 'Tutor', 'Good session, see you next week.'),
    ],
    'f-1019': [
        line(0, '[System]', 'Tutor joined with camera off.'),
        line(40, 'Tutor', 'Hi Jalen, hi Sofia.'),
        line(180, '[System]', 'Camera still off — 3 minutes into breakout visits.', true),
        line(300, 'Sofia', 'Can you see my screen?'),
        line(330, 'Tutor', 'Yep, looks good.'),
        line(620, 'Jalen', 'I don\'t get why it\'s negative.'),
        line(660, 'Tutor', 'Think about which way you\'re moving on the number line.'),
        line(1020, '[System]', 'Camera remained off for the full breakout period.'),
        line(1490, 'Tutor', 'Alright, that\'s time.'),
    ],
    'f-1012': [
        line(0, 'Tutor', 'Hi Darius, let\'s get started.'),
        line(90, 'Darius', 'Okay.'),
        line(300, 'Tutor', 'Try the first two, I\'ll check back.'),
        line(605, '[System]', 'Student screen idle.'),
        line(905, '[System]', 'Student idle 5m 00s — no tutor prompt.', true),
        line(1100, 'Tutor', 'Darius, how far did you get?'),
        line(1130, 'Darius', 'I didn\'t start.'),
        line(1160, 'Tutor', 'Okay, let\'s do the first one together.'),
        line(1440, 'Tutor', 'See you next time.'),
    ],
    'f-1047': [
        line(0, '[System]', 'Session started — tutor not present.'),
        line(70, '[System]', 'Tutor joined, then left after 1m 48s.', true),
        line(190, '[Chat]', 'Lead tutor: Marcus, are you reconnecting?'),
        line(600, '[System]', 'Students reassigned to lead tutor.'),
        line(1490, '[System]', 'Session ended — tutor did not rejoin.'),
    ],
});

/**
 * The full roster: 200 tutors, 70 assigned to this supervisor.
 *
 * The five tutors with flags in this prototype are all assigned and keep their
 * detail pages. Everyone else is generated — on track unless they belong to
 * another supervisor and carry a pattern there — and has no detail page.
 */
const FIRST = ['Avery', 'Jordan', 'Sam', 'Riley', 'Morgan', 'Casey', 'Taylor', 'Jamie', 'Alex', 'Quinn',
    'Drew', 'Reese', 'Skyler', 'Rowan', 'Elliot', 'Harper', 'Emerson', 'Finley', 'Hayden', 'Kai'];
const LAST = ['Nguyen', 'Patel', 'Garcia', 'Kim', 'Okafor', 'Silva', 'Cohen', 'Ali', 'Murphy', 'Chen',
    'Lopez', 'Singh', 'Brooks', 'Rivera', 'Ward'];

let seed = 7;
const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
};

export const TOTAL_ROSTER = 200;
export const ASSIGNED_COUNT = 70;

export const ROSTER = (() => {
    const named = new Set(REPEAT_TUTORS.map((t) => t.name));
    const people = REPEAT_TUTORS.map((t) => ({ ...t, assigned: true, hasPage: true }));
    const metricNames = METRICS.map((m) => m.name).concat(['Session Attendance']);

    for (let i = 0; people.length < TOTAL_ROSTER; i += 1) {
        const name = `${FIRST[i % FIRST.length]} ${LAST[Math.floor(i / FIRST.length) % LAST.length]}`;
        if (named.has(name)) continue;
        named.add(name);
        const assigned = people.filter((p) => p.assigned).length < ASSIGNED_COUNT;
        // Other supervisors' tutors carry some patterns; this supervisor's extras are on track.
        let status = 'On Track';
        let patterns = [];
        if (!assigned) {
            const r = rand();
            if (r < 0.05 || r > 0.97) status = 'Check-In Needed';
            else if (r < 0.12) status = 'Verification Needed';
            if (status !== 'On Track') {
                const of = 8 + Math.floor(rand() * 9);
                const flagged = Math.ceil(of * (0.26 + rand() * 0.2));
                patterns = [{
                    metric: metricNames[Math.floor(rand() * metricNames.length)],
                    flagged,
                    of,
                    confirmed: status === 'Check-In Needed' ? 1 + Math.floor(rand() * 2) : 0,
                    dismissed: 0,
                }];
            }
        }
        people.push({ id: `r-${i}`, name, status, patterns, assigned, hasPage: false, sessions: [] });
    }
    return people;
})();

/** Display order of the status groups: who to talk to first. */
export const STATUS_ORDER = ['Check-In Needed', 'Verification Needed', 'On Track'];

Object.assign(TRANSCRIPTS, {
    'f-1051': [
        line(0, 'Tutor', 'Okay, I\'ll start with whoever\'s ready.'),
        line(60, 'Tutor', 'Hi Ava — oh wait, let me check on Lila first.'),
        line(420, '[System]', 'Visit order: 3, 1, 4, 2 — suggested order was 1, 2, 3, 4.', true),
        line(700, 'Lila', 'I finished the warm-up.'),
        line(760, 'Tutor', 'Great, try the next section.'),
        line(1480, 'Tutor', 'That\'s time, everyone.'),
    ],
    'f-1053': [
        line(0, 'Tutor', 'Moving everyone into rooms now.'),
        line(310, '[System]', 'Student Sofia M. still in the main room after 7m 02s.', true),
        line(440, 'Tutor', 'Sorry Sofia, sending you to room 2 now.'),
        line(520, 'Sofia', 'Okay.'),
        line(1490, 'Tutor', 'Good work today.'),
    ],
    // Laura Benning, Sep 3 — Conversational Engagement only.
    'f-1033': [
        line(0, 'Tutor', 'Hi Theo! Ready for the fractions review?'),
        line(40, 'Theo', 'Yeah.'),
        line(150, 'Tutor', 'Start with the first three and tell me when you\'re stuck.'),
        line(420, 'Theo', 'I\'m stuck on number two.'),
        line(650, '[System]', 'No audio or chat for 3m 50s after the student asked for help.', true),
        line(880, 'Tutor', 'Sorry, okay — number two. What did you try?'),
        line(940, 'Theo', 'I tried adding the bottoms.'),
        line(1000, 'Tutor', 'Close. Let\'s find a common denominator first.'),
        line(1460, 'Tutor', 'Nice work today.'),
    ],
    // Laura Benning, Sep 12 — flagged for both Greeting & Transitions and Conversational Engagement.
    'c-ts-2': [
        line(0, 'Tutor', 'Hi Theo, let\'s get started on the worksheet.'),
        line(45, 'Theo', 'Okay.'),
        line(300, 'Theo', 'Is the answer five sixths?'),
        line(330, 'Tutor', 'Yes! Keep going.'),
        line(480, '[System]', 'Tutor left breakout room 1 — no message to the student.', true),
        line(500, 'Tutor', 'Imani, how is the worksheet going?'),
        line(540, 'Imani', 'I don\'t understand number four.'),
        line(760, '[System]', 'No audio or chat for 3m 20s after the student asked for help.', true),
        line(960, 'Tutor', 'Okay, number four. Read it out to me.'),
        line(1450, 'Tutor', 'That\'s time — good work, both of you.'),
    ],
    // Sessions the AI passed as clean. Each has something a supervisor watching
    // closely could still catch — the case for adding a violation by hand.
    'c-886': [
        line(0, 'Tutor', 'Hey both, let\'s get going.'),
        line(48, 'Ezra', 'Hi.'),
        line(95, 'Tutor', 'Leo, start on problem four. Ezra, you\'re on six.'),
        line(260, 'Leo', 'Is this the one with the ratio?'),
        line(290, 'Tutor', 'Yep.'),
        line(410, 'Ezra', 'Can you help me with six? I don\'t get the setup.'),
        line(455, 'Tutor', 'Just copy what Leo wrote, it\'s the same idea.'),
        line(470, 'Ezra', 'Oh. Okay.'),
        line(600, '[System]', 'Tutor muted for 6m 10s.'),
        line(970, 'Tutor', 'Back — how\'s everyone doing?'),
        line(1010, 'Leo', 'Done with four and five.'),
        line(1080, 'Tutor', 'Nice. Ezra?'),
        line(1105, 'Ezra', 'I copied it.'),
        line(1120, 'Tutor', 'Cool. That\'s time soon.'),
        line(1500, 'Tutor', 'Alright, see you Thursday.'),
    ],
    'c-881': [
        line(0, 'Tutor', 'Good afternoon, Theo! Good to see you.'),
        line(40, 'Theo', 'Hi Ms. Benning.'),
        line(120, 'Tutor', 'Let\'s pick up where we stopped on fractions.'),
        line(300, 'Theo', 'I think the answer is three fourths.'),
        line(330, 'Tutor', 'Great work, how did you get it?'),
        line(400, 'Theo', 'I found a common denominator.'),
        line(520, '[System]', 'Tutor moved to breakout room 2.'),
        line(540, 'Tutor', 'Hi Imani, how\'s it going?'),
        line(575, 'Imani', 'Okay.'),
        line(860, '[System]', 'Tutor moved to breakout room 1.'),
        line(880, 'Theo', 'Where did you go? I was stuck for a while.'),
        line(905, 'Tutor', 'Sorry! Let\'s look at it now.'),
        line(1450, 'Tutor', 'Great session today, both of you.'),
    ],
});

/**
 * Flags audited in earlier weeks. AI diagnosis accumulates every audit, not only
 * this week's flags, so the model's track record has enough rows to read.
 */
export const AUDIT_HISTORY = [
    // Spot checks: sessions with no AI flag that a supervisor watched and found nothing in.
    { id: 'h-c07', week: 'Sep 7', tutor: 'Jamie Garcia', categoryId: null, category: 'No AI flag', confidence: null, verdict: 'clean', outcome: 'clean', note: 'Spot check after a parent email. Nothing wrong.' },
    { id: 'h-c06', week: 'Sep 7', tutor: 'Quinn Patel', categoryId: null, category: 'No AI flag', confidence: null, verdict: 'clean', outcome: 'clean', note: '' },
    { id: 'h-c05', week: 'Aug 31', tutor: 'Taylor Okafor', categoryId: null, category: 'No AI flag', confidence: null, verdict: 'clean', outcome: 'clean', note: 'Watched the full session; greeting and rotations fine.' },
    { id: 'h-c04', week: 'Aug 31', tutor: 'Alex Kim', categoryId: null, category: 'No AI flag', confidence: null, verdict: 'clean', outcome: 'clean', note: '' },
    { id: 'h-c03', week: 'Aug 24', tutor: 'Morgan Silva', categoryId: null, category: 'No AI flag', confidence: null, verdict: 'clean', outcome: 'clean', note: 'Random spot check.' },
    // A real violation filed under the wrong compliance, and one the AI never flagged.
    { id: 'h-0915', week: 'Sep 7', tutor: 'Morgan Silva', categoryId: 'greeting', category: 'Greeting & Transitions', aiCategoryId: 'conduct', aiCategory: 'Communication & Conduct', confidence: 0.74, verdict: 'confirmed', outcome: 'relabelled', note: 'Curt, but it was a rushed hand-off between rooms, not disrespect toward the student.' },
    { id: 'h-0910', week: 'Sep 7', tutor: 'Riley Chen', categoryId: 'camera', category: 'Camera On', confidence: null, verdict: 'confirmed', outcome: 'missed', note: 'Camera off for the last ten minutes. Found while checking a different flag.' },
    { id: 'h-0912', week: 'Sep 7', tutor: 'Priya Raman', categoryId: 'camera', category: 'Camera On', confidence: 0.92, verdict: 'confirmed', note: 'Camera off the whole breakout, no message about it.' },
    { id: 'h-0908', week: 'Sep 7', tutor: 'Laura Benning', categoryId: 'greeting', category: 'Greeting & Transitions', confidence: 0.84, verdict: 'confirmed', note: 'Rotated out of two rooms without a word.' },
    { id: 'h-0905', week: 'Sep 7', tutor: 'Taylor Okafor', categoryId: 'engagement', category: 'Conversational Engagement', confidence: 0.58, verdict: 'dismissed', reason: 'Tutor responded in chat', note: 'Four-minute gap on audio, but she was answering in chat the whole time.' },
    { id: 'h-0901', week: 'Aug 31', tutor: 'Owen Hartley', categoryId: 'conduct', category: 'Communication & Conduct', confidence: 0.81, verdict: 'confirmed', note: 'Told a student to "stop wasting my time." Clear.' },
    { id: 'h-0897', week: 'Aug 31', tutor: 'Marcus Webb', categoryId: 'attendance', category: 'Session Attendance', confidence: 0.95, verdict: 'confirmed', note: 'Joined late and left after a minute.' },
    { id: 'h-0893', week: 'Aug 31', tutor: 'Jamie Garcia', categoryId: 'camera', category: 'Camera On', confidence: 0.66, verdict: 'dismissed', reason: 'Camera or screen state misread', note: 'Camera was on — virtual background read as a blank feed.' },
    { id: 'h-0890', week: 'Aug 24', tutor: 'Alex Kim', categoryId: 'conduct', category: 'Communication & Conduct', confidence: 0.71, verdict: 'dismissed', reason: 'Words misheard or missing', note: '"You should know this" was actually "you\'ll know this by the end." Transcript dropped words.' },
    { id: 'h-0886', week: 'Aug 24', tutor: 'Devon Marsh', categoryId: 'non-compliance', category: 'Student Non-Compliance', confidence: 0.77, verdict: 'confirmed', note: 'Student idle six minutes, never prompted.' },
    { id: 'h-0881', week: 'Aug 24', tutor: 'Quinn Patel', categoryId: 'rotation', category: 'Rotation Patterns', confidence: 0.6, verdict: 'dismissed', reason: 'Below the rule\'s threshold', note: 'Order was off by one swap. Rule says "highly inconsistent" — this isn\'t.' },
    { id: 'h-0877', week: 'Aug 17', tutor: 'Riley Chen', categoryId: 'greeting', category: 'Greeting & Transitions', confidence: 0.69, verdict: 'dismissed', reason: 'Recording incomplete or cut off', note: 'Recording starts two minutes in — the greeting happened before it.' },
    { id: 'h-0872', week: 'Aug 17', tutor: 'Anika Morrow', categoryId: 'engagement', category: 'Conversational Engagement', confidence: 0.73, verdict: 'confirmed', note: 'Long silences, no prompts in chat either.' },
    { id: 'h-0868', week: 'Aug 17', tutor: 'Morgan Silva', categoryId: 'coverage', category: 'Assigned Student Coverage', confidence: 0.62, verdict: 'dismissed', reason: 'Wrong compliance matched', note: 'Student was moved by the lead tutor — this is a rotation question, not coverage.' },
];

/**
 * Every session with a recording opens on something. A flagged session uses the
 * transcript of the tutor's AI flag for that compliance; a clean one gets an
 * ordinary session, so "Open session" is never a dead button.
 */
const cleanSession = (student) => [
    line(0, 'Tutor', `Hi ${student}, good to see you. Ready to start?`),
    line(45, student, 'Yeah.'),
    line(120, 'Tutor', "Let's open the practice set from last time."),
    line(300, student, 'I did the first two.'),
    line(340, 'Tutor', 'Nice — show me how you set up the second one.'),
    line(520, student, 'I divided both sides first.'),
    line(560, 'Tutor', 'Exactly right. Try the next one on your own.'),
    line(900, 'Tutor', 'How is it going?'),
    line(930, student, 'Almost done.'),
    line(1200, 'Tutor', "Great work. Let's check the answers together."),
    line(1450, 'Tutor', "That's time — see you next session."),
];

REPEAT_TUTORS.forEach((t) => t.sessions.forEach((s) => {
    if (s.transcriptId || !s.recording) return;
    if (s.flags.length > 0) {
        const mine = FLAG_INSTANCES.filter((f) => f.tutor === t.name);
        const match = mine.find((f) => s.flags.includes(f.category)) ?? mine[0];
        if (match && TRANSCRIPTS[match.id]) s.transcriptId = match.id;
        return;
    }
    const id = `c-${s.id}`;
    TRANSCRIPTS[id] = cleanSession(s.students[0].split(' ')[0]);
    s.transcriptId = id;
}));
