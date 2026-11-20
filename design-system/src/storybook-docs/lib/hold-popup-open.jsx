import React from 'react';

import { Popup } from '@/components';

/**
 * Draws a printed Popup example open, so a picture shows its layer. A real
 * Popup opens from its trigger; `show` with `triggerType="manual"` is staging,
 * so the printed example never carries it. The case calls the example for its
 * element tree and this puts both on each Popup in it, also inside a menu.
 *
 * @param {React.ReactNode} node  what a hook-free example returned
 */
export const holdPopupOpen = (node) => React.Children.map(node, (child) => {
    if (!React.isValidElement(child)) return child;
    if (child.type === Popup) return React.cloneElement(child, { show: true, triggerType: 'manual' });
    if (child.props?.children) return React.cloneElement(child, undefined, holdPopupOpen(child.props.children));
    return child;
});
