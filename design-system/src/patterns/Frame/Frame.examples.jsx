import React from 'react';

import { ModeFrame } from '@/storybook-docs/lib/mode-frame.jsx';

/**
 * The do and don't examples on the Frame docs page. The Frame decides what
 * docks from its own width, and a scaled picture would read narrower than its
 * stage, so each side is a story drawn in an iframe at a real screen width
 * (`ModeFrame`). The picture is inert and hidden from assistive technology, so
 * the docs page gains no tab stops. Stage sizes are docs geometry.
 */

const Picture = ({ storyId, width, height = 560, title }) => (
    <div inert aria-hidden="true" style={{ width: '100%' }}>
        <ModeFrame storyId={storyId} width={width} height={height} title={title} />
    </div>
);

/** Do: an app page with its Sidebar, docked at 1024. */
export const WithSidebar = () => <Picture storyId="templates-frame--pair-with-sidebar" width={1024} title="Frame with its Sidebar" />;

/** Don't: the same page with no `sidebar`. */
export const WithoutSidebar = () => <Picture storyId="templates-frame--pair-without-sidebar" width={1024} title="Frame with no Sidebar" />;

/** Don't: a page title in the header row in place of the breadcrumb. */
export const TitleInHeader = () => <Picture storyId="templates-frame--pair-title-in-header" width={1024} title="Frame with a title in the header" />;
