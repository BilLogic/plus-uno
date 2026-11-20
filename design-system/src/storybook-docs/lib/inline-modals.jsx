import React from 'react';

import { Modal } from '@/templates';

/**
 * Draws a printed Modal example inside its picture. A consumer's Modal opens
 * over the screen; a docs picture has to sit in flow, which `inline` does, and
 * that prop is staging, so the printed example never carries it. The case calls
 * the example for its element tree and this puts `inline` on each Modal in it.
 *
 * @param {React.ReactNode} node  what a hook-free example returned
 */
export const inlineModals = (node) => React.Children.map(node, (child) => {
    if (!React.isValidElement(child)) return child;
    if (child.type === Modal) return React.cloneElement(child, { inline: true });
    if (child.type === React.Fragment) return <>{inlineModals(child.props.children)}</>;
    return child;
});
