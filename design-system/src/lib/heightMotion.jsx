import React, { createContext, useContext } from 'react';
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from 'motion/react';
import { SPRINGS } from '@/tokens/ladder/springs.generated.js';

export { AnimatePresence };
export const HeightRowContext = createContext(false);

/** Height follows the row spring; Reduced holds its final size and fades. */
export function HeightSurface({ children, className, ...props }) {
    const reduced = useReducedMotion();
    const present = useIsPresent();
    return (
        <motion.div
            className={className}
            style={{ overflow: 'hidden' }}
            initial={{ height: reduced ? 'auto' : 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: reduced ? 'auto' : 0, opacity: 0 }}
            transition={{ height: SPRINGS['spatial.fast'].productive, opacity: SPRINGS['appearance.fast'].productive }}
            aria-hidden={!present ? true : undefined}
            inert={!present ? true : undefined}
            {...props}
        >{children}</motion.div>
    );
}

export function HeightCell({ children }) {
    return useContext(HeightRowContext)
        ? <HeightSurface><div className="plus-tree-table-cell-height">{children}</div></HeightSurface>
        : children;
}

/** Keep table markup intact: presence is shared by the cells inside this row. */
export function HeightRow({ children }) {
    const present = useIsPresent();
    return (
        <HeightRowContext.Provider value>
            {React.cloneElement(children, { inert: !present ? true : undefined, 'aria-hidden': !present ? true : undefined })}
        </HeightRowContext.Provider>
    );
}
