import React from 'react';

import { DropdownMenu } from '@/components';

/**
 * Draws a printed DropdownMenu example open, so a picture can show its rows. A
 * real menu opens from its trigger; `isOpen` is staging, so the printed example
 * never carries it. The case calls the example for its element and this puts
 * `isOpen` on it.
 *
 * @param {React.ReactElement} element  the DropdownMenu a hook-free example returned
 */
export const holdMenuOpen = (element) => (
    React.isValidElement(element) && element.type === DropdownMenu
        ? React.cloneElement(element, { isOpen: true })
        : element
);
