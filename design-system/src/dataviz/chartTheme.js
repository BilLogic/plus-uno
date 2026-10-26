/**
 * The Highcharts theme every chart spreads.
 *
 * Data marks wear chart tokens and chrome wears text and border tokens, as
 * Atlassian's data-visualization guidance splits them (palette.js says which
 * token does which job): series take `--ds-chart-categorical-*` in order,
 * tick labels `--ds-text-subtle`, titles, legends and tooltips `--ds-text`,
 * grid lines and axes `--ds-border`. No value carries a fallback: the tokens
 * resolve in every color mode, so a chart follows light, dark and increased
 * contrast with no code of its own. The Highcharts defaults this theme does not
 * set are pointed at the same tokens in `chartTheme.css`.
 */
import { CATEGORICAL, CHROME } from '@/dataviz/palette';
import '@/dataviz/chartTheme.css';

const BODY = 'var(--font-family-body, "Merriweather Sans", "Open Sans", sans-serif)';

const axis = (gridLineWidth, gridLineDashStyle) => ({
    gridLineColor: CHROME.grid,
    ...(gridLineDashStyle && { gridLineDashStyle }),
    gridLineWidth,
    lineColor: CHROME.axis,
    tickColor: CHROME.axis,
    labels: {
        style: {
            color: CHROME.textSubtle,
            fontFamily: BODY,
            fontSize: 'var(--font-size-body3, 12px)',
            fontWeight: 'var(--font-weight-semibold-1, 400)'
        }
    },
    title: {
        style: {
            color: CHROME.text,
            fontFamily: BODY
        }
    }
});

const chartTheme = {
    // Highcharts Accessibility — on, deliberately.
    //
    // With `enabled: false` Highcharts skips its accessibility module and falls
    // back to stamping the root <svg> `role="img"` with an aria-label read off
    // the chart title. Every chart here sets `title: { text: null }`, so that
    // label was the empty string: an image role with no accessible name, which
    // is the axe failure all 40 dataviz stories carried. Enabling the module
    // replaces it with a screen-reader section naming the chart type and axes,
    // per-series and per-point labels, and keyboard navigation of the data.
    //
    // The two sub-options exist because Highcharts' defaults assume a chart
    // owns its page, and these charts are widgets inside one:
    //
    // - `landmarkVerbosity: 'disabled'` keeps the chart a labeled
    //   `role="group"` instead of a `role="region"` landmark. Untitled charts
    //   all generate the same label, so 'all' both fails axe `landmark-unique`
    //   and puts six identical entries in a six-chart dashboard's landmark menu.
    // - `beforeChartFormat` drops the heading Highcharts opens the screen-reader
    //   section with. It guesses the level from the surrounding DOM, and inside
    //   a card headed by an h3 the guess came out <h6> — a skipped level, and an
    //   axe `heading-order` failure. The label survives as a <div>; the group's
    //   aria-label already names the chart. The rest is Highcharts' own default.
    accessibility: {
        enabled: true,
        landmarkVerbosity: 'disabled',
        screenReaderSection: {
            beforeChartFormat: '<div>{chartTitle}</div>' +
                '<div>{typeDescription}</div>' +
                '<div>{chartSubtitle}</div>' +
                '<div>{chartLongdesc}</div>' +
                '<div>{playAsSoundButton}</div>' +
                '<div>{viewTableButton}</div>' +
                '<div>{xAxisDescription}</div>' +
                '<div>{yAxisDescription}</div>' +
                '<div>{annotationsTitle}{annotationsList}</div>'
        }
    },
    // Series colors, in assignment order. Past six series, fold the rest into "Other".
    colors: CATEGORICAL,
    chart: {
        backgroundColor: 'transparent',
        spacing: [16, 16, 16, 16], // Matches --size-card-pad-md
        style: {
            fontFamily: BODY,
            color: CHROME.text
        }
    },
    title: {
        style: {
            color: CHROME.text,
            fontFamily: 'var(--font-family-header, "Lato", sans-serif)',
            fontWeight: 'var(--font-weight-headline, 700)',
            fontSize: 'var(--font-size-h4, 24px)'
        }
    },
    subtitle: {
        style: {
            color: CHROME.textSubtle,
            fontFamily: BODY,
            fontSize: 'var(--font-size-body2, 14px)'
        }
    },
    xAxis: axis(0),
    yAxis: axis(1, 'Dash'),
    legend: {
        itemStyle: {
            color: CHROME.text,
            fontFamily: BODY,
            fontWeight: 'var(--font-weight-semibold-1, 400)'
        },
        itemHoverStyle: {
            color: CHROME.text
        },
        itemHiddenStyle: {
            color: CHROME.textDisabled
        }
    },
    tooltip: {
        backgroundColor: CHROME.tooltip,
        borderColor: CHROME.axis,
        borderRadius: 8, // Matches --size-element-radius-md
        borderWidth: 1,
        style: {
            color: CHROME.text,
            fontFamily: BODY,
            fontSize: 'var(--font-size-body2, 14px)'
        },
        shadow: true
    },
    credits: {
        enabled: false
    }
};

export default chartTheme;
