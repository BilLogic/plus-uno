import React from 'react';
import { showCode } from '@/storybook-docs/lib/show-code.js';
import { CaseSurface } from '@/storybook-docs/lib/case-surface.jsx';
import { FitStage } from '@/storybook-docs/lib/fit-stage.jsx';
import { WINDOW_HEIGHT } from '@/storybook-docs/lib/multi-step-task.jsx';
import { BrowserWindow } from '@/storybook-docs/lib/template-page.jsx';
import * as Example from './FrameExamples.jsx';
import examplesSource from './FrameExamples.jsx?raw';

/**
 * The live do and don't examples of the Frame template page. Each one is an
 * example from `FrameExamples.jsx` inside the staging the docs page needs; its
 * Show code is that example's own source, never the staging.
 */

/** The Show code for each example, read from `FrameExamples.jsx`. */
export const CODE = showCode(examplesSource, [
    'BarInOrder',
    'BarScrambled',
    'MultiStepInnerSidebar',
    'MultiStepStepsInPage',
    'AiPanel',
    'BareColumn',
    'BareWithSidebar',
]);

/** Wide enough that the Frame inside the window docks its Sidebar (1024 and up). */
const DOCKED_STAGE = 1100; // docs-literal: keeps the Frame at 1024 or more inside the window's border
/** Wide enough that the Sidebar and the AI panel both dock (the Page keeps its 720 floor). */
const PANEL_STAGE = 1440; // docs-literal: the X-Large stage

const holdLinks = (event) => {
    if (event.target.closest('a')) event.preventDefault();
};

/** The footer bar on a surface, its Save and exit link held in place. */
const OnBar = ({ children }) => (
    <CaseSurface border="top" padding="sm" onClickCapture={holdLinks}>{children}</CaseSurface>
);

/** A window at the docs stage width, holding a Frame that fills it. */
const InWindow = ({ address, stage = DOCKED_STAGE, children }) => (
    <FitStage width={stage} reflow={false}>
        <BrowserWindow address={address} height={WINDOW_HEIGHT}>
            <div style={{ height: '100%' }} onClickCapture={holdLinks}>{children}</div>
        </BrowserWindow>
    </FitStage>
);

/** Save and exit as a link at the left edge; Back and the primary Next in tracks 3 and 4, on one 32 line. */
export const BarInOrder = () => <OnBar><Example.BarInOrder /></OnBar>;

/** Cancel repeated in the footer beside Save and exit: two ways out of one task. */
export const BarScrambled = () => <OnBar><Example.BarScrambled /></OnBar>;

/** One task: the steps are the Sidebar's inner rows, so the Page holds only the task. */
export const MultiStepInnerSidebar = () => <InWindow address="app.plus.org/terms/new"><Example.MultiStepInnerSidebar /></InWindow>;

/** The steps drawn again in the Page, beside a Sidebar that still lists the main areas: two lists for one task. */
export const MultiStepStepsInPage = () => <InWindow address="app.plus.org/terms/new"><Example.MultiStepStepsInPage /></InWindow>;

/** The panel docked at the right edge, the Page narrowing beside it. */
export const AiPanelDocked = () => <InWindow address="app.plus.org/dashboard" stage={PANEL_STAGE}><Example.AiPanel /></InWindow>;

/** The panel floating over the Page, hiding the rows beneath it: a Frame under 1168 cannot dock a 400 panel. */
export const AiPanelFloating = () => <InWindow address="app.plus.org/dashboard"><Example.AiPanel /></InWindow>;

/** One centered column: the form and its button. */
export const BareColumn = () => <InWindow address="app.plus.org/sign-in"><Example.BareColumn /></InWindow>;

/** The Sidebar beside a sign-in: navigation for a person who has not signed in. */
export const BareWithSidebar = () => <InWindow address="app.plus.org/sign-in"><Example.BareWithSidebar /></InWindow>;
