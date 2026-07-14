import React from 'react';
import { ResourceType } from './ResourceType';

export default {
    title: 'Specs/Home/Elements/Resource Type',
    tags: ['!dev', '!autodocs'],
    component: ResourceType,
    parameters: {
        layout: 'centered',
    },
};

export const Overview = () => (
    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <ResourceType type="pdf" />
            <span style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)' }}>PDF</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <ResourceType type="link" />
            <span style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)' }}>Link</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <ResourceType type="video" />
            <span style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)' }}>Video</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <ResourceType type="image" />
            <span style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)' }}>Image</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <ResourceType type="slides" />
            <span style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)' }}>Slides</span>
        </div>
    </div>
);

