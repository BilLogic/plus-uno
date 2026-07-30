/**
 * Live-app compatibility shim — Student Reflection filled state.
 * Prefer Storybook Pages / Student Reflection stories / Reflection Flow.
 */
import React from 'react';
import { Filled } from './StudentReflection.stories.jsx';

/**
 * @param {object} props
 */
export default function StudentReflectionPart1(props) {
    return Filled.render(props);
}
