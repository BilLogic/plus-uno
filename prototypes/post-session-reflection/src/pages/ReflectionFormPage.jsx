import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReflectionFlow from '@/specs/Toolkit/Post-Session/Pages/ReflectionFlow/ReflectionFlow';
import { REFLECTIONS } from '../data/reflections';

/**
 * Reflection form route — wraps the Storybook ReflectionFlow orchestrator.
 */
export default function ReflectionFormPage() {
    const { reflectionId } = useParams();
    const navigate = useNavigate();

    const reflection = useMemo(
        () => REFLECTIONS.find((row) => row.id === reflectionId) || REFLECTIONS[0],
        [reflectionId],
    );

    return (
        <ReflectionFlow
            students={reflection.students}
            initialSessionInfo={{
                date: reflection.dateIso || '',
                sessionOption: 'session-1',
                selectedStudentIds: (reflection.students || []).map((student) => student.id || student.name),
            }}
            onExit={() => navigate('/')}
        />
    );
}
