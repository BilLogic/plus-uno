import React from 'react';
import { useNavigate } from 'react-router-dom';

const DevIndexPage = () => {
    const navigate = useNavigate();

    const prototypes = [
        { name: 'Home Redesign', path: '/home' },
        { name: 'Sessions (In Session)', path: '/sessions' },
        { name: 'Lessons', path: '/lessons' },
        { name: 'Weekly Reports', path: '/weekly-reports' },
        { name: 'Reflection Assistant', path: '/reflection' },
        { name: 'Tutor Admin (Research Assistant)', path: '/research-assistant' },
    ];

    return (
        <div style={{ padding: '40px', fontFamily: 'Inter, sans-serif' }}>
            <h1 style={{ marginBottom: '24px' }}>PLUS Prototypes</h1>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {prototypes.map((proto) => (
                    <li key={proto.path} style={{ marginBottom: '12px' }}>
                        <button
                            onClick={() => navigate(proto.path)}
                            style={{
                                padding: '12px 24px',
                                fontSize: '16px',
                                backgroundColor: 'var(--color-primary, #0472a8)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                width: '300px',
                                textAlign: 'left',
                                transition: 'opacity 0.2s'
                            }}
                            onMouseOver={(e) => e.target.style.opacity = '0.9'}
                            onMouseOut={(e) => e.target.style.opacity = '1'}
                        >
                            {proto.name}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default DevIndexPage;
