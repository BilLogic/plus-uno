import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GaugeChart, HeatmapChart } from '@/DataViz';
import Button from '@/components/Button';
import Badge from '@/components/Badge';
import ButtonGroup from '@/components/ButtonGroup';
import NavTabs from '@/components/NavTabs';
import Accordion from '@/components/Accordion';

const PRACTICE_HEATMAP_Y = ['W4', 'W3', 'W2', 'W1'];
const PRACTICE_HEATMAP_X = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const PRACTICE_HEATMAP_DATA = [
    [0, 0, 0.10], [1, 0, 0.16], [2, 0, 0.21], [3, 0, 0.13], [4, 0, 0.58], [5, 0, 0.42], [6, 0, 0.18],
    [0, 1, 0.52], [1, 1, 0.37], [2, 1, 0.61], [3, 1, 0.28], [4, 1, 0.25], [5, 1, 0.34], [6, 1, 0.22],
    [0, 2, 0.43], [1, 2, 0.70], [2, 2, 0.48], [3, 2, 0.66], [4, 2, 0.31], [5, 2, 0.20], [6, 2, 0.56],
    [0, 3, 0.24], [1, 3, 0.41], [2, 3, 0.18], [3, 3, 0.47], [4, 3, 0.29], [5, 3, 0.35], [6, 3, 0.15]
];

/**
 * Student AI Insights modal: modified to match APPLICATION-PROTOTYPES node 171-44945.
 * Replicates pop-up with data visualizations (HighCharts) and content: Student Momentum gauge,
 * Practice Activity heatmap, Key Observations, Talking Points.
 * @param {Object} props
 * @param {Object} props.student - Selected student { id, name, status, ... }
 * @param {Array} props.allStudents - All students for tab navigation
 * @param {Function} props.onClose - Close modal callback
 * @param {Function} props.onSelectStudent - Callback when switching student via tabs
 * @param {HTMLElement} [props.containerEl] - Optional container element for section-anchored overlay
 * @param {string} [props.containerId] - Optional container element id for section-anchored overlay
 * @param {string} [props.containerSelector] - Optional selector for section-anchored overlay
 * @returns {JSX.Element} Modal with AI Insights tab content
 */
const resolveScopedContainer = ({ containerEl, containerId, containerSelector }) => {
    if (containerId === 'root' || containerSelector === '#root') {
        return typeof document !== 'undefined' ? document.getElementById('root') : null;
    }
    const directCandidate = (
        (containerEl && containerEl instanceof HTMLElement && containerEl) ||
        (containerId && typeof document !== 'undefined' && document.getElementById(containerId)) ||
        (containerSelector && typeof document !== 'undefined' && document.querySelector(containerSelector)) ||
        null
    );
    return directCandidate || null;
};

const StudentInsightsModal = ({ student, allStudents = [], onClose, onSelectStudent, containerEl, containerId, containerSelector }) => {
    const [activeContentTab, setActiveContentTab] = useState('ai-insights');
    const [selectedStudentId, setSelectedStudentId] = useState(student?.id);
    const [activeAccordionKey, setActiveAccordionKey] = useState(null);
    const [shouldPlayIntroAnimations, setShouldPlayIntroAnimations] = useState(true);

    // Sync state when student prop changes
    useEffect(() => {
        setSelectedStudentId(student?.id);
    }, [student?.id]);

    // Play intro animations once per modal open, then keep everything static.
    useEffect(() => {
        const timer = window.setTimeout(() => setShouldPlayIntroAnimations(false), 1900);
        return () => window.clearTimeout(timer);
    }, []);

    const currentStudent = useMemo(
        () => allStudents.find((s) => s.id === selectedStudentId) || student,
        [allStudents, selectedStudentId, student]
    );

    const handleStudentTabClick = (s) => {
        if (!s) return;
        setSelectedStudentId(s.id);
        onSelectStudent?.(s);
    };

    /** Content tab IDs for AI Insights, Goals, Notes (ButtonGroup filled = tabs look). */
    const contentTabIds = ['ai-insights', 'goals', 'notes'];
    const contentTabLabels = ['AI Insights', 'Goals', 'Notes'];

    /** AI insights for current student */
    const momentumPercent = 92;
    const practiceHeatmapY = PRACTICE_HEATMAP_Y;
    const practiceHeatmapX = PRACTICE_HEATMAP_X;
    const practiceHeatmapData = PRACTICE_HEATMAP_DATA;

    const keyObservations = [
        { title: 'Persistence Score', subtitle: 'Attempts before giving up', value: '4.2', badge: 'avg', comparison: 'vs. 3.8 last week', badgeStyle: 'primary' },
        { title: 'Struggling Concept', subtitle: 'Fractions with unlike denominators', value: '3', badge: 'attempts', comparison: 'vs. last session', badgeStyle: 'danger' },
        { title: 'Strong Momentum', subtitle: 'Integer operations', value: '95%', badge: 'accuracy', comparison: 'vs. last session', badgeStyle: 'success' }
    ];

    const talkingPoints = [
        { title: "What's Working?", content: 'Arlene is 92% toward both goals with consistent effort over two weeks. Celebrate this reliability - recognizing steady progress builds confidence.' },
        { title: "What's Changed?", content: 'Recent drop in practice (see practice activity heatmap) - check in about obstacles.' },
        { title: 'Where to Help?', content: 'Strong on addition/subtraction, needs support on fractions.' }
    ];

    const statusTags = [
        { text: 'Needs content help', style: 'secondary', fill: 'tonal' },
        { text: 'Eligible for reward', style: 'success', fill: 'tonal', leadingVisual: <i className="fa-solid fa-gift" aria-hidden /> },
        { text: 'Check-in pending', style: 'warning', fill: 'tonal', leadingVisual: <i className="fa-solid fa-clock" aria-hidden /> }
    ];

    const shortName = (name) => {
        const parts = name.split(' ');
        return parts.length >= 2 ? `${parts[0]} ${parts[1][0]}.` : name;
    };

    const explicitScopeRequested = Boolean(containerEl || containerId || containerSelector);
    const scopedContainer = resolveScopedContainer({ containerEl, containerId, containerSelector });
    const rootContainer = typeof document !== 'undefined' ? document.getElementById('root') : null;
    if (explicitScopeRequested && !scopedContainer) {
        console.warn('[StudentInsightsModal] Scoped container not found. Blocking modal mount to avoid full-page fallback.', {
            containerId,
            containerSelector
        });
        return null;
    }
    const portalContainer = scopedContainer || rootContainer;
    if (!portalContainer) return null;
    const isSectionAnchored = Boolean(scopedContainer);

    // Ensure absolute-positioned overlay is scoped to the selected section container.
    if (isSectionAnchored && portalContainer instanceof HTMLElement) {
        const computedPos = window.getComputedStyle(portalContainer).position;
        if (computedPos === 'static') {
            portalContainer.style.position = 'relative';
        }
    }

    const modalContent = (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-insights-modal-title"
            data-modal-container={isSectionAnchored ? 'scoped' : 'root'}
            style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1200,
                padding: '24px',
                pointerEvents: 'auto'
            }}
            onClick={(e) => e.target === e.currentTarget && onClose?.()}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className={shouldPlayIntroAnimations ? 'play-intro-animations' : ''}
                style={{
                    position: 'relative',
                    backgroundColor: 'var(--color-surface-container-high, #fff)',
                    borderRadius: '16px',
                    width: 'min(1120px, calc(100% - 48px))',
                    height: '80%',
                    maxWidth: '1120px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                }}
            >
                {/* Student tabs + Close button – same row (Figma 171-44945); no division stroke */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    padding: '16px 24px 0',
                    boxSizing: 'content-box'
                }}>
                    <div className="modal-header-reveal">
                        <NavTabs
                            activeKey={selectedStudentId}
                            onSelect={(k) => {
                                const student = allStudents.find((s) => s.id == k);
                                handleStudentTabClick(student);
                            }}
                        >
                            {allStudents.map((s) => (
                                <NavTabs.Item key={s.id} eventKey={s.id}>
                                    {shortName(s.name)}
                                </NavTabs.Item>
                            ))}
                        </NavTabs>
                    </div>
                    <Button
                        aria-label="Close"
                        leadingVisual={<i className="fas fa-xmark" aria-hidden />}
                        style="secondary"
                        fill="ghost"
                        size="medium"
                        onClick={onClose}
                    />
                </div>

                {/* Header: row 1 = name + Update goals; row 2 = status badges; no division stroke */}
                <div style={{ padding: '16px 24px', boxSizing: 'content-box' }}>
                    <div className="modal-header-reveal" style={{ animationDelay: '100ms' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <h2 id="student-insights-modal-title" className="h4" style={{ margin: 0 }}>{currentStudent?.name}</h2>
                            <Button text="Update goals" style="primary" fill="filled" size="medium" trailingVisual={<i className="fa-solid fa-pencil" aria-hidden />} onClick={() => { }} />
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                            {statusTags.map((tag, i) => (
                                <div key={i} className="animate-enter" style={{ animationDelay: `${150 + i * 50}ms` }}>
                                    <Badge
                                        text={tag.text}
                                        style={tag.style}
                                        size="b2"
                                        leadingVisual={tag.leadingVisual}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content tabs: AI Insights, Goals, Notes – tonal buttons; container full width, fit-content height, border-box to contain padding */}
                <div style={{ padding: '0 24px 4px', width: '100%', height: 'fit-content', boxSizing: 'border-box', marginTop: '0', marginBottom: 0 }}>
                    <div className="modal-header-reveal" style={{ animationDelay: '200ms' }}>
                        <ButtonGroup
                            fill="tonal"
                            size="medium"
                            buttons={contentTabLabels.map((label, i) => ({
                                id: contentTabIds[i],
                                text: label,
                                style: activeContentTab === contentTabIds[i] ? 'primary' : 'secondary',
                                active: activeContentTab === contentTabIds[i],
                                onClick: () => setActiveContentTab(contentTabIds[i])
                            }))}
                            ariaLabel="Content sections"
                            block
                        />
                    </div>
                </div>

                {/* Modal body - scrollable, fills tab. Hiding scrollbar via inline styles. */}
                <div style={{
                    overflowY: 'auto',
                    padding: '24px',
                    flex: 1,
                    minHeight: 0,
                    height: '100%',
                    scrollbarWidth: 'none', // Firefox
                    msOverflowStyle: 'none'  // IE/Edge
                }}>
                    <style>{`
                        .student-insights-content::-webkit-scrollbar,
                        .no-scrollbar::-webkit-scrollbar {
                            display: none;
                        }

                        @keyframes modalRevealIn {
                            from { opacity: 0; transform: translateY(24px); }
                            to { opacity: 1; transform: translateY(0); }
                        }

                        @keyframes heatmapGridFill {
                            0% { opacity: 0; transform: scale(0.85); }
                            100% { opacity: 1; transform: scale(1); }
                        }

                        .animate-enter {
                            opacity: 1;
                            transform: translateY(0);
                            transition: opacity 0.4s ease, filter 0.4s ease;
                        }

                        .play-intro-animations .animate-enter {
                            opacity: 0;
                            animation: modalRevealIn 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                        }

                        .obs-card {
                            transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
                        }

                        /* Heatmap Grid-Fill Animation */
                        .play-intro-animations .highcharts-heatmap-series .highcharts-point {
                            opacity: 0;
                            transform-origin: center;
                            animation: heatmapGridFill 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                        }

                        /* Staggering 28 cells (4x7 grid) */
                        ${Array.from({ length: 28 }).map((_, i) => `
                            .play-intro-animations .highcharts-heatmap-series .highcharts-point:nth-child(${i + 1}) {
                                animation-delay: ${400 + i * 25}ms;
                            }
                        `).join('')}

                        /* Header reveal animations */
                        .modal-header-reveal {
                            opacity: 1;
                            transform: translateY(0);
                        }

                        .play-intro-animations .modal-header-reveal {
                            opacity: 0;
                            animation: modalRevealIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                        }

                        /* Simpler Global Delays */
                        .delay-1 { animation-delay: 150ms; }
                        .delay-2 { animation-delay: 250ms; }
                        .delay-3 { animation-delay: 350ms; }

                        /* Simpler Inner Staggering (60ms steps) */
                        .delay-inner-1 { animation-delay: calc(var(--base-delay, 0ms) + 60ms) !important; }
                        .delay-inner-2 { animation-delay: calc(var(--base-delay, 0ms) + 120ms) !important; }
                        .delay-inner-3 { animation-delay: calc(var(--base-delay, 0ms) + 180ms) !important; }
                        .delay-inner-4 { animation-delay: calc(var(--base-delay, 0ms) + 240ms) !important; }
                        .delay-inner-5 { animation-delay: calc(var(--base-delay, 0ms) + 300ms) !important; }
                        .delay-inner-6 { animation-delay: calc(var(--base-delay, 0ms) + 360ms) !important; }
                    `}</style>
                    <div
                        className="student-insights-content"
                        style={{ display: activeContentTab === 'ai-insights' ? 'grid' : 'none', gridTemplateColumns: '1fr 1fr 1fr', width: '100%', maxWidth: '100%', gap: '24px', alignItems: 'stretch', height: '100%', minHeight: 0 }}
                    >
                        {/* Column 1: Student Momentum (gauge + heatmap) - reduced spacing to fit */}
                        <div
                            className="animate-enter delay-1"
                            style={{ minHeight: 0, display: 'flex', flexDirection: 'column', '--base-delay': '100ms' }}
                        >
                            <h3 className="body1-txt" style={{ fontWeight: 600, marginBottom: '8px' }}>Student Momentum</h3>
                            <div className="animate-enter delay-inner-1" style={{ position: 'relative', marginBottom: '0px', '--base-delay': '100ms' }}>
                                <GaugeChart
                                    value={momentumPercent}
                                    min={0}
                                    max={100}
                                    label="%"
                                    height={180}
                                    color="var(--color-tertiary, #0e8175)"
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '-12px', paddingLeft: '10%', paddingRight: '10%', fontSize: '12px', color: 'var(--color-on-surface-variant)' }}>
                                    <span>Low</span>
                                    <span>High</span>
                                </div>
                            </div>
                            <h4 className="body2-txt animate-enter delay-inner-2" style={{ fontWeight: 600, marginTop: '12px', marginBottom: '4px', '--base-delay': '100ms' }}>Practice Activity (Last 4 Weeks)</h4>
                            <div className="animate-enter delay-inner-3" style={{ '--base-delay': '100ms' }}>
                                <HeatmapChart
                                    xCategories={practiceHeatmapX}
                                    yCategories={practiceHeatmapY}
                                    data={practiceHeatmapData}
                                    height={150}
                                    minColor="rgba(3, 122, 188, 0.16)"
                                    maxColor="rgba(4, 114, 168, 0.86)"
                                    enableAnimation={false}
                                    showLegend={false}
                                    showDataLabels={false}
                                    pointPadding={0.12}
                                    hideLegendNavigation
                                    compactSpacing
                                />
                            </div>
                        </div>

                        {/* Column 2: Key Observations - cards take available height */}
                        <div
                            className="animate-enter delay-2"
                            style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, '--base-delay': '200ms' }}
                        >
                            <h3 className="body1-txt" style={{ fontWeight: 600, marginBottom: '12px' }}>Key Observations</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, minHeight: 0, overflowY: 'hidden', width: '100%' }}>
                                {keyObservations.map((obs, i) => (
                                    <div key={i} className={`obs-card animate-enter delay-inner-${i + 1}`} style={{
                                        padding: '16px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--color-outline-variant)',
                                        backgroundColor: 'var(--color-surface-container)',
                                        flex: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        '--base-delay': '200ms'
                                    }}>
                                        <div className="body2-txt" style={{ fontWeight: 600, color: 'var(--color-on-surface)' }}>{obs.title}</div>
                                        <div className="body3-txt" style={{ color: 'var(--color-on-surface-variant)', marginTop: '4px' }}>{obs.subtitle}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                                            <span className="body1-txt" style={{ fontWeight: 600 }}>{obs.value}</span>
                                            <Badge text={obs.badge} style={obs.badgeStyle} size="b3" fill="tonal" />
                                            <span className="body3-txt" style={{ color: 'var(--color-on-surface-variant)', marginLeft: 'auto' }}>{obs.comparison}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Column 3: Talking Points – accordions from component library */}
                        <div
                            className="animate-enter delay-3"
                            style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, width: '100%', '--base-delay': '300ms' }}
                        >
                            <h3 className="body1-txt" style={{ fontWeight: 600, marginBottom: '12px' }}>Talking Points</h3>
                            <div className="no-scrollbar" style={{ flex: 1, minHeight: 0, overflowY: 'auto', width: '100%', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                <div className="animate-enter delay-inner-1" style={{ '--base-delay': '300ms' }}>
                                    <Accordion
                                        items={talkingPoints.map((tp, i) => ({
                                            eventKey: String(i),
                                            header: <span className="body2-txt" style={{ fontWeight: 600, color: 'var(--color-on-surface)' }}>{tp.title}</span>,
                                            body: <span className="body2-txt" style={{ color: 'var(--color-on-surface)' }}>{tp.content}</span>
                                        }))}
                                        activeKey={activeAccordionKey}
                                        onSelect={(k) => setActiveAccordionKey(k === activeAccordionKey ? null : k)}
                                    />
                                </div>
                                <div className="animate-enter delay-inner-2" style={{ '--base-delay': '300ms' }}>
                                    <p className="body3-txt" style={{ marginTop: '16px', color: 'var(--color-on-surface-variant)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                        <i className="fas fa-circle-info" style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden />
                                        <span>LLM-synthesized insights from 38 rows of reflection form data across 6 tutors, Last updated in Jan 2026.</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {activeContentTab === 'goals' && (
                        <div className="body1-txt" style={{ padding: '16px 0', color: 'var(--color-on-surface-variant)' }}>
                            Goal details are available from the Update goals action.
                        </div>
                    )}
                    {activeContentTab === 'notes' && (
                        <div className="body1-txt" style={{ padding: '16px 0', color: 'var(--color-on-surface-variant)' }}>
                            No notes have been added for this student yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, portalContainer);
};

export default StudentInsightsModal;
