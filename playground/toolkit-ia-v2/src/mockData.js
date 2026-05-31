/**
 * Mock sessions for Toolkit IA v2 — time-based session hub.
 * Session-centric model with multi-tutor / multi-student rosters.
 * `group` maps to hub tabs: today | upcoming | history
 */

export const HUB_TABS = {
    today: 'today',
    upcoming: 'upcoming',
    history: 'history',
};

/** @typedef {'not-started' | 'in-progress' | 'submitted'} ReflectionStatus */

export const MOCK_SESSIONS = [
    {
        id: 'ses-101',
        group: 'today',
        title: 'Algebra II — Period 3',
        course: 'Algebra II',
        timeLabel: 'Today · 3:00–3:45 PM',
        schoolLabel: 'Lincoln High',
        roomLabel: 'Virtual · Room 12',
        tutors: [
            { id: 't-alex', name: 'Alex Morgan', role: 'Lead tutor', readiness: 'ready' },
            { id: 't-jamie', name: 'Jamie Ortiz', role: 'Support tutor', readiness: 'ready' },
        ],
        students: [
            { id: 'st-jordan', name: 'Jordan Lee', status: 'expected' },
            { id: 'st-mia', name: 'Mia Santos', status: 'expected' },
        ],
        rosterChanges: [
            { at: 'Today 2:15 PM', note: 'Mia Santos added to session roster (group expansion)' },
        ],
        status: 'in-progress',
        statusLabel: 'In progress',
        contextSummary:
            'Linear systems warm-up; two-student group with shared agenda and split checkpoints.',
        flags: ['IEP accommodations on file', 'Co-tutor assigned'],
        agenda: [
            'Warm-up: linear systems review',
            'Problem set 4.2 — guided practice',
            'Exit ticket: identify solution types',
        ],
        sessionNotes:
            'Group responds well to turn-based problem solving. Jordan prefers scaffolding; Mia prefers timed checkpoints.',
        goals: ['Improve confidence with word problems', 'Raise unit test average by one letter grade'],
        reflectionDraft: '',
        reflectionStatus: 'not-started',
        priorNotes: 'Last session: both students completed 8/10 practice problems.',
        attendance: {
            label: '2 expected',
            detail: 'Jordan Lee · Mia Santos — on track',
        },
        engagement: { label: 'High', detail: 'Active in last 3 group sessions' },
    },
    {
        id: 'ses-102',
        group: 'today',
        title: 'Biology — Midterm prep',
        course: 'Biology',
        timeLabel: 'Today · 4:15–5:00 PM',
        schoolLabel: 'Riverside Middle',
        roomLabel: 'In person · Study pod B',
        tutors: [{ id: 't-alex', name: 'Alex Morgan', role: 'Lead tutor', readiness: 'needs-prep' }],
        students: [{ id: 'st-sam', name: 'Sam Rivera', status: 'expected' }],
        rosterChanges: [],
        status: 'starting-soon',
        statusLabel: 'Starts in 45 min',
        contextSummary: 'Photosynthesis recap and lab worksheet; midterm in 5 days.',
        flags: ['Midterm in 5 days'],
        agenda: ['Photosynthesis recap', 'Lab prep worksheet', 'Vocab check-in'],
        sessionNotes: 'Sam is preparing for midterms; wants condensed study guides.',
        goals: ['Solidify cell energetics', 'Complete lab prep with fewer hints'],
        reflectionDraft: '',
        reflectionStatus: 'not-started',
        priorNotes: 'Prior session ended early due to fire drill.',
        attendance: { label: '1 expected', detail: 'Sam Rivera — confirmed in-person' },
        engagement: { label: 'Steady', detail: 'Completed 2 of 3 homework tasks' },
    },
    {
        id: 'ses-103',
        group: 'upcoming',
        title: 'ELA — Reading block',
        course: 'ELA — Reading',
        timeLabel: 'Tomorrow · 9:00–9:40 AM',
        schoolLabel: 'Westview Elementary',
        roomLabel: 'Virtual',
        tutors: [{ id: 't-priya', name: 'Priya Nair', role: 'Lead tutor', readiness: 'ready' }],
        students: [{ id: 'st-avery', name: 'Avery Kim', status: 'scheduled' }],
        rosterChanges: [],
        status: 'scheduled',
        statusLabel: 'Scheduled',
        contextSummary: 'Shared reading with inference prompts; timers and checkpoints planned.',
        flags: ['504 plan — extended time'],
        agenda: ['Shared reading chunk', 'Inference prompts', 'Short written response'],
        sessionNotes: 'Avery benefits from timers and clear checkpoints.',
        goals: ['Increase sustained reading stamina', 'Cite textual evidence in writing'],
        reflectionDraft: '',
        reflectionStatus: 'not-started',
        priorNotes: 'Last week: finished reading chunk with one timer extension.',
        attendance: null,
        engagement: null,
    },
    {
        id: 'ses-104',
        group: 'upcoming',
        title: 'Chemistry — Small group lab',
        course: 'Chemistry',
        timeLabel: 'Wed, Jun 3 · 6:30–7:15 PM',
        schoolLabel: 'Central High',
        roomLabel: 'Virtual',
        tutors: [
            { id: 't-priya', name: 'Priya Nair', role: 'Lead tutor', readiness: 'not-started' },
            { id: 't-lee', name: 'Lee Chen', role: 'Support tutor', readiness: 'ready' },
        ],
        students: [
            { id: 'st-dev', name: 'Dev Patel', status: 'scheduled' },
            { id: 'st-morgan', name: 'Morgan Ellis', status: 'scheduled' },
        ],
        rosterChanges: [
            { at: 'Mon, Jun 1', note: 'Lee Chen swapped in for Jordan Okonkwo (schedule conflict)' },
            { at: 'Sun, May 31', note: 'Morgan Ellis joined roster — school requested pair tutoring' },
        ],
        status: 'scheduled',
        statusLabel: 'Scheduled',
        contextSummary:
            'Stoichiometry small group; roster recently changed — confirm plan with both tutors before session.',
        flags: ['Roster changed (2 updates)', 'Co-plan review requested'],
        agenda: ['Stoichiometry drill', 'Limiting reagent intro', 'Practice set'],
        sessionNotes: 'Dev needs visuals for mole ratios; Morgan strong on arithmetic, weaker on abstraction.',
        goals: ['Master mole-to-mole conversions', 'Complete practice set with <2 hints per student'],
        reflectionDraft: '',
        reflectionStatus: 'not-started',
        priorNotes: 'Dev missed last session — send recap before Wednesday.',
        attendance: null,
        engagement: null,
    },
    {
        id: 'ses-105',
        group: 'history',
        title: 'Geometry — Proof workshop',
        course: 'Geometry',
        timeLabel: 'Fri, May 29 · 2:00–2:45 PM',
        schoolLabel: 'Lincoln High',
        roomLabel: 'Virtual',
        tutors: [{ id: 't-alex', name: 'Alex Morgan', role: 'Lead tutor', readiness: 'ready' }],
        students: [{ id: 'st-casey', name: 'Casey Brooks', status: 'present' }],
        rosterChanges: [],
        status: 'completed',
        statusLabel: 'Completed',
        contextSummary:
            'Triangle proofs workshop; reflection in progress — tutor may finish after back-to-back block.',
        flags: ['Reflection overdue risk'],
        agenda: ['Triangle similarity review', 'Proof outline practice'],
        sessionNotes: 'Casey prefers visual models before formal proofs.',
        goals: ['Identify similar triangles', 'Write two-column proofs with cues'],
        reflectionDraft:
            'Casey completed two proofs with minimal prompting. Still need to add homework recommendation.',
        reflectionStatus: 'in-progress',
        priorNotes: 'Supervisor note: strong session; follow up on homework submission.',
        attendance: { label: '1 present', detail: 'Casey Brooks · full 45 min' },
        engagement: { label: 'High', detail: 'Asked 4 questions; completed exit ticket' },
    },
    {
        id: 'ses-106',
        group: 'history',
        title: 'US History — Unit wrap-up',
        course: 'US History',
        timeLabel: 'Thu, May 28 · 11:00–11:40 AM',
        schoolLabel: 'Riverside Middle',
        roomLabel: 'In person',
        tutors: [{ id: 't-jordan', name: 'Jordan Okonkwo', role: 'Lead tutor', readiness: 'ready' }],
        students: [{ id: 'st-riley', name: 'Riley Chen', status: 'present' }],
        rosterChanges: [],
        status: 'completed',
        statusLabel: 'Completed',
        contextSummary: 'Civil War unit recap; reflection submitted.',
        flags: [],
        agenda: ['Unit recap', 'Short response draft', 'Study guide handoff'],
        sessionNotes: 'Riley works best with bullet outlines before writing.',
        goals: ['Summarize causes of the Civil War', 'Complete study guide section 3'],
        reflectionDraft:
            'Riley drafted a strong short response. Study guide section 3 still in progress — assign for next session.',
        reflectionStatus: 'submitted',
        priorNotes: 'Engagement dipped at 20 min; regrouped with outline scaffold.',
        attendance: { label: '1 present', detail: 'Riley Chen · full 40 min' },
        engagement: { label: 'Moderate', detail: 'Re-engaged after outline scaffold' },
    },
    {
        id: 'ses-107',
        group: 'history',
        title: 'Algebra I — Virtual check-in',
        course: 'Algebra I',
        timeLabel: 'Wed, May 27 · 4:00–4:45 PM',
        schoolLabel: 'Westview Elementary',
        roomLabel: 'Virtual',
        tutors: [{ id: 't-alex', name: 'Alex Morgan', role: 'Lead tutor', readiness: 'ready' }],
        students: [{ id: 'st-taylor', name: 'Taylor Nguyen', status: 'absent' }],
        rosterChanges: [],
        status: 'missed',
        statusLabel: 'Student no-show',
        contextSummary:
            'Session not held; reflection not started. Tutor documented wait — complete reflection for compliance.',
        flags: ['Attendance follow-up required', 'Reflection not started'],
        agenda: ['Quadratic functions intro', 'Graphing practice'],
        sessionNotes: 'Taylor has had two late arrivals this month.',
        goals: ['Graph parabolas from vertex form'],
        reflectionDraft: '',
        reflectionStatus: 'not-started',
        priorNotes: 'Tutor waited 15 min; school confirmed connectivity issue.',
        attendance: { label: '1 absent', detail: 'Taylor Nguyen · no-show documented' },
        engagement: { label: 'N/A', detail: 'Session did not occur' },
    },
    {
        id: 'ses-108',
        group: 'history',
        title: 'Math lab — Group session',
        course: 'Math lab',
        timeLabel: 'Wed, May 27 · 1:00–1:50 PM',
        schoolLabel: 'Central High',
        roomLabel: 'In person · Lab 2',
        tutors: [
            { id: 't-priya', name: 'Priya Nair', role: 'Lead tutor', readiness: 'ready' },
            { id: 't-alex', name: 'Alex Morgan', role: 'Support tutor', readiness: 'ready' },
        ],
        students: [
            { id: 'st-dev', name: 'Dev Patel', status: 'present' },
            { id: 'st-morgan', name: 'Morgan Ellis', status: 'present' },
            { id: 'st-kai', name: 'Kai Brooks', status: 'left-early' },
        ],
        rosterChanges: [
            { at: 'Wed, May 27 1:05 PM', note: 'Kai Brooks marked left early (15 min) — roster note for reflection' },
        ],
        status: 'completed',
        statusLabel: 'Completed',
        contextSummary:
            'Fractions and ratios lab; reflection in progress after back-to-back afternoon block.',
        flags: ['Partial attendance (1 left early)', 'Multi-tutor session'],
        agenda: ['Ratio review', 'Partner practice', 'Group exit ticket'],
        sessionNotes: 'Dev and Morgan paired; Kai left after ratio review.',
        goals: ['Equivalent ratios', 'Apply ratio tables to word problems'],
        reflectionDraft: 'Started group reflection — need per-student attendance notes for Kai.',
        reflectionStatus: 'in-progress',
        priorNotes: 'Second session of the day for Priya; Alex covered last 20 min.',
        attendance: {
            label: '2 present, 1 left early',
            detail: 'Dev · Morgan full session; Kai Brooks 15 min',
        },
        engagement: { label: 'Mixed', detail: 'High for Dev/Morgan; Kai disengaged before leaving' },
    },
];

export function sessionById(id) {
    return MOCK_SESSIONS.find((s) => s.id === id) ?? null;
}

export function tutorCount(session) {
    return session.tutors?.length ?? 0;
}

export function studentCount(session) {
    return session.students?.length ?? 0;
}

export function isReflectionIncomplete(session) {
    return session.reflectionStatus === 'not-started' || session.reflectionStatus === 'in-progress';
}

export function sessionsByGroup(group) {
    const sessions = MOCK_SESSIONS.filter((s) => s.group === group);
    if (group !== HUB_TABS.history) return sessions;
    return [...sessions].sort((a, b) => {
        const aInc = isReflectionIncomplete(a);
        const bInc = isReflectionIncomplete(b);
        if (aInc && !bInc) return -1;
        if (!aInc && bInc) return 1;
        return 0;
    });
}

export function statusBadgeStyle(status) {
    switch (status) {
        case 'in-progress':
            return 'primary';
        case 'starting-soon':
            return 'secondary';
        case 'scheduled':
            return 'secondary';
        case 'completed':
            return 'success';
        case 'missed':
            return 'danger';
        default:
            return 'secondary';
    }
}

export function reflectionStatusLabel(status) {
    switch (status) {
        case 'submitted':
            return 'Submitted';
        case 'in-progress':
            return 'In progress';
        case 'not-started':
            return 'Not started';
        default:
            return status;
    }
}

export function reflectionBadgeStyle(status) {
    switch (status) {
        case 'submitted':
            return 'success';
        case 'in-progress':
            return 'warning';
        case 'not-started':
            return 'secondary';
        default:
            return 'secondary';
    }
}

export function readinessBadgeStyle(readiness) {
    switch (readiness) {
        case 'ready':
            return 'success';
        case 'needs-prep':
            return 'warning';
        case 'not-started':
            return 'secondary';
        default:
            return 'secondary';
    }
}
