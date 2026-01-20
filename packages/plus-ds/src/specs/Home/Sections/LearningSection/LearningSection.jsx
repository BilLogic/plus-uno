import React from 'react';
import { Card } from '@/components';

/**
 * Learning Section Component
 * Displays a grid of recommended learning cards.
 */
const LearningSection = () => {
    // Learning Items
    const learningItems = [
        { title: 'Advanced React Patterns', subtitle: 'Frontend Development', image: 'https://via.placeholder.com/300x150' },
        { title: 'Figma for Developers', subtitle: 'Design', image: 'https://via.placeholder.com/300x150' },
        { title: 'Web Accessibility 101', subtitle: 'General Web', image: 'https://via.placeholder.com/300x150' }
    ];

    return (
        <div>
            <h3 className="h3 mb-3">Recommended Learning</h3>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '24px'
            }}>
                {learningItems.map((item, index) => (
                    <Card
                        key={index}
                        title={item.title}
                        subtitle={item.subtitle}
                        image={item.image}
                        body="Learn the latest techniques and best practices."
                        actionButton={{
                            text: 'Start Learning',
                            onClick: () => console.log(`Clicked ${item.title}`)
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

export default LearningSection;
