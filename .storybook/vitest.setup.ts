import * as a11yAddonAnnotations from "@storybook/addon-a11y/preview";
import { setProjectAnnotations } from '@storybook/react-vite';
import * as projectAnnotations from './preview.jsx';
// Registered HERE and not in preview.jsx on purpose: the assertion belongs to
// the test run, not to the Storybook a designer has open. See the header of
// ./page-outline.js. `scripts/check-page-outline.mjs` fails if this import or
// the annotations below go missing — that is the one way to switch the
// assertion off without anything going red.
import { pageOutlineAnnotations } from './page-outline.js';

// This is an important step to apply the right configuration when testing your stories.
// More info at: https://storybook.js.org/docs/api/portable-stories/portable-stories-vitest#setprojectannotations
setProjectAnnotations([a11yAddonAnnotations, projectAnnotations, pageOutlineAnnotations]);