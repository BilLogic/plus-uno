/**
 * Live-app compatibility shim — Self Reflection filled state.
 * Prefer Storybook Pages / Self Reflection stories / Reflection Flow.
 */
import React from 'react';
import { Filled } from './SelfReflection.stories.jsx';

/**
 * @param {object} props
 */
export default function SelfReflectionFilled(props) {
    return Filled.render(props);
}
