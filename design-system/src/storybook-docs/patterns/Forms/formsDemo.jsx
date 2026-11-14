import React, { useId, useRef, useState } from 'react';

import {
    Button,
    CheckboxGroup,
    Fieldset,
    Heading,
    IconButton,
    Illustration,
    ProgressIndicator,
    ProgressTracker,
    RadioGroup,
    Select,
    TextField,
} from '@/components';
import { Frame } from '@/patterns';
import { STEPS_ACROSS_MAX, STEPS_RAIL, stepItems } from '@/storybook-docs/lib/focused-task.jsx';
import { BrowserWindow } from '@/storybook-docs/lib/template-page.jsx';
import { FormFields, FILLED } from '../../../patterns/Form/formDemo.jsx';

/**
 * The Forms pattern's examples. The four hosts, the blocked submit, the server
 * refusal, the sending button and leaving with edits are the Form template's
 * demos (formDemo.jsx), reused so the pattern and the template show one thing.
 * What is new here: required and optional marks, help in a caption, bound
 * inputs, and the one-question-per-step flow in the In steps host.
 *
 *   Marks          the fields with their required marks and their captions
 *   BoundInputs    a control that cannot be wrong, in place of a free one
 *   QuestionStep   one focal question per step on Frame · focused
 */

/** The width a picture lays out at, in px: docs geometry. */
export const STAGE = 1024; // docs-literal

/** Window height for a question step with 96px tile illustrations and an error line: docs geometry, in px. */
export const QUESTION_STEP_HEIGHT = 540; // docs-literal

/** The fields as the person meets them: Student and Site are required, Notes says it is optional. */
export const Marks = () => {
    const [values, setValues] = useState(FILLED);
    return (
        <div style={{ padding: 'var(--page-pad)', maxInlineSize: 'calc(var(--card-min-width-lg))' }}>
            <FormFields values={values} onChange={setValues} />
        </div>
    );
};

const GRADES = ['Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'];

/** Up to five choices are a radio group that starts unanswered; six or more are a select. */
export const BoundInputs = () => {
    const [format, setFormat] = useState(null);
    const [grade, setGrade] = useState(null);
    return (
        <div style={{ padding: 'var(--page-pad)', maxInlineSize: 'calc(var(--card-min-width-lg))' }}>
            <Fieldset legend="Session">
                <RadioGroup legend="Format" isRequired options={['In person', 'Video', 'Phone']} value={format} onChange={setFormat} />
                <Select label="Grade" isRequired options={GRADES.map((g) => ({ value: g, label: g }))} value={grade} onChange={setGrade} />
                <TextField label="Notes (optional)" value="" onChange={() => {}} />
            </Fieldset>
        </div>
    );
};

export const QUESTION_STEPS = [
    {
        id: 'format',
        stepLabel: 'Format',
        kind: 'radio',
        heading: 'How would you like to tutor?',
        description: 'Pick the session format you want to start with. You can change this later.',
        errorMessage: 'Choose a tutoring format to continue.',
        options: [
            {
                value: 'one-on-one',
                label: 'One-on-one',
                description: 'Work with one student on a focused goal.',
                illustration: <Illustration character="relationships" size={96} />,
            },
            {
                value: 'small-group',
                label: 'Small group',
                description: 'Guide two to four students together.',
                illustration: <Illustration character="social-emotional" size={96} />,
            },
            {
                value: 'drop-in',
                label: 'Drop-in help',
                description: 'Answer quick homework questions.',
                illustration: <Illustration character="mastering-content" size={96} />,
            },
        ],
    },
    {
        id: 'subjects',
        stepLabel: 'Subjects',
        kind: 'checkbox',
        heading: 'Which subjects can you tutor?',
        description: 'Choose every subject you are comfortable teaching this term.',
        errorMessage: 'Select at least one subject to continue.',
        options: [
            {
                value: 'algebra',
                label: 'Algebra',
                description: 'Equations, functions, and graphs.',
                illustration: <Illustration character="equal" size={96} />,
            },
            {
                value: 'geometry',
                label: 'Geometry',
                description: 'Shapes, proofs, and spatial reasoning.',
                illustration: <Illustration character="pi" size={96} />,
            },
            {
                value: 'calculus',
                label: 'Calculus',
                description: 'Limits, derivatives, and integrals.',
                illustration: <Illustration character="root" size={96} />,
            },
        ],
    },
    {
        id: 'schedule',
        stepLabel: 'Schedule',
        kind: 'radio',
        heading: 'When are you free to tutor?',
        description: 'We match you with sessions in your preferred window.',
        errorMessage: 'Choose a time window to continue.',
        options: [
            {
                value: 'afternoons',
                label: 'School afternoons',
                description: 'Weekdays between 3:00 PM and 6:00 PM.',
                illustration: <Illustration character="advocacy" size={96} />,
            },
            {
                value: 'evenings',
                label: 'Evenings and weekends',
                description: 'After 6:00 PM or Saturday mornings.',
                illustration: <Illustration character="technology" size={96} />,
            },
        ],
    },
];

export const FIVE_QUESTION_STEPS = [
    {
        id: 'format',
        stepLabel: 'Format',
        kind: 'radio',
        heading: 'How would you like to tutor?',
        description: 'Pick the session format you want to start with.',
        errorMessage: 'Choose a tutoring format to continue.',
        options: QUESTION_STEPS[0].options.slice(0, 2),
    },
    {
        id: 'subjects',
        stepLabel: 'Subjects',
        kind: 'checkbox',
        heading: 'Which subjects can you tutor?',
        description: 'Choose every subject you are comfortable teaching.',
        errorMessage: 'Select at least one subject to continue.',
        options: QUESTION_STEPS[1].options.slice(0, 2),
    },
    {
        id: 'grades',
        stepLabel: 'Grades',
        kind: 'checkbox',
        heading: 'Which grade bands fit you best?',
        description: 'Pick one or both grade bands for this term.',
        errorMessage: 'Select at least one grade band to continue.',
        options: [
            {
                value: 'middle',
                label: 'Middle school',
                description: 'Grades 6 through 8.',
                illustration: <Illustration character="dot" size={96} />,
            },
            {
                value: 'high',
                label: 'High school',
                description: 'Grades 9 through 12.',
                illustration: <Illustration character="all" size={96} />,
            },
        ],
    },
    {
        id: 'schedule',
        stepLabel: 'Schedule',
        kind: 'radio',
        heading: 'When are you free to tutor?',
        description: 'We match you with sessions in your preferred window.',
        errorMessage: 'Choose a time window to continue.',
        options: QUESTION_STEPS[2].options,
    },
    {
        id: 'review',
        stepLabel: 'Review',
        kind: 'radio',
        heading: 'Ready to start matching?',
        description: 'Confirm how you want your supervisor to assign your first student.',
        errorMessage: 'Choose a matching preference to continue.',
        options: [
            {
                value: 'auto',
                label: 'Match me right away',
                description: 'Assign the next student in my window.',
                illustration: <Illustration character="approximately-equal" size={96} />,
            },
            {
                value: 'review-first',
                label: 'Review matches first',
                description: 'Send me student profiles before confirming.',
                illustration: <Illustration character="divider" size={96} />,
            },
        ],
    },
];

const hasAnswer = (step, answer) => (
    step.kind === 'checkbox'
        ? Array.isArray(answer) && answer.length > 0
        : answer !== null && answer !== undefined && answer !== ''
);

/**
 * One question per step inside the Forms pattern's In steps host (Frame · focused).
 * Under five steps, ProgressIndicator dots sit centered above the question;
 * at five or more, the host switches to its left step list. Continue stays
 * enabled and validates on press.
 */
export const QuestionStep = ({
    steps = QUESTION_STEPS,
    start = 0,
    initialAnswers = {},
    title = 'Tutor setup',
}) => {
    const [at, setAt] = useState(start);
    const [answers, setAnswers] = useState(initialAnswers);
    const [error, setError] = useState(null);
    const groupRef = useRef(null);
    const headingId = useId();

    const step = steps[at];
    const answer = answers[step.id];
    const usesLeftStepList = steps.length > STEPS_ACROSS_MAX;
    const labels = steps.map((item) => item.stepLabel);

    const goToStep = (nextIndex) => {
        setError(null);
        setAt(nextIndex);
    };

    const goBack = () => {
        if (at === 0) return;
        goToStep(at - 1);
    };

    const goContinue = () => {
        if (!hasAnswer(step, answer)) {
            setError(step.errorMessage);
            const firstControl = groupRef.current?.querySelector('[role="radio"], input[type="checkbox"]');
            firstControl?.focus();
            return;
        }
        setError(null);
        if (at < steps.length - 1) {
            setAt(at + 1);
        }
    };

    const questionBody = (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--stack-lg)',
                flex: '1 1 auto',
                minInlineSize: 0,
            }}
        >
            {!usesLeftStepList && (
                <ProgressIndicator
                    values={labels}
                    selectedIndex={at}
                    label="Setup progress"
                />
            )}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 'var(--stack-sm)',
                    textAlign: 'center',
                }}
            >
                <Heading as="h1" size="medium" id={headingId}>
                    {step.heading}
                </Heading>
                <p style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>
                    {step.description}
                </p>
            </div>
            <div ref={groupRef} style={{ display: 'flex', justifyContent: 'center' }}>
                {step.kind === 'checkbox' ? (
                    <CheckboxGroup
                        key={step.id}
                        name={`question-${step.id}`}
                        aria-labelledby={headingId}
                        appearance="tile"
                        orientation="inline"
                        options={step.options}
                        value={Array.isArray(answer) ? answer : []}
                        onChange={(next) => {
                            setAnswers((prev) => ({ ...prev, [step.id]: next }));
                            if (next.length > 0) setError(null);
                        }}
                        error={error}
                    />
                ) : (
                    <RadioGroup
                        key={step.id}
                        name={`question-${step.id}`}
                        aria-labelledby={headingId}
                        appearance="tile"
                        orientation="inline"
                        options={step.options}
                        value={answer ?? null}
                        onChange={(next) => {
                            setAnswers((prev) => ({ ...prev, [step.id]: next }));
                            if (next !== null && next !== undefined) setError(null);
                        }}
                        error={error}
                    />
                )}
            </div>
            <div
                role="group"
                aria-label="Step actions"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'var(--inline-md)',
                }}
            >
                <Button text="Back" appearance="subtle" isDisabled={at === 0} onClick={goBack} />
                <Button text="Continue" appearance="primary" onClick={goContinue} />
            </div>
        </div>
    );

    return (
        <Frame
            header={(
                <div style={{ display: 'flex', alignItems: 'center', flex: '1 1 auto', gap: 'var(--inline-md)', minInlineSize: 0 }}>
                    <IconButton appearance="subtle" icon="xmark" label="Close" onClick={() => {}} />
                    <span style={{ font: 'var(--heading-xsmall)', color: 'var(--ds-text)' }}>{title}</span>
                </div>
            )}
            width="reading"
            style={{ blockSize: '100%' }}
        >
            {usesLeftStepList ? (
                <div style={{ display: 'flex', gap: 'var(--inline-lg)' }}>
                    <div style={{ flex: `0 0 ${STEPS_RAIL}px`, inlineSize: STEPS_RAIL }}>
                        <ProgressTracker
                            label="Steps"
                            orientation="vertical"
                            items={stepItems(labels, at, goToStep)}
                        />
                    </div>
                    {questionBody}
                </div>
            ) : questionBody}
        </Frame>
    );
};

/** The question step framed in its browser window for the Forms pattern page. */
export const QuestionStepInWindow = ({ address = 'app.plus.org/signup', height = QUESTION_STEP_HEIGHT, ...props }) => (
    <BrowserWindow address={address} height={height}>
        <QuestionStep {...props} />
    </BrowserWindow>
);
