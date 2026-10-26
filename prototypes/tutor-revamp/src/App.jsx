import React from 'react';
import { Route, Routes, useParams } from 'react-router-dom';
import Home from './pages/Home';
import Placeholder from './pages/Placeholder';
import { SESSIONS, STUDENTS } from './data/mock';

const sessionTitle = (id) => SESSIONS.find((s) => s.id === id)?.title ?? 'Session';
const studentName = (id) => STUDENTS.find((s) => s.id === id)?.name ?? 'Student';

const SessionPage = ({ phase }) => {
    const { sessionId } = useParams();
    const title = sessionTitle(sessionId);
    const board = { before: 'Session', during: 'Insights', after: 'Reflect' }[phase];
    return <Placeholder title={title} board={board} breadcrumbs={[{ text: 'Sessions', to: '/sessions' }, { text: title }]} />;
};

const StudentPage = () => {
    const { studentId } = useParams();
    const name = studentName(studentId);
    return <Placeholder title={name} board="Student" breadcrumbs={[{ text: 'Students', to: '/students' }, { text: name }]} />;
};

/**
 * The tutor revamp's routes: the ten screens of the vision. Screens not built
 * yet render a placeholder in the shell.
 */
const App = () => (
    <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lessons" element={<Placeholder title="Lessons" board="Lessons" />} />
        <Route path="/lessons/:lessonId" element={<Placeholder title="Lesson" board="Lesson" breadcrumbs={[{ text: 'Lessons', to: '/lessons' }, { text: 'Lesson' }]} />} />
        <Route path="/onboarding" element={<Placeholder title="Onboarding" board="Onboarding" />} />
        <Route path="/sessions" element={<Placeholder title="Sessions" board="Sessions" />} />
        <Route path="/sessions/:sessionId" element={<SessionPage phase="before" />} />
        <Route path="/sessions/:sessionId/during" element={<SessionPage phase="during" />} />
        <Route path="/sessions/:sessionId/after" element={<SessionPage phase="after" />} />
        <Route path="/students" element={<Placeholder title="Students" board="Student" />} />
        <Route path="/students/:studentId" element={<StudentPage />} />
        <Route path="/reviews" element={<Placeholder title="Reviews" board="Review" />} />
        <Route path="*" element={<Placeholder title="Not found" board="Main" />} />
    </Routes>
);

export default App;
