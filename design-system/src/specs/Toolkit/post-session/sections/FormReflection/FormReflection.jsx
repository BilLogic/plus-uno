import React, { useState } from 'react';
import Switch from '../../../../../forms/Switch';
import Textarea from '../../../../../forms/Textarea';

const defaultReflectionPrompts = [
    {
        id: 'selected-areas-1',
        question: 'How can we provide support to enhance performance in the selected areas?',
        warning: "Please do not include students’ name in the response.",
        example: "Eg. I'm experiencing technical difficulties in the breakout room so I need instructions.",
        switchLabel: 'Escalate this request to tutor supervisors for immediate attention.',
    },
    {
        id: 'selected-areas-2',
        question: 'How can we provide support to enhance performance in the selected areas?',
        warning: "Please do not include students’ name in the response.",
        example: "Eg. I'm experiencing technical difficulties in the breakout room so I need instructions.",
        switchLabel: 'Escalate this request to tutor supervisors for immediate attention.',
    },
];

const FormReflection = ({ prompts = defaultReflectionPrompts }) => {
    const [values, setValues] = useState(
        () => prompts.reduce((acc, prompt) => ({ ...acc, [prompt.id]: '' }), {})
    );

    const [escalations, setEscalations] = useState(
        () => prompts.reduce((acc, prompt) => ({ ...acc, [prompt.id]: true }), {})
    );

    return (
        <div
            className="d-flex flex-column"
            style={{
                gap: 'var(--size-section-gap-lg)',
            }}
        >
            {prompts.map((prompt) => (
                <div
                    key={prompt.id}
                    className="d-flex flex-column"
                    style={{
                        gap: 'var(--size-element-gap-md)',
                    }}
                >
                    <p className="body2-txt m-0" style={{ color: 'var(--color-on-surface)' }}>
                        {prompt.question}
                    </p>

                    <p className="body2-txt m-0" style={{ color: 'var(--color-danger)' }}>
                        {prompt.warning}
                    </p>

                    <p className="body2-txt m-0" style={{ color: 'var(--color-on-surface-variant)' }}>
                        {prompt.example}
                    </p>

                    <Textarea
                        id={`${prompt.id}-textarea`}
                        name={`${prompt.id}-textarea`}
                        variant="long"
                        rows={2}
                        value={values[prompt.id]}
                        onChange={(e) =>
                            setValues((prev) => ({
                                ...prev,
                                [prompt.id]: e.target.value,
                            }))
                        }
                    />

                    <Switch
                        id={`${prompt.id}-switch`}
                        name={`${prompt.id}-switch`}
                        checked={escalations[prompt.id]}
                        onChange={(e) =>
                            setEscalations((prev) => ({
                                ...prev,
                                [prompt.id]: e.target.checked,
                            }))
                        }
                        label={prompt.switchLabel}
                    />
                </div>
            ))}
        </div>
    );
};

export default FormReflection;
