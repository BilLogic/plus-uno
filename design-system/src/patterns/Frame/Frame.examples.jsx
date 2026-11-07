import React from 'react';

import { InAppFrame, slotContent } from '@/storybook-docs/lib/pattern-demo.jsx';
import { ScaledPreview } from '@/storybook-docs/lib/scaled-preview.jsx';
import BrowserFrame from '@/storybook-docs/chrome/BrowserFrame';

/**
 * The do and don't examples on the Frame docs page: a live Frame, scaled
 * down to the card. The stage is 1024 wide, so the Sidebar docks as it does
 * at Large. Stage sizes are docs geometry, not design values.
 */

const STAGE = { width: 1024, height: 560 };

const Scenario = () => (
    <InAppFrame height="100%">
        {slotContent('Content slot')}
    </InAppFrame>
);

/** A Frame in one browser's window chrome, at the stage size. */
const InBrowser = ({ browser, children = <Scenario /> }) => (
    <ScaledPreview {...STAGE}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <BrowserFrame browser={browser}>{children}</BrowserFrame>
        </div>
    </ScaledPreview>
);

const Stack = ({ children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>{children}</div>
);

/** Do: the Frame inside a Browser frame. */
export const InBrowserDo = () => <InBrowser browser="chrome" />;

/** Don't: the same Frame with no window around it. */
export const InBrowserDont = () => (
    <ScaledPreview {...STAGE}>
        <Scenario />
    </ScaledPreview>
);

/** Do: two scenarios in the same browser. */
export const OneBrowserDo = () => (
    <Stack>
        <InBrowser browser="chrome" />
        <InBrowser browser="chrome" />
    </Stack>
);

/** Don't: one scenario in Chrome, the next in Safari. */
export const OneBrowserDont = () => (
    <Stack>
        <InBrowser browser="chrome" />
        <InBrowser browser="safari" />
    </Stack>
);

/** Do: the Frame fills the Browser frame. */
export const WidthDo = () => <InBrowser browser="chrome" />;

/** Don't: a narrower Frame floats in the middle of a wider Browser frame. */
export const WidthDont = () => (
    <InBrowser browser="chrome">
        <div style={{ width: '75%', height: '100%', marginInline: 'auto' }}>
            <Scenario />
        </div>
    </InBrowser>
);
