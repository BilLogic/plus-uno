import '@testing-library/jest-dom';

// The components barrel loads the chart library, which asks `CSS.supports` on
// load; jsdom has no such function. Setup files run before each test file's
// imports, so every file that reaches the barrel gets it.
globalThis.CSS = globalThis.CSS || {};
if (typeof globalThis.CSS.supports !== 'function') globalThis.CSS.supports = () => false;
