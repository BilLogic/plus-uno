export const SESSIONS = [
    {
        value: 'session-1',
        label: 'Tuesday 3:30 PM — Math Foundations (Mar 18)',
    },
    {
        value: 'session-2',
        label: 'Wednesday 4:00 PM — Reading Comprehension (Mar 19)',
    },
    {
        value: 'session-3',
        label: 'Thursday 2:00 PM — Science Lab (Mar 20)',
    },
];

export const STUDENTS = [
    { id: 'stu-1', name: 'Maya Johnson', grade: '5th Grade' },
    { id: 'stu-2', name: 'Carlos Rivera', grade: '5th Grade' },
    { id: 'stu-3', name: 'Aisha Patel', grade: '4th Grade' },
    { id: 'stu-4', name: 'Ethan Kim', grade: '5th Grade' },
];

export const ATTENDANCE_OPTIONS = [
    { value: 'present', label: 'Present' },
    { value: 'absent', label: 'Absent' },
    { value: 'late', label: 'Late' },
];

export const CANCELLATION_REASONS = [
    { value: 'student-absent', label: 'Student(s) absent' },
    { value: 'tutor-unavailable', label: 'Tutor unavailable' },
    { value: 'scheduling-conflict', label: 'Scheduling conflict' },
    { value: 'holiday', label: 'Holiday / School closure' },
    { value: 'technical-issue', label: 'Technical issue' },
    { value: 'other', label: 'Other' },
];

export const ENGAGEMENT_LEVELS = [
    { value: 'low', label: 'Low' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'high', label: 'High' },
];

export const UNDERSTANDING_LEVELS = [
    { value: 'struggling', label: 'Struggling' },
    { value: 'developing', label: 'Developing' },
    { value: 'proficient', label: 'Proficient' },
];

export const CONCERN_AREAS = [
    { value: 'academic-struggle', label: 'Academic struggle' },
    { value: 'behavioral', label: 'Behavioral concerns' },
    { value: 'emotional', label: 'Emotional / well-being' },
    { value: 'attendance', label: 'Attendance pattern' },
    { value: 'engagement', label: 'Low engagement' },
    { value: 'family', label: 'Family / home situation' },
    { value: 'other', label: 'Other' },
];

export const SEVERITY_OPTIONS = [
    { value: 'low', label: 'Low — Informational' },
    { value: 'medium', label: 'Medium — Monitor closely' },
    { value: 'high', label: 'High — Needs attention this week' },
    { value: 'urgent', label: 'Urgent — Immediate action required' },
];

export const STRATEGIES = [
    { value: 'modeling', label: 'Modeling' },
    { value: 'scaffolding', label: 'Scaffolding' },
    { value: 'direct-instruction', label: 'Direct Instruction' },
    { value: 'collaborative-learning', label: 'Collaborative Learning' },
    { value: 'guided-practice', label: 'Guided Practice' },
    { value: 'formative-assessment', label: 'Formative Assessment' },
    { value: 'differentiation', label: 'Differentiation' },
    { value: 'questioning-techniques', label: 'Questioning Techniques' },
    { value: 'visual-aids', label: 'Visual Aids / Manipulatives' },
    { value: 'peer-tutoring', label: 'Peer Tutoring' },
];

export const EFFECTIVENESS_OPTIONS = [
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '4', label: '4' },
    { value: '5', label: '5' },
];

export const WOULD_USE_AGAIN_OPTIONS = [
    { value: 'yes', label: 'Yes' },
    { value: 'maybe', label: 'Maybe' },
    { value: 'no', label: 'No' },
];

export const RECOMMENDED_ACTIONS = [
    { value: 'parent-contact', label: 'Contact parent/guardian' },
    { value: 'supervisor-meeting', label: 'Schedule supervisor meeting' },
    { value: 'counselor-referral', label: 'Refer to school counselor' },
    { value: 'academic-support', label: 'Additional academic support' },
    { value: 'behavior-plan', label: 'Create behavior plan' },
    { value: 'schedule-change', label: 'Adjust tutoring schedule' },
    { value: 'other', label: 'Other (describe above)' },
];

export const STEP_CONFIG = [
    { id: 1, label: 'Session Information', icon: 'fa-regular fa-calendar' },
    { id: 2, label: 'Session Overview', icon: 'fa-regular fa-clipboard' },
    { id: 3, label: 'Student Check-In', icon: 'fa-regular fa-users' },
    { id: 4, label: 'Student Deep Dive', icon: 'fa-solid fa-magnifying-glass' },
    { id: 5, label: 'Teaching Strategies', icon: 'fa-solid fa-lightbulb' },
    { id: 6, label: 'Review & Submit', icon: 'fa-regular fa-paper-plane' },
];
