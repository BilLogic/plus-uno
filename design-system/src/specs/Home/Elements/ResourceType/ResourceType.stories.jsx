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
            <span style={{ fontSize: '12px', color: 'var(--ds-text-subtle)' }}>PDF</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <ResourceType type="link" />
            <span style={{ fontSize: '12px', color: 'var(--ds-text-subtle)' }}>Link</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <ResourceType type="video" />
            <span style={{ fontSize: '12px', color: 'var(--ds-text-subtle)' }}>Video</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <ResourceType type="image" />
            <span style={{ fontSize: '12px', color: 'var(--ds-text-subtle)' }}>Image</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <ResourceType type="slides" />
            <span style={{ fontSize: '12px', color: 'var(--ds-text-subtle)' }}>Slides</span>
        </div>
    </div>
);

