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
        () => REFLECTIONS.find((row) => row.id === reflectionId) || null,
        [reflectionId],
    );

    if (!reflection) {
        return (
            <div style={{ padding: 'var(--size-section-gap-md)' }}>
                <h4 className="h4">Reflection not found</h4>
                <p className="body1-txt">No draft matches id “{reflectionId}”.</p>
                <button type="button" className="body2-txt" onClick={() => navigate('/')}>
                    Back to sessions
                </button>
            </div>
        );
    }

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
