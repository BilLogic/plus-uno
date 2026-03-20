/**
 * Profile - Modals - Preview Image
 * 
 * Preview modal that appears when users upload their profile picture.
 * They can adjust how zoomed in or out the image is before saving.
 * After clicking save, it directs users back to their profile page with the updated picture.
 * 
 * Re-uses the Range component (from forms) and Button component (from components).
 * 
 * Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=4536-3943&m=dev
 * 
 * States:
 * - Default: Preview header + close icon, divider, circular profile image at default zoom (~49%),
 *   "Zoom" label with range slider, minus/plus icons, "Save" button
 * - Zoomed In: Same layout, image zoomed in more, slider at ~82%
 * - Loading: All content hidden (opacity 0), loading spinner centered
 * 
 * Typography:
 * - Header title: h5 (Lato SemiBold, 20px, line-height 1.4) in --color-on-surface
 * - Close icon: Font Awesome 7 Solid, 24px in --color-on-surface-variant
 * - Zoom label: body3-txt (Merriweather Sans Regular, 12px, line-height 1.667) in --color-on-surface-variant
 * - Minus/Plus icons: Font Awesome 7 Solid in --color-primary
 * - Save button text: h6 (Lato SemiBold, 16px, line-height 1.5) in --color-on-primary (white)
 * 
 * Colors:
 * - Modal background: --color-surface-container-high (#e7e8eb)
 * - Divider: --color-outline at 10% opacity
 * - Range track: --color-surface-container-highest (#e2e2e5)
 * - Range fill: --color-primary (#0472a8)
 * - Range dot: --color-primary
 * - Minus/Plus icons: --color-primary
 * - Save button: --color-primary background, --color-on-primary text
 * - Loading spinner: --color-on-surface-variant
 * 
 * Spacing:
 * - Modal padding: var(--size-modal-pad-x-sm, 10px) / var(--size-modal-pad-y-sm, 8px)
 * - Modal gap: var(--size-modal-gap-sm, 8px)
 * - Header gap: var(--size-modal-gap-md, 12px)
 * - Button footer gap: var(--size-modal-gap-sm, 8px)
 * - Zoom label gap: var(--size-small-gap-xs, 4px)
 * - Modal border-radius: 6px
 * 
 * Width: 340px (from Figma)
 */
import React, { useState } from 'react';
import Range from '../../../forms/Range';
import Button from '../../../components/Button/Button';

export default {
    title: 'Specs/Profile/Modals/Preview Image',
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
};

/** Placeholder profile image (circle with avatar illustration) */
const ProfileImagePlaceholder = ({ zoom = 50 }) => {
    const scale = 0.8 + (zoom / 100) * 0.6; // Scale from 0.8 to 1.4
    return (
        <div
            style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                border: '1px solid var(--color-outline-variant)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--color-surface)',
            }}
        >
            <i
                className="fa-solid fa-user"
                style={{
                    fontSize: `${48 * scale}px`,
                    color: 'var(--color-on-surface-variant)',
                    transition: 'font-size 0.15s ease',
                }}
            />
        </div>
    );
};

/** Loading spinner matching Figma design */
const LoadingSpinner = () => (
    <div
        style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '52px',
            height: '52px',
        }}
    >
        {/* 3 quadrant blocks (Figma loading animation) */}
        <div
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '46.15%',
                height: '46.15%',
                backgroundColor: 'var(--color-on-surface-variant)',
                borderRadius: '1px',
            }}
        />
        <div
            style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '46.15%',
                height: '46.15%',
                backgroundColor: 'var(--color-on-surface-variant)',
                borderRadius: '1px',
            }}
        />
        <div
            style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '46.15%',
                height: '46.15%',
                backgroundColor: 'var(--color-on-surface-variant)',
                borderRadius: '1px',
            }}
        />
    </div>
);

/**
 * Reusable Preview Image Modal component for stories
 */
const PreviewImageModal = ({ zoomValue = 49, isLoading = false, interactive = false }) => {
    const [zoom, setZoom] = useState(zoomValue);

    const handleZoomChange = (e) => {
        setZoom(Number(e.target.value));
    };

    const handleMinus = () => {
        setZoom((prev) => Math.max(0, prev - 5));
    };

    const handlePlus = () => {
        setZoom((prev) => Math.min(100, prev + 5));
    };

    const contentOpacity = isLoading ? 0 : 1;

    return (
        <div
            style={{
                width: '340px',
                backgroundColor: 'var(--color-surface-container-high, #e7e8eb)',
                borderRadius: '6px',
                padding: 'var(--size-modal-pad-y-sm, 8px) var(--size-modal-pad-x-sm, 10px)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-modal-gap-sm, 8px)',
                overflow: 'hidden',
                position: 'relative',
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--size-modal-gap-md, 12px)',
                    width: '100%',
                    opacity: contentOpacity,
                }}
            >
                <span
                    className="h5"
                    style={{
                        flex: '1 0 0',
                        color: 'var(--color-on-surface)',
                    }}
                >
                    Preview
                </span>
                <i
                    className="fa-solid fa-xmark"
                    style={{
                        fontSize: '24px',
                        color: 'var(--color-on-surface-variant)',
                        cursor: 'pointer',
                    }}
                />
            </div>

            {/* Divider */}
            <div
                style={{
                    width: '100%',
                    height: '1px',
                    backgroundColor: 'var(--color-outline)',
                    opacity: isLoading ? 0 : 0.1,
                }}
            />

            {/* Body - Profile Image */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 'var(--size-space-medium, 8px)',
                    width: '100%',
                    opacity: contentOpacity,
                }}
            >
                <ProfileImagePlaceholder zoom={interactive ? zoom : zoomValue} />
            </div>

            {/* Divider */}
            <div
                style={{
                    width: '100%',
                    height: '1px',
                    backgroundColor: 'var(--color-outline)',
                    opacity: isLoading ? 0 : 0.1,
                }}
            />

            {/* Zoom Controls */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--size-small-gap-xs, 4px)',
                    width: '100%',
                    opacity: contentOpacity,
                }}
            >
                <span
                    className="body3-txt"
                    style={{
                        color: 'var(--color-on-surface-variant)',
                    }}
                >
                    Zoom
                </span>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--size-element-gap-sm, 8px)',
                        width: '100%',
                    }}
                >
                    <i
                        className="fa-solid fa-minus"
                        style={{
                            fontSize: '14px',
                            color: 'var(--color-primary)',
                            cursor: interactive ? 'pointer' : 'default',
                            flexShrink: 0,
                        }}
                        onClick={interactive ? handleMinus : undefined}
                    />
                    {interactive ? (
                        <Range
                            id="zoom-range"
                            min={0}
                            max={100}
                            value={zoom}
                            onChange={handleZoomChange}
                            size="medium"
                            style={{ flex: '1 0 0' }}
                        />
                    ) : (
                        <Range
                            id="zoom-range-static"
                            min={0}
                            max={100}
                            defaultValue={zoomValue}
                            size="medium"
                            style={{ flex: '1 0 0' }}
                        />
                    )}
                    <i
                        className="fa-solid fa-plus"
                        style={{
                            fontSize: '14px',
                            color: 'var(--color-primary)',
                            cursor: interactive ? 'pointer' : 'default',
                            flexShrink: 0,
                        }}
                        onClick={interactive ? handlePlus : undefined}
                    />
                </div>
            </div>

            {/* Footer - Save Button */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: 'var(--size-modal-gap-sm, 8px)',
                    width: '100%',
                    opacity: contentOpacity,
                }}
            >
                <Button
                    text="Save"
                    style="primary"
                    fill="filled"
                    size="medium"
                />
            </div>

            {/* Loading Spinner */}
            {isLoading && <LoadingSpinner />}
        </div>
    );
};

/**
 * All States
 * Shows the Preview Image modal in all three states:
 * Default, Zoomed In, and Loading.
 */
export const PreviewImageStory = () => {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-section-gap-xl, 32px)',
                padding: 'var(--size-element-pad-y-lg, 12px)',
            }}
        >
            {/* State 1: Default */}
            <div>
                <h6
                    className="h6"
                    style={{
                        color: 'var(--color-on-surface-variant)',
                        marginBottom: 'var(--size-element-gap-md, 16px)',
                    }}
                >
                    Default (Zoom ~49%)
                </h6>
                <PreviewImageModal zoomValue={49} />
            </div>

            {/* State 2: Zoomed In */}
            <div>
                <h6
                    className="h6"
                    style={{
                        color: 'var(--color-on-surface-variant)',
                        marginBottom: 'var(--size-element-gap-md, 16px)',
                    }}
                >
                    Zoomed In (~82%)
                </h6>
                <PreviewImageModal zoomValue={82} />
            </div>

            {/* State 3: Loading */}
            <div>
                <h6
                    className="h6"
                    style={{
                        color: 'var(--color-on-surface-variant)',
                        marginBottom: 'var(--size-element-gap-md, 16px)',
                    }}
                >
                    Loading
                </h6>
                <PreviewImageModal isLoading={true} />
            </div>

            {/* Interactive */}
            <div>
                <h6
                    className="h6"
                    style={{
                        color: 'var(--color-on-surface-variant)',
                        marginBottom: 'var(--size-element-gap-md, 16px)',
                    }}
                >
                    Interactive
                </h6>
                <PreviewImageModal zoomValue={49} interactive={true} />
            </div>
        </div>
    );
};
