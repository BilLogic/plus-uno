/**
 * Mock sessions for Toolkit IA — session-centered prototype.
 */

export const MOCK_SESSIONS = [
    {
        id: 'ses-101',
        group: 'today',
        shortLabel: 'Algebra II — Jordan',
        studentName: 'Jordan Lee',
        course: 'Algebra II',
        timeLabel: 'Today · 3:00–3:45 PM',
        roomLabel: 'Virtual · Room 12',
        agenda: [
            'Warm-up: linear systems review',
            'Problem set 4.2 — guided practice',
            'Exit ticket: identify solution types',
        ],
        studentNotes:
            'Jordan prefers step-by-step scaffolding. Responds well to growth framing after missed problems.',
        goals: ['Improve confidence with word problems', 'Raise unit test average by one letter grade'],
        reflectionDraft:
            'Session focused on systems of equations. Jordan needed reassurance on substitution; by the end they solved two independently.',
    },
    {
        id: 'ses-102',
        group: 'today',
        shortLabel: 'Bio — Sam',
        studentName: 'Sam Rivera',
        course: 'Biology',
        timeLabel: 'Today · 4:15–5:00 PM',
        roomLabel: 'In person · Study pod B',
        agenda: ['Photosynthesis recap', 'Lab prep worksheet', 'Vocab check-in'],
        studentNotes: 'Sam is preparing for midterms; wants condensed study guides.',
        goals: ['Solidify cell energetics', 'Complete lab prep with fewer hints'],
        reflectionDraft: '',
    },
    {
        id: 'ses-103',
        group: 'upcoming',
        shortLabel: 'Reading — Avery',
        studentName: 'Avery Kim',
        course: 'ELA — Reading',
        timeLabel: 'Tomorrow · 9:00–9:40 AM',
        roomLabel: 'Virtual',
        agenda: ['Shared reading chunk', 'Inference prompts', 'Short written response'],
        studentNotes: 'Avery benefits from timers and clear checkpoints.',
        goals: ['Increase sustained reading stamina', 'Cite textual evidence in writing'],
        reflectionDraft: '',
    },
    {
        id: 'ses-104',
        group: 'upcoming',
        shortLabel: 'Chem — Dev',
        studentName: 'Dev Patel',
        course: 'Chemistry',
        timeLabel: 'Wed · 6:30–7:15 PM',
        roomLabel: 'Virtual',
        agenda: ['Stoichiometry drill', 'Limiting reagent intro', 'Practice set'],
        studentNotes: 'Strong on arithmetic; abstract ratios need visuals.',
        goals: ['Master mole-to-mole conversions', 'Complete practice set with <2 hints'],
        reflectionDraft: '',
    },
];

export function sessionById(id) {
    return MOCK_SESSIONS.find((s) => s.id === id) ?? null;
}
