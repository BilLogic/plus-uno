import React from 'react';
import PropTypes from 'prop-types';
import './PatternSection.scss';

/**
 * Section pattern for PLUS design system.
 * Large structural block for page layout: title, optional description, an
 * actions slot aligned to the title row, and content children. Standard
 * section padding/gap tokens; flat (no elevation on basic sections).
 * Mirrors the "Section" slot component in the Figma design system file.
 */
const PatternSection = ({
    id,
    title,
    description,
    actions,
    padding = 'md',
    gap = 'md',
    background = 'none',
    className = '',
    style,
    children,
    ...props
}) => {
    const classes = [
        'plus-pattern-section',
        `plus-pattern-section-pad-${padding}`,
        `plus-pattern-section-gap-${gap}`,
        `plus-pattern-section-bg-${background}`,
        className,
    ].filter(Boolean).join(' ');

    const hasHeader = title || description || actions;

    return (
        <section id={id} className={classes} style={style} {...props}>
            {hasHeader && (
                <div className="plus-pattern-section-header">
                    <div className="plus-pattern-section-heading">
                        {title && <h2 className="plus-pattern-section-title h5">{title}</h2>}
                        {description && (
                            <p className="plus-pattern-section-description body1-txt">{description}</p>
                        )}
                    </div>
                    {actions && <div className="plus-pattern-section-actions">{actions}</div>}
                </div>
            )}
            <div className="plus-pattern-section-content">{children}</div>
        </section>
    );
};

PatternSection.propTypes = {
    id: PropTypes.string,
    /** Section title */
    title: PropTypes.node,
    /** Optional description under the title */
    description: PropTypes.node,
    /** Actions slot, aligned to the end of the title row */
    actions: PropTypes.node,
    /** Padding scale (section padding tokens) */
    padding: PropTypes.oneOf(['none', 'sm', 'md', 'lg']),
    /** Gap scale between header and content (section gap tokens) */
    gap: PropTypes.oneOf(['sm', 'md', 'lg']),
    /** Background: transparent (default) or surface-container-low */
    background: PropTypes.oneOf(['none', 'surface-container-low']),
    className: PropTypes.string,
    style: PropTypes.object,
    /** Content slot */
    children: PropTypes.node,
};

export default PatternSection;
