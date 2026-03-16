/**
 * Training Progress prototype — replicates Figma node 367-146235.
 * Uses the spec TutorTrainingProgressPage (Training Progress tab, overview cards, details table).
 * Clicking a tutor row opens TutorLessonDetailsModal with lesson details for that tutor.
 */
import React, { useState } from 'react';
import TutorTrainingProgressPage from '@/specs/Admin/Tutor Admin/Pages/TutorTrainingProgressPage/TutorTrainingProgressPage';
import TutorLessonDetailsModal from './TutorLessonDetailsModal';

const TrainingProgressPage = () => {
    const [isLessonDetailsModalOpen, setIsLessonDetailsModalOpen] = useState(false);
    const [selectedTutor, setSelectedTutor] = useState(null);

    const handleRowClick = (tutor) => {
        setSelectedTutor(tutor);
        setIsLessonDetailsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsLessonDetailsModalOpen(false);
        setSelectedTutor(null);
    };

    return (
        <>
            <TutorTrainingProgressPage
                activeTab="trainingProgress"
                currentPage={1}
                totalPages={20}
                totalEntries={36}
                onRowClick={handleRowClick}
            />
            {isLessonDetailsModalOpen && (
                <TutorLessonDetailsModal
                    tutor={selectedTutor}
                    onClose={handleCloseModal}
                />
            )}
        </>
    );
};

export default TrainingProgressPage;
