import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
/** Same layout as home-redesign reference: spec PageLayout (correct container: background, border, TopBar, Sidebar, content wrapper). */
import { PageLayout } from '@/specs/Universal/Pages';
import Button from '@/components/Button';
import Badge from '@/components/Badge';
import ManageAssignmentModal from './ManageAssignmentModal';

import StudentInsightsModal from './StudentInsightsModal';
import { CompactReflectionBar } from './ReflectionAssistant/CompactReflectionBar';
import { ReflectionAssistantChat } from './ReflectionAssistant/ReflectionAssistantChat';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Replicates Design System - Web App Specs node 1687-173829: "Your Students" page.
 * Header: breadcrumbs, user John Doe Lead. Controls: Status dropdown, session dropdown, Copy assignments, Manage Session.
 * Table: Name ↑, Status ↑ (badges per 157-180925), Attendance (1952-149731), Engagement (1952-149739), Action: "See Details" only.
 * Shell reveal pacing matches homepage: skeleton ~400ms then TopBar + Sidebar animate in (TopBar 0.6s, Sidebar 0.65s with 100ms delay).
 * @returns {JSX.Element} Your Students page
 */
const InSessionPage = () => {
    const [isManageAssignmentOpen, setIsManageAssignmentOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [isInsightsModalOpen, setIsInsightsModalOpen] = useState(false);
    /** Tracks which student name cell is hovered for hover affordance. */
    const [hoveredStudentId, setHoveredStudentId] = useState(null);
    /** Shell pacing (same as homepage): skeleton then TopBar + Sidebar reveal. */
    const [shellLoading, setShellLoading] = useState(true);
    const [shellReady, setShellReady] = useState(false);
    const [shellEntered, setShellEntered] = useState(false);

    // Content loading state (Skeleton -> Progressive Reveal)
    const [contentReady, setContentReady] = useState(false);
    const [contentVisible, setContentVisible] = useState(false);
    const [hasEntered, setHasEntered] = useState(false);

    // Chat / Reflection States
    const [chatExpanded, setChatExpanded] = useState(false);
    const [initialReflectionPrompt, setInitialReflectionPrompt] = useState('');

    const navigate = useNavigate();

    /** Session context per Figma 1687-173829: Hogwarts (Prof. Snape), 11:25 - 12:25pm, 12/21/2023 */
    const sessionContext = {
        sessionLabel: 'Hogwarts (Prof. Snape), 11:25 - 12:25pm, 12/21/2023'
    };

    /**
     * Status badge mapping per Figma 157-180925: Needs to set goals (teal), Needs motivation (red-purple),
     * Needs challenge (olive), Needs content help (light purple), On track (green).
     * PLUS DS Badge style mapping.
     */
    const STATUS_STYLE_MAP = {
        'Needs to set goals': 'tertiary',
        'Needs motivation': 'danger',
        'Needs challenge': 'warning',
        'Needs content help': 'secondary',
        'On track': 'success'
    };

    /** Your Students list with varied status, filled attendance and engagement. */
    const yourStudents = [
        { id: 1, name: 'Arlene McCoy', status: 'Needs motivation', attendance: 'joined', engagement: 'fully-engaged' },
        { id: 2, name: 'Morgan Reed', status: 'Needs to set goals', attendance: 'joined', engagement: 'partially-engaged' },
        { id: 3, name: 'Taylor Brooks', status: 'On track', attendance: 'joined', engagement: 'fully-engaged' },
        { id: 4, name: 'Casey Jordan', status: 'Needs content help', attendance: 'did-not-join', engagement: 'not-engaged' },
        { id: 5, name: 'Jordan Avery', status: 'Needs challenge', attendance: 'joined', engagement: 'partially-engaged' }
    ];

    /** Attendance options per Figma 1952-149731 */
    const ATTENDANCE_OPTIONS = [
        { value: '', label: 'Select' },
        { value: 'joined', label: 'Joined' },
        { value: 'did-not-join', label: 'Did not join' }
    ];

    /** Engagement options per Figma 1952-149739 */
    const ENGAGEMENT_OPTIONS = [
        { value: '', label: 'Select' },
        { value: 'fully-engaged', label: 'Fully engaged on Zoom' },
        { value: 'partially-engaged', label: 'Partially engaged' },
        { value: 'not-engaged', label: 'Not engaged at all' }
    ];

    const openStudentInsights = (student) => {
        setSelectedStudent(student);
        setIsInsightsModalOpen(true);
    };

    const closeInsightsModal = () => {
        setIsInsightsModalOpen(false);
        setSelectedStudent(null);
    };

    /**
     * Opens student insights when Enter or Space is pressed on the name cell (accessibility).
     * @param {React.KeyboardEvent} e - Keyboard event
     * @param {Object} student - Student object to open insights for
     */
    const handleNameKeyDown = (e, student) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openStudentInsights(student);
        }
    };

    const getStatusBadgeStyle = (status) => STATUS_STYLE_MAP[status] || 'secondary';

    /** Shell + Content: sync skeleton exit at 600ms (match App.jsx). */
    useEffect(() => {
        const t = setTimeout(() => {
            setShellLoading(false);
            setShellReady(true);
            setContentReady(true);
        }, 600);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (!shellReady) return;
        const id = requestAnimationFrame(() => setShellEntered(true));
        return () => cancelAnimationFrame(id);
    }, [shellReady]);

    /** Content: 330ms delay after contentReady starts, then reveals. */
    useEffect(() => {
        if (!contentReady) return;
        const t = setTimeout(() => setContentVisible(true), 330);
        return () => clearTimeout(t);
    }, [contentReady]);

    useEffect(() => {
        if (!contentVisible) return;
        const id = requestAnimationFrame(() => setHasEntered(true));
        return () => cancelAnimationFrame(id);
    }, [contentVisible]);

    return (
        <PageLayout
            shellLoading={shellLoading}
            shellEntered={shellEntered}
            topBarConfig={{
                breadcrumbs: [
                    { text: 'Sessions', href: '#' },
                    { text: sessionContext.sessionLabel, href: '#' },
                    ...(chatExpanded ? [{ text: 'Session Reflection', href: '#' }] : [])
                ],
                user: { name: 'Boyuan Guo', counter: null, counterValue: null, type: 'lead tutor' }
            }}
            sidebarConfig={{
                user: 'tutor',
                activeTab: 'sessions',
                onHomeClick: () => navigate('/home'),
                onTabClick: (id) => {
                    if (id === 'sessions') navigate('/sessions');
                    if (id === 'tutors') navigate('/admin');
                }
            }}
            id="sessions-in-session-page"
            mainClassName={!chatExpanded ? "sessions-content" : ""}
            contentDirect={chatExpanded}
            floatingContent={
                !chatExpanded ? (
                    <div style={{ maxWidth: 420 }}>
                        <CompactReflectionBar onExpand={(prompt) => {
                            if (prompt) setInitialReflectionPrompt(prompt);
                            setChatExpanded(true);
                        }} />
                    </div>
                ) : null
            }
        >
            <AnimatePresence mode="wait">
                {chatExpanded ? (
                    <motion.div
                        key="chat"
                        initial={{ opacity: 0, scale: 0.995 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.995 }}
                        transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            flex: 1,
                            minHeight: 0,
                            width: '100%',
                            height: '100%',
                            position: 'relative',
                        }}
                    >
                        <ReflectionAssistantChat
                            initialPrompt={initialReflectionPrompt}
                            onBack={() => {
                                setChatExpanded(false);
                                setInitialReflectionPrompt('');
                            }}
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="content"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`sessions-main-reveal ${hasEntered ? 'has-entered' : ''}`}
                        style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', width: '100%' }}
                    >
                        {/* Styles for animation and skeletons */}
                        <style>{`
                            @keyframes revealIn {
                                from { opacity: 0; transform: translateY(16px); }
                                to { opacity: 1; transform: translateY(0); }
                            }
                            @keyframes skeleton-shimmer {
                                0% { background-position: 200% 0; }
                                100% { background-position: -200% 0; }
                            }
                            .skeleton-block {
                                background: linear-gradient(90deg, 
                                    var(--color-surface-container-highest) 0%, 
                                    var(--color-surface-container) 50%, 
                                    var(--color-surface-container-highest) 100%);
                                background-size: 200% 100%;
                                animation: skeleton-shimmer 1.5s ease-in-out infinite;
                                border-radius: 4px;
                            }
                            .model-reveal {
                                opacity: 0;
                                animation: revealIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                            }
                            /* Student Row Interaction */
                            .student-row {
                                transition: background-color 0.2s ease;
                                cursor: pointer;
                            }
                            .student-row:hover {
                                background-color: var(--color-surface-container-highest) !important; 
                            }
                        `}</style>
                        {!contentVisible ? (
                            <div className={`page-skeleton-root ${contentReady ? 'is-exiting' : ''}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
                                <div className="skeleton-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', paddingTop: '16px' }}>
                                    <div className="skeleton-block" style={{ width: '200px', height: '32px' }} />
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <div className="skeleton-block" style={{ width: '120px', height: '36px' }} />
                                        <div className="skeleton-block" style={{ width: '120px', height: '36px' }} />
                                    </div>
                                </div>
                                <div className="skeleton-table">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <div key={i} className="skeleton-block" style={{ width: '100%', height: '52px', marginBottom: '8px', borderRadius: '4px' }} />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="page-reveal-content" style={{ display: 'flex', flexDirection: 'column' }}>
                                {/* Header Section */}
                                <div className="page-content-reveal header-reveal" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingTop: '16px', animationDelay: '0ms' }}>
                                    <h1 className="h4" style={{ margin: 0 }}>Your Students</h1>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <Button text="Copy assignments" style="secondary" fill="outline" size="small" leadingVisual={<i className="fa-solid fa-copy" />} />
                                        <Button text="Manage Session" style="primary" fill="outline" size="small" leadingVisual={<i className="fa-solid fa-gear" />} onClick={() => setIsManageAssignmentOpen(true)} />
                                    </div>
                                </div>

                                {/* Table Container */}
                                <div className="page-content-reveal table-reveal" style={{ width: '100%', animationDelay: '280ms' }}>
                                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left', color: 'var(--color-on-surface-variant)', fontSize: '12px' }}>
                                                <th style={{ padding: '8px 16px', fontWeight: 500 }}>Name <i className="fa-solid fa-arrow-up" style={{ fontSize: '10px', marginLeft: '4px' }} /></th>
                                                <th style={{ padding: '8px 16px', fontWeight: 500 }}>Status <i className="fa-solid fa-arrow-up" style={{ fontSize: '10px', marginLeft: '4px' }} /></th>
                                                <th style={{ padding: '8px 16px', fontWeight: 500 }}>Attendance</th>
                                                <th style={{ padding: '8px 16px', fontWeight: 500 }}>Engagement</th>
                                                <th style={{ padding: '8px 16px', fontWeight: 500, textAlign: 'right' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {yourStudents.map((s, i) => (
                                                <tr
                                                    key={s.id}
                                                    className="model-reveal student-row"
                                                    style={{
                                                        animationDelay: `${560 + i * 100}ms`
                                                    }}
                                                >
                                                    <td
                                                        style={{
                                                            padding: '12px 16px',
                                                            borderTopLeftRadius: '8px',
                                                            borderBottomLeftRadius: '8px',
                                                            color: 'var(--color-on-surface)',
                                                            textDecoration: hoveredStudentId === s.id ? 'underline' : 'none',
                                                            cursor: 'pointer'
                                                        }}
                                                        onMouseEnter={() => setHoveredStudentId(s.id)}
                                                        onMouseLeave={() => setHoveredStudentId(null)}
                                                        onClick={() => openStudentInsights(s)}
                                                    >
                                                        {s.name}
                                                    </td>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <Badge text={s.status} style={getStatusBadgeStyle(s.status)} size="b3" fill="tonal" />
                                                    </td>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <select className="form-select form-select-sm" style={{ width: 'auto', minWidth: '120px' }} value={s.attendance || ''} onChange={() => { }}>
                                                            {ATTENDANCE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                                        </select>
                                                    </td>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <select className="form-select form-select-sm" style={{ width: 'auto', minWidth: '160px' }} value={s.engagement || ''} onChange={() => { }}>
                                                            {ENGAGEMENT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                                        </select>
                                                    </td>
                                                    <td style={{ padding: '12px 16px', textAlign: 'right', borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }}>
                                                        <Button
                                                            text="See Details"
                                                            style="secondary"
                                                            fill="outline"
                                                            size="small"
                                                            onClick={() => openStudentInsights(s)}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {isManageAssignmentOpen && (
                <ManageAssignmentModal onClose={() => setIsManageAssignmentOpen(false)} />
            )}

            {isInsightsModalOpen && selectedStudent && (
                <StudentInsightsModal
                    student={selectedStudent}
                    allStudents={yourStudents}
                    onClose={closeInsightsModal}
                    onSelectStudent={setSelectedStudent}
                    containerSelector="#root > div > .plus-page-main-container"
                />
            )}

        </PageLayout>
    );
};

export default InSessionPage;
