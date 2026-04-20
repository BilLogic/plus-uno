/**
 * Profile - Elements - Tooltip: Additional Email
 * 
 * Info icon with tooltip that explains the additional email feature.
 * Re-uses the Tooltip component and Icon from the design system.
 * 
 * Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=5719-19370&m=dev
 * 
 * States:
 * - Default: Info circle icon only (no tooltip visible)
 * - Hovered: Info circle icon with tooltip visible to the right
 * 
 * Typography:
 * - Tooltip text: Merriweather Sans Light, 8px, line-height 1.667, centered
 *   in --color-inverse-on-surface (#f0f1f3)
 * - Icon: Font Awesome 7 Solid, 10px in --color-primary (#0472a8)
 * 
 * Colors:
 * - Icon: --color-primary
 * - Tooltip background: --color-inverse-surface (#2e3133)
 * - Tooltip text: --color-inverse-on-surface (#f0f1f3)
 * - Tooltip border-radius: var(--size-element-radius-md, 4px)
 * - Tooltip padding: var(--size-element-pad-x-sm, 8px) / var(--size-element-pad-y-lg, 8px)
 * 
 * Tooltip text: "Get notifications sent to an alternate email address"
 * Tooltip placement: right (arrow points left toward the icon)
 */
import React from 'react';
import Tooltip from '../../../components/Tooltip/Tooltip';

export default {
    title: 'Specs/Profile/Elements/Tooltip Additional Email',
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
};

/**
 * All States
 * Shows the Tooltip: Additional Email in its different states:
 * Default (icon only) and Hovered (icon + tooltip).
 */
export const TooltipAdditionalEmailStory = () => {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-section-gap-xl, 32px)',
                padding: 'var(--size-element-pad-y-lg, 12px)',
            }}
        >
            {/* State 1: Default (icon only) */}
            <div>
                <h6
                    className="h6"
                    style={{
                        color: 'var(--color-on-surface-variant)',
                        marginBottom: 'var(--size-element-gap-md, 16px)',
                    }}
                >
                    Default (Icon Only)
                </h6>
                <div
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <i
                        className="fa-solid fa-circle-info"
                        style={{
                            fontSize: '10px',
                            color: 'var(--color-primary)',
                            cursor: 'pointer',
                        }}
                    />
                </div>
            </div>

            {/* State 2: Hovered (icon + tooltip) */}
            <div>
                <h6
                    className="h6"
                    style={{
                        color: 'var(--color-on-surface-variant)',
                        marginBottom: 'var(--size-element-gap-md, 16px)',
                    }}
                >
                    Hovered (Icon + Tooltip) — Hover over the icon
                </h6>
                <div
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Tooltip
                        text="Get notifications sent to an alternate email address"
                        placement="right"
                        size="small"
                        id="tooltip-additional-email"
                    >
                        <span
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                            }}
                        >
                            <i
                                className="fa-solid fa-circle-info"
                                style={{
                                    fontSize: '10px',
                                    color: 'var(--color-primary)',
                                }}
                            />
                        </span>
                    </Tooltip>
                </div>
            </div>

            {/* Interactive — always visible for demo */}
            <div>
                <h6
                    className="h6"
                    style={{
                        color: 'var(--color-on-surface-variant)',
                        marginBottom: 'var(--size-element-gap-md, 16px)',
                    }}
                >
                    Interactive — Hover over the icon
                </h6>
                <div
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingLeft: '20px',
                    }}
                >
                    <Tooltip
                        text="Get notifications sent to an alternate email address"
                        placement="right"
                        size="small"
                        id="tooltip-additional-email-interactive"
                    >
                        <span
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                            }}
                        >
                            <i
                                className="fa-solid fa-circle-info"
                                style={{
                                    fontSize: '10px',
                                    color: 'var(--color-primary)',
                                }}
                            />
                        </span>
                    </Tooltip>
                </div>
            </div>
        </div>
    );
};
