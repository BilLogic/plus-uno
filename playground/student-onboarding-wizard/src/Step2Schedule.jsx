import React from 'react';
import Cascader from '@plus-ds/forms/Cascader';

const Step2Schedule = ({ data, updateData }) => {
    const scheduleOptions = [
        {
            text: 'Math',
            value: 'math',
            children: [
                {
                    text: 'Fractions',
                    value: 'fractions',
                    children: [
                        { text: 'Adding/Subtracting', value: 'add-sub' },
                        { text: 'Multiplying/Dividing', value: 'mul-div' }
                    ]
                },
                {
                    text: 'Geometry',
                    value: 'geometry',
                    children: [
                        { text: 'Area & Perimeter', value: 'area-per' },
                        { text: 'Angles', value: 'angles' }
                    ]
                }
            ]
        },
        {
            text: 'Reading',
            value: 'reading',
            children: [
                {
                    text: 'Comprehension',
                    value: 'comprehension',
                    children: [
                        { text: 'Main Idea', value: 'main-idea' },
                        { text: 'Inference', value: 'inference' }
                    ]
                }
            ]
        }
    ];

    const value = data.schedule ? Array.isArray(data.schedule) ? data.schedule : [] : [];

    const handleChange = (newPath) => {
        updateData('schedule', newPath);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md)' }}>
            <div>
                <h3 className="h4-txt" style={{ marginBottom: 'var(--size-element-gap-xs)' }}>Curriculum Focus</h3>
                <p className="body1-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                    Which specific subject and topic area does this student need the most immediate support with?
                </p>
            </div>

            <div style={{ maxWidth: '400px' }}>
                {/* The cascader placeholder label is set to 'Please select' by default */}
                <Cascader
                    id="schedule-cascader"
                    value={value}
                    options={scheduleOptions}
                    onChange={handleChange}
                    placeholder="Select subject path..."
                />
            </div>

            {value.length > 0 && (
                <div style={{ marginTop: 'var(--size-element-gap-md)', padding: 'var(--size-element-pad-y-sm) var(--size-element-pad-x-sm)', backgroundColor: 'var(--color-info-container)', borderRadius: 'var(--size-element-radius-md)' }}>
                    <p className="body2-txt" style={{ margin: 0, color: 'var(--color-on-info-container)' }}>
                        <strong>Selected Focus:</strong> {value.join(' → ')}
                    </p>
                </div>
            )}
        </div>
    );
};

export default Step2Schedule;
