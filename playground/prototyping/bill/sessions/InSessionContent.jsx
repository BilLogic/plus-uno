import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/Button';
import Badge from '@/components/Badge';
import ManageAssignmentModal from './ManageAssignmentModal';
import StudentInsightsModal from './StudentInsightsModal';
import { CompactReflectionBar } from './ReflectionAssistant/CompactReflectionBar';
import { ReflectionAssistantChat } from './ReflectionAssistant/ReflectionAssistantChat';
import { ShellContext } from '../home-redesign/src/context/ShellContext';

/**
 * InSessionContent: Content-only version of InSessionPage for use inside ShellLayout.
 * No PageLayout wrapper - uses ShellContext to update TopBar/Layout config.
 */
const InSessionContent = () => {
    const navigate = useNavigate();
    const { setBreadcrumbs, setMainClassName, setFloatingContent, setContentDirect } = useContext(ShellContext);

    const [isManageAssignmentOpen, setIsManageAssignmentOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [isInsightsModalOpen, setIsInsightsModalOpen] = useState(false);
    const [hoveredStudentId, setHoveredStudentId] = useState(null);
    const [hasEntered, setHasEntered] = useState(false);

    // Chat / Reflection States
    const [chatExpanded, setChatExpanded] = useState(false);
    const [initialReflectionPrompt, setInitialReflectionPrompt] = useState('');
    const sessionsRootRef = useRef(null);

    const sessionContext = {
        sessionLabel: 'Hogwarts (Prof. Snape), 11:25 - 12:25pm, 12/21/2023'
    };

    const STATUS_STYLE_MAP = {
        'Needs to set goals': 'tertiary',
        'Needs motivation': 'danger',
        'Needs challenge': 'warning',
        'Needs content help': 'secondary',
        'On track': 'success'
    };

    const yourStudents = [
        { id: 1, name: 'Arlene McCoy', status: 'Needs motivation', attendance: 'joined', engagement: 'fully-engaged' },
        { id: 2, name: 'Morgan Reed', status: 'Needs to set goals', attendance: 'joined', engagement: 'partially-engaged' },
        { id: 3, name: 'Taylor Brooks', status: 'On track', attendance: 'joined', engagement: 'fully-engaged' },
        { id: 4, name: 'Casey Jordan', status: 'Needs content help', attendance: 'did-not-join', engagement: 'not-engaged' },
        { id: 5, name: 'Jordan Avery', status: 'Needs challenge', attendance: 'joined', engagement: 'partially-engaged' }
    ];

    const ATTENDANCE_OPTIONS = [
        { value: '', label: 'Select' },
        { value: 'joined', label: 'Joined' },
        { value: 'did-not-join', label: 'Did not join' }
    ];

    const ENGAGEMENT_OPTIONS = [
        { value: '', label: 'Select' },
        { value: 'fully-engaged', label: 'Fully engaged on Zoom' },
        { value: 'partially-engaged', label: 'Partially engaged' },
        { value: 'not-engaged', label: 'Not engaged at all' }
    ];

    // Update shell context on mount and when chat state changes
    useEffect(() => {
        setBreadcrumbs([
            { text: 'Toolkit', href: '#' },
            { text: 'Sessions', href: '/sessions' },
            { text: sessionContext.sessionLabel, href: '#' },
            ...(chatExpanded ? [{ text: 'Session Reflection', href: '#' }] : [])
        ]);
        setMainClassName(!chatExpanded ? 'sessions-content' : '');
        setContentDirect(chatExpanded);
        setFloatingContent(!chatExpanded ? (
            <div style={{ maxWidth: 420 }}>
                <CompactReflectionBar onExpand={() => navigate('/reflection')} />
            </div>
        ) : null);
    }, [chatExpanded, setBreadcrumbs, setMainClassName, setContentDirect, setFloatingContent]);

    useEffect(() => {
        requestAnimationFrame(() => setHasEntered(true));
    }, []);

    const openStudentInsights = (student) => {
        setSelectedStudent(student);
        setIsInsightsModalOpen(true);
    };

    const closeInsightsModal = () => {
        setIsInsightsModalOpen(false);
        setSelectedStudent(null);
    };

    const handleNameKeyDown = (e, student) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openStudentInsights(student);
        }
    };

    const getStatusBadgeStyle = (status) => STATUS_STYLE_MAP[status] || 'secondary';

    const modalContainerElement =
        (typeof document !== 'undefined' &&
            (document.querySelector('#home-redesign-page .plus-page-main-container') ||
                document.querySelector('.plus-page-main-container'))) ||
        sessionsRootRef.current?.closest('.plus-page-main-container') ||
        null;

    return (
        <>
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
                        ref={sessionsRootRef}
                        style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', width: '100%' }}
                    >
                        <style>{`
                            @keyframes revealIn {
                                from { opacity: 0; transform: translateY(24px); }
                                to { opacity: 1; transform: translateY(0); }
                            }
                            .model-reveal {
                                opacity: 0;
                                animation: revealIn 1.3s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                            }
                            .student-row {
                                transition: background-color 0.2s ease;
                                cursor: pointer;
                            }
                            .student-row:hover {
                                background-color: var(--color-surface-container-highest) !important; 
                            }
                            @media (prefers-reduced-motion: reduce) {
                                .model-reveal {
                                    opacity: 1;
                                    animation: none !important;
                                }
                            }
                        `}</style>
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
                    containerId="root"
                />
            )}

        </>
    );
};

export default InSessionContent;
