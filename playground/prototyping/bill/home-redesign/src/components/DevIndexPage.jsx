import React from 'react';
import { Link } from 'react-router-dom';

const DevIndexPage = () => {
    return (
        <div style={{
            padding: '40px',
            maxWidth: '800px',
            margin: '0 auto',
            fontFamily: 'var(--font-family-body, sans-serif)'
        }}>
            <h1 style={{ marginBottom: '24px', color: 'var(--color-on-surface, #000)' }}>PLUS Application Prototypes</h1>
            <p style={{ marginBottom: '32px', color: 'var(--color-on-surface-variant, #666)' }}>
                Select a prototype to view:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Link to="/home" style={linkStyle}>
                    <div style={{ fontWeight: 'bold', fontSize: '18px' }}>Home Redesign (Dashboard)</div>
                    <div style={{ fontSize: '14px', color: '#666' }}>The new student dashboard with progress cards.</div>
                </Link>

                <Link to="/admin" style={linkStyle}>
                    <div style={{ fontWeight: 'bold', fontSize: '18px' }}>Tutor Admin</div>
                    <div style={{ fontSize: '14px', color: '#666' }}>Admin view for managing tutors and training.</div>
                </Link>

                <Link to="/sessions" style={linkStyle}>
                    <div style={{ fontWeight: 'bold', fontSize: '18px' }}>Sessions</div>
                    <div style={{ fontSize: '14px', color: '#666' }}>In-session view with chat and reflection tools.</div>
                </Link>

                <Link to="/reflection" style={linkStyle}>
                    <div style={{ fontWeight: 'bold', fontSize: '18px' }}>Session Reflection</div>
                    <div style={{ fontSize: '14px', color: '#666' }}>Post-session reflection assistant.</div>
                </Link>

                <Link to="/research-assistant" style={linkStyle}>
                    <div style={{ fontWeight: 'bold', fontSize: '18px' }}>Research Assistant</div>
                    <div style={{ fontSize: '14px', color: '#666' }}>AI research assistant for tutors.</div>
                </Link>

                <Link to="/weekly-reports" style={linkStyle}>
                    <div style={{ fontWeight: 'bold', fontSize: '18px' }}>Weekly Reports</div>
                    <div style={{ fontSize: '14px', color: '#666' }}>Student weekly performance reports.</div>
                </Link>

                <Link to="/lessons" style={linkStyle}>
                    <div style={{ fontWeight: 'bold', fontSize: '18px' }}>Lessons</div>
                    <div style={{ fontSize: '14px', color: '#666' }}>A growth mindset simulation game.</div>
                </Link>
            </div>
        </div>
    );
};

const linkStyle = {
    display: 'block',
    padding: '24px',
    backgroundColor: 'var(--color-surface, #fff)',
    border: '1px solid var(--color-outline-variant, #e0e0e0)',
    borderRadius: '8px',
    textDecoration: 'none',
    color: 'var(--color-on-surface, #000)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
};

export default DevIndexPage;
