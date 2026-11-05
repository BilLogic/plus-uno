import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './Object.scss';

export const OBJECT_SIZES = [12, 16];

const objectPropTypes = {
    /** `12` or `16` (the default), in pixels. */
    size: PropTypes.oneOf(OBJECT_SIZES),
    /** The accessible name. An empty string marks the glyph decorative. */
    label: PropTypes.string,
    testId: PropTypes.string,
    className: PropTypes.string,
};

/**
 * Builds one typed object-kind component — `TaskIcon`, `BugIcon`, … — each a
 * fixed Font Awesome glyph at the Object sizes, named for the kind it draws
 * rather than taking a glyph name.
 */
export function createObjectIcon(faClass, defaultLabel) {
    const ObjectIcon = ({ size = 16, label = defaultLabel, testId, className, ...props }) => (
        <span
            role={label ? 'img' : undefined}
            aria-label={label || undefined}
            aria-hidden={label ? undefined : true}
            data-testid={testId}
            className={classNames('plus-object', `plus-object--${size}`, className)}
            {...props}
        >
            <i className={faClass} aria-hidden="true" />
        </span>
    );
    ObjectIcon.propTypes = objectPropTypes;
    ObjectIcon.displayName = `${defaultLabel.replace(/\s+/g, '')}Icon`;
    return ObjectIcon;
}

export const TaskIcon = createObjectIcon('fa-solid fa-list-check', 'Task');
export const BugIcon = createObjectIcon('fa-solid fa-bug', 'Bug');
export const IdeaIcon = createObjectIcon('fa-solid fa-lightbulb', 'Idea');
export const PullRequestIcon = createObjectIcon('fa-solid fa-code-pull-request', 'Pull request');
export const ProjectIcon = createObjectIcon('fa-solid fa-diagram-project', 'Project');
export const PageIcon = createObjectIcon('fa-solid fa-file-lines', 'Page');

createObjectIcon.propTypes = {
    /** `12` or `16` (the default), in pixels. */
    size: PropTypes.oneOf(OBJECT_SIZES),
    /** The accessible name. An empty string marks the glyph decorative. */
    label: PropTypes.string,
    testId: PropTypes.string,
    className: PropTypes.string,
};

export default createObjectIcon;
