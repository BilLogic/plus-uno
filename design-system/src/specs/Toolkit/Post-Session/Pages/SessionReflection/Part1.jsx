/**
 * Live-app compatibility shim — Session Reflection filled state.
 * Prefer Storybook Pages / Session Reflection stories / Reflection Flow.
 */
import React from 'react';
import { Filled } from './SessionReflection.stories.jsx';

/**
 * @param {object} props
 */
export default function SessionReflectionPart1(props) {
    return Filled.render(props);
}
