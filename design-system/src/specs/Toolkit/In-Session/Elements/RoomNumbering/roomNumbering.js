/**
 * Room Numbering v2 — normative algorithm
 * (Notion "Session Counts & Room Indicators", Hand-off Spec, v2, Jul 2026).
 *
 * Each tutor owns a frozen block of consecutive Zoom breakout-room numbers sized
 * `assigned_students + buffer`, where buffer scales with tutor count (3 / 2 / 1).
 * A student's number is the lowest free number in their tutor's block; freed numbers
 * recycle. When a block is full a student borrows the lowest free number from any
 * other block (rule 7) and their row is flagged out-of-range. Blocks never resize,
 * so `total rooms ≥ current students` holds by construction and a borrow always
 * succeeds.
 *
 * State is plain data; every operation returns a new state (no mutation), so it is
 * trivial to drive from React or to unit-test.
 *
 *   state = {
 *     order:       [tutorId, …],                 // grouping order
 *     tutors:      { [tutorId]: { id, name } },
 *     blocks:      { [tutorId]: { start, end } }, // inclusive, 1-indexed, frozen
 *     roomCount:   number,                        // Σ block sizes (header badge)
 *     buffer:      number,
 *     assignments: { [studentId]: { tutorId, name, room, outOfRange, absent } },
 *   }
 */

/** Buffer per tutor, scaled by tutor count (rule 1). */
export function bufferFor(tutorCount) {
    if (tutorCount <= 4) return 3;
    if (tutorCount <= 8) return 2;
    return 1;
}

/** Rooms currently held by students, optionally freeing one student first (recycling). */
function heldRooms(state, exceptStudentId = null) {
    const held = new Set();
    for (const [sid, a] of Object.entries(state.assignments)) {
        if (sid === exceptStudentId) continue;
        if (a.room != null) held.add(a.room);
    }
    return held;
}

/** Lowest free room within a tutor's block, or null when the block is full. */
function lowestFreeInBlock(state, tutorId, held) {
    const b = state.blocks[tutorId];
    if (!b) return null;
    for (let r = b.start; r <= b.end; r++) if (!held.has(r)) return r;
    return null;
}

/** Lowest free room anywhere (used to borrow when a block is full — rule 7). */
function lowestFreeAnywhere(state, held) {
    for (let r = 1; r <= state.roomCount; r++) if (!held.has(r)) return r;
    return null;
}

/**
 * Assign (or reassign) a student to a tutor: lowest free number in that tutor's
 * block (rule 2), borrowing the lowest free number elsewhere if the block is full
 * (rule 7, which flags the row out-of-range). Reassigning frees the student's
 * current number first, so moves recycle it.
 */
export function assignStudent(state, studentId, tutorId, name) {
    const prev = state.assignments[studentId];
    const held = heldRooms(state, studentId);
    let room = lowestFreeInBlock(state, tutorId, held);
    let outOfRange = false;
    if (room == null) {
        room = lowestFreeAnywhere(state, held);
        outOfRange = room != null; // borrowed from another block
    }
    const assignments = {
        ...state.assignments,
        [studentId]: {
            tutorId,
            name: name ?? prev?.name ?? studentId,
            room,
            outOfRange,
            absent: prev?.absent ?? false,
        },
    };
    return { ...state, assignments };
}

/** Build the frozen block layout and assign every initial student (rule 1 + 2). */
export function initialAssignment(roster) {
    const buffer = bufferFor(roster.length);
    const order = roster.map((t) => t.id);
    const tutors = {};
    const blocks = {};
    let cursor = 1;
    for (const t of roster) {
        const size = t.students.length + buffer;
        blocks[t.id] = { start: cursor, end: cursor + size - 1 };
        tutors[t.id] = { id: t.id, name: t.name };
        cursor += size;
    }
    let state = { order, tutors, blocks, roomCount: cursor - 1, buffer, assignments: {} };
    for (const t of roster) {
        for (const s of t.students) {
            state = assignStudent(state, s.id, t.id, s.name);
        }
    }
    return state;
}

/** Move a student to another tutor: free the old number, assign in the destination (rule 3). */
export function moveStudent(state, studentId, toTutorId) {
    const cur = state.assignments[studentId];
    if (!cur) return state;
    return assignStudent(state, studentId, toTutorId, cur.name);
}

/** Add a new student to a tutor mid-session — recycled numbers included (rule 5). */
export function addStudent(state, studentId, tutorId, name) {
    return assignStudent(state, studentId, tutorId, name);
}

/** Mark a student absent — keeps their number, room stays empty (rule 4). No numbering change. */
export function setAbsent(state, studentId, absent = true) {
    const cur = state.assignments[studentId];
    if (!cur) return state;
    return { ...state, assignments: { ...state.assignments, [studentId]: { ...cur, absent } } };
}

/**
 * A tutor joins mid-session and inherits students in place: rooms unchanged, no new
 * block is created (rule 6). The buffer/room-count stay frozen.
 */
export function inheritStudents(state, newTutorId, name, studentIds) {
    const tutors = { ...state.tutors, [newTutorId]: { id: newTutorId, name } };
    const order = state.order.includes(newTutorId) ? state.order : [...state.order, newTutorId];
    const assignments = { ...state.assignments };
    for (const sid of studentIds) {
        if (assignments[sid]) assignments[sid] = { ...assignments[sid], tutorId: newTutorId };
    }
    return { ...state, tutors, order, assignments };
}

/** Students of a tutor, sorted by room number (for rendering a tutor's roster). */
export function studentsOf(state, tutorId) {
    return Object.entries(state.assignments)
        .filter(([, a]) => a.tutorId === tutorId)
        .map(([id, a]) => ({ id, ...a }))
        .sort((x, y) => (x.room ?? 0) - (y.room ?? 0));
}
