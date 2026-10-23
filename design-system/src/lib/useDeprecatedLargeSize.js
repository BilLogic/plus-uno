import { useEffect } from 'react';

/**
 * Controls draw two heights, 32 and 24 compact. `size="large"` is kept so no
 * call site breaks, but it draws like `medium`; this says so in development,
 * once per mounted control.
 *
 * @param {string} component - The component's display name, for the message.
 * @param {string} size - The size prop the caller passed.
 */
export function useDeprecatedLargeSize(component, size) {
    useEffect(() => {
        if (size !== 'large' || process.env.NODE_ENV === 'production') return;
        // eslint-disable-next-line no-console
        console.warn(`[${component}] size="large" is deprecated and draws like size="medium"; use medium.`);
    }, [component, size]);
}
