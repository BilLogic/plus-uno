import React from 'react';
import Button from './Button';

export default {
    title: 'Components/Button/Subcomponents',
    component: Button,
    parameters: {
        docs: {
            description: {
                component: 'Internal subcomponents and structural variations of the Button.',
            },
        },
    },
};

/**
 * Button Content
 * Demonstrates the composition of text and visuals (Leading/Trailing).
 */
export const ButtonContent = () => (
    <div className="p-4" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p style={{ color: 'var(--color-secondary-text)', margin: 0, marginBottom: '8px' }}>
            Note: Button content displayed with secondary text color (simulating styling inheritance).
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-secondary-text)' }}>
            <Button.Content text="Text Only" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-secondary-text)' }}>
            <Button.Content text="Text + Leading Visual" leadingVisual="star" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-secondary-text)' }}>
            <Button.Content text="Text + Trailing Visual" trailingVisual="arrow-right" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-secondary-text)' }}>
            <Button.Content leadingVisual="user" aria-label="Icon Only" />
        </div>
    </div>
);

/**
 * Vertical Layout
 * The vertical arrangement of content, typically used for action tiles.
 */
export const VerticalLayout = () => (
    <div style={{ display: 'flex', gap: '16px' }}>
        <div style={{ width: '100px', height: '100px' }}>
            <Button
                text="Add Item"
                vertical
                leadingVisual="plus"
                style="primary"
                fill="outline"
                block // Make it fill the container
                className="h-100" // Ensure height fill if utility exists, or rely on block
            />
        </div>
        <Button
            text="Upload"
            vertical
            leadingVisual="upload"
            style="secondary"
            fill="tonal"
        />
    </div>
);
