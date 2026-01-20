import React from 'react';
import ResourceCard from './ResourceCard';

export default {
    title: 'Specs/Home/Cards/ResourceCard',
    component: ResourceCard,
    tags: ['autodocs'],
};

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '400px' }}>
        <ResourceCard
            type="video"
            subtitle="Use Culturally Responsive Teaching Practices"
            title="Supporting students with learning differences during the coronavirus pandemic is a critical and multifaceted challenge"
            duration="12 mins"
            status="completed"
            badgeType="mastering-content"
            actionButtonText="get started"
        />
        
        <ResourceCard
            type="pdf"
            subtitle="Resource Subtitle"
            title="Resource Title"
            duration="5 mins"
            status="in-progress"
            badgeType="advocacy"
            actionButtonText="continue"
        />
    </div>
);

export const Interactive = {
    args: {
        type: 'video',
        subtitle: 'Use Culturally Responsive Teaching Practices',
        title: 'Supporting students with learning differences during the coronavirus pandemic is a critical and multifaceted challenge',
        duration: '12 mins',
        status: 'completed',
        badgeType: 'mastering-content',
        actionButtonText: 'get started',
    },
};

