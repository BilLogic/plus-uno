/**
 * Regular is the default weight for a PLUS icon; solid is used only where Free
 * has no regular. Which names have a regular is generated from the Font Awesome
 * 7.2 metadata (`npm run generate:icon-lists`). An alias name (such as
 * `calendar-alt`) is not listed, so it draws solid: use the current name.
 */
import { FREE_REGULAR_ICONS } from './icon-regular.generated';

export { FREE_REGULAR_ICONS };

/**
 * The Font Awesome classes for a Free icon name: `fa-regular fa-<name>` where
 * Free has a regular weight, `fa-solid fa-<name>` where it does not. A string
 * that already carries a family (`fa-brands fa-figma`) is returned as given.
 */
export const iconClass = (name) => {
    if (name.includes("fa-")) return name;
    return `${FREE_REGULAR_ICONS.has(name) ? "fa-regular" : "fa-solid"} fa-${name}`;
};
