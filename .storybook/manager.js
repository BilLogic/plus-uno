// Storybook manager configuration (runs in the "manager" UI, not inside the preview iframe)
//
// We keep this file tiny and focused: suppress a couple known, non-actionable warnings
// that otherwise drown out real errors in DevTools during design review.

const SUPPRESSED_CONSOLE_SUBSTRINGS = [
  // Storybook internal deprecation (doesn't break anything today)
  'The `active` prop on `Button` is deprecated and will be removed in Storybook 11.',
];

const shouldSuppressConsoleMessage = (args) => {
  const text = args
    .map((a) => (typeof a === 'string' ? a : ''))
    .join(' ');
  return SUPPRESSED_CONSOLE_SUBSTRINGS.some((s) => text.includes(s));
};

// Patch console once (HMR / reloads can re-run manager modules)
if (!globalThis.__PLUS_STORYBOOK_MANAGER_CONSOLE_PATCHED__) {
  globalThis.__PLUS_STORYBOOK_MANAGER_CONSOLE_PATCHED__ = true;

  const originalWarn = console.warn.bind(console);
  const originalError = console.error.bind(console);

  console.warn = (...args) => {
    if (shouldSuppressConsoleMessage(args)) return;
    originalWarn(...args);
  };

  console.error = (...args) => {
    if (shouldSuppressConsoleMessage(args)) return;
    originalError(...args);
  };
}

