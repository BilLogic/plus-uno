/**
 * Centralized Highcharts Module Loader
 * 
 * This module initializes all required Highcharts modules once.
 * Import this file at the top of any chart component that needs extended modules.
 * 
 * Uses ES imports for Vite/ESM compatibility.
 */
import Highcharts from 'highcharts';

// Import all modules using ES imports
import HighchartsMore from 'highcharts/highcharts-more';
import Accessibility from 'highcharts/modules/accessibility';
import SolidGauge from 'highcharts/modules/solid-gauge';
import Heatmap from 'highcharts/modules/heatmap';
import Histogram from 'highcharts/modules/histogram-bellcurve';
import Treemap from 'highcharts/modules/treemap';
import Sunburst from 'highcharts/modules/sunburst';
import Funnel from 'highcharts/modules/funnel';
import Sankey from 'highcharts/modules/sankey';
import DependencyWheelModule from 'highcharts/modules/dependency-wheel';
import NetworkGraphModule from 'highcharts/modules/networkgraph';
import WordCloudModule from 'highcharts/modules/wordcloud';
import Bullet from 'highcharts/modules/bullet';
import Dumbbell from 'highcharts/modules/dumbbell';
import Lollipop from 'highcharts/modules/lollipop';

// Phase 2 modules
import Timeline from 'highcharts/modules/timeline';
import Pareto from 'highcharts/modules/pareto';
import Organization from 'highcharts/modules/organization';
import Venn from 'highcharts/modules/venn';
import Streamgraph from 'highcharts/modules/streamgraph';

// Phase 3 modules
import ItemSeries from 'highcharts/modules/item-series';
import Treegraph from 'highcharts/modules/treegraph';
import ArcDiagram from 'highcharts/modules/arc-diagram';
import XRange from 'highcharts/modules/xrange';
import Variwide from 'highcharts/modules/variwide';


// Track if modules have been initialized
let modulesInitialized = false;

/**
 * Helper function to safely initialize a Highcharts module.
 * Handles both direct function exports and default exports.
 */
function initModule(Module, moduleName) {
    try {
        if (typeof Module === 'function') {
            Module(Highcharts);
        } else if (Module && Module.default && typeof Module.default === 'function') {
            Module.default(Highcharts);
        }
    } catch (error) {
        console.warn(`Failed to initialize Highcharts module "${moduleName}":`, error);
    }
}

/**
 * Initialize all Highcharts modules.
 * This is idempotent - calling it multiple times is safe.
 */
export function initHighchartsModules() {
    if (modulesInitialized) {
        return Highcharts;
    }

    try {
        // Initialize in dependency order

        // highcharts-more - Required for: bubble, waterfall, boxplot, gauge, lollipop, polar/radar
        initModule(HighchartsMore, 'highcharts-more');

        // accessibility - Enables Highcharts a11y features and removes the warning in console
        initModule(Accessibility, 'accessibility');

        // solid-gauge - Required for: gauge charts (depends on highcharts-more)
        initModule(SolidGauge, 'solid-gauge');

        // heatmap - Required for: heatmap charts
        initModule(Heatmap, 'heatmap');

        // histogram-bellcurve - Required for: histogram charts
        initModule(Histogram, 'histogram-bellcurve');

        // treemap - Required for: treemap charts
        initModule(Treemap, 'treemap');

        // sunburst - Required for: sunburst charts (depends on treemap)
        initModule(Sunburst, 'sunburst');

        // funnel - Required for: funnel charts
        initModule(Funnel, 'funnel');

        // sankey - Required for: sankey diagrams and dependency wheel
        initModule(Sankey, 'sankey');

        // dependency-wheel - Required for: dependency wheel (depends on sankey)
        initModule(DependencyWheelModule, 'dependency-wheel');

        // networkgraph - Required for: network graph
        initModule(NetworkGraphModule, 'networkgraph');

        // wordcloud - Required for: word cloud
        initModule(WordCloudModule, 'wordcloud');

        // bullet - Required for: bullet charts
        initModule(Bullet, 'bullet');

        // dumbbell - Required for: lollipop and dumbbell charts
        initModule(Dumbbell, 'dumbbell');

        // lollipop - Required for: lollipop charts (depends on dumbbell)
        initModule(Lollipop, 'lollipop');

        // Phase 2 modules
        // timeline - Required for: timeline charts
        initModule(Timeline, 'timeline');

        // pareto - Required for: pareto charts
        initModule(Pareto, 'pareto');

        // organization - Required for: organization charts (depends on sankey)
        initModule(Organization, 'organization');

        // venn - Required for: venn diagrams
        initModule(Venn, 'venn');

        // streamgraph - Required for: streamgraph charts
        initModule(Streamgraph, 'streamgraph');

        // Phase 3 modules
        // item-series - Required for: parliament charts
        initModule(ItemSeries, 'item-series');

        // treegraph - Required for: treegraph charts
        initModule(Treegraph, 'treegraph');

        // arc-diagram - Required for: arc diagrams
        initModule(ArcDiagram, 'arc-diagram');

        // xrange - Required for: xrange charts
        initModule(XRange, 'xrange');

        // variwide - Required for: variwide charts
        initModule(Variwide, 'variwide');

        modulesInitialized = true;
    } catch (error) {
        console.error('Error initializing Highcharts modules:', error);
    }

    return Highcharts;
}

// Initialize modules immediately on import
initHighchartsModules();

// Export the configured Highcharts instance
export default Highcharts;
