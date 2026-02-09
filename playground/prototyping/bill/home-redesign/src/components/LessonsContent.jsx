import React, { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShellContext } from '../context/ShellContext';
import ChatSimulationCard from './ChatSimulationCard';
import lessonCover from '../assets/supporting-growth-mindset.png';

export const LessonsContent = () => {
    const navigate = useNavigate();
    const { setBreadcrumbs, setFloatingContent, setMainClassName } = useContext(ShellContext);

    useEffect(() => {
        setBreadcrumbs([
            { text: 'Training', href: '#' },
            { text: 'Lessons', href: '/lessons/supporting-growth-mindset' },
            { text: 'Supporting a Growth Mindset' }
        ]);
        setFloatingContent(null);
        setMainClassName('');
    }, [setBreadcrumbs, setFloatingContent, setMainClassName]);

    return (
        <ChatSimulationCard
            coverImage={lessonCover}
            onClose={() => navigate('/home')}
            onComplete={() => navigate('/home')}
        />
    );
};

