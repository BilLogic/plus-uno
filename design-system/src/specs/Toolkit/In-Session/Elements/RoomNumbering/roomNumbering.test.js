import { describe, it, expect } from 'vitest';
import {
    bufferFor,
    initialAssignment,
    assignStudent,
    moveStudent,
    addStudent,
    setAbsent,
    inheritStudents,
    studentsOf,
} from './roomNumbering.js';

/** 4 tutors × 4 students, buffer 3 → blocks of 7, total 28 (the spec's worked example). */
const roster = () => [
    { id: 'savannah', name: 'Savannah', students: [
        { id: 'ava', name: 'Ava' }, { id: 'ben', name: 'Ben' }, { id: 'chloe', name: 'Chloe' }, { id: 'ethan', name: 'Ethan' },
    ] },
    { id: 'maya', name: 'Maya', students: [
        { id: 's5', name: 'S5' }, { id: 's6', name: 'S6' }, { id: 's7', name: 'S7' }, { id: 'liam', name: 'Liam' },
    ] },
    { id: 'noah', name: 'Noah', students: [
        { id: 's9', name: 'S9' }, { id: 's10', name: 'S10' }, { id: 's11', name: 'S11' }, { id: 's12', name: 'S12' },
    ] },
    { id: 'priya', name: 'Priya', students: [
        { id: 's13', name: 'S13' }, { id: 's14', name: 'S14' }, { id: 's15', name: 'S15' }, { id: 's16', name: 'S16' },
    ] },
];

const room = (state, id) => state.assignments[id].room;

describe('bufferFor (rule 1 — scaled buffer)', () => {
    it('is 3 for ≤4 tutors, 2 for 5–8, 1 for 9+', () => {
        expect(bufferFor(1)).toBe(3);
        expect(bufferFor(4)).toBe(3);
        expect(bufferFor(5)).toBe(2);
        expect(bufferFor(8)).toBe(2);
        expect(bufferFor(9)).toBe(1);
        expect(bufferFor(20)).toBe(1);
    });
});

describe('initialAssignment (rules 1–2)', () => {
    it('freezes blocks of assigned+buffer and sums the room count', () => {
        const s = initialAssignment(roster());
        expect(s.buffer).toBe(3);
        expect(s.blocks.savannah).toEqual({ start: 1, end: 7 });
        expect(s.blocks.maya).toEqual({ start: 8, end: 14 });
        expect(s.blocks.noah).toEqual({ start: 15, end: 21 });
        expect(s.blocks.priya).toEqual({ start: 22, end: 28 });
        expect(s.roomCount).toBe(28);
    });

    it('gives each student the lowest free number in their block', () => {
        const s = initialAssignment(roster());
        expect(room(s, 'ava')).toBe(1);
        expect(room(s, 'ethan')).toBe(4);
        expect(room(s, 'liam')).toBe(11); // Maya's 4th → 8,9,10,11
        expect(s.assignments.ava.outOfRange).toBe(false);
    });
});

describe('move + recycle (rules 2–3)', () => {
    it('frees the old number and takes the lowest free in the destination block; no one else moves', () => {
        let s = initialAssignment(roster());
        const noahRoomsBefore = studentsOf(s, 'noah').map((x) => x.room);
        s = moveStudent(s, 'ethan', 'maya'); // Ethan leaves room 4 (Savannah), joins Maya
        expect(room(s, 'ethan')).toBe(12);   // Maya's block 8–14: 8,9,10,11 taken → 12
        // Savannah's room 4 is now free for recycling.
        s = addStudent(s, 'zoe', 'savannah', 'Zoe'); // rule 5 — recycled number
        expect(room(s, 'zoe')).toBe(4);
        // Noah's students never renumbered.
        expect(studentsOf(s, 'noah').map((x) => x.room)).toEqual(noahRoomsBefore);
    });
});

describe('absence (rule 4)', () => {
    it('keeps the number and does not free the room', () => {
        let s = initialAssignment(roster());
        s = setAbsent(s, 'liam', true);
        expect(room(s, 'liam')).toBe(11);
        expect(s.assignments.liam.absent).toBe(true);
        // A new student cannot take Liam's still-reserved room 11.
        s = addStudent(s, 'zoe', 'maya', 'Zoe');
        expect(room(s, 'zoe')).toBe(12);
    });
});

describe('block full — borrow + out-of-range (rule 7)', () => {
    it('borrows the lowest free number from another block and flags the row', () => {
        let s = initialAssignment(roster());
        // Fill Maya's block (8–14 = 7 rooms): she already has 4, add 3 more to fill, then one more overflows.
        s = addStudent(s, 'm5', 'maya', 'M5'); // 12
        s = addStudent(s, 'm6', 'maya', 'M6'); // 13
        s = addStudent(s, 'm7', 'maya', 'M7'); // 14 — block now full
        s = addStudent(s, 'm8', 'maya', 'M8'); // overflow → borrow lowest free anywhere
        expect(s.assignments.m8.outOfRange).toBe(true);
        expect(room(s, 'm8')).toBe(5); // Savannah's block has 4 (1–4 taken) → 5 free
    });
});

describe('tutor joins mid-session (rule 6)', () => {
    it('inherits students in place without renumbering or a new block', () => {
        let s = initialAssignment(roster());
        const before = studentsOf(s, 'priya').map((x) => x.room);
        s = inheritStudents(s, 'quinn', 'Quinn', ['s15', 's16']);
        expect(s.assignments.s15.tutorId).toBe('quinn');
        expect(room(s, 's15')).toBe(before[2]); // room unchanged
        expect(s.blocks.quinn).toBeUndefined();  // no new block
        expect(s.roomCount).toBe(28);            // unchanged
    });
});
