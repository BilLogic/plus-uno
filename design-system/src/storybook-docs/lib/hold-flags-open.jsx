import React from 'react';

import { Flag } from '@/components';

/**
 * Draws a printed Flag example held on screen, so a picture keeps its Flags. A
 * real Flag leaves on its own after a few seconds; `autohide={false}` is
 * staging, so the printed example never carries it. The case calls the example
 * for its element tree and this puts `autohide={false}` on each Flag in it.
 *
 * @param {React.ReactNode} node  what a hook-free example returned
 */
export const holdFlagsOpen = (node) => React.Children.map(node, (child) => {
    if (!React.isValidElement(child)) return child;
    if (child.type === Flag) return React.cloneElement(child, { autohide: false, show: true });
    if (child.props?.children) return React.cloneElement(child, undefined, holdFlagsOpen(child.props.children));
    return child;
});
