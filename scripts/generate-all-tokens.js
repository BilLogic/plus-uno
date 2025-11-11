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
 * Convert Figma variable name to Material Design 3 CSS variable name
 */
function toM3ColorName(name) {
    let normalized = name
        .replace(/^_/, '')
        .replace(/\//g, '-')
        .toLowerCase()
        .trim();
    
    // Material Design 3 specific mappings
    const mappings = {
        'primary-primary': 'primary',
        'primary-on-primary': 'on-primary',
        'primary-primary-container': 'primary-container',
        'primary-on-primary-container': 'on-primary-container',
        'primary-inverse-primary': 'inverse-primary',
        'secondary-secondary': 'secondary',
        'secondary-on-secondary': 'on-secondary',
        'secondary-secondary-container': 'secondary-container',
        'secondary-on-secondary-container': 'on-secondary-container',
        'tertiary-tertiary': 'tertiary',
        'tertiary-on-tertiary': 'on-tertiary',
        'tertiary-tertiary-container': 'tertiary-container',
        'tertiary-on-tertiary-container': 'on-tertiary-container',
        'danger-danger': 'danger',
        'danger-on-danger': 'on-danger',
        'danger-danger-container': 'danger-container',
        'danger-on-danger-container': 'on-danger-container',
        'success-success': 'success',
        'success-on-success': 'on-success',
        'success-success-container': 'success-container',
        'success-on-success-container': 'on-success-container',
        'warning-warning': 'warning',
        'warning-on-warning': 'on-warning',
        'warning-warning-container': 'warning-container',
        'warning-on-warning-container': 'on-warning-container',
        'info-info': 'info',
        'info-on-info': 'on-info',
        'info-info-container': 'info-container',
        'info-on-info-container': 'on-info-container',
        'social-emotional-social-emotional': 'social-emotional',
        'social-emotional-on-social-emotional': 'on-social-emotional',
        'social-emotional-social-emotional-container': 'social-emotional-container',
        'social-emotional-on-social-emotional-container': 'on-social-emotional-container',
        'mastering-content-mastering-content': 'mastering-content',
        'mastering-content-on-mastering-content': 'on-mastering-content',
        'mastering-content-mastering-content-container': 'mastering-content-container',
        'mastering-content-on-mastering-content-container': 'on-mastering-content-container',
        'advocacy-advocacy': 'advocacy',
        'advocacy-on-advocacy': 'on-advocacy',
        'advocacy-advocacy-container': 'advocacy-container',
        'advocacy-on-advocacy-container': 'on-advocacy-container',
        'relationship-relationship': 'relationship',
        'relationship-on-relationship': 'on-relationship',
        'relationship-relationship-container': 'relationship-container',
        'relationship-on-relationship-container': 'on-relationship-container',
        'technology-tools-technology-tools': 'technology-tools',
        'technology-tools-on-technology-tools': 'on-technology-tools',
        'technology-tools-technology-tools-container': 'technology-tools-container',
        'technology-tools-on-technology-tools-container': 'on-technology-tools-container',
    };
    
    // Handle state layers
    if (normalized.includes('state-layers')) {
        normalized = normalized
            .replace('primary-state-layers-primary-08', 'primary-state-08')
            .replace('primary-state-layers-primary-12', 'primary-state-12')
            .replace('primary-state-layers-primary-16', 'primary-state-16')
            .replace('primary-state-layers-primary-container-08', 'primary-container-state-08')
            .replace('primary-state-layers-primary-container-12', 'primary-container-state-12')
            .replace('primary-state-layers-primary-container-16', 'primary-container-state-16')
            .replace('secondary-state-layers-secondary-08', 'secondary-state-08')
            .replace('secondary-state-layers-secondary-12', 'secondary-state-12')
            .replace('secondary-state-layers-secondary-16', 'secondary-state-16')
            .replace('secondary-state-layers-secondary-container-08', 'secondary-container-state-08')
            .replace('secondary-state-layers-secondary-container-12', 'secondary-container-state-12')
            .replace('secondary-state-layers-secondary-container-16', 'secondary-container-state-16')
            .replace('tertiary-state-layers-tertiary-08', 'tertiary-state-08')
            .replace('tertiary-state-layers-tertiary-12', 'tertiary-state-12')
            .replace('tertiary-state-layers-tertiary-16', 'tertiary-state-16')
            .replace('tertiary-state-layers-tertiary-container-08', 'tertiary-container-state-08')
            .replace('tertiary-state-layers-tertiary-container-12', 'tertiary-container-state-12')
            .replace('tertiary-state-layers-tertiary-container-16', 'tertiary-container-state-16')
            .replace('danger-state-layers-danger-08', 'danger-state-08')
            .replace('danger-state-layers-danger-12', 'danger-state-12')
            .replace('danger-state-layers-danger-16', 'danger-state-16')
            .replace('danger-state-layers-danger-container-08', 'danger-container-state-08')
            .replace('danger-state-layers-danger-container-12', 'danger-container-state-12')
            .replace('danger-state-layers-danger-container-16', 'danger-container-state-16')
            .replace('success-state-layers-success-08', 'success-state-08')
            .replace('success-state-layers-success-12', 'success-state-12')
            .replace('success-state-layers-success-16', 'success-state-16')
            .replace('success-state-layers-success-container-08', 'success-container-state-08')
            .replace('success-state-layers-success-container-12', 'success-container-state-12')
            .replace('success-state-layers-success-container-16', 'success-container-state-16')
            .replace('info-state-layers-info-08', 'info-state-08')
            .replace('info-state-layers-info-12', 'info-state-12')
            .replace('info-state-layers-info-16', 'info-state-16')
            .replace('info-state-layers-info-container-08', 'info-container-state-08')
            .replace('info-state-layers-info-container-12', 'info-container-state-12')
            .replace('info-state-layers-info-container-16', 'info-container-state-16')
            .replace('warning-state-layers-warning-08', 'warning-state-08')
            .replace('warning-state-layers-warning-12', 'warning-state-12')
            .replace('warning-state-layers-warning-16', 'warning-state-16')
            .replace('warning-state-layers-warning-container-08', 'warning-container-state-08')
            .replace('warning-state-layers-warning-container-12', 'warning-container-state-12')
            .replace('warning-state-layers-warning-container-16', 'warning-container-state-16')
            .replace('social-emotional-state-layers-social-emotional-08', 'social-emotional-state-08')
            .replace('social-emotional-state-layers-social-emotional-12', 'social-emotional-state-12')
            .replace('social-emotional-state-layers-social-emotional-16', 'social-emotional-state-16')
            .replace('social-emotional-state-layers-social-emotional-container-08', 'social-emotional-container-state-08')
            .replace('social-emotional-state-layers-social-emotional-container-12', 'social-emotional-container-state-12')
            .replace('social-emotional-state-layers-social-emotional-container-16', 'social-emotional-container-state-16')
            .replace('mastering-content-state-layers-mastering-content-08', 'mastering-content-state-08')
            .replace('mastering-content-state-layers-mastering-content-12', 'mastering-content-state-12')
            .replace('mastering-content-state-layers-mastering-content-16', 'mastering-content-state-16')
            .replace('mastering-content-state-layers-mastering-content-container-08', 'mastering-content-container-state-08')
            .replace('mastering-content-state-layers-mastering-content-container-12', 'mastering-content-container-state-12')
            .replace('mastering-content-state-layers-mastering-content-container-16', 'mastering-content-container-state-16')
            .replace('advocacy-state-layers-advocacy-08', 'advocacy-state-08')
            .replace('advocacy-state-layers-advocacy-12', 'advocacy-state-12')
            .replace('advocacy-state-layers-advocacy-16', 'advocacy-state-16')
            .replace('advocacy-state-layers-advocacy-container-08', 'advocacy-container-state-08')
            .replace('advocacy-state-layers-advocacy-container-12', 'advocacy-container-state-12')
            .replace('advocacy-state-layers-advocacy-container-16', 'advocacy-container-state-16')
            .replace('relationship-state-layers-relationship-08', 'relationship-state-08')
            .replace('relationship-state-layers-relationship-12', 'relationship-state-12')
            .replace('relationship-state-layers-relationship-16', 'relationship-state-16')
            .replace('relationship-state-layers-relationship-container-08', 'relationship-container-state-08')
            .replace('relationship-state-layers-relationship-container-12', 'relationship-container-state-12')
            .replace('relationship-state-layers-relationship-container-16', 'relationship-container-state-16')
            .replace('technology-tools-state-layers-technology-tools-08', 'technology-tools-state-08')
            .replace('technology-tools-state-layers-technology-tools-12', 'technology-tools-state-12')
            .replace('technology-tools-state-layers-technology-tools-16', 'technology-tools-state-16')
            .replace('technology-tools-state-layers-technology-tools-container-08', 'technology-tools-container-state-08')
            .replace('technology-tools-state-layers-technology-tools-container-12', 'technology-tools-container-state-12')
            .replace('technology-tools-state-layers-technology-tools-container-16', 'technology-tools-container-state-16');
    }
    
    return mappings[normalized] || normalized;
}

/**
 * Process and generate colors SCSS
 */
function generateColorsSCSS() {
    const accent = JSON.parse(fs.readFileSync('new tokens/colors _ accent.json', 'utf8'));
    const neutral = JSON.parse(fs.readFileSync('new tokens/colors _ neutral.json', 'utf8'));
    
    const accentMode = Object.keys(accent.modes)[0];
    const neutralMode = Object.keys(neutral.modes)[0];
    
    let scss = `/**
 * Material Design 3 Color Tokens
 * Generated from Figma design system
 * Follows M3 color role guidance: https://m3.material.io/styles/color/roles
 */

:root {
    /* ============================================
       ACCENT COLORS - Material Design 3 Roles
       ============================================ */
    
    /* Primary Colors */
`;

    // Process accent colors
    const colorMap = {};
    accent.variables.forEach(v => {
        const val = v.valuesByMode[accentMode];
        if (!val) return;
        
        let colorValue;
        if (val.type === 'VARIABLE_ALIAS') {
            // For aliases, we'll resolve them later
            const resolved = v.resolvedValuesByMode[accentMode];
            if (resolved && resolved.r !== undefined) {
                colorValue = rgbToHex(resolved.r, resolved.g, resolved.b, resolved.a);
            } else {
                return; // Skip if we can't resolve
            }
        } else if (val.r !== undefined) {
            colorValue = rgbToHex(val.r, val.g, val.b, val.a);
        } else {
            return;
        }
        
        const cssName = toM3ColorName(v.name);
        colorMap[cssName] = colorValue;
    });
    
    // Organize and output accent colors by category
    const categories = {
        'Primary': ['primary', 'on-primary', 'primary-container', 'on-primary-container', 'inverse-primary'],
        'Primary State Layers': Object.keys(colorMap).filter(k => k.startsWith('primary-state') || k.startsWith('primary-container-state')),
        'Secondary': ['secondary', 'on-secondary', 'secondary-container', 'on-secondary-container'],
        'Secondary State Layers': Object.keys(colorMap).filter(k => k.startsWith('secondary-state') || k.startsWith('secondary-container-state')),
        'Tertiary': ['tertiary', 'on-tertiary', 'tertiary-container', 'on-tertiary-container'],
        'Tertiary State Layers': Object.keys(colorMap).filter(k => k.startsWith('tertiary-state') || k.startsWith('tertiary-container-state')),
        'Danger': ['danger', 'on-danger', 'danger-container', 'on-danger-container'],
        'Danger State Layers': Object.keys(colorMap).filter(k => k.startsWith('danger-state') || k.startsWith('danger-container-state')),
        'Success': ['success', 'on-success', 'success-container', 'on-success-container'],
        'Success State Layers': Object.keys(colorMap).filter(k => k.startsWith('success-state') || k.startsWith('success-container-state')),
        'Warning': ['warning', 'on-warning', 'warning-container', 'on-warning-container'],
        'Warning State Layers': Object.keys(colorMap).filter(k => k.startsWith('warning-state') || k.startsWith('warning-container-state')),
        'Info': ['info', 'on-info', 'info-container', 'on-info-container'],
        'Info State Layers': Object.keys(colorMap).filter(k => k.startsWith('info-state') || k.startsWith('info-container-state')),
        'Social-Emotional': ['social-emotional', 'on-social-emotional', 'social-emotional-container', 'on-social-emotional-container'],
        'Social-Emotional State Layers': Object.keys(colorMap).filter(k => k.startsWith('social-emotional-state') || k.startsWith('social-emotional-container-state')),
        'Mastering Content': ['mastering-content', 'on-mastering-content', 'mastering-content-container', 'on-mastering-content-container'],
        'Mastering Content State Layers': Object.keys(colorMap).filter(k => k.startsWith('mastering-content-state') || k.startsWith('mastering-content-container-state')),
        'Advocacy': ['advocacy', 'on-advocacy', 'advocacy-container', 'on-advocacy-container'],
        'Advocacy State Layers': Object.keys(colorMap).filter(k => k.startsWith('advocacy-state') || k.startsWith('advocacy-container-state')),
        'Relationship': ['relationship', 'on-relationship', 'relationship-container', 'on-relationship-container'],
        'Relationship State Layers': Object.keys(colorMap).filter(k => k.startsWith('relationship-state') || k.startsWith('relationship-container-state')),
        'Technology Tools': ['technology-tools', 'on-technology-tools', 'technology-tools-container', 'on-technology-tools-container'],
        'Technology Tools State Layers': Object.keys(colorMap).filter(k => k.startsWith('technology-tools-state') || k.startsWith('technology-tools-container-state')),
    };
    
    Object.entries(categories).forEach(([category, keys]) => {
        if (keys.length > 0 && keys.some(k => colorMap[k])) {
            scss += `\n    /* ${category} */\n`;
            keys.forEach(key => {
                if (colorMap[key]) {
                    scss += `    --color-${key}: ${colorMap[key]};\n`;
                }
            });
        }
    });
    
    // Process neutral colors
    scss += `\n    /* ============================================
       NEUTRAL COLORS - Material Design 3
       ============================================ */
    
    /* Surface Colors */\n`;
    
    const neutralMap = {};
    neutral.variables.forEach(v => {
        const val = v.valuesByMode[neutralMode];
        if (!val) return;
        
        let colorValue;
        if (val.type === 'VARIABLE_ALIAS') {
            const resolved = v.resolvedValuesByMode[neutralMode];
            if (resolved && resolved.r !== undefined) {
                colorValue = rgbToHex(resolved.r, resolved.g, resolved.b, resolved.a);
            } else {
                return;
            }
        } else if (val.r !== undefined) {
            colorValue = rgbToHex(val.r, val.g, val.b, val.a);
        } else {
            return;
        }
        
        let cssName = v.name
            .replace(/^Neutral Colors\//i, '')
            .replace(/^State-layers\//i, '')
            .replace(/\//g, '-')
            .toLowerCase()
            .trim();
        
        // Map to M3 names
        if (cssName === 'surface') cssName = 'surface';
        else if (cssName === 'on-surface') cssName = 'on-surface';
        else if (cssName === 'outline') cssName = 'outline';
        else if (cssName === 'outline-variant') cssName = 'outline-variant';
        else if (cssName === 'surface-container-surface-container-high') cssName = 'surface-container-high';
        else if (cssName === 'surface-container-surface-container') cssName = 'surface-container';
        else if (cssName === 'surface-container-surface-container-low') cssName = 'surface-container-low';
        else if (cssName === 'surface-container-surface-container-lowest') cssName = 'surface-container-lowest';
        else if (cssName === 'alternative-surface-dim') cssName = 'surface-dim';
        else if (cssName === 'alternative-surface-bright') cssName = 'surface-bright';
        else if (cssName === 'alternative-surface-variant') cssName = 'surface-variant';
        else if (cssName === 'alternative-scrim') cssName = 'scrim';
        else if (cssName === 'alternative-inverse-surface') cssName = 'inverse-surface';
        else if (cssName === 'alternative-inverse-on-surface') cssName = 'inverse-on-surface';
        else if (cssName === 'on-surface-variant') cssName = 'on-surface-variant';
        else if (cssName.includes('surface-container-surface-container-highest')) cssName = 'surface-container-highest';
        else if (cssName.startsWith('surface-container-on-surface')) cssName = 'on-surface';
        
        // Skip state layers for now (they're handled separately if needed)
        if (cssName.includes('opacity') || cssName.includes('state-layers')) {
            return;
        }
        
        neutralMap[cssName] = colorValue;
    });
    
    // Output neutral colors in organized groups
    const neutralGroups = {
        'Surface': ['surface', 'on-surface'],
        'Surface Variant': ['surface-variant', 'on-surface-variant'],
        'Outline': ['outline', 'outline-variant'],
        'Surface Containers': ['surface-container-lowest', 'surface-container-low', 'surface-container', 'surface-container-high', 'surface-container-highest'],
        'Alternative Surfaces': ['surface-dim', 'surface-bright', 'scrim', 'inverse-surface', 'inverse-on-surface'],
    };
    
    Object.entries(neutralGroups).forEach(([group, keys]) => {
        const existingKeys = keys.filter(k => neutralMap[k]);
        if (existingKeys.length > 0) {
            scss += `\n    /* ${group} */\n`;
            existingKeys.forEach(key => {
                scss += `    --color-${key}: ${neutralMap[key]};\n`;
            });
        }
    });
    
    scss += `}\n`;
    
    return scss;
}

/**
 * Generate primitives SCSS
 */
function generatePrimitivesSCSS() {
    const primitives = JSON.parse(fs.readFileSync('new tokens/size _ primitive.json', 'utf8'));
    const mode = Object.keys(primitives.modes)[0];
    
    let scss = `/**
 * Primitive Size Tokens
 * Base values used to build semantic tokens
 * DO NOT USE DIRECTLY - Use semantic tokens instead
 */

:root {
    /* Spacing Primitives */\n`;
    
    const spacing = [];
    const radius = [];
    const stroke = [];
    
    primitives.variables.forEach(v => {
        const val = v.valuesByMode[mode];
        if (val === undefined || val === null) return;
        
        const resolved = v.resolvedValuesByMode[mode];
        const value = resolved?.resolvedValue ?? val;
        
        const name = v.name.toLowerCase().replace(/\//g, '-');
        
        if (name.includes('spacing') || name.includes('space-')) {
            spacing.push({ name, value });
        } else if (name.includes('radius')) {
            radius.push({ name, value });
        } else if (name.includes('stroke')) {
            stroke.push({ name, value });
        }
    });
    
    // Sort and output spacing
    spacing.sort((a, b) => {
        const numA = parseInt(a.name.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.name.match(/\d+/)?.[0] || '0');
        return numA - numB;
    });
    
    spacing.forEach(item => {
        const varName = item.name.replace(/^spacing\//, '').replace(/^small\//, '').replace(/^medium\//, '').replace(/^large\//, '');
        scss += `    --size-${varName}: ${item.value}px;\n`;
    });
    
    scss += `\n    /* Border Radius Primitives */\n`;
    radius.sort((a, b) => {
        const numA = parseInt(a.name.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.name.match(/\d+/)?.[0] || '0');
        return numA - numB;
    });
    
    radius.forEach(item => {
        const varName = item.name.replace(/^border\/radius\//, '').replace(/^border\/radius\//, '');
        scss += `    --size-${varName}: ${item.value}px;\n`;
    });
    
    scss += `\n    /* Stroke/Border Width Primitives */\n`;
    stroke.sort((a, b) => {
        const numA = parseFloat(a.name.match(/\d+\.?\d*/)?.[0] || '0');
        const numB = parseFloat(b.name.match(/\d+\.?\d*/)?.[0] || '0');
        return numA - numB;
    });
    
    stroke.forEach(item => {
        const varName = item.name.replace(/^border\/stroke\//, '');
        scss += `    --size-${varName}: ${item.value}px;\n`;
    });
    
    scss += `}\n`;
    
    return scss;
}

/**
 * Generate semantic tokens SCSS
 */
function generateSemanticsSCSS() {
    const semantics = JSON.parse(fs.readFileSync('new tokens/size _ semantics.json', 'utf8'));
    const mode = Object.keys(semantics.modes)[0];
    
    let scss = `/**
 * Semantic Spacing Tokens
 * These are the tokens designers and developers should use
 * Organized by component layer: Elements, Cards, Sections, Modals, Surfaces, Surface Containers
 */

:root {
`;
    
    // Organize by layer
    const layers = {
        'element': [],
        'card': [],
        'section': [],
        'modal': [],
        'surface': [],
        'surface-container': [],
        'table': [],
    };
    
    semantics.variables.forEach(v => {
        const val = v.valuesByMode[mode];
        if (!val) return;
        
        const resolved = v.resolvedValuesByMode[mode];
        let value;
        
        if (val.type === 'VARIABLE_ALIAS') {
            value = resolved?.resolvedValue;
        } else {
            value = val;
        }
        
        if (value === undefined || value === null) return;
        
        const name = v.name.toLowerCase().replace(/\//g, '-');
        let layer = null;
        
        if (name.startsWith('element')) layer = 'element';
        else if (name.startsWith('card')) layer = 'card';
        else if (name.startsWith('section')) layer = 'section';
        else if (name.startsWith('modal')) layer = 'modal';
        else if (name.startsWith('surface-container')) layer = 'surface-container';
        else if (name.startsWith('surface') && !name.includes('container')) layer = 'surface';
        else if (name.startsWith('table')) layer = 'table';
        
        if (layer && layers[layer]) {
            layers[layer].push({ name, value });
        }
    });
    
    // Output by layer
    const layerOrder = ['element', 'card', 'section', 'modal', 'surface', 'surface-container', 'table'];
    const layerLabels = {
        'element': 'Elements Layer',
        'card': 'Cards Layer',
        'section': 'Sections Layer',
        'modal': 'Modals Layer',
        'surface': 'Surfaces Layer',
        'surface-container': 'Surface Containers Layer',
        'table': 'Table Tokens',
    };
    
    layerOrder.forEach(layer => {
        if (layers[layer].length > 0) {
            scss += `\n    /* ${layerLabels[layer]} */\n`;
            
            // Sort: padding first, then gap, then radius, then border
            const sorted = layers[layer].sort((a, b) => {
                const order = ['pad-x', 'pad-y', 'gap', 'radius', 'stroke', 'border'];
                const aType = order.findIndex(o => a.name.includes(o));
                const bType = order.findIndex(o => b.name.includes(o));
                if (aType !== bType) return aType - bType;
                return a.name.localeCompare(b.name);
            });
            
            sorted.forEach(item => {
                const varName = item.name;
                scss += `    --size-${varName}: ${item.value}px;\n`;
            });
        }
    });
    
    scss += `}\n`;
    
    return scss;
}

/**
 * Generate layout tokens SCSS
 */
function generateLayoutSCSS() {
    const layout = JSON.parse(fs.readFileSync('new tokens/size _ layout.json', 'utf8'));
    
    let scss = `/**
 * Layout Tokens
 * Breakpoints, containers, and column widths
 */

:root {
    /* Breakpoints */\n`;
    
    // Extract breakpoints
    const breakpoints = {};
    layout.variables.forEach(v => {
        if (v.name.includes('Breakpoints')) {
            const modes = v.valuesByMode;
            Object.entries(modes).forEach(([modeKey, value]) => {
                if (typeof value === 'number') {
                    const modeName = layout.modes[modeKey];
                    if (!breakpoints[modeName]) breakpoints[modeName] = {};
                    if (v.name.includes('min')) {
                        breakpoints[modeName].min = value;
                    } else if (v.name.includes('max')) {
                        breakpoints[modeName].max = value;
                    }
                }
            });
        }
    });
    
    // Output breakpoints
    Object.entries(breakpoints).forEach(([mode, { min, max }]) => {
        if (min) scss += `    --breakpoint-${mode.toLowerCase()}-min: ${min}px;\n`;
        if (max) scss += `    --breakpoint-${mode.toLowerCase()}-max: ${max}px;\n`;
    });
    
    scss += `\n    /* Containers */\n`;
    
    // Extract containers (simplified - would need more parsing for full implementation)
    // For now, output key container values
    
    scss += `}\n`;
    
    return scss;
}

// Generate all files
console.log('Generating token SCSS files...');

const colorsSCSS = generateColorsSCSS();
fs.writeFileSync('design-system/tokens/_colors.scss', colorsSCSS);
console.log('✅ Generated design-system/tokens/_colors.scss');

const primitivesSCSS = generatePrimitivesSCSS();
fs.writeFileSync('design-system/tokens/_primitives.scss', primitivesSCSS);
console.log('✅ Generated design-system/tokens/_primitives.scss');

const semanticsSCSS = generateSemanticsSCSS();
fs.writeFileSync('design-system/tokens/_spacing_semantics.scss', semanticsSCSS);
console.log('✅ Generated design-system/tokens/_spacing_semantics.scss');

const layoutSCSS = generateLayoutSCSS();
fs.writeFileSync('design-system/tokens/_layout.scss', layoutSCSS);
console.log('✅ Generated design-system/tokens/_layout.scss');

console.log('\n✅ All token files generated successfully!');

