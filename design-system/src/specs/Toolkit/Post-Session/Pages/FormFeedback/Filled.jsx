/**
 * Live-app compatibility shim — Form Feedback filled state.
 * Prefer Storybook Pages / Form Feedback stories / Reflection Flow.
 */
import React from 'react';
import { Filled } from './FormFeedback.stories.jsx';

/**
 * @param {object} props
 */
export default function FormFeedbackFilled(props) {
    return Filled.render(props);
}
