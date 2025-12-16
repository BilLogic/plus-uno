import React from 'react';
import PropTypes from 'prop-types';
import './Logo.scss';

/**
 * Logo Component
 * 
 * PLUS brand logo component with multiple styles, sizes, and optional text wordmark.
 * Matches Figma design system specifications.
 * 
 * @param {string} style - Visual style: 'colored', 'filled', or 'outlined'
 * @param {string} size - Size variant: 'XS', 'S', 'M', 'L', 'XL'
 * @param {boolean} text - Whether to show the text wordmark alongside the icon
 */
const Logo = ({ style = 'colored', size = 'M', text = false, className = '', ...props }) => {
    // Normalize size to lowercase for CSS classes
    const sizeClass = size.toLowerCase();

    // Build class names
    const classNames = [
        'plus-logo',
        `plus-logo--${sizeClass}`,
        `plus-logo--${style}`,
        text && 'plus-logo--with-text',
        className
    ].filter(Boolean).join(' ');

    // Size dimensions based on Figma specs
    const sizeDimensions = {
        xs: 40,
        s: 64,
        m: 92,
        l: 144,
        xl: 160
    };

    const dimension = sizeDimensions[sizeClass] || 92;

    // Logo icon SVG - the main PLUS logo mark
    const LogoIcon = () => {
        // Colors based on style
        const getColors = () => {
            switch (style) {
                case 'colored':
                    return {
                        gradientStart: '#00658E',
                        gradientEnd: '#0472A8',
                        plusColor: '#FFFFFF',
                        bgColor: null // Uses gradient
                    };
                case 'filled':
                    return {
                        bgColor: '#F9F9FC',
                        plusColor: '#1A1C1E'
                    };
                case 'outlined':
                    return {
                        bgColor: 'transparent',
                        strokeColor: '#F9F9FC',
                        plusColor: '#1A1C1E'
                    };
                default:
                    return {
                        gradientStart: '#00658E',
                        gradientEnd: '#0472A8',
                        plusColor: '#FFFFFF'
                    };
            }
        };

        const colors = getColors();
        const gradientId = `logo-gradient-${Math.random().toString(36).substr(2, 9)}`;

        if (style === 'colored') {
            return (
                <svg
                    viewBox="0 0 40 40"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    width={dimension}
                    height={dimension}
                >
                    <defs>
                        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={colors.gradientStart} />
                            <stop offset="100%" stopColor={colors.gradientEnd} />
                        </linearGradient>
                    </defs>
                    <rect width="40" height="40" rx="4" fill={`url(#${gradientId})`} />
                    <path
                        d="M20 8V32M8 20H32"
                        stroke={colors.plusColor}
                        strokeWidth="4"
                        strokeLinecap="round"
                    />
                </svg>
            );
        }

        if (style === 'filled') {
            return (
                <svg
                    viewBox="0 0 40 40"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    width={dimension}
                    height={dimension}
                >
                    <rect width="40" height="40" rx="4" fill={colors.bgColor} />
                    <path
                        d="M20 8V32M8 20H32"
                        stroke={colors.plusColor}
                        strokeWidth="4"
                        strokeLinecap="round"
                    />
                </svg>
            );
        }

        // Outlined style
        return (
            <svg
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                width={dimension}
                height={dimension}
            >
                <rect
                    x="1" y="1"
                    width="38" height="38"
                    rx="3"
                    stroke={colors.strokeColor}
                    strokeWidth="2"
                    fill="none"
                />
                <path
                    d="M20 8V32M8 20H32"
                    stroke={colors.strokeColor}
                    strokeWidth="4"
                    strokeLinecap="round"
                />
            </svg>
        );
    };

    // Text wordmark SVG
    const LogoText = () => {
        const textColor = style === 'colored' ? '#1A1C1E' : '#F9F9FC';

        return (
            <svg
                viewBox="0 0 80 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                height={dimension}
                style={{ width: 'auto' }}
            >
                <text
                    x="0"
                    y="28"
                    fontFamily="var(--font-family-heading, 'Lora')"
                    fontSize="24"
                    fontWeight="600"
                    fill={textColor}
                >
                    PLUS
                </text>
            </svg>
        );
    };

    return (
        <div className={classNames} {...props}>
            <div className="plus-logo__container">
                <div className="plus-logo__icon">
                    <LogoIcon />
                </div>
            </div>
            {text && (
                <div className="plus-logo__text">
                    <LogoText />
                </div>
            )}
        </div>
    );
};

Logo.propTypes = {
    /** Visual style of the logo */
    style: PropTypes.oneOf(['colored', 'filled', 'outlined']),
    /** Size variant */
    size: PropTypes.oneOf(['XS', 'S', 'M', 'L', 'XL']),
    /** Whether to show text wordmark */
    text: PropTypes.bool,
    /** Additional CSS classes */
    className: PropTypes.string
};

Logo.defaultProps = {
    style: 'colored',
    size: 'M',
    text: false,
    className: ''
};

export default Logo;
export { Logo };
