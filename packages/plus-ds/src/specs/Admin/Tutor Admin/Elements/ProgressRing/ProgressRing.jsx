import React from 'react';
import PropTypes from 'prop-types';
import './ProgressRing.scss';

/**
 * ProgressRing Component
 * 
 * Custom gauge-style progress indicator.
 * Matches design used in TutorsTrainingProgressTable.
 */
const ProgressRing = ({ value, label, size = 48, height = 40, color }) => {
    // Parse value to percentage
    let percentage = 0;
    let displayValue = label || value;

    if (typeof value === 'string') {
        if (value.includes('/')) {
            const [num, den] = value.split('/').map(Number);
            if (den > 0) percentage = (num / den) * 100;
        } else if (value.includes('%')) {
            percentage = parseFloat(value);
        } else {
            percentage = parseFloat(value);
        }
    } else if (typeof value === 'number') {
        percentage = value;
    }

    // Clamp percentage
    percentage = Math.min(100, Math.max(0, percentage));

    // Default fill color
    const fillColor = color || 'var(--color-progress-ring-fill, #FFE17A)';
    const trackColor = 'var(--color-surface-variant, #DEE3E5)';

    return (
        <div className="plus-progress-ring" style={{ width: size, height: height }}>
            {/* Background Track */}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="100%"
                height="100%"
                viewBox="0 0 48 40"
                fill="none"
                className="plus-progress-ring__track"
            >
                <path d="M8.72662 39.2763C7.78931 40.2136 6.25886 40.2205 5.41982 39.1942C2.93875 36.1595 1.23059 32.5528 0.461153 28.6843C-0.464892 24.0284 0.0103881 19.2024 1.82689 14.8167C3.64339 10.4309 6.71953 6.68237 10.6663 4.04502C14.6131 1.40768 19.2532 -5.66086e-08 24 0C28.7468 5.66086e-08 33.3869 1.40768 37.3337 4.04503C41.2805 6.68237 44.3566 10.4309 46.1731 14.8167C47.9896 19.2024 48.4649 24.0284 47.5388 28.6843C46.7694 32.5528 45.0613 36.1595 42.5802 39.1942C41.7411 40.2205 40.2107 40.2136 39.2734 39.2763C38.3362 38.339 38.35 36.8274 39.1631 35.7806C40.9865 33.433 42.2469 30.6847 42.8311 27.7478C43.5719 24.0231 43.1917 20.1623 41.7385 16.6537C40.2853 13.1451 37.8244 10.1462 34.667 8.03637C31.5095 5.92649 27.7974 4.80035 24 4.80035C20.2026 4.80035 16.4905 5.92649 13.3331 8.03637C10.1756 10.1462 7.71472 13.1451 6.26151 16.6537C4.80831 20.1623 4.42809 24.0231 5.16892 27.7478C5.75307 30.6847 7.01351 33.433 8.83691 35.7806C9.64996 36.8274 9.66383 38.339 8.72662 39.2763Z" fill={trackColor} />
            </svg>

            {/* Foreground Fill (Masked) */}
            <div
                className="plus-progress-ring__fill-container"
                style={{ clipPath: `inset(${100 - percentage}% 0 0 0)` }}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="100%"
                    height="100%"
                    viewBox="0 0 48 40"
                    fill="none"
                >
                    <path opacity="0.8" d="M8.72662 39.2763C7.78931 40.2136 6.25886 40.2205 5.41982 39.1942C2.93875 36.1595 1.23059 32.5528 0.461153 28.6843C-0.464892 24.0284 0.0103881 19.2024 1.82689 14.8167C3.64339 10.4309 6.71953 6.68237 10.6663 4.04502C13.9456 1.85369 17.7036 0.511288 21.6037 0.119918C22.9227 -0.012438 24 1.07459 24 2.40018C24 3.72576 22.9212 4.78489 21.606 4.95018C18.6569 5.32081 15.8226 6.37281 13.3331 8.03637C10.1756 10.1462 7.71472 13.1451 6.26151 16.6537C4.80831 20.1623 4.42809 24.0231 5.16892 27.7478C5.75307 30.6847 7.01351 33.433 8.83691 35.7806C9.64996 36.8274 9.66383 38.339 8.72662 39.2763Z" fill={fillColor} />
                </svg>
            </div>

            {/* Label */}
            <div className="plus-progress-ring__label">
                <span className="plus-progress-ring__text">{displayValue}</span>
            </div>
        </div>
    );
};

ProgressRing.propTypes = {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    label: PropTypes.string,
    size: PropTypes.number,
    height: PropTypes.number,
    color: PropTypes.string
};

export default ProgressRing;
