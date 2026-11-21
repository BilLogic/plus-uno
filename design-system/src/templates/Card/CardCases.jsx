import React from 'react';
import { HeadingLevelContext } from '@/lib/headingLevel';
import { showCode } from '@/storybook-docs/lib/show-code.js';
import * as Example from './CardExamples.jsx';
import examplesSource from './CardExamples.jsx?raw';

/**
 * The examples of the Card page: each one is an example from
 * `CardExamples.jsx`, kept off Storybook's docs styles, and Show code prints
 * the example's own source.
 */

export const CODE = showCode(examplesSource, [
    'MetricAtMin224',
    'MetricAtMin480',
    'MetricsInOneCard',
    'MetricsAsNestedCards',
    'LoadingInPlace',
    'LoadingLine',
]);

/** `sb-unstyled` keeps Storybook's docs styles off the examples, as it does inside a canvas. */
const InDocs = ({ children }) => <div className="sb-unstyled">{children}</div>;

/** Card titles in the do and don't cards sit below the docs page outline. */
const Outline = ({ children }) => (
    <InDocs>
        <HeadingLevelContext.Provider value={4}>{children}</HeadingLevelContext.Provider>
    </InDocs>
);

const inDocs = (Example) => {
    const Wrapped = () => <InDocs><Example /></InDocs>;
    return Wrapped;
};

const underOutline = (Example) => {
    const Wrapped = () => <Outline><Example /></Outline>;
    return Wrapped;
};

/** One number fits the 224 minimum, which is only as wide as it needs. */
export const MetricAtMin224 = inDocs(Example.MetricAtMin224);

/** The same number at the 480 minimum leaves most of the card empty. */
export const MetricAtMin480 = inDocs(Example.MetricAtMin480);

/** The same card shell serves a metric tile, a progress display and a session summary. */
export const CardJobs = Example.CardJobs;

/** One card: three metrics stacked in its body, spaced by its own rhythm. */
export const MetricsInOneCard = underOutline(Example.MetricsInOneCard);

/** Three mini cards nested inside the card. */
export const MetricsAsNestedCards = underOutline(Example.MetricsAsNestedCards);

/** The card holds its place while it loads: skeleton bars fill the body. */
export const LoadingInPlace = inDocs(Example.LoadingInPlace);

/** A bare loading line takes the card away. */
export const LoadingLine = inDocs(Example.LoadingLine);
