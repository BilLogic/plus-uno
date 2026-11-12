/**
 * A development-only `console.warn` for one component, prefixed with its name:
 * `const warn = devWarn('ChangeTag')` then `warn('x is ignored')` prints
 * `[ChangeTag] x is ignored`. Silent in production.
 */
export const devWarn = (component) => (message) => {
    if (process.env.NODE_ENV === 'production') return;
    // eslint-disable-next-line no-console
    console.warn(`[${component}] ${message}`);
};
