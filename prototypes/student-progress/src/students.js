/**
 * Seeded roster for the Student Progress prototype.
 *
 * Fixed data by design (brief: complexity dial low-mid, no data layer). The
 * spread is deliberate: three on-track, two needs-attention, one at-risk, so
 * the "needs attention" filter visibly removes half the list — a filter that
 * barely changes the view can't be usability-tested.
 *
 * `outcome` is modelled as a small closed set rather than free text. The PRD
 * says only "outcome" without defining it; this is the assumption under test
 * (see the manifest's openQuestions).
 */

/** Progress states, ordered worst-first — the roster sorts by this. */
export const PROGRESS_STATES = {
    'at-risk': { label: 'At risk', badgeStyle: 'danger', icon: 'fa-triangle-exclamation', rank: 0 },
    'needs-attention': { label: 'Needs attention', badgeStyle: 'warning', icon: 'fa-circle-exclamation', rank: 1 },
    'on-track': { label: 'On track', badgeStyle: 'success', icon: 'fa-circle-check', rank: 2 },
};

/** Session outcomes — a closed set so the prototype pins down what "outcome" means. */
export const OUTCOMES = {
    strong: { label: 'Strong', badgeStyle: 'success' },
    steady: { label: 'Steady', badgeStyle: 'info' },
    struggled: { label: 'Struggled', badgeStyle: 'warning' },
    missed: { label: 'Missed', badgeStyle: 'danger' },
};

/** A tutor is "not on track" when their state is anything other than on-track. */
export const isNotOnTrack = (student) => student.progress !== 'on-track';

export const STUDENTS = [
    {
        id: 'stu-arjun',
        name: 'Arjun Mehta',
        grade: 'Grade 9 · Algebra I',
        sessionsCompleted: 4,
        sessionsPlanned: 12,
        progress: 'at-risk',
        sessions: [
            { date: '2026-07-22', topic: 'Quadratic factoring', outcome: 'missed' },
            { date: '2026-07-15', topic: 'Quadratic factoring', outcome: 'missed' },
            { date: '2026-07-08', topic: 'Systems of equations', outcome: 'struggled' },
            { date: '2026-07-01', topic: 'Graphing linear functions', outcome: 'struggled' },
            { date: '2026-06-24', topic: 'Slope and intercepts', outcome: 'steady' },
        ],
    },
    {
        id: 'stu-priya',
        name: 'Priya Nair',
        grade: 'Grade 10 · Geometry',
        sessionsCompleted: 8,
        sessionsPlanned: 12,
        progress: 'needs-attention',
        sessions: [
            { date: '2026-07-23', topic: 'Circle theorems', outcome: 'struggled' },
            { date: '2026-07-16', topic: 'Triangle congruence', outcome: 'steady' },
            { date: '2026-07-09', topic: 'Triangle congruence', outcome: 'struggled' },
            { date: '2026-07-02', topic: 'Angle relationships', outcome: 'missed' },
            { date: '2026-06-25', topic: 'Coordinate proofs', outcome: 'steady' },
        ],
    },
    {
        id: 'stu-marcus',
        name: 'Marcus Lee',
        grade: 'Grade 8 · Pre-Algebra',
        sessionsCompleted: 6,
        sessionsPlanned: 12,
        progress: 'needs-attention',
        sessions: [
            { date: '2026-07-21', topic: 'Ratios and proportions', outcome: 'steady' },
            { date: '2026-07-14', topic: 'Percent word problems', outcome: 'struggled' },
            { date: '2026-07-07', topic: 'Percent word problems', outcome: 'missed' },
            { date: '2026-06-30', topic: 'Integer operations', outcome: 'steady' },
            { date: '2026-06-23', topic: 'Order of operations', outcome: 'strong' },
        ],
    },
    {
        id: 'stu-aisha',
        name: 'Aisha Khan',
        grade: 'Grade 11 · Algebra II',
        sessionsCompleted: 11,
        sessionsPlanned: 12,
        progress: 'on-track',
        sessions: [
            { date: '2026-07-24', topic: 'Logarithmic equations', outcome: 'strong' },
            { date: '2026-07-17', topic: 'Exponential growth', outcome: 'strong' },
            { date: '2026-07-10', topic: 'Polynomial division', outcome: 'steady' },
            { date: '2026-07-03', topic: 'Rational expressions', outcome: 'strong' },
            { date: '2026-06-26', topic: 'Complex numbers', outcome: 'steady' },
        ],
    },
    {
        id: 'stu-diego',
        name: 'Diego Alvarez',
        grade: 'Grade 9 · Algebra I',
        sessionsCompleted: 10,
        sessionsPlanned: 12,
        progress: 'on-track',
        sessions: [
            { date: '2026-07-23', topic: 'Inequalities', outcome: 'strong' },
            { date: '2026-07-16', topic: 'Absolute value equations', outcome: 'steady' },
            { date: '2026-07-09', topic: 'Systems of equations', outcome: 'strong' },
            { date: '2026-07-02', topic: 'Graphing linear functions', outcome: 'steady' },
            { date: '2026-06-25', topic: 'Slope and intercepts', outcome: 'strong' },
        ],
    },
    {
        id: 'stu-sam',
        name: 'Sam Chen',
        grade: 'Grade 10 · Geometry',
        sessionsCompleted: 9,
        sessionsPlanned: 12,
        progress: 'on-track',
        sessions: [
            { date: '2026-07-22', topic: 'Surface area and volume', outcome: 'steady' },
            { date: '2026-07-15', topic: 'Similar figures', outcome: 'strong' },
            { date: '2026-07-08', topic: 'Pythagorean theorem', outcome: 'strong' },
            { date: '2026-07-01', topic: 'Angle relationships', outcome: 'steady' },
            { date: '2026-06-24', topic: 'Coordinate proofs', outcome: 'steady' },
        ],
    },
];

/** Empty roster — exercises the "no assigned students" acceptance criterion. */
export const NO_STUDENTS = [];
