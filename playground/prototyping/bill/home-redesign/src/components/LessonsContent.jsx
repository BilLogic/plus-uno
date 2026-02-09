import React, { useEffect, useContext } from 'react';
import { ShellContext } from '../context/ShellContext';

export const LessonsContent = () => {
    const { setBreadcrumbs, setFloatingContent } = useContext(ShellContext);

    useEffect(() => {
        setBreadcrumbs([
            { text: 'Home', href: '/home' },
            { text: 'Lessons' }
        ]);
        setFloatingContent(null);
    }, [setBreadcrumbs, setFloatingContent]);

    return (
        <div style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--size-surface-radius, 16px)',
            padding: 'var(--Surface-pad-y, 24px) var(--Surface-pad-x, 32px)',
            width: '100%',
            height: '100%',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center'
        }}>
            <h1 style={{ marginBottom: '1rem', fontFamily: 'var(--font-family-header)' }}>Supporting a Growth Mindset</h1>
            <p className="body1-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                This prototype is currently under development.
            </p>
        </div>
    );
};
