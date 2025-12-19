import React from 'react';
import PropTypes from 'prop-types';

/**
 * Section component for PLUS design system.
 * A simple container component for page sections with standard padding and spacing.
 */
const Section = ({
    children,
    title,
    id,
    padding = 'md',
    background = 'transparent',
    className = '',
    style,
}) => {
    // Classes
    const classes = [
        'plus-section',
        padding ? `plus-section-pad-${padding}` : '',
        background && background !== 'transparent' ? `plus-section-bg-${background}` : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <section id={id} className={classes} style={style}>
            {title && <h2 className="plus-section-title h3">{title}</h2>}
            <div className="plus-section-content">
                {children}
            </div>
        </section>
    );
};

Section.propTypes = {
    children: PropTypes.node,
    title: PropTypes.string,
    id: PropTypes.string,
    padding: PropTypes.oneOf(['none', 'sm', 'md', 'lg', 'xl']),
    background: PropTypes.oneOf(['transparent', 'surface', 'surface-alt']),
    className: PropTypes.string,
    style: PropTypes.object,
};

export default Section;
