/**
 * Highcharts Theme matching PLUS Design System tokens.
 * 
 * Uses CSS custom properties for all colors and typography.
 * Follows M3 color roles: on-surface for text on surface backgrounds.
 */

const chartTheme = {
    // Categorical Palette (Data Series)
    // Order: Primary, Secondary, Tertiary, Tech Tools, Advocacy, Social-Emotional, Mastering Content, Relationship
    colors: [
        'var(--color-primary, #0472a8)',
        'var(--color-secondary, #445c6a)',
        'var(--color-tertiary, #0e8175)',
        'var(--color-technology-tools, #005cbd)',
        'var(--color-advocacy, #167745)',
        'var(--color-social-emotional, #8c6600)',
        'var(--color-mastering-content, #8659a9)',
        'var(--color-relationship, #c70b77)'
    ],
    // Status Colors (Manual Use)
    statusColors: {
        success: 'var(--color-success, #3e691a)',
        warning: 'var(--color-warning, #9f8205)',
        danger: 'var(--color-danger, #ba1a1a)',
        info: 'var(--color-info, #0e8175)'
    },
    // Neutral Colors (Manual Use)
    neutralColors: {
        surface: 'var(--color-surface, #f9f9fc)',
        onSurface: 'var(--color-on-surface, #191c1e)',
        outline: 'var(--color-outline, #6f797a)',
        outlineVariant: 'var(--color-outline-variant, #bec8ca)'
    },
    chart: {
        backgroundColor: 'transparent',
        spacing: [16, 16, 16, 16], // Matches --size-card-pad-md
        style: {
            fontFamily: 'var(--font-family-body, "Merriweather Sans", "Open Sans", sans-serif)',
            color: 'var(--color-on-surface, #191c1e)'
        }
    },
    title: {
        style: {
            color: 'var(--color-on-surface, #191c1e)',
            fontFamily: 'var(--font-family-header, "Lato", sans-serif)',
            fontWeight: 'var(--font-weight-headline, 700)',
            fontSize: 'var(--font-size-h4, 24px)'
        }
    },
    subtitle: {
        style: {
            color: 'var(--color-on-surface-variant, #3f484a)',
            fontFamily: 'var(--font-family-body, "Merriweather Sans", sans-serif)',
            fontSize: 'var(--font-size-body2, 14px)'
        }
    },
    xAxis: {
        gridLineColor: 'var(--color-outline-variant, #bec8ca)',
        gridLineWidth: 0,
        lineColor: 'var(--color-outline-variant, #bec8ca)',
        tickColor: 'var(--color-outline-variant, #bec8ca)',
        labels: {
            style: {
                color: 'var(--color-on-surface-variant, #3f484a)',
                fontFamily: 'var(--font-family-body, "Merriweather Sans", sans-serif)',
                fontSize: 'var(--font-size-body3, 12px)',
                fontWeight: 'var(--font-weight-semibold-1, 400)'
            }
        },
        title: {
            style: {
                color: 'var(--color-on-surface, #191c1e)',
                fontFamily: 'var(--font-family-body, "Merriweather Sans", sans-serif)'
            }
        }
    },
    yAxis: {
        gridLineColor: 'var(--color-outline-variant, #bec8ca)',
        gridLineDashStyle: 'Dash',
        gridLineWidth: 1,
        lineColor: 'var(--color-outline-variant, #bec8ca)',
        tickColor: 'var(--color-outline-variant, #bec8ca)',
        labels: {
            style: {
                color: 'var(--color-on-surface-variant, #3f484a)',
                fontFamily: 'var(--font-family-body, "Merriweather Sans", sans-serif)',
                fontSize: 'var(--font-size-body3, 12px)',
                fontWeight: 'var(--font-weight-semibold-1, 400)'
            }
        },
        title: {
            style: {
                color: 'var(--color-on-surface, #191c1e)',
                fontFamily: 'var(--font-family-body, "Merriweather Sans", sans-serif)'
            }
        }
    },
    legend: {
        itemStyle: {
            color: 'var(--color-on-surface, #191c1e)',
            fontFamily: 'var(--font-family-body, "Merriweather Sans", sans-serif)',
            fontWeight: 'var(--font-weight-semibold-1, 400)'
        },
        itemHoverStyle: {
            color: 'var(--color-on-surface, #000000)'
        },
        itemHiddenStyle: {
            color: 'var(--color-outline, #6f797a)'
        }
    },
    tooltip: {
        backgroundColor: 'var(--color-surface, #f9f9fc)',
        borderColor: 'var(--color-outline, #6f797a)',
        borderRadius: 8, // Matches --size-element-radius-md
        borderWidth: 1,
        style: {
            color: 'var(--color-on-surface, #191c1e)',
            fontFamily: 'var(--font-family-body, "Merriweather Sans", sans-serif)',
            fontSize: 'var(--font-size-body2, 14px)'
        },
        shadow: true
    },
    credits: {
        enabled: false
    }
};

export default chartTheme;
