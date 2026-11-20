import React from 'react';

import { Tooltip } from '@/components';

/**
 * Draws a printed Tooltip example open, so a picture shows its text. A real
 * Tooltip opens from its trigger; `show` is staging, so the printed example
 * never carries it. The case calls the example for its element and this puts
 * `show` on it.
 *
 * @param {React.ReactElement} element  the Tooltip a hook-free example returned
 */
export const holdTooltipOpen = (element) => (
    React.isValidElement(element) && element.type === Tooltip
        ? React.cloneElement(element, { show: true })
        : element
);
