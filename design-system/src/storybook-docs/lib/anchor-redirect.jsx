import { useEffect } from 'react';

/**
 * A section that moved to another docs page leaves its anchor behind: a link to
 * `page#section` still lands on the new page. A hash never reaches the server, so a
 * `netlify.toml` redirect cannot do this. The page that lost the section mounts one of
 * these, and when it opens on the old hash it sends the reader to `to`.
 *
 * - `from`: the old hash, with its `#` (`#foundation-size-roles`).
 * - `to`: the new location, a manager URL such as
 *   `?path=/docs/foundations-layout-dimensions--docs#foundation-size-roles`.
 */
export const redirectMovedAnchor = (from, to, win = window) => {
    const reach = (() => {
        try {
            return win.top && win.top.location.hash === from ? win.top : win;
        } catch {
            return win;
        }
    })();
    if (reach.location.hash !== from) return false;
    reach.location.replace(to);
    return true;
};

export const AnchorRedirect = ({ from, to }) => {
    useEffect(() => {
        redirectMovedAnchor(from, to);
    }, [from, to]);
    return null;
};
