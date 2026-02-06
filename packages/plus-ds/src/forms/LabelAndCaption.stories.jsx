import React from 'react';

export default {
    title: 'Forms/Label and Caption',
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
};

/**
 * Label Component
 * Shows a form label with optional required indicator (*)
 * 
 * Typography:
 * - Label text: body3-txt (Merriweather Sans Regular, 12px, line-height 1.667)
 * - Required asterisk: body3-txt (Merriweather Sans Light, 12px, line-height 1.667)
 * 
 * Colors:
 * - Label text: --color-on-surface
 * - Required asterisk: --color-danger
 * 
 * Spacing:
 * - Gap between label and asterisk: --size-spacing-space-050 (4px)
 */
const Label = ({ text = 'Label', required = true }) => (
    <div
        style={{
            display: 'flex',
            gap: 'var(--size-spacing-space-050)',
            alignItems: 'flex-start',
            lineHeight: 0
        }}
    >
        <span
            className="body3-txt"
            style={{
                color: 'var(--color-on-surface)',
                fontFamily: 'Merriweather Sans',
                fontWeight: 400,
                lineHeight: 1.667
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
                    lineHeight: 1.667
                }}
            >
                *
            </span>
        )}
    </div>
);

/**
 * Caption Component
 * Shows helper text below form fields with optional icon and state-based styling
 * 
 * States:
 * - default: Gray text with icon
 * - success: Green text with icon
 * - danger: Red text with icon
 * - warning: Yellow/brown text with icon
 * - disabled: Gray text with icon, 78% opacity
 * 
 * Typography:
 * - Caption text: body3-txt (Merriweather Sans Light, 12px, line-height 1.667)
 * - Icon: Font Awesome 6 Free Solid, 10px, line-height 2
 * 
 * Colors:
 * - default: --color-on-surface
 * - success: --color-success-text
 * - danger: --color-danger-text
 * - warning: --color-warning-text
 * - disabled: --color-on-surface with 78% opacity
 * - icon: --color-on-surface-variant
 * 
 * Spacing:
 * - Gap between icon and text: --size-element-pad-y-sm (4px)
 */
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

    const showIcon = ['default', 'success', 'danger', 'warning', 'disabled'].includes(state);

    return (
        <div
            style={{
                display: 'flex',
                gap: 'var(--size-element-pad-y-sm)',
                alignItems: 'flex-start',
                opacity: state === 'disabled' ? 0.78 : 1
            }}
        >
            {showIcon && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <i
                        className={`fa-solid fa-${icon}`}
                        style={{
                            fontSize: '10px',
                            lineHeight: 2,
                            color: 'var(--color-on-surface-variant)'
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
                    lineHeight: 1.667
                }}
            >
                {text}
            </span>
        </div>
    );
};

/**
 * Label - Overview
 * Shows all label variations
 */
export const Label_Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md)' }}>
        <section>
            <h6 className="h6 mb-3">Label with Required Indicator</h6>
            <Label text="Label" required={true} />
        </section>

        <section>
            <h6 className="h6 mb-3">Label without Required Indicator</h6>
            <Label text="Label" required={false} />
        </section>

        <section>
            <h6 className="h6 mb-3">Custom Label Text</h6>
            <Label text="Email Address" required={true} />
        </section>
    </div>
);

/**
 * Caption - Overview
 * Shows all caption states
 */
export const Caption_Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md)' }}>
        <section>
            <h6 className="h6 mb-3">Default State</h6>
            <Caption text="caption" state="default" icon="square-plus" />
        </section>

        <section>
            <h6 className="h6 mb-3">Success State</h6>
            <Caption text="caption" state="success" icon="circle-check" />
        </section>

        <section>
            <h6 className="h6 mb-3">Danger State</h6>
            <Caption text="caption" state="danger" icon="circle-xmark" />
        </section>

        <section>
            <h6 className="h6 mb-3">Warning State</h6>
            <Caption text="caption" state="warning" icon="triangle-exclamation" />
        </section>

        <section>
            <h6 className="h6 mb-3">Disabled State</h6>
            <Caption text="caption" state="disabled" icon="square-plus" />
        </section>
    </div>
);

/**
 * Combined Example
 * Shows label and caption used together in a form context
 */
export const Combined_Example = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-lg)' }}>
        <section>
            <h6 className="h6 mb-4">Form Field with Label and Caption</h6>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-xs)', maxWidth: '400px' }}>
                <Label text="Email Address" required={true} />
                <input
                    type="email"
                    placeholder="Enter your email"
                    style={{
                        padding: '8px 12px',
                        border: '1px solid var(--color-outline-variant)',
                        borderRadius: '4px',
                        fontSize: '14px'
                    }}
                />
                <Caption text="We'll never share your email with anyone else." state="default" icon="circle-info" />
            </div>
        </section>

        <section>
            <h6 className="h6 mb-4">Success State</h6>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-xs)', maxWidth: '400px' }}>
                <Label text="Username" required={true} />
                <input
                    type="text"
                    value="john_doe"
                    readOnly
                    style={{
                        padding: '8px 12px',
                        border: '1px solid var(--color-success)',
                        borderRadius: '4px',
                        fontSize: '14px',
                        backgroundColor: 'var(--color-success-state-08)'
                    }}
                />
                <Caption text="Username is available!" state="success" icon="circle-check" />
            </div>
        </section>

        <section>
            <h6 className="h6 mb-4">Error State</h6>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-xs)', maxWidth: '400px' }}>
                <Label text="Password" required={true} />
                <input
                    type="password"
                    value="123"
                    style={{
                        padding: '8px 12px',
                        border: '1px solid var(--color-danger)',
                        borderRadius: '4px',
                        fontSize: '14px',
                        backgroundColor: 'var(--color-danger-state-08)'
                    }}
                />
                <Caption text="Password must be at least 8 characters long." state="danger" icon="circle-xmark" />
            </div>
        </section>

        <section>
            <h6 className="h6 mb-4">Warning State</h6>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-xs)', maxWidth: '400px' }}>
                <Label text="Phone Number" required={false} />
                <input
                    type="tel"
                    value="555-0123"
                    style={{
                        padding: '8px 12px',
                        border: '1px solid var(--color-warning)',
                        borderRadius: '4px',
                        fontSize: '14px',
                        backgroundColor: 'var(--color-warning-state-08)'
                    }}
                />
                <Caption text="Please include country code for international numbers." state="warning" icon="triangle-exclamation" />
            </div>
        </section>

        <section>
            <h6 className="h6 mb-4">Disabled State</h6>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-xs)', maxWidth: '400px' }}>
                <Label text="Account Type" required={true} />
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
                        opacity: 0.78
                    }}
                />
                <Caption text="Account type cannot be changed." state="disabled" icon="lock" />
            </div>
        </section>
    </div>
);

// Export components for reuse
export { Label, Caption };
