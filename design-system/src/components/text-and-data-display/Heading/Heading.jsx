import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { headingTag, useHeadingLevel } from '@/lib/headingLevel';
import './Heading.scss';

export const HEADING_SIZES = ['xxlarge', 'xlarge', 'large', 'medium', 'small', 'xsmall', 'xxsmall'];
export const HEADING_COLORS = ['color.text', 'color.text.inverse', 'color.text.warning.inverse'];
const HEADING_TAGS = ['div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span'];

/**
 * A heading's text style, independent of the HTML tag it renders. The tag
 * tracks the ambient level from `HeadingContextProvider`, so moving a heading
 * to a different place in the page never requires touching its `size`.
 */
const Heading = forwardRef(({ as, size, color = 'color.text', id, testId, children }, ref) => {
    const level = useHeadingLevel();
    const Tag = as || headingTag(level);
    return (
        <Tag ref={ref} id={id} data-testid={testId} className="plus-heading" data-size={size} data-color={color}>
            {children}
        </Tag>
    );
});

Heading.displayName = 'Heading';

Heading.propTypes = {
    /** Overrides the HTML element the heading renders as. */
    as: PropTypes.oneOf(HEADING_TAGS),
    /** The text style. Required: a heading with no size is not a heading. */
    size: PropTypes.oneOf(HEADING_SIZES).isRequired,
    /** Applies inverse text color automatically when the ground is dark. */
    color: PropTypes.oneOf(HEADING_COLORS),
    id: PropTypes.string,
    testId: PropTypes.string,
    children: PropTypes.node.isRequired,
};

export default Heading;
export { HeadingContextProvider, useHeadingLevel } from '@/lib/headingLevel';
