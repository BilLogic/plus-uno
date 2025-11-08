const fs = require('fs');
const path = require('path');

/**
 * Convert RGB to hex/rgba
 */
function rgbToHex(r, g, b, a = 1) {
    const toHex = (n) => Math.round(n * 255).toString(16).padStart(2, '0');
    if (a < 1 && a > 0) {
        return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a.toFixed(3)})`;
    }
    return '#' + toHex(r) + toHex(g) + toHex(b);
}

/**
 * Convert Figma name to CSS variable name following Material Design 3 conventions
 */
function toMaterial3VarName(name) {
    // Handle special cases and normalize
    let normalized = name
        .replace(/^_/, '')
        .replace(/^Neutral Colors\//i, '')
        .replace(/^colors \/ /i, '')
        .replace(/\/State-layers\//g, '-state-')
        .replace(/\//g, '-')
        .replace(/\s+/g, '-')
        .replace(/\(/g, '-')
        .replace(/\)/g, '')
        .toLowerCase()
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    
    // Material Design 3 specific mappings
    normalized = normalized
        .replace(/^primary-primary$/, 'primary')
        .replace(/^primary-on-primary$/, 'on-primary')
        .replace(/^primary-primary-container$/, 'primary-container')
        .replace(/^primary-on-primary-container$/, 'on-primary-container')
        .replace(/^primary-inverse-primary$/, 'inverse-primary')
        .replace(/^secondary-secondary$/, 'secondary')
        .replace(/^secondary-on-secondary$/, 'on-secondary')
        .replace(/^secondary-secondary-container$/, 'secondary-container')
        .replace(/^secondary-on-secondary-container$/, 'on-secondary-container')
        .replace(/^tertiary-tertiary$/, 'tertiary')
        .replace(/^tertiary-on-tertiary$/, 'on-tertiary')
        .replace(/^tertiary-tertiary-container$/, 'tertiary-container')
        .replace(/^tertiary-on-tertiary-container$/, 'on-tertiary-container')
        .replace(/^danger-danger$/, 'danger')
        .replace(/^danger-on-danger$/, 'on-danger')
        .replace(/^danger-danger-container$/, 'danger-container')
        .replace(/^danger-on-danger-container$/, 'on-danger-container')
        .replace(/^success-success$/, 'success')
        .replace(/^success-on-success$/, 'on-success')
        .replace(/^success-success-container$/, 'success-container')
        .replace(/^success-on-success-container$/, 'on-success-container')
        .replace(/^info-info$/, 'info')
        .replace(/^info-on-info$/, 'on-info')
        .replace(/^info-info-container$/, 'info-container')
        .replace(/^info-on-info-container$/, 'on-info-container')
        .replace(/^warning-warning$/, 'warning')
        .replace(/^warning-on-warning$/, 'on-warning')
        .replace(/^warning-warning-container$/, 'warning-container')
        .replace(/^warning-on-warning-container$/, 'on-warning-container')
        .replace(/^social-emotional-social-emotional$/, 'social-emotional')
        .replace(/^social-emotional-on-social-emotional$/, 'on-social-emotional')
        .replace(/^social-emotional-social-emotional-container$/, 'social-emotional-container')
        .replace(/^social-emotional-on-social-emotional-container$/, 'on-social-emotional-container')
        .replace(/^mastering-content-mastering-content$/, 'mastering-content')
        .replace(/^mastering-content-on-mastering-content$/, 'on-mastering-content')
        .replace(/^mastering-content-mastering-content-container$/, 'mastering-content-container')
        .replace(/^mastering-content-on-mastering-content-container$/, 'on-mastering-content-container')
        .replace(/^advocacy-advocacy$/, 'advocacy')
        .replace(/^advocacy-on-advocacy$/, 'on-advocacy')
        .replace(/^advocacy-advocacy-container$/, 'advocacy-container')
        .replace(/^advocacy-on-advocacy-container$/, 'on-advocacy-container')
        .replace(/^relationship-relationship$/, 'relationship')
        .replace(/^relationship-on-relationship$/, 'on-relationship')
        .replace(/^relationship-relationship-container$/, 'relationship-container')
        .replace(/^relationship-on-relationship-container$/, 'on-relationship-container')
        .replace(/^technology-tools-technology-tools$/, 'technology-tools')
        .replace(/^technology-tools-on-technology-tools$/, 'on-technology-tools')
        .replace(/^technology-tools-technology-tools-container$/, 'technology-tools-container')
        .replace(/^technology-tools-on-technology-tools-container$/, 'on-technology-tools-container')
        .replace(/surface-container-surface-container-highest/, 'surface-container-highest')
        .replace(/surface-container-surface-container$/, 'surface-container')
        .replace(/surface-container-surface-container-low$/, 'surface-container-low')
        .replace(/surface-container-surface-container-lowest$/, 'surface-container-lowest')
        .replace(/alternative-surface-dim$/, 'surface-dim')
        .replace(/alternative-surface-bright$/, 'surface-bright')
        .replace(/alternative-surface-variant$/, 'surface-variant')
        .replace(/alternative-scrim$/, 'scrim')
        .replace(/alternative-inverse-surface$/, 'inverse-surface')
        .replace(/alternative-inverse-on-surface$/, 'inverse-on-surface');
    
    return normalized;
}

/**
 * Generate colors SCSS
 */
function generateColors() {
    const accent = JSON.parse(fs.readFileSync('new tokens/colors _ accent.json', 'utf8'));
    const neutral = JSON.parse(fs.readFileSync('new tokens/colors _ neutral.json', 'utf8'));
    
    const accentMode = Object.keys(accent.modes)[0];
    const neutralMode = Object.keys(neutral.modes)[0];
    
    let scss = `:root {\n    /* Material Design 3 Color Tokens - Accent Colors */\n\n`;
    
    // Process accent colors
    const accentColors = {};
    accent.variables.forEach(v => {
        const val = v.valuesByMode[accentMode];
        if (!val) return;
        
        let colorValue;
        if (val.type === 'VARIABLE_ALIAS') {
            const aliasName = v.resolvedValuesByMode[accentMode].aliasName;
            colorValue = `var(--color-${toMaterial3VarName(aliasName)})`;
        } else if (val.r !== undefined) {
            colorValue = rgbToHex(val.r, val.g, val.b, val.a);
        } else {
            return;
        }
        
        const cssName = toMaterial3VarName(v.name);
        accentColors[cssName] = colorValue;
    });
    
    // Organize and output accent colors
    scss += `    /* Primary Colors */\n`;
    ['primary', 'on-primary', 'primary-container', 'on-primary-container', 'inverse-primary'].forEach(key => {
        if (accentColors[key]) {
            scss += `    --color-${key}: ${accentColors[key]};\n`;
        }
    });
    
    scss += `\n    /* Primary State Layers */\n`;
    Object.keys(accentColors).filter(k => k.includes('primary-state')).forEach(key => {
        scss += `    --color-${key}: ${accentColors[key]};\n`;
    });
    
    scss += `\n    /* Secondary Colors */\n`;
    ['secondary', 'on-secondary', 'secondary-container', 'on-secondary-container'].forEach(key => {
        if (accentColors[key]) {
            scss += `    --color-${key}: ${accentColors[key]};\n`;
        }
    });
    
    scss += `\n    /* Tertiary Colors */\n`;
    ['tertiary', 'on-tertiary', 'tertiary-container', 'on-tertiary-container'].forEach(key => {
        if (accentColors[key]) {
            scss += `    --color-${key}: ${accentColors[key]};\n`;
        }
    });
    
    scss += `\n    /* Danger Colors */\n`;
    ['danger', 'on-danger', 'danger-container', 'on-danger-container'].forEach(key => {
        if (accentColors[key]) {
            scss += `    --color-${key}: ${accentColors[key]};\n`;
        }
    });
    
    scss += `\n    /* Success Colors */\n`;
    ['success', 'on-success', 'success-container', 'on-success-container'].forEach(key => {
        if (accentColors[key]) {
            scss += `    --color-${key}: ${accentColors[key]};\n`;
        }
    });
    
    scss += `\n    /* Warning Colors */\n`;
    ['warning', 'on-warning', 'warning-container', 'on-warning-container'].forEach(key => {
        if (accentColors[key]) {
            scss += `    --color-${key}: ${accentColors[key]};\n`;
        }
    });
    
    scss += `\n    /* Info Colors */\n`;
    ['info', 'on-info', 'info-container', 'on-info-container'].forEach(key => {
        if (accentColors[key]) {
            scss += `    --color-${key}: ${accentColors[key]};\n`;
        }
    });
    
    scss += `\n    /* SMART Framework Colors */\n`;
    scss += `    /* Social-Emotional */\n`;
    ['social-emotional', 'on-social-emotional', 'social-emotional-container', 'on-social-emotional-container'].forEach(key => {
        if (accentColors[key]) {
            scss += `    --color-${key}: ${accentColors[key]};\n`;
        }
    });
    
    scss += `\n    /* Mastering Content */\n`;
    ['mastering-content', 'on-mastering-content', 'mastering-content-container', 'on-mastering-content-container'].forEach(key => {
        if (accentColors[key]) {
            scss += `    --color-${key}: ${accentColors[key]};\n`;
        }
    });
    
    scss += `\n    /* Advocacy */\n`;
    ['advocacy', 'on-advocacy', 'advocacy-container', 'on-advocacy-container'].forEach(key => {
        if (accentColors[key]) {
            scss += `    --color-${key}: ${accentColors[key]};\n`;
        }
    });
    
    scss += `\n    /* Relationship */\n`;
    ['relationship', 'on-relationship', 'relationship-container', 'on-relationship-container'].forEach(key => {
        if (accentColors[key]) {
            scss += `    --color-${key}: ${accentColors[key]};\n`;
        }
    });
    
    scss += `\n    /* Technology Tools */\n`;
    ['technology-tools', 'on-technology-tools', 'technology-tools-container', 'on-technology-tools-container'].forEach(key => {
        if (accentColors[key]) {
            scss += `    --color-${key}: ${accentColors[key]};\n`;
        }
    });
    
    // Process neutral colors
    scss += `\n    /* Material Design 3 Color Tokens - Neutral Colors */\n\n`;
    scss += `    /* Surface Colors */\n`;
    ['surface', 'on-surface', 'surface-variant', 'on-surface-variant'].forEach(key => {
        // Process neutral colors
        neutral.variables.forEach(v => {
            const val = v.valuesByMode[neutralMode];
            if (!val || val.type === 'VARIABLE_ALIAS') return;
            if (val.r !== undefined) {
                const cssName = toMaterial3VarName(v.name);
                if (cssName === key) {
                    scss += `    --color-${key}: ${rgbToHex(val.r, val.g, val.b, val.a)};\n`;
                }
            }
        });
    });
    
    scss += `\n    /* Outline Colors */\n`;
    ['outline', 'outline-variant'].forEach(key => {
        neutral.variables.forEach(v => {
            const val = v.valuesByMode[neutralMode];
            if (!val || val.type === 'VARIABLE_ALIAS') return;
            if (val.r !== undefined) {
                const cssName = toMaterial3VarName(v.name);
                if (cssName === key) {
                    scss += `    --color-${key}: ${rgbToHex(val.r, val.g, val.b, val.a)};\n`;
                }
            }
        });
    });
    
    scss += `\n    /* Surface Container Colors */\n`;
    ['surface-container-highest', 'surface-container-high', 'surface-container', 'surface-container-low', 'surface-container-lowest'].forEach(key => {
        neutral.variables.forEach(v => {
            const val = v.valuesByMode[neutralMode];
            if (!val || val.type === 'VARIABLE_ALIAS') return;
            if (val.r !== undefined) {
                const cssName = toMaterial3VarName(v.name);
                if (cssName === key || cssName.includes(key.replace('-', '-'))) {
                    scss += `    --color-${key}: ${rgbToHex(val.r, val.g, val.b, val.a)};\n`;
                    return;
                }
            }
        });
    });
    
    scss += `\n    /* Alternative Surface Colors */\n`;
    ['surface-dim', 'surface-bright', 'surface-variant', 'scrim', 'inverse-surface', 'inverse-on-surface'].forEach(key => {
        neutral.variables.forEach(v => {
            const val = v.valuesByMode[neutralMode];
            if (!val || val.type === 'VARIABLE_ALIAS') return;
            if (val.r !== undefined) {
                const cssName = toMaterial3VarName(v.name);
                if (cssName === key) {
                    scss += `    --color-${key}: ${rgbToHex(val.r, val.g, val.b, val.a)};\n`;
                }
            }
        });
    });
    
    scss += `}\n`;
    
    return scss;
}

// Generate and save
const colorsScss = generateColors();
fs.writeFileSync('src/css/tokens/_colors_new.scss', colorsScss);
console.log('Generated new colors SCSS file: src/css/tokens/_colors_new.scss');
console.log('File size:', colorsScss.length, 'characters');

