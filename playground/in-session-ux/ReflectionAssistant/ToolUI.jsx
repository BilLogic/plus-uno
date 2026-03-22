import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ParameterSlider Component
 * Based on https://www.tool-ui.com/docs/overview
 */
export const ParameterSlider = ({
    id,
    sliders,
    responseActions = [
        { id: "reset", label: "Reset", variant: "ghost" },
        { id: "apply", label: "Apply", variant: "default" }
    ],
    onResponseAction
}) => {
    const [values, setValues] = useState(
        sliders.reduce((acc, s) => ({ ...acc, [s.id]: s.value }), {})
    );

    const handleChange = (sliderId, newValue) => {
        setValues(prev => ({ ...prev, [sliderId]: newValue }));
    };

    return (
        <div
            id={id}
            style={{
                background: 'var(--chat-surface, #ffffff)',
                border: '1px solid var(--chat-outline, #d1d5db)',
                borderRadius: '12px',
                padding: '20px',
                width: '100%',
                fontFamily: 'var(--font-family-body)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {sliders.map(slider => (
                    <div key={slider.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--chat-on-surface, #111827)' }}>
                                {slider.label}
                            </label>
                            <span style={{ fontSize: '13px', color: 'var(--chat-on-surface-muted, #6b7280)', fontWeight: 600 }}>
                                {values[slider.id]}{slider.unit || ''}
                            </span>
                        </div>
                        <input
                            type="range"
                            min={slider.min}
                            max={slider.max}
                            step={slider.step || 1}
                            value={values[slider.id]}
                            onChange={(e) => handleChange(slider.id, parseFloat(e.target.value))}
                            style={{
                                width: '100%',
                                accentColor: 'var(--color-primary, #0472a8)',
                                cursor: 'pointer'
                            }}
                        />
                    </div>
                ))}
            </div>

            {responseActions.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--chat-outline, #e5e7eb)' }}>
                    {responseActions.map(action => (
                        <button
                            key={action.id}
                            onClick={() => onResponseAction?.(action.id, values)}
                            style={{
                                padding: '6px 16px',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                border: action.variant === 'ghost' ? 'none' : '1px solid var(--color-primary, #0472a8)',
                                background: action.variant === 'ghost' ? 'transparent' : 'var(--color-primary, #0472a8)',
                                color: action.variant === 'ghost' ? 'var(--color-primary, #0472a8)' : 'white',
                            }}
                        >
                            {action.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

/**
 * QuestionFlow Component
 * Based on https://www.tool-ui.com/docs/overview
 */
export const QuestionFlow = ({
    id,
    steps,
    step: controlledStep,
    title: controlledTitle,
    description: controlledDescription,
    options: controlledOptions,
    selectionMode = "single",
    onComplete,
    onSelect,
    onBack
}) => {
    const isUpfront = Array.isArray(steps);
    const [currentStepIdx, setCurrentStepIdx] = useState(0);
    const [answers, setAnswers] = useState({});

    const currentStep = isUpfront ? steps[currentStepIdx] : {
        id: controlledStep,
        title: controlledTitle,
        description: controlledDescription,
        options: controlledOptions
    };

    const handleOptionSelect = (optionId) => {
        if (selectionMode === "single") {
            const newAnswers = { ...answers, [currentStep.id]: optionId };
            setAnswers(newAnswers);

            if (isUpfront) {
                if (currentStepIdx < steps.length - 1) {
                    setCurrentStepIdx(prev => prev + 1);
                } else {
                    onComplete?.(newAnswers);
                }
            } else {
                onSelect?.([optionId]);
            }
        } else {
            // Multi-select logic
            const currentAnswers = answers[currentStep.id] || [];
            const newValues = currentAnswers.includes(optionId)
                ? currentAnswers.filter(id => id !== optionId)
                : [...currentAnswers, optionId];

            setAnswers(prev => ({ ...prev, [currentStep.id]: newValues }));
        }
    };

    const handleContinue = () => {
        if (selectionMode === "multi") {
            if (isUpfront) {
                if (currentStepIdx < steps.length - 1) {
                    setCurrentStepIdx(prev => prev + 1);
                } else {
                    onComplete?.(answers);
                }
            } else {
                onSelect?.(answers[currentStep.id] || []);
            }
        }
    };

    return (
        <div
            id={id}
            style={{
                background: 'var(--chat-surface, #ffffff)',
                border: '1px solid var(--chat-outline, #d1d5db)',
                borderRadius: '12px',
                padding: '24px',
                width: '100%',
                fontFamily: 'var(--font-family-body)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
        >
            <div style={{ marginBottom: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--chat-on-surface, #111827)' }}>
                    {currentStep.title}
                </h3>
                {currentStep.description && (
                    <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: 'var(--chat-on-surface-muted, #6b7280)', lineHeight: 1.5 }}>
                        {currentStep.description}
                    </p>
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {currentStep.options?.map(option => {
                    const isSelected = selectionMode === "single"
                        ? answers[currentStep.id] === option.id
                        : (answers[currentStep.id] || []).includes(option.id);

                    return (
                        <button
                            key={option.id}
                            onClick={() => handleOptionSelect(option.id)}
                            style={{
                                padding: '12px 16px',
                                textAlign: 'left',
                                borderRadius: '8px',
                                border: '1px solid',
                                borderColor: isSelected ? 'var(--color-primary, #0472a8)' : 'var(--chat-outline, #e5e7eb)',
                                background: isSelected ? 'var(--color-primary-state-04, rgba(4, 114, 168, 0.04))' : 'transparent',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                        >
                            <span style={{ fontSize: '14px', fontWeight: 500, color: isSelected ? 'var(--color-primary, #0472a8)' : 'var(--chat-on-surface, #111827)' }}>
                                {option.label}
                            </span>
                            {isSelected && (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ color: 'var(--color-primary, #0472a8)' }}>
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            )}
                        </button>
                    );
                })}
            </div>

            {(selectionMode === "multi" || (isUpfront && currentStepIdx > 0)) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--chat-outline, #e5e7eb)' }}>
                    {isUpfront && currentStepIdx > 0 ? (
                        <button
                            onClick={() => setCurrentStepIdx(prev => prev - 1)}
                            style={{
                                padding: '6px 16px',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: 500,
                                color: 'var(--chat-on-surface-muted, #6b7280)',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer'
                            }}
                        >
                            Back
                        </button>
                    ) : (
                        <div />
                    )}
                    {selectionMode === "multi" && (
                        <button
                            onClick={handleContinue}
                            disabled={!(answers[currentStep.id]?.length > 0)}
                            style={{
                                padding: '6px 16px',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                background: (answers[currentStep.id]?.length > 0) ? 'var(--color-primary, #0472a8)' : 'var(--chat-outline, #e5e7eb)',
                                color: 'white',
                                border: 'none'
                            }}
                        >
                            Continue
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
