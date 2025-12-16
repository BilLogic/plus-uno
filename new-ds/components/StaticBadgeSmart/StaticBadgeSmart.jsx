import React from 'react';
import PropTypes from 'prop-types';
import { SMART_CONSTANTS } from '@/components/constants';

const StaticBadgeSmart = ({
    type,
    size = 'h1',
    id,
    className = ''
}) => {
    const normalizedType = type.replace(/\s+/g, '-').toLowerCase();

    const textMap = {
        'socio-emotional': SMART_CONSTANTS.CA_SE_FULL,
        'mastering-content': SMART_CONSTANTS.CA_MC,
        'advocacy': SMART_CONSTANTS.CA_ADV,
        'relationships': SMART_CONSTANTS.CA_RELN,
        'technology-tools': SMART_CONSTANTS.CA_TT
    };

    const displayText = textMap[normalizedType] || SMART_CONSTANTS.CA_SE_FULL;

    const colorMap = {
        'socio-emotional': {
            bg: 'var(--color-social-emotional-state-08)',
            icon: 'var(--color-social-emotional)',
            text: 'var(--color-social-emotional-text)'
        },
        'mastering-content': {
            bg: 'var(--color-mastering-content-state-08)',
            icon: 'var(--color-mastering-content)',
            text: 'var(--color-mastering-content-text)'
        },
        'advocacy': {
            bg: 'var(--color-advocacy-state-08)',
            icon: 'var(--color-advocacy)',
            text: 'var(--color-advocacy-text)'
        },
        'relationships': {
            bg: 'var(--color-relationship-state-08)',
            icon: 'var(--color-relationship)',
            text: 'var(--color-relationship-text)'
        },
        'technology-tools': {
            bg: 'var(--color-technology-tools-state-08)',
            icon: 'var(--color-technology-tools)',
            text: 'var(--color-technology-tools-text)'
        }
    };

    const colors = colorMap[normalizedType] || colorMap['socio-emotional'];

    const getStyles = () => {
        const baseStyles = {
            backgroundColor: colors.bg,
            color: colors.text,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 'auto',
            maxWidth: '100%',
            alignSelf: 'flex-start',
            flex: '0 0 auto',
        };

        if (['h1', 'h2', 'h3'].includes(size)) {
            return {
                ...baseStyles,
                paddingLeft: 'var(--size-element-pad-x-lg)',
                paddingRight: 'var(--size-element-pad-x-lg)',
                borderRadius: 'var(--size-element-radius-full)',
                gap: 'var(--size-element-gap-lg)',
            };
        } else if (['h4', 'h5'].includes(size)) {
            return {
                ...baseStyles,
                paddingLeft: 'var(--size-element-pad-x-md)',
                paddingRight: 'var(--size-element-pad-x-md)',
                borderRadius: 'var(--size-element-radius-full)',
                gap: 'var(--size-element-gap-md)',
            };
        } else if (size === 'h6') {
            return {
                ...baseStyles,
                paddingLeft: 'var(--size-element-pad-x-md)',
                paddingRight: 'var(--size-element-pad-x-md)',
                borderRadius: 'var(--size-element-radius-full)',
                gap: 'var(--size-element-gap-md)',
            };
        } else if (['b1', 'b2'].includes(size)) {
            return {
                ...baseStyles,
                paddingLeft: 'var(--size-element-pad-x-sm)',
                paddingRight: 'var(--size-element-pad-x-sm)',
                borderRadius: 'var(--size-element-radius-full)',
                gap: 'var(--size-element-gap-sm)',
            };
        } else if (size === 'b3') {
            return {
                ...baseStyles,
                paddingLeft: 'var(--size-element-pad-x-sm)',
                paddingRight: 'var(--size-element-pad-x-sm)',
                gap: 'var(--size-element-gap-sm)',
                borderRadius: normalizedType === 'technology-tools' ? 'var(--size-border-radius-radius-400)' : 'var(--size-element-radius-full)',
            };
        }
        return baseStyles;
    };

    const getIconStyles = () => {
        const baseIconStyles = {
            color: colors.icon,
            fontFamily: '"Font Awesome 6 Free"',
            fontWeight: '900',
        };

        if (size === 'h1' || size === 'h2') {
            return { ...baseIconStyles, fontSize: 'var(--font-size-fa-h2-solid)', lineHeight: 'var(--font-line-height-fa-h2-solid)' };
        } else if (size === 'h3') {
            return { ...baseIconStyles, fontSize: 'var(--font-size-fa-h3-solid)', lineHeight: 'var(--font-line-height-fa-h3-solid)' };
        } else if (size === 'h4') {
            return { ...baseIconStyles, fontSize: 'var(--font-size-fa-h4-solid)', lineHeight: 'var(--font-line-height-fa-h4-solid)' };
        } else if (size === 'h5') {
            return { ...baseIconStyles, fontSize: 'var(--font-size-fa-h5-solid)', lineHeight: 'var(--font-line-height-fa-h5-solid)' };
        } else if (size === 'h6' || size === 'b1') {
            return { ...baseIconStyles, fontSize: 'var(--font-size-fa-h6-solid)', lineHeight: 'var(--font-line-height-fa-h6-solid)' };
        } else if (size === 'b2') {
            return { ...baseIconStyles, fontSize: 'var(--font-size-fa-body2-solid)', lineHeight: 'var(--font-line-height-fa-body2-solid)' };
        } else if (size === 'b3') {
            return { ...baseIconStyles, fontSize: 'var(--font-size-fa-body3-solid)', lineHeight: 'var(--font-line-height-fa-body3-solid)' };
        }
        return baseIconStyles;
    };

    const getTextStyles = () => {
        const baseTextStyles = {
            display: 'flex',
            alignItems: 'center',
            height: 'auto',
        };

        if (['h1', 'h2', 'h3'].includes(size)) {
            return {
                ...baseTextStyles,
                fontFamily: 'var(--font-family-header)',
                fontWeight: 'var(--font-weight-bold)',
                lineHeight: `var(--font-line-height-${size})`,
                fontSize: size === 'h2' ? 'var(--font-size-h2)' : undefined,
            };
        } else if (['h4', 'h5', 'h6'].includes(size)) {
            return {
                ...baseTextStyles,
                fontFamily: 'var(--font-family-header)',
                fontWeight: 'var(--font-weight-semibold-2)',
                lineHeight: `var(--font-line-height-${size})`,
            };
        } else if (['b1', 'b2', 'b3'].includes(size)) {
            return {
                ...baseTextStyles,
                fontFamily: 'var(--font-family-body)',
                fontWeight: 'var(--font-weight-semibold-1)',
                lineHeight: size === 'b1' ? 'var(--font-line-height-body1)' : size === 'b2' ? 'var(--font-line-height-body2)' : 'var(--font-line-height-body3)',
            };
        }
        return baseTextStyles;
    };

    return (
        <span
            id={id}
            className={`plus-badge plus-static-badge-smart plus-static-badge-smart-${normalizedType} ${size} ${className}`}
            style={getStyles()}
        >
            <i className="fas fa-circle-dot" style={getIconStyles()}></i>
            <span className="plus-badge-text" style={getTextStyles()}>{displayText}</span>
        </span>
    );
};

StaticBadgeSmart.propTypes = {
    type: PropTypes.oneOf(['socio-emotional', 'mastering-content', 'advocacy', 'relationships', 'technology-tools']).isRequired,
    size: PropTypes.oneOf(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'b1', 'b2', 'b3']),
    id: PropTypes.string,
    className: PropTypes.string
};

export default StaticBadgeSmart;
