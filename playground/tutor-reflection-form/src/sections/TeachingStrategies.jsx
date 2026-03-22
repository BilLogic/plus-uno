import React from 'react';
import MultipleChoice from '@/forms/MultipleChoice';
import Scale from '@/forms/RadioButtonGroup';
import Badge from '@/components/Badge';

const EFFECTIVENESS_OPTIONS = [
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '4', label: '4' },
    { value: '5', label: '5' },
];

const TeachingStrategies = ({ strategiesList, data, onChange }) => {
    const handleStrategyToggle = (newSelected) => {
        onChange({ selected: newSelected });
    };

    const handleRatingChange = (strategy, value) => {
        onChange({
            ratings: { ...data.ratings, [strategy]: value },
        });
    };

    const handleUseAgainChange = (strategy, value) => {
        onChange({
            useAgain: { ...data.useAgain, [strategy]: value },
        });
    };

    const strategyOptions = strategiesList.map((s) => ({
        value: s,
        label: s,
    }));

    return (
        <div className="reflection-form__section-card">
            <h5 className="h5 reflection-form__section-title">
                <i className="fa-solid fa-lightbulb" style={{ marginRight: '8px', color: 'var(--color-primary)' }} />
                Teaching Strategies
            </h5>
            <p className="body2-txt reflection-form__section-description">
                Which strategies did you use this session? Rating their effectiveness helps build
                AI-powered coaching insights over time.
            </p>

            <div className="reflection-form__field-group">
                <label className="body2-txt font-weight-semibold reflection-form__label">
                    Strategies used this session *
                </label>
                <MultipleChoice
                    name="strategies"
                    type="checkbox"
                    options={strategyOptions}
                    value={data.selected}
                    onChange={handleStrategyToggle}
                />
            </div>

            {data.selected.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-md, 16px)' }}>
                    <label className="body2-txt font-weight-semibold reflection-form__label">
                        Rate each strategy's effectiveness
                    </label>

                    {data.selected.map((strategy) => (
                        <div key={strategy} className="strategy-item">
                            <div className="strategy-item__header">
                                <span className="body2-txt font-weight-semibold" style={{ color: 'var(--color-on-surface)' }}>
                                    {strategy}
                                </span>
                                {data.ratings[strategy] && (
                                    <Badge
                                        text={`${data.ratings[strategy]}/5`}
                                        style={parseInt(data.ratings[strategy]) >= 4 ? 'success' : parseInt(data.ratings[strategy]) >= 3 ? 'warning' : 'danger'}
                                        size="b3"
                                    />
                                )}
                            </div>

                            <Scale
                                name={`effectiveness-${strategy}`}
                                lowestLabel="Not effective"
                                highestLabel="Very effective"
                                options={EFFECTIVENESS_OPTIONS}
                                value={data.ratings[strategy]}
                                onChange={(val) => handleRatingChange(strategy, val)}
                            />

                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--size-element-gap-md, 16px)' }}>
                                <span className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                                    Would you use this strategy again?
                                </span>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {['Yes', 'No', 'Maybe'].map((opt) => (
                                        <span
                                            key={opt}
                                            onClick={() => handleUseAgainChange(strategy, opt)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <Badge
                                                text={opt}
                                                style={data.useAgain[strategy] === opt ? 'primary' : 'secondary'}
                                                size="b3"
                                            />
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TeachingStrategies;
