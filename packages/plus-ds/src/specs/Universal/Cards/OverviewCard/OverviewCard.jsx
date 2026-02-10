/**
 * OverviewCard Component
 * 
 * Two main card types from Figma node-id=83-125838:
 * 1. SMART Cards (tutor needs) - with vertical bar visualization
 * 2. Metric Cards (status, completion, accuracy, etc.) - with donut chart
 */

import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import DonutChart from '@/DataViz/PartToWhole/DonutChart/DonutChart';
import './OverviewCard.scss';

// SMART category colors
const SMART_COLORS = {
    socio: {
        bg: 'var(--color-social-emotional-container, #ffdea0)',
        text: 'var(--color-social-emotional-text, #674a00)',
        fill: 'var(--color-social-emotional, #8c6600)'
    },
    mastering: {
        bg: 'var(--color-mastering-content-container, #f2daff)',
        text: 'var(--color-mastering-content-text, #673a8b)',
        fill: 'var(--color-mastering-content, #8659a9)'
    },
    advocacy: {
        bg: 'var(--color-advocacy-container, #b3f1bf)',
        text: 'var(--color-advocacy-text, #00572a)',
        fill: 'var(--color-advocacy, #167745)'
    },
    relationships: {
        bg: 'var(--color-relationship-container, #ffd9e4)',
        text: 'var(--color-relationship-text, #940055)',
        fill: 'var(--color-relationship, #c70b77)'
    },
    technology: {
        bg: 'var(--color-technology-tools-container, #d7e2ff)',
        text: 'var(--color-technology-tools-text, #0b469d)',
        fill: 'var(--color-technology-tools, #005cbd)'
    }
};

/**
 * SMARTBar - Vertical bar component for SMART visualization
 */
const SMARTBar = ({ letter, value = 0, category, isHighlighted = false }) => {
    const colors = SMART_COLORS[category] || SMART_COLORS.socio;
    const barHeight = Math.max(1, value * 80); // Scale value (0-1) to 80px max height

    return (
        <div className="plus-overview-card__smart-bar">
            <div className="plus-overview-card__smart-bar-track">
                <div
                    className="plus-overview-card__smart-bar-fill"
                    style={{
                        height: `${barHeight}px`,
                        backgroundColor: isHighlighted ? colors.fill : colors.bg
                    }}
                />
            </div>
            <span
                className="plus-overview-card__smart-bar-label"
                style={{ color: colors.text }}
            >
                {letter}
            </span>
        </div>
    );
};

SMARTBar.propTypes = {
    letter: PropTypes.string.isRequired,
    value: PropTypes.number,
    category: PropTypes.string,
    isHighlighted: PropTypes.bool
};

/**
 * SMART Visualization - Shows 5 vertical bars (S, M, A, R, T)
 */
const SMARTVisualization = ({ data = {}, highlightedCategory }) => {
    const categories = [
        { letter: 'S', key: 'socio', category: 'socio' },
        { letter: 'M', key: 'mastering', category: 'mastering' },
        { letter: 'A', key: 'advocacy', category: 'advocacy' },
        { letter: 'R', key: 'relationships', category: 'relationships' },
        { letter: 'T', key: 'technology', category: 'technology' }
    ];

    return (
        <div className="plus-overview-card__smart-viz">
            {categories.map(({ letter, key, category }) => (
                <SMARTBar
                    key={key}
                    letter={letter}
                    value={data[key] || 0}
                    category={category}
                    isHighlighted={highlightedCategory === key}
                />
            ))}
        </div>
    );
};

SMARTVisualization.propTypes = {
    data: PropTypes.object,
    highlightedCategory: PropTypes.string
};

/**
 * OverviewCard Component
 */
const OverviewCard = ({
    type = 'relationships',
    title,
    subtitle,
    description,
    value,
    icon,
    smartData = {},
    chartValue = 20,
    chartLabel,
    chartColor,
    animateIntro = false,
    introDelay = 0,
    editLink,
    className = '',
    style,
    ...props
}) => {
    const hasRunIntroRef = useRef(false);
    const cardRef = useRef(null);
    const [introPlayed, setIntroPlayed] = useState(!animateIntro);
    const [animatedChartValue, setAnimatedChartValue] = useState(animateIntro ? 0 : chartValue);
    const [animatedMetricLabel, setAnimatedMetricLabel] = useState('');
    const [animatedSmartData, setAnimatedSmartData] = useState(animateIntro ? {
        socio: 0,
        mastering: 0,
        advocacy: 0,
        relationships: 0,
        technology: 0
    } : smartData);

    useEffect(() => {
        if (!animateIntro) {
            setIntroPlayed(true);
            return undefined;
        }
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setIntroPlayed(true);
            return undefined;
        }
        setIntroPlayed(false);
        return undefined;
    }, [animateIntro]);

    // Determine if this is a SMART card or metric card
    const isSmartCard = ['relationships', 'socio-emotional', 'mastering-content', 'advocacy', 'technology-tools', 'undefined'].includes(type);
    const isMetricCard = ['status', 'completion', 'accuracy', 'avg-accuracy', 'avg-completion', 'time-spent', 'effort', 'progress'].includes(type);

    // Get type-specific colors for SMART cards
    const getSmartTypeKey = (cardType) => {
        const typeMap = {
            'relationships': 'relationships',
            'socio-emotional': 'socio',
            'mastering-content': 'mastering',
            'advocacy': 'advocacy',
            'technology-tools': 'technology'
        };
        return typeMap[cardType] || null;
    };

    const smartTypeKey = getSmartTypeKey(type);
    const smartColors = smartTypeKey ? SMART_COLORS[smartTypeKey] : null;

    // Donut chart segments for metric cards
    const getDonutSegments = (val) => {
        const clamped = Math.max(0, Math.min(100, Number.isFinite(val) ? val : 0));
        return [
            { value: clamped, color: chartColor || 'var(--color-primary, #006b5e)', label: 'Value' },
            { value: 100 - clamped, color: 'var(--color-surface-variant, #dde3ea)', label: 'Remaining' }
        ];
    };

    // Default subtitles based on type
    const getDefaultSubtitle = () => {
        const subtitleMap = {
            'relationships': 'Relationships',
            'socio-emotional': 'Social-Emotional',
            'mastering-content': 'Mastering Content',
            'advocacy': 'Advocacy',
            'technology-tools': 'Technology Tools',
            'undefined': 'Oops...',
            'status': value || '37.5%',
            'completion': value || '20%',
            'accuracy': value || '20%',
            'avg-accuracy': value || '20%',
            'avg-completion': value || '20%',
            'time-spent': value || '30 / 90 min',
            'effort': value || '2/10',
            'progress': value || '2/10'
        };
        return subtitleMap[type] || '';
    };

    // Default descriptions based on type
    const getDefaultDescription = () => {
        const descMap = {
            'relationships': '3/3 students need relationship support',
            'socio-emotional': '3/3 students need social-emotional support',
            'mastering-content': '3/3 students need mastering content support',
            'advocacy': '3/3 students need advocacy support',
            'technology-tools': '3/3 students need technology tools support',
            'undefined': 'We lack data to inform you student\'s need. Please revisit later.',
            'status': 'students has status: outstanding.',
            'completion': 'of total lessons have been completed.',
            'accuracy': 'is the average accuracy on the completed training lessons.',
            'avg-accuracy': 'is the average accuracy on the completed training lessons.',
            'avg-completion': 'of total lessons have been completed.',
            'time-spent': 'is the average time spent on training.',
            'effort': 'students have fulfilled their effort goals.',
            'progress': 'students have fulfilled their progress goals.'
        };
        return descMap[type] || '';
    };

    // Title based on type
    const getTitle = () => {
        if (title) return title;

        const titleMap = {
            'relationships': 'Student Need',
            'socio-emotional': 'Student Need',
            'mastering-content': 'Student Need',
            'advocacy': 'Student Need',
            'technology-tools': 'Student Need',
            'undefined': 'Student Need',
            'status': 'Status',
            'completion': 'Completion Rate',
            'accuracy': 'Accuracy Rate',
            'avg-accuracy': 'Avg Accuracy Rate',
            'avg-completion': 'Avg Completion Rate',
            'time-spent': 'Avg Time Spent',
            'effort': 'Effort',
            'progress': 'Progress'
        };
        return titleMap[type] || 'Student Need';
    };

    const targetMetricLabel = subtitle || getDefaultSubtitle();

    useEffect(() => {
        if (!animateIntro) {
            setAnimatedChartValue(chartValue);
            setAnimatedMetricLabel(targetMetricLabel);
            setAnimatedSmartData(smartData);
            return undefined;
        }
        if (hasRunIntroRef.current) {
            setAnimatedChartValue(chartValue);
            setAnimatedMetricLabel(targetMetricLabel);
            setAnimatedSmartData(smartData);
            return undefined;
        }
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            hasRunIntroRef.current = true;
            setAnimatedChartValue(chartValue);
            setAnimatedMetricLabel(targetMetricLabel);
            setAnimatedSmartData(smartData);
            setIntroPlayed(true);
            return undefined;
        }

        const metricMatch = /^(-?\d+(?:\.\d+)?)\s*(%)?$/.exec(String(targetMetricLabel).trim());
        const metricTarget = metricMatch ? parseFloat(metricMatch[1]) : chartValue;
        const metricSuffix = metricMatch && metricMatch[2] ? '%' : '';
        const metricDecimals = metricMatch && metricMatch[1].includes('.') ? metricMatch[1].split('.')[1].length : 0;

        setAnimatedChartValue(0);
        setAnimatedMetricLabel(metricMatch ? `0${metricSuffix}` : targetMetricLabel);
        setAnimatedSmartData({
            socio: 0,
            mastering: 0,
            advocacy: 0,
            relationships: 0,
            technology: 0
        });

        const startDelay = Math.max(0, introDelay);
        let frameId;
        let delayTimer;
        let observer;
        let fallbackTimer;
        let intersectionObserver;

        const runIntro = () => {
            if (hasRunIntroRef.current) {
                return;
            }
            delayTimer = window.setTimeout(() => {
                hasRunIntroRef.current = true;
                setIntroPlayed(true);
                const start = performance.now();
                const duration = 1100;
                const easeOut = (t) => 1 - Math.pow(1 - t, 3);

                const step = (now) => {
                    const progress = Math.min((now - start) / duration, 1);
                    const eased = easeOut(progress);
                    setAnimatedChartValue(chartValue * eased);
                    setAnimatedSmartData({
                        socio: (smartData.socio || 0) * eased,
                        mastering: (smartData.mastering || 0) * eased,
                        advocacy: (smartData.advocacy || 0) * eased,
                        relationships: (smartData.relationships || 0) * eased,
                        technology: (smartData.technology || 0) * eased
                    });
                    if (metricMatch) {
                        setAnimatedMetricLabel(`${(metricTarget * eased).toFixed(metricDecimals)}${metricSuffix}`);
                    }
                    if (progress < 1) {
                        frameId = window.requestAnimationFrame(step);
                    } else {
                        setAnimatedChartValue(chartValue);
                        setAnimatedMetricLabel(targetMetricLabel);
                        setAnimatedSmartData(smartData);
                    }
                };
                frameId = window.requestAnimationFrame(step);
            }, startDelay);
        };

        const root = cardRef.current ? cardRef.current.closest('.admin-reveal-root') : null;
        const cardNode = cardRef.current;
        if (root && !root.classList.contains('has-stage-overview')) {
            observer = new MutationObserver(() => {
                if (root.classList.contains('has-stage-overview')) {
                    observer.disconnect();
                    runIntro();
                }
            });
            observer.observe(root, { attributes: true, attributeFilter: ['class'] });
        } else {
            runIntro();
        }

        // Safety net: if stage class is missed, still play once the card is visible.
        if (cardNode && typeof IntersectionObserver !== 'undefined') {
            intersectionObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        runIntro();
                    }
                });
            }, { threshold: 0.25 });
            intersectionObserver.observe(cardNode);
        }
        fallbackTimer = window.setTimeout(runIntro, 1400);

        return () => {
            if (delayTimer) {
                window.clearTimeout(delayTimer);
            }
            if (fallbackTimer) {
                window.clearTimeout(fallbackTimer);
            }
            if (frameId) {
                window.cancelAnimationFrame(frameId);
            }
            if (observer) {
                observer.disconnect();
            }
            if (intersectionObserver) {
                intersectionObserver.disconnect();
            }
        };
    }, [animateIntro, introDelay, chartValue, targetMetricLabel, smartData]);

    return (
        <div
            ref={cardRef}
            className={`plus-overview-card plus-overview-card--${type} ${animateIntro && introPlayed ? 'plus-overview-card--intro-active' : ''} ${className}`}
            style={style}
            {...props}
        >
            {/* Header: Title + Icon */}
            <div className="plus-overview-card__header">
                <h6 className="plus-overview-card__title">{getTitle()}</h6>
                <div className="plus-overview-card__icon">
                    {icon || <i className="fas fa-circle-info" />}
                </div>
            </div>

            {/* Body */}
            <div className="plus-overview-card__body">
                {/* Text content */}
                <div className="plus-overview-card__text">
                    <span className="plus-overview-card__subtitle">
                        {isMetricCard ? animatedMetricLabel || targetMetricLabel : (subtitle || getDefaultSubtitle())}
                    </span>
                    <p className="plus-overview-card__description">
                        {description || getDefaultDescription()}
                        {type === 'time-spent' && editLink && (
                            <a href="#" className="plus-overview-card__edit-link">Edit Goal</a>
                        )}
                    </p>
                </div>

                {/* Visualization */}
                <div className="plus-overview-card__visualization">
                    {isSmartCard && (
                        <SMARTVisualization
                            data={animatedSmartData}
                            highlightedCategory={smartTypeKey}
                        />
                    )}
                    {isMetricCard && (
                        <div className="plus-overview-card__donut">
                            <DonutChart
                                size={96}
                                segments={getDonutSegments(animatedChartValue)}
                                value={animatedMetricLabel || targetMetricLabel}
                                centerTextSize="h4"
                                animate={false}
                                animationDelay={0}
                                animationDuration={1100}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

OverviewCard.propTypes = {
    /** Card type variant */
    type: PropTypes.oneOf([
        // SMART types
        'relationships',
        'socio-emotional',
        'mastering-content',
        'advocacy',
        'technology-tools',
        'undefined',
        // Metric types
        'status',
        'completion',
        'accuracy',
        'avg-accuracy',
        'avg-completion',
        'time-spent',
        'effort',
        'progress'
    ]),
    /** Card title */
    title: PropTypes.string,
    /** Subtitle (bold text below title) */
    subtitle: PropTypes.string,
    /** Description text */
    description: PropTypes.string,
    /** Metric value (for metric cards subtitle) */
    value: PropTypes.string,
    /** Custom icon element */
    icon: PropTypes.node,
    /** SMART bar data { socio, mastering, advocacy, relationships, technology } - values 0-1 */
    smartData: PropTypes.object,
    /** Donut chart value (0-100) for metric cards */
    chartValue: PropTypes.number,
    /** Donut chart center label */
    chartLabel: PropTypes.string,
    /** Custom color for the donut chart value segment */
    chartColor: PropTypes.string,
    /** Whether to animate chart visualization on initial mount */
    animateIntro: PropTypes.bool,
    /** Intro animation delay in milliseconds */
    introDelay: PropTypes.number,
    /** Show edit link (for time-spent type) */
    editLink: PropTypes.bool,
    /** Additional CSS classes */
    className: PropTypes.string,
    /** Inline styles */
    style: PropTypes.object
};

export default OverviewCard;
