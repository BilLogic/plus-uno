import { createContext, useContext } from 'react';

/**
 * What a reflection step reads from the page around it.
 *
 * - `stepMenu`: the step menu, for the side column of the step's Section.
 * - `footerEl`: the page footer's slot; the step's actions are portaled into it.
 * - `registerCancel`: where a step hands over its Cancel, so Back and Close in
 *   the header row leave the same way Cancel does.
 *
 * Outside a page (a step on its own) all three are empty: the step draws its
 * Section without a side column and its actions inline.
 */
export const ReflectionChromeContext = createContext({
    stepMenu: null,
    footerEl: null,
    registerCancel: () => {},
});

export const useReflectionChrome = () => useContext(ReflectionChromeContext);
