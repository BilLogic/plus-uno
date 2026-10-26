import React from 'react';
import PropTypes from 'prop-types';
import { HeadingLevelContext, headingTag, useHeadingLevel } from '@/lib/headingLevel';
import './PatternSection.scss';

/**
 * Section pattern for PLUS design system.
 * Large structural block for page layout: title, optional description, an
 * actions slot aligned to the title row, and content children. Standard
 * section padding/gap tokens; flat (no elevation on basic sections).
 * Mirrors the "Section" slot component in the Figma design system file.
 *
 * Its title is one heading level below what holds it, and one size smaller:
 * a section on a page is an h2 at Heading/medium 20, a section inside a
 * section is a subsection, an h3 at Heading/small 16. Deeper sections keep
 * the subsection size. `level="page"` makes it the page header instead: an h1
 * at Heading/large 24, and the sections it holds are h2s.
 *
 * `tabs` adds the `_Section header` tabs row under the title row, Section/
 * stack-sm below it, like the header's `tabs` type.
 */
const PatternSection = ({
    id,
    title,
    description,
    actions,
    tabs,
    level: rankProp,
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

    const hasHeader = title || description || actions || tabs;
    const parentLevel = useHeadingLevel();
    const isPage = rankProp === 'page';
    const level = isPage ? 1 : parentLevel + 1;
    const Title = headingTag(level);
    const rank = isPage ? 'page' : level > 2 ? 'subsection' : 'section';

    return (
        <section id={id} className={classes} style={style} {...props}>
            {hasHeader && (
                <div className="plus-pattern-section-header">
                    <div className="plus-pattern-section-title-row">
                        <div className="plus-pattern-section-heading">
                            {title && (
                                <Title className={`plus-pattern-section-title plus-pattern-section-title--${rank}`}>{title}</Title>
                            )}
                            {description && (
                                <p className="plus-pattern-section-description">{description}</p>
                            )}
                        </div>
                        {actions && <div className="plus-pattern-section-actions">{actions}</div>}
                    </div>
                    {tabs && <div className="plus-pattern-section-tabs">{tabs}</div>}
                </div>
            )}
            {/* A section with no title is a wrapper: what it holds keeps the parent's level. */}
            <HeadingLevelContext.Provider value={title ? level : parentLevel}>
                <div className="plus-pattern-section-content">{children}</div>
            </HeadingLevelContext.Provider>
        </section>
    );
};

PatternSection.propTypes = {
    id: PropTypes.string,
    /** Section title: an h2 at Heading/medium 20, or an h3 at Heading/small 16 inside another section */
    title: PropTypes.node,
    /** Optional description under the title */
    description: PropTypes.node,
    /** Actions slot, aligned to the end of the title row */
    actions: PropTypes.node,
    /** Tabs row under the title row (the header's `tabs` type) */
    tabs: PropTypes.node,
    /** `page` makes the title the page's h1 at Heading/large 24; by default it nests one level down */
    level: PropTypes.oneOf(['page']),
    /** Padding scale (section padding tokens) */
    padding: PropTypes.oneOf(['none', 'sm', 'md', 'lg']),
    /** Gap scale between header and content (section gap tokens) */
    gap: PropTypes.oneOf(['sm', 'md', 'lg']),
    /** Background: transparent (default) or `container`, the translucent well (`--ds-surface-container`) */
    background: PropTypes.oneOf(['none', 'container']),
    className: PropTypes.string,
    style: PropTypes.object,
    /** Content slot */
    children: PropTypes.node,
};

export default PatternSection;
