/**
 * The one place this repository loads Highcharts, and the one instance it uses.
 *
 * WHY THE `esm/` ENTRY AND NOT `highcharts`. The bare entry is a UMD bundle,
 * and so is every `highcharts/modules/*` beside it. A UMD module registers
 * itself against `window._Highcharts`, which only exists when the main bundle
 * was loaded as a script tag — under Vite it is not, so the modules were
 * reaching for an object that was never there. Highcharts 12 tolerated it far
 * enough to keep working; 13 does not, and fails at import with a stack inside
 * `highcharts-more.js` before a single chart renders (#300).
 *
 * The `esm/` builds import `./highcharts.js` themselves and register on THAT
 * instance, so a side-effect import is all a module needs — no factory call,
 * no ordering, no `window`.
 *
 * ONE INSTANCE, AND IT MATTERS. A module registered on the ESM Highcharts is
 * invisible to the UMD one: mixing the two gives two objects, and a chart drawn
 * with the wrong one silently loses every series type these modules add. That
 * is why this file default-exports the instance and every chart component
 * imports Highcharts FROM HERE rather than from the package.
 *
 * The old `initModule()` wrapper is gone with the UMD entry. It called each
 * import as a function and swallowed the result in a try/catch — which is
 * exactly why nobody noticed the modules had stopped applying: the failure it
 * was written to survive is the failure it was hiding.
 */
import Highcharts from 'highcharts/esm/highcharts';

// Side-effect imports. Each registers its series types on the instance above.
import 'highcharts/esm/highcharts-more';
import 'highcharts/esm/modules/accessibility';
import 'highcharts/esm/modules/solid-gauge';
import 'highcharts/esm/modules/heatmap';
import 'highcharts/esm/modules/histogram-bellcurve';
import 'highcharts/esm/modules/treemap';
import 'highcharts/esm/modules/sunburst';
import 'highcharts/esm/modules/funnel';
import 'highcharts/esm/modules/sankey';
import 'highcharts/esm/modules/dependency-wheel';
import 'highcharts/esm/modules/networkgraph';
import 'highcharts/esm/modules/wordcloud';
import 'highcharts/esm/modules/bullet';
import 'highcharts/esm/modules/dumbbell';
import 'highcharts/esm/modules/lollipop';
import 'highcharts/esm/modules/timeline';
import 'highcharts/esm/modules/pareto';
import 'highcharts/esm/modules/organization';
import 'highcharts/esm/modules/venn';
import 'highcharts/esm/modules/streamgraph';
import 'highcharts/esm/modules/item-series';
import 'highcharts/esm/modules/treegraph';
import 'highcharts/esm/modules/arc-diagram';
import 'highcharts/esm/modules/xrange';
import 'highcharts/esm/modules/variwide';

/**
 * Kept as a no-op for callers that expect it. The `esm/` imports above register
 * on import, so there is nothing left to initialise — but returning the
 * instance keeps `initHighchartsModules()` truthful rather than removing a name
 * something outside this repo may still call.
 */
export function initHighchartsModules() {
    return Highcharts;
}

export default Highcharts;
