import React from 'react';
import PropTypes from 'prop-types';
import { clsx } from 'clsx';
import './Object.scss';
import { iconClass } from '../../../lib/icon';
import Icon from '../Icon';

export const OBJECT_SIZES = [12, 16];

const objectPropTypes = {
    /** `12` or `16` (the default), in pixels. */
    size: PropTypes.oneOf(OBJECT_SIZES),
    /** The accessible name. An empty string marks the glyph decorative. */
    label: PropTypes.string,
    testId: PropTypes.string,
    className: PropTypes.string,
};

/** Object: a fixed Font Awesome glyph that marks the kind of thing a row or reference names, one component per kind (`TaskIcon`, `BugIcon`, …) built by `createObjectIcon`. */
export function createObjectIcon(faClass, defaultLabel) {
    const ObjectIcon = ({ size = 16, label = defaultLabel, testId, className, ...props }) => (
        <span
            role={label ? 'img' : undefined}
            aria-label={label || undefined}
            aria-hidden={label ? undefined : true}
            data-testid={testId}
            className={clsx('plus-object', `plus-object--${size}`, className)}
            {...props}
        >
            <Icon name={faClass} />
        </span>
    );
    ObjectIcon.propTypes = objectPropTypes;
    ObjectIcon.displayName = `${defaultLabel.replace(/\s+/g, '')}Icon`;
    return ObjectIcon;
}

export const TaskIcon = createObjectIcon(iconClass('list-check'), 'Task');
export const BugIcon = createObjectIcon(iconClass('bug'), 'Bug');
export const IdeaIcon = createObjectIcon(iconClass('lightbulb'), 'Idea');
export const PullRequestIcon = createObjectIcon(iconClass('code-pull-request'), 'Pull request');
export const ProjectIcon = createObjectIcon(iconClass('diagram-project'), 'Project');
export const PageIcon = createObjectIcon(iconClass('file-lines'), 'Page');

createObjectIcon.propTypes = {
    /** `12` or `16` (the default), in pixels. */
    size: PropTypes.oneOf(OBJECT_SIZES),
    /** The accessible name. An empty string marks the glyph decorative. */
    label: PropTypes.string,
    testId: PropTypes.string,
    className: PropTypes.string,
};

export default createObjectIcon;
