import React from 'react';
import { expect, within } from 'storybook/test';

import MediaObject from './MediaObject/MediaObject';

/**
 * The one cue a clickable media object has.
 *
 * WHY THIS FILE EXISTS (#325). `MediaObject` computed `cursor: pointer` when
 * given an `onClick`, merged it with the caller's `style`, and then spread
 * `{...props}` — which contains `style` — over the result:
 *
 *     style={{ ...styles, ...props.style }} {...props}
 *
 * The later spread won, so the merged object was replaced wholesale and a
 * component given BOTH `onClick` and `style` lost its pointer cursor. Given
 * only one of the two it looked correct, which is why this survived: the
 * failing case needs both, and no story passed both.
 *
 * The row is still a `div` with a handler, which the Usage tab says not to do.
 * This assertion is about the cue not disappearing, not about the pattern being
 * a good one.
 */

export default {
    title: 'Components/Layout and structure/Media object style',
    tags: ['!dev', '!autodocs'],
    parameters: {
        docs: {
            description: {
                component:
                    'Regression cover for #325: a caller-supplied style merges with the '
                    + 'computed one instead of replacing it.',
            },
        },
    },
};

export const CallerStyleMergesWithTheComputedOne = () => (
    <div style={{ maxWidth: '480px' }}>
        <MediaObject
            media={<span aria-hidden="true">◆</span>}
            heading="Session notes"
            onClick={() => {}}
            style={{ marginBlock: '24px' }}
            data-testid="mos-row"
        >
            Last edited yesterday
        </MediaObject>
    </div>
);

CallerStyleMergesWithTheComputedOne.play = async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const row = canvas.getByTestId('mos-row');

    // The caller's style is applied…
    await expect(row.style.marginBlock).toBe('24px');
    // …and it did not take the computed one with it.
    await expect(row.style.cursor).toBe('pointer');
};
