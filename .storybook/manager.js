import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming/create';

// Storybook manager configuration (runs in the "manager" UI, not inside the preview iframe)

const SUPPRESSED_CONSOLE_SUBSTRINGS = [
  'The `active` prop on `Button` is deprecated and will be removed in Storybook 11.',
];

const shouldSuppressConsoleMessage = (args) => {
  const text = args
    .map((a) => (typeof a === 'string' ? a : ''))
    .join(' ');
  return SUPPRESSED_CONSOLE_SUBSTRINGS.some((s) => text.includes(s));
};

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

addons.setConfig({
  theme: create({
    base: 'light',
    brandTitle: 'PLUS',
    brandUrl: './',
    /* PLUS design system primary (see Colors / --color-primary) */
    colorPrimary: '#0472a8',
    colorSecondary: '#00547e',
    appBg: '#fafafa',
    appContentBg: '#ffffff',
    appBorderColor: '#e4e4e7',
    appHoverBg: '#f4f4f5',
    appPreviewBg: '#f4f4f5',
    barBg: '#fafafa',
    barTextColor: '#3f3f46',
    barHoverColor: '#18181b',
    barSelectedColor: '#18181b',
    textColor: '#18181b',
    textInverseColor: '#fafafa',
    textMutedColor: '#71717a',
    fontBase:
      '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontCode: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    appBorderRadius: 8,
    inputBorderRadius: 8,
    inputBg: '#ffffff',
    inputBorder: '#e4e4e7',
    inputTextColor: '#18181b',
    buttonBg: '#f4f4f5',
    buttonBorder: '#e4e4e7',
    booleanBg: '#e4e4e7',
    booleanSelectedBg: '#0472a8',
  }),
});
