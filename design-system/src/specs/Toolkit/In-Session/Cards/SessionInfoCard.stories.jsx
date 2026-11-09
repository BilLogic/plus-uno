import React from 'react';
import { IconButton } from '@/components';
import { iconClass } from '../../../../lib/icon';

export default {
    title: 'Specs/Toolkit/In-Session/Cards/Session Info Card',
    parameters: {
        layout: 'centered',
    },
    tags: ['!dev', '!autodocs'],
};

/**
 * Session Info Card
 * A reusable card component displaying an icon, title, and content.
 * Used within modals to display session information.
 *
 * Design tokens used:
 * - Spacing: --size-modal-gap-md, --size-spacing-small-space-025
 * - Typography: body2-txt, font-weight-semibold, font-weight-light
 * - Colors: --color-on-surface, --color-on-surface-variant, --color-primary
 * - Icon: --font-size-fa-h4-solid, --font-line-height-fa-h4-solid
 */
export const SessionInfoCard = ({
    icon,
    title,
    content,
    contentLink,
    showCopyButton = false
}) => (
    <div
        className="d-flex align-items-center"
        style={{
            gap: 'var(--size-modal-gap-md)',
            padding: 'var(--size-modal-pad-y-lg) var(--pad-x-lg)',
        }}
    >
        {/* Icon Container */}
        <div
            style={{
                width: 'var(--size-spacing-medium-space-500)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <i
                className={icon}
                style={{
                    fontSize: 'var(--font-size-fa-h4-solid)',
                    color: 'var(--ds-icon-subtle)',
                    lineHeight: 'var(--font-line-height-fa-h4-solid)',
                }}
            />
        </div>

        {/* Content Container */}
        <div
            className="d-flex flex-column"
            style={{ gap: 'var(--size-spacing-small-space-025)' }}
        >
            {/* Title */}
            <span
                className="body2-txt font-weight-semibold"
                style={{ color: 'var(--ds-text)' }}
            >
                {title}
            </span>

            {/* Content Row */}
            <div
                className="d-inline-flex align-items-center"
                style={{ gap: 'var(--stack-md)' }}
            >
                {contentLink ? (
                    <a
                        href={contentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="body2-txt font-weight-light"
                        style={{
                            color: 'var(--color-primary)',
                            textDecoration: 'underline',
                        }}
                    >
                        {content}
                    </a>
                ) : (
                    <span
                        className="body2-txt font-weight-light"
                        style={{ color: 'var(--ds-text)' }}
                    >
                        {content}
                    </span>
                )}

                {/* Copy Button */}
                {showCopyButton && (
                    <IconButton icon="copy" label="Copy to clipboard" appearance="subtle" spacing="compact" onClick={() => navigator.clipboard?.writeText(content)} />
                )}
            </div>
        </div>
    </div>
);

/**
 * Default
 * Basic session info card with icon, title, and content
 */
export const Default = () => (
    <SessionInfoCard
        icon={iconClass('square-plus')}
        title="Title"
        content="Content"
        showCopyButton={true}
    />
);

/**
 * Time Example
 * Session time information
 */
export const TimeExample = () => (
    <SessionInfoCard
        icon="fa-regular fa-clock"
        title="Time"
        content="1:30 PM - 2:20 PM (Thursday)"
    />
);

/**
 * Teacher Example
 * Teacher information card
 */
export const TeacherExample = () => (
    <SessionInfoCard
        icon={iconClass('graduation-cap')}
        title="Teacher"
        content="Mr. Snape"
    />
);

/**
 * Session Link Example
 * Clickable session link
 */
export const SessionLinkExample = () => (
    <SessionInfoCard
        icon={iconClass('video')}
        title="Session Link"
        content="Zoom"
        contentLink="https://zoom.us"
    />
);

/**
 * Passcode Example
 * Session passcode with copy button
 */
export const PasscodeExample = () => (
    <SessionInfoCard
        icon={iconClass('key')}
        title="Session Passcode"
        content="123 456 789"
        showCopyButton={true}
    />
);
