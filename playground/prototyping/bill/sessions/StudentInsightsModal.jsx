import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GaugeChart, HeatmapChart } from '@/DataViz';
import Button from '@/components/Button';
import Badge from '@/components/Badge';
import ButtonGroup from '@/components/ButtonGroup';
import NavTabs from '@/components/NavTabs';
import Accordion from '@/components/Accordion';

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
    if (!directCandidate) return null;
    if (directCandidate.classList?.contains('plus-page-main-container')) return directCandidate;
    const nestedMainContainer = directCandidate.querySelector?.('.plus-page-main-container');
    return nestedMainContainer || directCandidate;
};

const StudentInsightsModal = ({ student, allStudents = [], onClose, onSelectStudent, containerEl, containerId, containerSelector }) => {
    const [activeContentTab, setActiveContentTab] = useState('ai-insights');
    const [selectedStudentId, setSelectedStudentId] = useState(student?.id);
    const [isLoading] = useState(false);
    const [headerReady] = useState(true);
    const [contentReady] = useState(true);

    // Accordion state
    const [activeAccordionKey, setActiveAccordionKey] = useState(null);

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

    /** Mock AI insights for current student (from Figma) */
    const momentumPercent = 92;
    const practiceHeatmapY = ['W4', 'W3', 'W2', 'W1'];
    const practiceHeatmapX = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const practiceHeatmapData = useMemo(() => {
        const rows = 4;
        const cols = 7;
        const data = [];
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                data.push([x, y, Math.random() > 0.4 ? 1 : 0]);
            }
        }
        return data;
    }, []);

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
                position: isSectionAnchored ? 'absolute' : 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1200,
                padding: '24px'
            }}
            onClick={(e) => e.target === e.currentTarget && onClose?.()}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    position: 'relative',
                    backgroundColor: 'var(--color-surface-container-high, #fff)',
                    borderRadius: '16px',
                    width: 'min(1120px, calc(100% - 48px))',
                    height: 'min(900px, calc(100% - 48px))',
                    maxWidth: '1120px',
                    maxHeight: '900px',
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
                    {isLoading ? (
                        <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="skeleton-block" style={{ width: '80px', height: '36px', borderRadius: '6px' }} />
                            ))}
                        </div>
                    ) : headerReady && (
                        <div className="header-reveal">
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
                    )}
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
                    {isLoading ? (
                        <>
                            <div className="skeleton-block" style={{ width: '200px', height: '32px', marginBottom: '12px', borderRadius: '8px' }} />
                            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                <div className="skeleton-block" style={{ width: '140px', height: '28px', borderRadius: '14px' }} />
                                <div className="skeleton-block" style={{ width: '150px', height: '28px', borderRadius: '14px' }} />
                                <div className="skeleton-block" style={{ width: '130px', height: '28px', borderRadius: '14px' }} />
                            </div>
                        </>
                    ) : headerReady && (
                        <div className="header-reveal header-delay-1">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                <h2 id="student-insights-modal-title" className="h4" style={{ margin: 0 }}>{currentStudent?.name}</h2>
                                <Button text="Update goals" style="primary" fill="filled" size="medium" trailingVisual={<i className="fa-solid fa-pencil" aria-hidden />} onClick={() => { }} />
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                                {statusTags.map((tag, i) => (
                                    <Badge
                                        key={i}
                                        text={tag.text}
                                        style={tag.style}
                                        size="b2"
                                        leadingVisual={tag.leadingVisual}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Content tabs: AI Insights, Goals, Notes – tonal buttons; container full width, fit-content height, border-box to contain padding */}
                <div style={{ padding: '0 24px 4px', width: '100%', height: 'fit-content', boxSizing: 'border-box', marginTop: '0', marginBottom: 0 }}>
                    {isLoading ? (
                        <div style={{ display: 'flex', gap: '0', borderRadius: '8px', overflow: 'hidden', height: '40px' }}>
                            {['AI Insights', 'Goals', 'Notes'].map((label, i) => (
                                <div key={i} className="skeleton-block" style={{ flex: 1, height: '100%', borderRadius: '0' }} />
                            ))}
                        </div>
                    ) : headerReady && (
                        <div className="header-reveal header-delay-2">
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
                    )}
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

                        @keyframes revealIn {
                            from { opacity: 0; transform: translateY(16px); }
                            to { opacity: 1; transform: translateY(0); }
                        }
                        .animate-enter {
                            opacity: 0;
                            animation: revealIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                            transition: opacity 0.4s ease, filter 0.4s ease;
                        }

                        .obs-card {
                            transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
                        }


                        /* Header reveal animations */
                        .header-reveal {
                            opacity: 0;
                            animation: revealIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                        }
                        .header-delay-1 { animation-delay: 80ms; }
                        .header-delay-2 { animation-delay: 160ms; }

                        /* Content column delays updated for left-to-right reveal */
                        .delay-1 { animation-delay: 200ms; }
                        .delay-2 { animation-delay: 400ms; }

                        /* Skeleton Styles */
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
                            border-radius: 8px;
                        }
                        .skeleton-grid {
                            display: grid;
                            grid-template-columns: 1fr 1fr 1fr;
                            width: 100%;
                            height: 100%;
                            gap: 24px;
                            align-items: stretch;
                        }
                        .skeleton-col {
                            display: flex;
                            flex-direction: column;
                            gap: 16px;
                            height: 100%;
                        }
                    `}</style>
                    {isLoading ? (
                        <div className="skeleton-grid">
                            {/* Col 1 Skeleton: Gauge & Heatmap */}
                            <div className="skeleton-col">
                                <div style={{ height: '24px', width: '140px' }} className="skeleton-block" />
                                <div style={{ height: '180px', borderRadius: '12px' }} className="skeleton-block" />
                                <div style={{ height: '20px', width: '180px', marginTop: '12px' }} className="skeleton-block" />
                                <div style={{ height: '150px', borderRadius: '12px' }} className="skeleton-block" />
                            </div>
                            {/* Col 2 Skeleton: Cards */}
                            <div className="skeleton-col">
                                <div style={{ height: '24px', width: '140px' }} className="skeleton-block" />
                                <div style={{ flex: 1, borderRadius: '12px' }} className="skeleton-block" />
                                <div style={{ flex: 1, borderRadius: '12px' }} className="skeleton-block" />
                                <div style={{ flex: 1, borderRadius: '12px' }} className="skeleton-block" />
                            </div>
                            {/* Col 3 Skeleton: List */}
                            <div className="skeleton-col">
                                <div style={{ height: '24px', width: '140px' }} className="skeleton-block" />
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} style={{ height: '48px', width: '100%', borderRadius: '8px' }} className="skeleton-block" />
                                ))}
                            </div>
                        </div>
                    ) : contentReady && activeContentTab === 'ai-insights' && (
                        <div
                            className="student-insights-content"
                            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', width: '100%', maxWidth: '100%', gap: '24px', alignItems: 'stretch', height: '100%', minHeight: 0 }}
                        >
                            {/* Column 1: Student Momentum (gauge + heatmap) - reduced spacing to fit */}
                            <div
                                className="animate-enter"
                                style={{ minHeight: 0, display: 'flex', flexDirection: 'column' }}
                            >
                                <h3 className="body1-txt" style={{ fontWeight: 600, marginBottom: '8px' }}>Student Momentum</h3>
                                <div style={{ position: 'relative', marginBottom: '0px' }}>
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
                                <h4 className="body2-txt" style={{ fontWeight: 600, marginTop: '12px', marginBottom: '4px' }}>Practice Activity (Last 4 Weeks)</h4>
                                <HeatmapChart
                                    xCategories={practiceHeatmapX}
                                    yCategories={practiceHeatmapY}
                                    data={practiceHeatmapData}
                                    height={150}
                                    minColor="#ffffff"
                                    maxColor="#a8d4e6"
                                    showLegend={false}
                                    showDataLabels={false}
                                    pointPadding={0.12}
                                    hideLegendNavigation
                                    compactSpacing
                                />
                            </div>

                            {/* Column 2: Key Observations - cards take available height */}
                            <div
                                className="animate-enter delay-1"
                                style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}
                            >
                                <h3 className="body1-txt" style={{ fontWeight: 600, marginBottom: '12px' }}>Key Observations</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, minHeight: 0, overflowY: 'hidden', width: '100%' }}>
                                    {keyObservations.map((obs, i) => (
                                        <div key={i} className="obs-card" style={{
                                            padding: '16px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--color-outline-variant)',
                                            backgroundColor: 'var(--color-surface-container)',
                                            flex: 1, // Distribute height equally
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'center'
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
                                className="animate-enter delay-2"
                                style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, width: '100%' }}
                            >
                                <h3 className="body1-txt" style={{ fontWeight: 600, marginBottom: '12px' }}>Talking Points</h3>
                                <div className="no-scrollbar" style={{ flex: 1, minHeight: 0, overflowY: 'auto', width: '100%', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                    <Accordion
                                        items={talkingPoints.map((tp, i) => ({
                                            eventKey: String(i),
                                            header: <span className="body2-txt" style={{ fontWeight: 600, color: 'var(--color-on-surface)' }}>{tp.title}</span>,
                                            body: <span className="body2-txt" style={{ color: 'var(--color-on-surface)' }}>{tp.content}</span>
                                        }))}
                                        activeKey={activeAccordionKey}
                                        onSelect={(k) => setActiveAccordionKey(k === activeAccordionKey ? null : k)}
                                    />
                                    <p className="body3-txt" style={{ marginTop: '16px', color: 'var(--color-on-surface-variant)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                        <i className="fas fa-circle-info" style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden />
                                        <span>LLM-synthesized insights from 38 rows of reflection form data across 6 tutors, Last updated in Jan 2026.</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeContentTab === 'goals' && (
                        <div className="body1-txt" style={{ padding: '16px 0' }}>Goals content placeholder.</div>
                    )}
                    {activeContentTab === 'notes' && (
                        <div className="body1-txt" style={{ padding: '16px 0' }}>Notes content placeholder.</div>
                    )}
                </div>
            </div>
        </div>
    );
    if (!portalContainer) return null;
    return createPortal(modalContent, portalContainer);
};

export default StudentInsightsModal;
