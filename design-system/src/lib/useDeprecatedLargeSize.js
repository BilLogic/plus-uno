import { useEffect } from 'react';

/**
 * Says in development, once per mounted control, that a size it was given is
 * kept only so no call site breaks: it draws like `medium`.
 *
 * @param {string} component - The component's display name, for the message.
 * @param {string} size - The size prop the caller passed.
 * @param {string[]} deprecated - The sizes that draw like `medium`.
 */
function useDeprecatedSizes(component, size, deprecated) {
    const isDeprecated = deprecated.includes(size);
    useEffect(() => {
        if (!isDeprecated || process.env.NODE_ENV === 'production') return;
        // eslint-disable-next-line no-console
        console.warn(`[${component}] size="${size}" is deprecated and draws like size="medium"; use medium.`);
    }, [component, size, isDeprecated]);
}

const LARGE = ['large'];
const SMALL_AND_LARGE = ['small', 'large'];

/**
 * Controls draw two heights, 32 and 24 compact. `size="large"` is kept so no
 * call site breaks, but it draws like `medium`.
 *
 * @param {string} component - The component's display name, for the message.
 * @param {string} size - The size prop the caller passed.
 */
export function useDeprecatedLargeSize(component, size) {
    useDeprecatedSizes(component, size, LARGE);
}

/**
 * Fields draw one height, 32. `size="small"` and `size="large"` are kept so
 * no call site breaks, but both draw like `medium`.
 *
 * @param {string} component - The component's display name, for the message.
 * @param {string} size - The size prop the caller passed.
 */
export function useDeprecatedFieldSize(component, size) {
    useDeprecatedSizes(component, size, SMALL_AND_LARGE);
}
