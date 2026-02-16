import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Highcharts from '../../../../../DataViz/highchartsModules';
import HighchartsReact from 'highcharts-react-official';
import './ProgressRing.scss';

/**
 * ProgressRing Component
 *
 * Uses Highcharts solidgauge for arc rendering, with a synchronized text count-up.
 * Matches design used in TutorsTrainingProgressTable.
 */
const ProgressRing = ({ value, label, size = 48, height = 48, color, animated = true, delay = 0 }) => {
    const DURATION_MS = 1100;
    const ringRef = useRef(null);
    const [hasStarted, setHasStarted] = useState(!animated);
    const [gaugeValue, setGaugeValue] = useState(0);
    const [displayText, setDisplayText] = useState('');

    const parsed = useMemo(() => {
        let percentage = 0;
        const rawValue = label || value;
        let format = 'raw';
        let denominator = 1;
        let decimals = 0;
        let numberTarget = 0;

        if (typeof rawValue === 'string') {
            if (rawValue.includes('/')) {
                format = 'fraction';
                const [num, den] = rawValue.split('/').map(Number);
                const numerator = Number.isFinite(num) ? num : 0;
                denominator = Number.isFinite(den) && den > 0 ? den : 1;
                numberTarget = numerator;
                percentage = (numerator / denominator) * 100;
            } else if (rawValue.includes('%')) {
                format = 'percent';
                const numericPart = parseFloat(rawValue.replace('%', '').trim());
                numberTarget = Number.isFinite(numericPart) ? numericPart : 0;
                const decimalPart = rawValue.replace('%', '').trim().split('.')[1];
                decimals = decimalPart ? decimalPart.length : 0;
                percentage = numberTarget;
            } else {
                format = 'number';
                const numericPart = parseFloat(rawValue);
                numberTarget = Number.isFinite(numericPart) ? numericPart : 0;
                const decimalPart = rawValue.split('.')[1];
                decimals = decimalPart ? decimalPart.length : 0;
                percentage = numberTarget;
            }
        } else if (typeof rawValue === 'number') {
            format = 'number';
            numberTarget = rawValue;
            percentage = rawValue;
        }

        const clampedPercentage = Math.min(100, Math.max(0, percentage));
        const formatText = (numericValue) => {
            if (format === 'fraction') {
                return `${Math.round(numericValue)}/${denominator}`;
            }
            if (format === 'percent') {
                return `${numericValue.toFixed(decimals)}%`;
            }
            if (format === 'number') {
                return numericValue.toFixed(decimals);
            }
            return String(rawValue ?? '');
        };

        return {
            percentage: clampedPercentage,
            format,
            numberTarget,
            formatText,
            finalText: String(rawValue ?? '')
        };
    }, [value, label]);

    useEffect(() => {
        if (!animated) {
            setHasStarted(true);
            setGaugeValue(parsed.percentage);
            setDisplayText(parsed.finalText);
            return undefined;
        }

        let frameId;
        let delayTimer;
        let observer;
        const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reducedMotion) {
            setHasStarted(true);
            setGaugeValue(parsed.percentage);
            setDisplayText(parsed.finalText);
            return undefined;
        }

        const startAnimation = () => {
            setHasStarted(true);
            setGaugeValue(parsed.percentage);

            if (parsed.format === 'raw') {
                setDisplayText(parsed.finalText);
                return;
            }

            const start = performance.now();
            const easeOut = (t) => 1 - Math.pow(1 - t, 3);
            const step = (now) => {
                const progress = Math.min((now - start) / DURATION_MS, 1);
                const eased = easeOut(progress);
                setDisplayText(parsed.formatText(parsed.numberTarget * eased));
                if (progress < 1) {
                    frameId = window.requestAnimationFrame(step);
                } else {
                    setDisplayText(parsed.finalText);
                }
            };
            frameId = window.requestAnimationFrame(step);
        };

        const scheduleStart = () => {
            delayTimer = window.setTimeout(startAnimation, delay);
        };

        const root = ringRef.current ? ringRef.current.closest('.admin-reveal-root') : null;
        if (root && !root.classList.contains('has-stage-rows')) {
            observer = new MutationObserver(() => {
                if (root.classList.contains('has-stage-rows')) {
                    observer.disconnect();
                    scheduleStart();
                }
            });
            observer.observe(root, { attributes: true, attributeFilter: ['class'] });
        } else {
            scheduleStart();
        }

        return () => {
            if (frameId) {
                window.cancelAnimationFrame(frameId);
            }
            if (delayTimer) {
                window.clearTimeout(delayTimer);
            }
            if (observer) {
                observer.disconnect();
            }
        };
    }, [animated, delay, parsed]);

    const fillColor = color || 'var(--color-progress-ring-fill, #FFE17A)';
    const trackColor = 'var(--color-surface-variant, #DEE3E5)';

    const options = useMemo(() => ({
        chart: {
            type: 'solidgauge',
            height,
            width: size,
            backgroundColor: 'transparent',
            spacing: [0, 0, 0, 0],
            margin: [0, 0, 0, 0],
            animation: false,
        },
        title: { text: null },
        tooltip: { enabled: false },
        credits: { enabled: false },
        pane: {
            // 270deg sweep (~75% of a full circle), with opening centered at bottom.
            center: ['50%', '50%'],
            size: '100%',
            startAngle: -135,
            endAngle: 135,
            background: {
                outerRadius: '100%',
                innerRadius: '82%',
                shape: 'arc',
                borderWidth: 0,
                backgroundColor: trackColor
            }
        },
        yAxis: {
            min: 0,
            max: 100,
            stops: [
                [0, fillColor],
                [1, fillColor]
            ],
            lineWidth: 0,
            tickWidth: 0,
            minorTickInterval: null,
            labels: { enabled: false },
        },
        plotOptions: {
            solidgauge: {
                rounded: true,
                linecap: 'round',
                dataLabels: { enabled: false },
                animation: {
                    duration: DURATION_MS
                }
            }
        },
        series: [{
            data: [{
                y: hasStarted ? gaugeValue : 0,
                color: fillColor
            }],
            innerRadius: '82%',
            radius: '100%',
            color: fillColor,
            animation: hasStarted ? { duration: DURATION_MS } : false
        }]
    }), [height, size, trackColor, fillColor, hasStarted, gaugeValue]);

    return (
        <div className="plus-progress-ring" style={{ width: size, height }} ref={ringRef}>
            <HighchartsReact highcharts={Highcharts} options={options} immutable />
            <div className="plus-progress-ring__label">
                <span className="plus-progress-ring__text">{displayText || parsed.finalText}</span>
            </div>
        </div>
    );
};

ProgressRing.propTypes = {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    label: PropTypes.string,
    size: PropTypes.number,
    height: PropTypes.number,
    color: PropTypes.string,
    animated: PropTypes.bool,
    delay: PropTypes.number
};

export default ProgressRing;
