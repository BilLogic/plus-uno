import React from 'react';

export default {
    title: 'Specs/Toolkit/In-Session/Cards/Session Info Card',
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
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
            padding: 'var(--size-modal-pad-y-lg) var(--size-element-pad-x-lg)',
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
                    color: 'var(--color-on-surface-variant)',
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
                style={{ color: 'var(--color-on-surface)' }}
            >
                {title}
            </span>

            {/* Content Row */}
            <div
                className="d-inline-flex align-items-center"
                style={{ gap: 'var(--size-element-gap-sm)' }}
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
                        style={{ color: 'var(--color-on-surface)' }}
                    >
                        {content}
                    </span>
                )}

                {/* Copy Button */}
                {showCopyButton && (
                    <button
                        type="button"
                        className="btn p-0 border-0 bg-transparent"
                        style={{ lineHeight: 1 }}
                        onClick={() => navigator.clipboard?.writeText(content)}
                        aria-label="Copy to clipboard"
                    >
                        <i
                            className="fa-regular fa-copy"
                            style={{
                                fontSize: 'var(--font-size-fa-b3-regular)',
                                color: 'var(--color-primary)',
                                cursor: 'pointer',
                            }}
                        />
                    </button>
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
        icon="fa-solid fa-square-plus"
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
        icon="fa-solid fa-graduation-cap"
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
        icon="fa-solid fa-video"
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
        icon="fa-solid fa-key"
        title="Session Passcode"
        content="123 456 789"
        showCopyButton={true}
    />
);
