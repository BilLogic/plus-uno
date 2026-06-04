/**
 * Mock sessions for Toolkit IA v3 — persistent context panel prototype.
 * Reflection status: not-started | draft | submitted
 */

export const SESSION_GROUPS = {
    today: 'today',
    upcoming: 'upcoming',
    history: 'history',
};

export const MOCK_SESSIONS = [
    {
        id: 'ses-301',
        group: 'today',
        title: 'Algebra II — Period 3',
        timeLabel: 'Today · 3:00–3:45 PM',
        dateLabel: 'Today, May 31',
        schoolLabel: 'Lincoln High',
        roomLabel: 'Virtual · Zoom',
        tutors: [
            { id: 't-alex', name: 'Alex Morgan', role: 'Lead tutor', isLead: true },
            { id: 't-jamie', name: 'Jamie Ortiz', role: 'Support tutor', isLead: false },
        ],
        students: [
            { id: 'st-jordan', name: 'Jordan Lee', status: 'expected', notes: 'Prefers scaffolding' },
            { id: 'st-mia', name: 'Mia Santos', status: 'expected', notes: 'Uses timed checkpoints' },
        ],
        rosterChanges: [
            { at: 'Today 2:15 PM', note: 'Mia Santos added (group expansion)' },
        ],
        status: 'in-progress',
        statusLabel: 'In progress',
        contextSummary: 'Linear systems group session; back-to-back with Biology at 4:15.',
        agenda: ['Warm-up: linear systems', 'Problem set 4.2', 'Exit ticket'],
        sessionNotes: 'Turn-based problem solving works well for this pair.',
        goals: [
            'Improve confidence with word problems',
            'Raise unit test average by one letter grade',
            'Document per-student engagement in reflection',
        ],
        priorNotes: 'Last session: both students completed 8/10 practice problems.',
        reflectionDraft: '',
        reflectionStatus: 'not-started',
        attendance: { label: '2 expected', detail: 'Jordan Lee · Mia Santos' },
        engagement: { label: 'High', detail: 'Active in last 3 group sessions' },
        zoomRecording: { available: false, status: 'Session in progress' },
        zoomSummary: null,
    },
    {
        id: 'ses-302',
        group: 'today',
        title: 'Biology — Midterm prep',
        timeLabel: 'Today · 4:15–5:00 PM',
        dateLabel: 'Today, May 31',
        schoolLabel: 'Riverside Middle',
        roomLabel: 'In person',
        tutors: [{ id: 't-alex', name: 'Alex Morgan', role: 'Lead tutor', isLead: true }],
        students: [{ id: 'st-sam', name: 'Sam Rivera', status: 'expected', notes: 'Midterm focus' }],
        rosterChanges: [],
        status: 'starting-soon',
        statusLabel: 'Starts in 45 min',
        contextSummary: 'Follows Algebra II; reflection for Period 3 may be delayed until after this block.',
        agenda: ['Photosynthesis recap', 'Lab prep worksheet', 'Vocab check-in'],
        sessionNotes: 'Sam wants condensed study guides.',
        goals: ['Solidify cell energetics', 'Complete lab prep with fewer hints'],
        priorNotes: 'Prior session ended early due to fire drill.',
        reflectionDraft: '',
        reflectionStatus: 'not-started',
        attendance: { label: '1 expected', detail: 'Sam Rivera — in-person confirmed' },
        engagement: { label: 'Steady', detail: '2 of 3 homework tasks done' },
        zoomRecording: { available: false, status: 'In-person session' },
        zoomSummary: null,
    },
    {
        id: 'ses-303',
        group: 'upcoming',
        title: 'Chemistry — Small group lab',
        timeLabel: 'Wed, Jun 3 · 6:30–7:15 PM',
        dateLabel: 'Wed, Jun 3',
        schoolLabel: 'Central High',
        roomLabel: 'Virtual · Zoom',
        tutors: [
            { id: 't-priya', name: 'Priya Nair', role: 'Lead tutor', isLead: true },
            { id: 't-lee', name: 'Lee Chen', role: 'Support tutor', isLead: false },
        ],
        students: [
            { id: 'st-dev', name: 'Dev Patel', status: 'scheduled', notes: 'Needs visual mole ratios' },
            { id: 'st-morgan', name: 'Morgan Ellis', status: 'scheduled', notes: 'Strong arithmetic' },
        ],
        rosterChanges: [
            { at: 'Mon, Jun 1', note: 'Lee Chen swapped in for Jordan Okonkwo' },
            { at: 'Sun, May 31', note: 'Morgan Ellis added — pair tutoring request' },
        ],
        status: 'scheduled',
        statusLabel: 'Scheduled',
        contextSummary: 'Roster changed twice; confirm Zoom co-hosts for both tutors.',
        agenda: ['Stoichiometry drill', 'Limiting reagent intro', 'Practice set'],
        sessionNotes: 'Co-plan before session due to roster changes.',
        goals: ['Master mole-to-mole conversions', '<2 hints per student on practice set'],
        priorNotes: 'Dev missed last session — send recap.',
        reflectionDraft: '',
        reflectionStatus: 'not-started',
        attendance: null,
        engagement: null,
        zoomRecording: { available: false, status: 'Scheduled — recording enabled' },
        zoomSummary: null,
    },
    {
        id: 'ses-304',
        group: 'history',
        title: 'Geometry — Proof workshop',
        timeLabel: 'Fri, May 29 · 2:00–2:45 PM',
        dateLabel: 'Fri, May 29',
        schoolLabel: 'Lincoln High',
        roomLabel: 'Virtual · Zoom',
        tutors: [{ id: 't-alex', name: 'Alex Morgan', role: 'Lead tutor', isLead: true }],
        students: [{ id: 'st-casey', name: 'Casey Brooks', status: 'present', notes: 'Visual models first' }],
        rosterChanges: [],
        status: 'completed',
        statusLabel: 'Completed',
        contextSummary: 'Ended before History block; reflection draft started, not submitted.',
        agenda: ['Triangle similarity', 'Proof outline practice'],
        sessionNotes: 'Casey completed two proofs with minimal prompting.',
        goals: ['Identify similar triangles', 'Write two-column proofs with cues'],
        priorNotes: 'Supervisor: strong session; follow up homework.',
        reflectionDraft:
            'Casey completed two proofs with minimal prompting. Still need homework recommendation and Zoom summary review.',
        reflectionStatus: 'draft',
        attendance: { label: '1 present', detail: 'Casey Brooks · full 45 min' },
        engagement: { label: 'High', detail: '4 questions; exit ticket complete' },
        zoomRecording: { available: true, status: 'Recording ready' },
        zoomSummary:
            'Zoom AI summary (mock): Tutor guided proof outlines; student verbalized steps for 2 problems. Breakout not used. Recommend attaching summary to submitted reflection.',
    },
    {
        id: 'ses-305',
        group: 'history',
        title: 'Math lab — Group session',
        timeLabel: 'Wed, May 27 · 1:00–1:50 PM',
        dateLabel: 'Wed, May 27',
        schoolLabel: 'Central High',
        roomLabel: 'Virtual · Zoom',
        tutors: [
            { id: 't-priya', name: 'Priya Nair', role: 'Lead tutor', isLead: true },
            { id: 't-alex', name: 'Alex Morgan', role: 'Support tutor', isLead: false },
        ],
        students: [
            { id: 'st-dev', name: 'Dev Patel', status: 'present' },
            { id: 'st-morgan', name: 'Morgan Ellis', status: 'present' },
            { id: 'st-kai', name: 'Kai Brooks', status: 'left-early' },
        ],
        rosterChanges: [
            { at: 'Wed 1:05 PM', note: 'Kai Brooks left early (15 min) — update reflection attendance' },
        ],
        status: 'completed',
        statusLabel: 'Completed',
        contextSummary: 'Back-to-back afternoon; reflection delayed until evening.',
        agenda: ['Ratio review', 'Partner practice', 'Group exit ticket'],
        sessionNotes: 'Dev/Morgan paired; Kai left after ratio review.',
        goals: ['Equivalent ratios', 'Ratio tables for word problems'],
        priorNotes: 'Priya’s second session that day; Alex covered final 20 min.',
        reflectionDraft: 'Started — need per-student attendance for Kai and Zoom highlights.',
        reflectionStatus: 'draft',
        attendance: { label: '2 present, 1 left early', detail: 'Dev · Morgan full; Kai 15 min' },
        engagement: { label: 'Mixed', detail: 'High Dev/Morgan; Kai disengaged early' },
        zoomRecording: { available: true, status: 'Processing' },
        zoomSummary:
            'Zoom summary pending (mock): Cloud recording processing. Tutor noted breakout room used for Dev/Morgan pair.',
    },
    {
        id: 'ses-306',
        group: 'history',
        title: 'US History — Unit wrap-up',
        timeLabel: 'Thu, May 28 · 11:00–11:40 AM',
        dateLabel: 'Thu, May 28',
        schoolLabel: 'Riverside Middle',
        roomLabel: 'In person',
        tutors: [{ id: 't-jordan', name: 'Jordan Okonkwo', role: 'Lead tutor', isLead: true }],
        students: [{ id: 'st-riley', name: 'Riley Chen', status: 'present' }],
        rosterChanges: [],
        status: 'completed',
        statusLabel: 'Completed',
        contextSummary: 'Reflection submitted; Zoom N/A (in-person).',
        agenda: ['Unit recap', 'Short response draft', 'Study guide'],
        sessionNotes: 'Riley works best with bullet outlines.',
        goals: ['Summarize Civil War causes', 'Complete study guide §3'],
        priorNotes: 'Re-engaged after outline scaffold at 20 min.',
        reflectionDraft:
            'Riley drafted a strong short response. Study guide §3 assigned for next session.',
        reflectionStatus: 'submitted',
        attendance: { label: '1 present', detail: 'Riley Chen · 40 min' },
        engagement: { label: 'Moderate', detail: 'Re-engaged after scaffold' },
        zoomRecording: { available: false, status: 'In-person — no Zoom recording' },
        zoomSummary: null,
    },
];

export function sessionById(id) {
    return MOCK_SESSIONS.find((s) => s.id === id) ?? null;
}

export function sessionsByGroup(group) {
    return MOCK_SESSIONS.filter((s) => s.group === group);
}

export function leadTutor(session) {
    return session.tutors.find((t) => t.isLead) ?? session.tutors[0] ?? null;
}

export function tutorCount(session) {
    return session.tutors?.length ?? 0;
}

export function studentCount(session) {
    return session.students?.length ?? 0;
}

export function reflectionStatusLabel(status) {
    switch (status) {
        case 'submitted':
            return 'Submitted';
        case 'draft':
            return 'Draft';
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
        case 'draft':
            return 'warning';
        case 'not-started':
            return 'secondary';
        default:
            return 'secondary';
    }
}
