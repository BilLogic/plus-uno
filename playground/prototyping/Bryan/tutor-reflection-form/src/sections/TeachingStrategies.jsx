import React from 'react';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import Scale from '@/forms/RadioButtonGroup';
import MultipleChoice from '@/forms/MultipleChoice';
import { STRATEGIES, EFFECTIVENESS_OPTIONS, WOULD_USE_AGAIN_OPTIONS } from '../data/mockData';

export default function TeachingStrategies({ formState, dispatch }) {
    const { selectedStrategies, strategyDetails } = formState;

    return (
        <div className="section-container">
            <div className="section-header">
                <h2 className="h5-txt" style={{ color: 'var(--color-on-surface)' }}>
                    Teaching Strategies
                </h2>
                <p className="body2-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                    Select the strategies you used during this session, then rate their effectiveness.
                </p>
            </div>

            <Card paddingSize="lg" gapSize="md" radiusSize="sm">
                <MultipleChoice
                    name="strategies"
                    type="checkbox"
                    options={STRATEGIES}
                    value={selectedStrategies}
                    onChange={(val) =>
                        dispatch({ type: 'SET_FIELD', field: 'selectedStrategies', value: val })
                    }
                />
            </Card>

            {selectedStrategies.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-md)' }}>
                    <span
                        className="body2-txt"
                        style={{
                            fontWeight: 'var(--font-weight-body2-semibold)',
                            color: 'var(--color-on-surface)',
                        }}
                    >
                        Rate each strategy
                    </span>

                    {selectedStrategies.map((strategyValue) => {
                        const strategy = STRATEGIES.find((s) => s.value === strategyValue);
                        if (!strategy) return null;
                        const detail = strategyDetails[strategyValue] || {};

                        return (
                            <div key={strategyValue} className="strategy-detail">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--size-element-gap-sm)' }}>
                                    <Badge text={strategy.label} style="primary" size="b2" />
                                </div>

                                <Scale
                                    name={`effectiveness-${strategyValue}`}
                                    label="Effectiveness"
                                    options={EFFECTIVENESS_OPTIONS}
                                    lowestLabel="Not effective"
                                    highestLabel="Very effective"
                                    value={detail.effectiveness || ''}
                                    onChange={(val) =>
                                        dispatch({
                                            type: 'SET_STRATEGY_DETAIL',
                                            strategyId: strategyValue,
                                            field: 'effectiveness',
                                            value: val,
                                        })
                                    }
                                />

                                <MultipleChoice
                                    name={`wouldUseAgain-${strategyValue}`}
                                    type="radio"
                                    options={WOULD_USE_AGAIN_OPTIONS}
                                    value={detail.wouldUseAgain || ''}
                                    onChange={(val) =>
                                        dispatch({
                                            type: 'SET_STRATEGY_DETAIL',
                                            strategyId: strategyValue,
                                            field: 'wouldUseAgain',
                                            value: val,
                                        })
                                    }
                                />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
