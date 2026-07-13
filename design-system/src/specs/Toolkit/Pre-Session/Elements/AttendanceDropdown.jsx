// Attendance is shared across pre- and in-session. The In-Session copy is the single
// canonical source; this file re-exports it so the two phases can never drift apart.
// (Previously these were byte-identical duplicates maintained by hand.)
export * from '../../In-Session/Elements/AttendanceDropdown.jsx';
