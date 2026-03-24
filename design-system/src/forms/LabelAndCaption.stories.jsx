import React from 'react';

/**
 * Label — form label with optional required asterisk.
 * Caption — helper text with semantic states.
 */
const Label = ({ text = 'Label', required = true }) => (
    <div
        style={{
            display: 'flex',
            gap: 'var(--size-spacing-space-050)',
            alignItems: 'flex-start',
            lineHeight: 0,
        }}
    >
        <span
            className="body3-txt"
            style={{
                color: 'var(--color-on-surface)',
                fontFamily: 'Merriweather Sans',
                fontWeight: 400,
                lineHeight: 1.667,
            }}
        >
            {text}
        </span>
        {required && (
            <span
                className="body3-txt"
                style={{
                    color: 'var(--color-danger)',
                    fontFamily: 'Merriweather Sans',
                    fontWeight: 300,
                    lineHeight: 1.667,
                }}
            >
                *
            </span>
        )}
    </div>
);

const Caption = ({ text = 'caption', state = 'default', icon = 'square-plus' }) => {
    const getTextColor = () => {
        switch (state) {
            case 'success':
                return 'var(--color-success-text)';
            case 'danger':
                return 'var(--color-danger-text)';
            case 'warning':
                return 'var(--color-warning-text)';
            case 'disabled':
            case 'default':
            default:
                return 'var(--color-on-surface)';
        }
    };

    const getIconColor = () => {
        switch (state) {
            case 'success':
                return 'var(--color-success)';
            case 'danger':
                return 'var(--color-danger)';
            case 'warning':
                return 'var(--color-warning)';
            case 'disabled':
            case 'default':
            default:
                return 'var(--color-on-surface-variant)';
        }
    };

    const showIcon = ['default', 'success', 'danger', 'warning', 'disabled'].includes(state);

    return (
        <div
            style={{
                display: 'flex',
                gap: 'var(--size-element-pad-y-sm)',
                alignItems: 'flex-start',
                opacity: state === 'disabled' ? 0.78 : 1,
            }}
        >
            {showIcon && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <i
                        className={`fa-solid fa-${icon}`}
                        style={{
                            fontSize: '10px',
                            lineHeight: 2,
                            color: getIconColor(),
                        }}
                    />
                </div>
            )}
            <span
                className="body3-txt"
                style={{
                    color: getTextColor(),
                    fontFamily: 'Merriweather Sans',
                    fontWeight: 300,
                    lineHeight: 1.667,
                }}
            >
                {text}
            </span>
        </div>
    );
};

export default {
    title: 'Forms/Label and Caption',
    component: Label,
    tags: ['!dev'],
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component:
                    'Typography patterns for field labels (with optional required asterisk) and captions with semantic states. Compositions use plain inputs for context only.',
            },
        },
    },
};

export const LabelContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md)' }}>
        <section>
            <h6 className="h6 mb-3">With required indicator</h6>
            <Label text="Label" required />
        </section>
        <section>
            <h6 className="h6 mb-3">Without required indicator</h6>
            <Label text="Label" required={false} />
        </section>
        <section>
            <h6 className="h6 mb-3">Custom copy</h6>
            <Label text="Email Address" required />
        </section>
    </div>
);

export const CaptionVariants = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md)' }}>
        <section>
            <h6 className="h6 mb-3">Default</h6>
            <Caption text="caption" state="default" icon="square-plus" />
        </section>
        <section>
            <h6 className="h6 mb-3">Success</h6>
            <Caption text="caption" state="success" icon="circle-check" />
        </section>
        <section>
            <h6 className="h6 mb-3">Danger</h6>
            <Caption text="caption" state="danger" icon="circle-xmark" />
        </section>
        <section>
            <h6 className="h6 mb-3">Warning</h6>
            <Caption text="caption" state="warning" icon="triangle-exclamation" />
        </section>
        <section>
            <h6 className="h6 mb-3">Disabled</h6>
            <Caption text="caption" state="disabled" icon="square-plus" />
        </section>
    </div>
);

export const Layout = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-lg)' }}>
        <section>
            <h6 className="h6 mb-4">Field column: label, control, caption</h6>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--size-element-gap-xs)',
                    maxWidth: '400px',
                }}
            >
                <Label text="Email Address" required />
                <input
                    type="email"
                    placeholder="Enter your email"
                    style={{
                        padding: '8px 12px',
                        border: '1px solid var(--color-outline-variant)',
                        borderRadius: '4px',
                        fontSize: '14px',
                    }}
                />
                <Caption text="We'll never share your email with anyone else." state="default" icon="circle-info" />
            </div>
        </section>
        <section>
            <h6 className="h6 mb-4">Success</h6>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--size-element-gap-xs)',
                    maxWidth: '400px',
                }}
            >
                <Label text="Username" required />
                <input
                    type="text"
                    value="john_doe"
                    readOnly
                    style={{
                        padding: '8px 12px',
                        border: '1px solid var(--color-success)',
                        borderRadius: '4px',
                        fontSize: '14px',
                        backgroundColor: 'var(--color-success-state-08)',
                    }}
                />
                <Caption text="Username is available!" state="success" icon="circle-check" />
            </div>
        </section>
        <section>
            <h6 className="h6 mb-4">Error</h6>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--size-element-gap-xs)',
                    maxWidth: '400px',
                }}
            >
                <Label text="Password" required />
                <input
                    type="password"
                    value="123"
                    style={{
                        padding: '8px 12px',
                        border: '1px solid var(--color-danger)',
                        borderRadius: '4px',
                        fontSize: '14px',
                        backgroundColor: 'var(--color-danger-state-08)',
                    }}
                />
                <Caption text="Password must be at least 8 characters long." state="danger" icon="circle-xmark" />
            </div>
        </section>
        <section>
            <h6 className="h6 mb-4">Warning</h6>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--size-element-gap-xs)',
                    maxWidth: '400px',
                }}
            >
                <Label text="Phone Number" required={false} />
                <input
                    type="tel"
                    value="555-0123"
                    style={{
                        padding: '8px 12px',
                        border: '1px solid var(--color-warning)',
                        borderRadius: '4px',
                        fontSize: '14px',
                        backgroundColor: 'var(--color-warning-state-08)',
                    }}
                />
                <Caption
                    text="Please include country code for international numbers."
                    state="warning"
                    icon="triangle-exclamation"
                />
            </div>
        </section>
        <section>
            <h6 className="h6 mb-4">Disabled</h6>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--size-element-gap-xs)',
                    maxWidth: '400px',
                }}
            >
                <Label text="Account Type" required />
                <input
                    type="text"
                    value="Premium"
                    disabled
                    style={{
                        padding: '8px 12px',
                        border: '1px solid var(--color-outline-variant)',
                        borderRadius: '4px',
                        fontSize: '14px',
                        backgroundColor: 'var(--color-surface-container-low)',
                        opacity: 0.78,
                    }}
                />
                <Caption text="Account type cannot be changed." state="disabled" icon="lock" />
            </div>
        </section>
    </div>
);

export { Label, Caption };
