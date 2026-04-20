import React, { useState } from 'react';
import SessionAdminDashboard from './SessionAdminDashboard';
import SessionBreakdownModal from './SessionBreakdownModal';
import StudentGoalsDashboard from './StudentGoalsDashboard';
import AssignStudentModal from './AssignStudentModal';

function App() {
    const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'studentGoals'
    const [selectedSession, setSelectedSession] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);

    // Assign student modal state
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [assignTarget, setAssignTarget] = useState(null);

    const handleRowClick = (session) => {
        setSelectedSession(session);
        setIsModalOpen(true);
    };

    const handleAssignClick = (session, e) => {
        if (e) e.stopPropagation();
        setAssignTarget(session);
        setIsAssignModalOpen(true);
    };

    const handleStudentClick = (student) => {
        setSelectedStudent(student);
        setIsModalOpen(false);
        setCurrentView('studentGoals');
    };

    const handleBackToDashboard = () => {
        setCurrentView('dashboard');
        setSelectedStudent(null);
    };

    return (
        <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {currentView === 'dashboard' ? (
                <SessionAdminDashboard
                    onRowClick={handleRowClick}
                    onAssignClick={handleAssignClick}
                />
            ) : (
                <StudentGoalsDashboard
                    student={selectedStudent}
                    onBack={handleBackToDashboard}
                />
            )}

            {isModalOpen && (
                <SessionBreakdownModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    session={selectedSession}
                    onStudentClick={handleStudentClick}
                />
            )}

            {isAssignModalOpen && (
                <AssignStudentModal
                    isOpen={isAssignModalOpen}
                    onClose={() => setIsAssignModalOpen(false)}
                    targetItem={assignTarget}
                />
            )}
        </div>
    );
}

export default App;
