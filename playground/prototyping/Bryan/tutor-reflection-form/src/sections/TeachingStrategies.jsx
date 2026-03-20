import React from 'react';
import Badge from '@/components/Badge';
import Scale from '@/forms/RadioButtonGroup';
import MultipleChoice from '@/forms/MultipleChoice';
import { STRATEGIES, EFFECTIVENESS_OPTIONS, WOULD_USE_AGAIN_OPTIONS } from '../data/mockData';

export default function TeachingStrategies({ formState, dispatch }) {
    const { selectedStrategies, strategyDetails } = formState;

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--size-element-gap-lg)',
            }}
        >
            <p className="body2-txt m-0" style={{ color: 'var(--color-on-surface-variant)' }}>
                Select the strategies you used during this session, then rate their effectiveness.
            </p>

            <MultipleChoice
                name="strategies"
                type="checkbox"
                options={STRATEGIES}
                value={selectedStrategies}
                onChange={(val) =>
                    dispatch({ type: 'SET_FIELD', field: 'selectedStrategies', value: val })
                }
            />

            {selectedStrategies.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--size-element-gap-lg)' }}>
                    <p className="h6 m-0" style={{ color: 'var(--color-on-surface)' }}>
                        Rate each strategy
                    </p>

                    {selectedStrategies.map((strategyValue) => {
                        const strategy = STRATEGIES.find((s) => s.value === strategyValue);
                        if (!strategy) return null;
                        const detail = strategyDetails[strategyValue] || {};

                        return (
                            <div
                                key={strategyValue}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 'var(--size-element-gap-md)',
                                    padding: 'var(--size-card-pad-y-md) var(--size-card-pad-x-md)',
                                    backgroundColor: 'var(--color-surface-container-low, #f5f5f5)',
                                    borderRadius: 'var(--size-card-radius-sm)',
                                }}
                            >
                                <Badge text={strategy.label} style="primary" size="b2" />

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
