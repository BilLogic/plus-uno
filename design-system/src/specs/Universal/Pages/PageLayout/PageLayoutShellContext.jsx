import React, { createContext, useContext } from 'react';

/**
 * Optional shell overrides for PageLayout (e.g. live-app product shell).
 * When null, Specs pages behave as in Storybook.
 *
 * @typedef {object} PageLayoutShellValue
 * @property {boolean} [enabled]
 * @property {'tutor' | 'supervisor'} [user]
 * @property {boolean} [forceSidebarExpanded]
 * @property {string} [activeTab]
 * @property {() => void} [goHome]
 * @property {(tabId: string) => void} [onTabClick]
 * @property {boolean} [fullscreen] Fill the viewport without the Specs card chrome
 */

/** @type {React.Context<PageLayoutShellValue | null>} */
const PageLayoutShellContext = createContext(null);

/**
 * @returns {PageLayoutShellValue | null}
 */
export function usePageLayoutShell() {
  return useContext(PageLayoutShellContext);
}

export const PageLayoutShellProvider = PageLayoutShellContext.Provider;

export default PageLayoutShellContext;
