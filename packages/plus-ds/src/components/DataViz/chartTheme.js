/**
 * Highcharts Theme matching PLUS Design System tokens.
 * 
 * Maps Foundation tokens to Highcharts properties.
 */

const chartTheme = {
    // Categorical Palette (Data Series)
    // Order: Primary, Secondary, Tertiary, Tech Tools, Advocacy, Social-Emotional, Mastering Content, Relationship
    colors: [
        '#0472a8', // var(--color-primary)
        '#445c6a', // var(--color-secondary)
        '#0e8175', // var(--color-tertiary)
        '#005cbd', // var(--color-technology-tools)
        '#167745', // var(--color-advocacy)
        '#8c6600', // var(--color-social-emotional)
        '#8659a9', // var(--color-mastering-content)
        '#c70b77'  // var(--color-relationship)
    ],
    // Status Colors (Manual Use)
    statusColors: {
        success: '#3e691a', // var(--color-success)
        warning: '#9f8205', // var(--color-warning)
        danger: '#ba1a1a',  // var(--color-danger)
        info: '#0e8175'     // var(--color-info)
    },
    // Neutral Colors (Manual Use)
    neutralColors: {
        surface: '#f9f9fc',         // var(--color-surface)
        onSurface: '#191c1e',       // var(--color-on-surface)
        outline: '#6f797a',         // var(--color-outline)
        outlineVariant: '#bec8ca'   // var(--color-outline-variant)
    },
    chart: {
        backgroundColor: 'transparent',
        spacing: [16, 16, 16, 16], // var(--card-pad-md) / var(--space-400)
        style: {
            fontFamily: 'var(--font-family-body)',
            color: 'var(--color-on-surface)'
        }
    },
    title: {
        style: {
            color: 'var(--color-on-surface)',
            fontFamily: 'var(--font-family-header)',
            fontWeight: 'bold',
            fontSize: 'var(--font-size-h4)'
        }
    },
    subtitle: {
        style: {
            color: 'var(--color-on-surface)',
            fontFamily: 'var(--font-family-body)'
        }
    },
    xAxis: {
        gridLineColor: 'var(--color-outline-variant)',
        gridLineWidth: 0,
        lineColor: 'var(--color-outline-variant)', // Lighter axis line
        tickColor: 'var(--color-outline-variant)',
        labels: {
            style: {
                color: 'var(--color-on-surface)',
                fontFamily: 'var(--font-family-body)',
                fontSize: 'var(--font-size-body3)', // 12px
                fontWeight: '500' // Medium
            }
        },
        title: {
            style: {
                color: 'var(--color-on-surface)'
            }
        }
    },
    yAxis: {
        gridLineColor: 'var(--color-outline-variant)',
        gridLineDashStyle: 'Dash', // Lighter dashed grid
        gridLineWidth: 1,
        lineColor: 'var(--color-outline-variant)',
        tickColor: 'var(--color-outline-variant)',
        labels: {
            style: {
                color: 'var(--color-on-surface)',
                fontFamily: 'var(--font-family-body)',
                fontSize: 'var(--font-size-body3)',
                fontWeight: '500'
            }
        },
        title: {
            style: {
                color: 'var(--color-on-surface)'
            }
        }
    },
    legend: {
        itemStyle: {
            color: 'var(--color-on-surface)',
            fontFamily: 'var(--font-family-body)',
            fontWeight: 'bold'
        },
        itemHoverStyle: {
            color: '#000000'
        },
        itemHiddenStyle: {
            color: 'var(--color-outline)'
        }
    },
    tooltip: {
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-outline)',
        borderRadius: 8,
        borderWidth: 1,
        style: {
            color: 'var(--color-on-surface)',
            fontFamily: 'var(--font-family-body)',
            fontSize: 'var(--font-size-body2)'
        },
        shadow: true
    },
    credits: {
        enabled: false
    }
};

export default chartTheme;
