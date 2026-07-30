import React from 'react';
import LastUpdated from './LastUpdated';

export default {
    tags: ['!dev', '!autodocs'],
    title: 'Specs/Toolkit/Post-Session/Elements/Last Updated',
    parameters: { layout: 'padded' },
};

/** Default last-updated caption. */
export const Overview = () => (
    <LastUpdated value={new Date('2026-11-09T18:12:00')} />
);
