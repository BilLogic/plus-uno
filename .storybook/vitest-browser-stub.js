// Stands in for `vitest/browser` in the real Storybook build, where that module
// does not exist. Only play functions call it, and those run under vitest.
const unavailable = () => {
  throw new Error('userEvent from vitest/browser is only available under vitest');
};
export const userEvent = new Proxy({}, { get: () => unavailable });
