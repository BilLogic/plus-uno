/**
 * Training/Lessons Specs - Elements
 * 
 * Element-level components for training lessons.
 * 
 * Components:
 * - Rating: Star rating component (1-5 stars)
 * - RatingSingle: Single star toggle
 * - LikertScale: Likert scale component
 * - AIIndicator: AI feature indicator icon
 * - SortControl: Sort dropdown control
 * - TrainingLessonStatusSelect: Status selection dropdown
 * - ToastTextButton: Toast with text button
 */

import React, { useState } from 'react';
import Rating from '@/components/Form/forms/Rating';
import Select from '@/components/Form/forms/Select';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Toast from '@/components/Toast';

export default {
    title: 'Specs/Training/Lessons/Elements',
    tags: ['autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Element-level components for training lessons interface.',
            },
        },
    },
};

/**
 * Overview
 */
export const Overview = () => (
    <div style={{ padding: 'var(--size-section-pad-y-lg)', maxWidth: '800px' }}>
        <h2 className="h2" style={{ marginBottom: '24px' }}>Training Lesson Elements</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
                { name: 'Rating', desc: 'Star rating (1-5 stars)' },
                { name: 'LikertScale', desc: 'Agreement scale component' },
                { name: 'AIIndicator', desc: 'AI feature indicator' },
                { name: 'SortControl', desc: 'Sort by dropdown' },
                { name: 'StatusSelect', desc: 'Lesson status selection' }
            ].map(item => (
                <div key={item.name} style={{
                    padding: '16px',
                    backgroundColor: 'var(--color-surface-container)',
                    borderRadius: '8px'
                }}>
                    <h4 className="h4">{item.name}</h4>
                    <p className="body2-txt">{item.desc}</p>
                </div>
            ))}
        </div>
    </div>
);

/**
 * Rating Component
 */
export const RatingComponent = () => {
    const [value, setValue] = useState(3);
    return (
        <div style={{ padding: '24px' }}>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Rating</h6>
            <Rating value={value} onChange={setValue} max={5} />
            <p className="body2-txt" style={{ marginTop: '8px' }}>Selected: {value} stars</p>
        </div>
    );
};

/**
 * LikertScale
 */
export const LikertScale = () => {
    const [selected, setSelected] = useState(null);
    const options = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];

    return (
        <div style={{ padding: '24px' }}>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Likert Scale</h6>
            <p className="body2-txt" style={{ marginBottom: '12px' }}>How satisfied are you with this lesson?</p>
            <div style={{ display: 'flex', gap: '8px' }}>
                {options.map((opt, i) => (
                    <button
                        key={i}
                        onClick={() => setSelected(i)}
                        style={{
                            padding: '8px 12px',
                            border: `2px solid ${selected === i ? 'var(--color-primary)' : 'var(--color-outline-variant)'}`,
                            borderRadius: '4px',
                            backgroundColor: selected === i ? 'var(--color-primary-container)' : 'transparent',
                            cursor: 'pointer',
                            fontSize: '12px'
                        }}
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    );
};

/**
 * AIIndicator
 */
export const AIIndicator = () => (
    <div style={{ padding: '24px' }}>
        <h6 className="h6" style={{ marginBottom: '16px' }}>AI Indicator</h6>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Badge text="AI Enabled" style="info" />
            <span className="body2-txt" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fas fa-robot" style={{ color: 'var(--color-primary)' }} />
                AI-assisted feedback
            </span>
        </div>
    </div>
);

/**
 * SortControl
 */
export const SortControl = () => {
    const [sortBy, setSortBy] = useState(null);
    return (
        <div style={{ padding: '24px', maxWidth: '300px' }}>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Sort Control</h6>
            <Select
                placeholder="Sort by..."
                options={[
                    { value: 'name', label: 'Name' },
                    { value: 'status', label: 'Status' },
                    { value: 'competency', label: 'Competency Area' },
                    { value: 'date', label: 'Date' }
                ]}
                value={sortBy}
                onChange={setSortBy}
            />
        </div>
    );
};

/**
 * StatusSelect
 */
export const StatusSelect = () => {
    const [status, setStatus] = useState(null);
    return (
        <div style={{ padding: '24px', maxWidth: '300px' }}>
            <h6 className="h6" style={{ marginBottom: '16px' }}>Training Lesson Status</h6>
            <Select
                placeholder="Select status..."
                options={[
                    { value: 'not-started', label: 'Not Started' },
                    { value: 'in-progress', label: 'In Progress' },
                    { value: 'completed', label: 'Completed' },
                    { value: 'needs-review', label: 'Needs Review' }
                ]}
                value={status}
                onChange={setStatus}
            />
        </div>
    );
};
