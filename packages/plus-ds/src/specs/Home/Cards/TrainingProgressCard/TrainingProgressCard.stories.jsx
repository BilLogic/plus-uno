import React from 'react';
import TrainingProgressCard from './TrainingProgressCard';

export default {
    title: 'Specs/Home/Cards/TrainingProgressCard',
    component: TrainingProgressCard,
    tags: ['autodocs'],
};

export const Overview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div>
            <h3 style={{ marginBottom: '16px', fontSize: '14px', fontWeight: '600' }}>Default</h3>
            <TrainingProgressCard
                size="default"
                completed={6}
                total={10}
                competencies={{
                    'S': 10,
                    'M': 15,
                    'A': 20,
                    'R': 25,
                    'T': 30
                }}
            />
        </div>
        <div>
            <h3 style={{ marginBottom: '16px', fontSize: '14px', fontWeight: '600' }}>Small</h3>
            <TrainingProgressCard
                size="small"
                completed={4}
                total={8}
                competencies={{
                    'S': 8,
                    'M': 12,
                    'A': 16,
                    'R': 20,
                    'T': 24
                }}
                competencyBreakdown={{
                    'S': { completed: 6, total: 9 },
                    'M': { completed: 2, total: 8 },
                    'A': { completed: 5, total: 7 },
                    'R': { completed: 3, total: 8 },
                    'T': { completed: 7, total: 9 }
                }}
            />
        </div>
    </div>
);

