/**
 * StrategyContentPromptModal - Training Onboarding Modal
 * 
 * Modal showing reflection question form with instructions, question, textarea, and submit button.
 * Matches Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=74-121977
 */

import React, { useState } from 'react';
import StrategyContentPromptModal from './StrategyContentPromptModal';
import './StrategyContentPromptModal.scss';

export default {
    title: 'Specs/Training/Onboarding/Modals/StrategyContentPromptModal',
    component: StrategyContentPromptModal,
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component: 'Modal component for collecting user reflection responses. Shows instructions, a required question, textarea for response, and submit button.',
            },
        },
    },
    argTypes: {
        instructionsTitle: {
            control: 'text',
            description: 'Instructions section title',
            table: { category: 'Content' },
        },
        instructionsText: {
            control: 'text',
            description: 'Instructions body text',
            table: { category: 'Content' },
        },
        questionLabel: {
            control: 'text',
            description: 'Question label (e.g., "Question 1")',
            table: { category: 'Content' },
        },
        questionText: {
            control: 'text',
            description: 'Question text',
            table: { category: 'Content' },
        },
        placeholder: {
            control: 'text',
            description: 'Textarea placeholder',
            table: { category: 'Content' },
        },
        buttonText: {
            control: 'text',
            description: 'Submit button text',
            table: { category: 'Content' },
        },
        required: {
            control: 'boolean',
            description: 'Whether question is required',
            table: { category: 'Behavior' },
        },
        show: {
            control: 'boolean',
            description: 'Whether modal is visible',
            table: { category: 'State' },
        },
        onSubmit: {
            action: 'submitted',
            table: { category: 'Events' },
        },
        onChange: {
            action: 'changed',
            table: { category: 'Events' },
        },
    },
};

/**
 * Overview
 * Shows modal matching Figma design
 */
export const Overview = {
    render: () => (
        <div style={{ padding: 'var(--size-section-pad-y-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--size-section-gap-lg, 32px)' }}>
            <section>
                <h6 className="h6" style={{ marginBottom: 'var(--size-section-gap-sm, 16px)' }}>Strategy Content Prompt Modal</h6>
                <StrategyContentPromptModal 
                    show={true}
                    instructionsTitle="Instructions"
                    instructionsText="Take a moment to reflect on what you learned in this module. Your response helps us understand your perspective and ensures you're ready to apply this in your sessions. Please answer the question below to complete the module."
                    questionLabel="Question 1"
                    questionText="What's one specific action you plan to take in your next session based on what you learned in this module?"
                    placeholder="Type in your response here ..."
                    buttonText="Submit"
                    required={true}
                />
            </section>
        </div>
    ),
};

/**
 * Interactive
 * Interactive playground with controls
 */
export const Interactive = {
    args: {
        instructionsTitle: 'Instructions',
        instructionsText: "Take a moment to reflect on what you learned in this module. Your response helps us understand your perspective and ensures you're ready to apply this in your sessions. Please answer the question below to complete the module.",
        questionLabel: 'Question 1',
        questionText: "What's one specific action you plan to take in your next session based on what you learned in this module?",
        placeholder: 'Type in your response here ...',
        buttonText: 'Submit',
        required: true,
        show: true,
    },
    render: (args) => {
        const [value, setValue] = useState('');

        return (
            <div style={{ padding: 'var(--size-section-pad-y-lg)' }}>
                <StrategyContentPromptModal 
                    {...args}
                    value={value}
                    onChange={(newValue) => {
                        setValue(newValue);
                        args.onChange && args.onChange(newValue);
                    }}
                    onSubmit={(submittedValue) => {
                        console.log('Submitted:', submittedValue);
                        args.onSubmit && args.onSubmit(submittedValue);
                    }}
                />
            </div>
        );
    },
};
