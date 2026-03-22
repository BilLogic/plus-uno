import React, { useState } from 'react';
import TextareaVer2 from '@plus-ds/forms/TextareaVer2';
import TagInput from '@plus-ds/forms/TagInput';

const Step3Goals = ({ data, updateData }) => {
    const textValue = data.goals?.text || '';
    const tagValue = data.goals?.tags || [
        { text: 'math', color: 'info' },
        { text: 'needs-review', color: 'warning' }
    ];

    const handleTextChange = (e) => {
        updateData('goals', { ...data.goals, text: e.target.value });
    };

    const handleTagsChange = (newTags) => {
        updateData('goals', { ...data.goals, tags: newTags });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md)' }}>
            <div>
                <h3 className="h4-txt" style={{ marginBottom: 'var(--size-element-gap-xs)' }}>Initial Goal Draft</h3>
                <p className="body1-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                    Based on the assessment and curriculum focus, draft the very first SMART goal for this student.
                </p>
            </div>

            <TextareaVer2
                label="Goal Description"
                placeholder="e.g., The student will be able to add and subtract fractions with unlike denominators with 80% accuracy by Nov 15th."
                variant="long"
                value={textValue}
                onChange={handleTextChange}
                rows={4}
            />

            <div>
                <label className="body2-txt" style={{ fontWeight: 'bold', marginBottom: 'var(--size-element-gap-xs)', display: 'block' }}>
                    Suggested Tags
                </label>
                <TagInput
                    id="goal-tags"
                    name="goal-tags"
                    tags={tagValue}
                    onChange={handleTagsChange}
                    size="medium"
                />
            </div>
        </div>
    );
};

export default Step3Goals;
