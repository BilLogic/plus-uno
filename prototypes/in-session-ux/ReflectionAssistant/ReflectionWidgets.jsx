import React, { useState } from 'react';

/**
 * QuestionFlow: Guided multi-step interaction for reflection.
 */
export const QuestionFlow = ({ steps, onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);

    const step = steps[currentStep];
    const isLastStep = currentStep === steps.length - 1;

    const handleNext = () => {
        if (isLastStep) {
            onComplete && onComplete();
        } else {
            setCurrentStep(prev => prev + 1);
            setSelectedOption(null);
        }
    };

    return (
        <div className="reflection-widget question-flow" style={{
            background: 'var(--color-surface, #fff)',
            border: '1px solid var(--color-outline-variant, #bec8ca)',
            borderRadius: '16px',
            padding: '20px',
            maxWidth: '500px',
            fontFamily: 'var(--font-family-body)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-on-surface-variant, #6b7280)', textTransform: 'uppercase' }}>
                    Step {currentStep + 1} of {steps.length}
                </span>
                <div style={{ flex: 1, height: '4px', background: 'var(--color-surface-container, #f0f2f5)', margin: '0 12px', borderRadius: '2px', position: 'relative' }}>
                    <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '100%',
                        width: `${((currentStep + 1) / steps.length) * 100}%`,
                        background: 'var(--color-primary, #0472a8)',
                        borderRadius: '2px',
                        transition: 'width 0.3s ease'
                    }} />
                </div>
            </div>

            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600 }}>{step.title}</h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: 'var(--color-on-surface-variant, #6b7280)' }}>{step.description}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                {step.options.map(option => (
                    <button
                        key={option.id}
                        onClick={() => setSelectedOption(option.id)}
                        style={{
                            padding: '12px 16px',
                            textAlign: 'left',
                            background: selectedOption === option.id ? 'var(--color-primary-container, #e0f2fe)' : 'transparent',
                            border: `1px solid ${selectedOption === option.id ? 'var(--color-primary, #0472a8)' : 'var(--color-outline-variant, #bec8ca)'}`,
                            borderRadius: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <div style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            border: `2px solid ${selectedOption === option.id ? 'var(--color-primary, #0472a8)' : 'var(--color-outline-variant, #bec8ca)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {selectedOption === option.id && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-primary, #0472a8)' }} />}
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: selectedOption === option.id ? 600 : 400 }}>{option.label}</span>
                    </button>
                ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    onClick={handleNext}
                    disabled={!selectedOption}
                    style={{
                        padding: '8px 24px',
                        background: 'var(--color-primary, #0472a8)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        opacity: !selectedOption ? 0.5 : 1
                    }}
                >
                    {isLastStep ? 'Finish' : 'Next'}
                </button>
            </div>
        </div>
    );
};

/**
 * ParameterSlider: Set of sliders for metric reflection.
 */
export const ParameterSlider = ({ sliders: initialSliders, onApply }) => {
    const [sliders, setSliders] = useState(initialSliders);

    const handleSliderChange = (id, newValue) => {
        setSliders(prev => prev.map(s => s.id === id ? { ...s, value: newValue } : s));
    };

    const handleReset = () => {
        setSliders(initialSliders);
    };

    return (
        <div className="reflection-widget parameter-slider" style={{
            background: 'var(--color-surface, #fff)',
            border: '1px solid var(--color-outline-variant, #bec8ca)',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '500px',
            fontFamily: 'var(--font-family-body)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
                {sliders.map(slider => (
                    <div key={slider.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 600 }}>{slider.label}</span>
                            <span style={{ fontSize: '14px', color: 'var(--color-primary, #0472a8)', fontWeight: 700 }}>
                                {slider.value}{slider.unit || ''}
                            </span>
                        </div>
                        <input
                            type="range"
                            min={slider.min}
                            max={slider.max}
                            step={slider.step || 1}
                            value={slider.value}
                            onChange={(e) => handleSliderChange(slider.id, parseInt(e.target.value))}
                            style={{
                                width: '100%',
                                cursor: 'pointer',
                                accentColor: 'var(--color-primary, #0472a8)'
                            }}
                        />
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                    onClick={handleReset}
                    style={{
                        padding: '8px 16px',
                        background: 'transparent',
                        color: 'var(--color-on-surface-variant, #6b7280)',
                        border: 'none',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    Reset
                </button>
                <button
                    onClick={() => onApply && onApply(sliders)}
                    style={{
                        padding: '8px 24px',
                        background: 'var(--color-primary, #0472a8)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    Apply
                </button>
            </div>
        </div>
    );
};
