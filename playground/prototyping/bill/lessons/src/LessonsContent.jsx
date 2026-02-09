import React, { useState, useEffect, useContext } from 'react';
import { ShellContext } from '../../home-redesign/src/App';

/**
 * LessonsContent: Content-only version for use inside ShellLayout.
 * Uses ShellContext to update TopBar breadcrumbs.
 */
const LessonsContent = () => {
    const { setBreadcrumbs } = useContext(ShellContext);
    const [hasEntered, setHasEntered] = useState(false);

    useEffect(() => {
        setBreadcrumbs([
            { text: 'Training', href: '#' },
            { text: 'Lessons', href: '#' },
            { text: 'Supporting a Growth Mindset' }
        ]);
    }, [setBreadcrumbs]);

    useEffect(() => {
        requestAnimationFrame(() => setHasEntered(true));
    }, []);

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
            textAlign: 'center',
            opacity: hasEntered ? 1 : 0,
            transform: hasEntered ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease'
        }}>
            <h1 style={{ marginBottom: '1rem', fontFamily: 'var(--font-family-header)' }}>Supporting a Growth Mindset</h1>
            <p className="body1-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                This prototype is currently under development.
            </p>
        </div>
    );
};

export default LessonsContent;
