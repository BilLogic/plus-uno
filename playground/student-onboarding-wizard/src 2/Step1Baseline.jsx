import React from 'react';
import ChoiceGrid from '@plus-ds/forms/ChoiceGrid';

const Step1Baseline = ({ data, updateData }) => {
    const rows = [
        { id: 'barrier', label: 'Primary Barrier' }
    ];

    const columns = [
        { id: 'motivation', label: 'Motivation' },
        { id: 'content', label: 'Content Mastery' },
        { id: 'focus', label: 'Focus & Attention' },
        { id: 'language', label: 'Language/Vocab' }
    ];

    // ChoiceGrid expects an object where keys are row IDs and values are selected column IDs
    const values = data.primaryBarrier ? { 'barrier': data.primaryBarrier } : {};

    const handleChange = (rowId, columnId) => {
        updateData('primaryBarrier', columnId);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-md)' }}>
            <div>
                <h3 className="h4-txt" style={{ marginBottom: 'var(--size-element-gap-xs)' }}>Baseline Assessment</h3>
                <p className="body1-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                    Based on your initial review, what is the student's primary learning barrier right now?
                </p>
            </div>

            <ChoiceGrid
                id="baseline-choice-grid"
                name="baseline-choice"
                type="radio"
                rows={rows}
                columns={columns}
                values={values}
                onChange={handleChange}
                size="large"
            />
        </div>
    );
};

export default Step1Baseline;
