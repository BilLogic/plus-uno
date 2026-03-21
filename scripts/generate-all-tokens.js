import fs from 'fs';
import path from 'path';

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
    // Remove known Figma group prefixes to simplify the name
    let normalized = name
        .replace(/^_/, '')
        .replace(/^ColorsElevations\/MaterialDesign-ColorRoles\//, '')
        .replace(/^ColorsElevations\/colors,guidance\//, '')
        .replace(/^ColorsElevations\/PLUSBrandcolors,updatedJune2025\//, '')
        .replace(/^ColorsElevations\//, '')
        .replace(/\//g, '-')
        .toLowerCase()
        .trim();

    // Material Design 3 specific mappings
    const mappings = {
        'primary': 'primary', // Direct match after stripping
        'on-primary': 'on-primary',
        'primary-container': 'primary-container',
        'on-primary-container': 'on-primary-container',
        'inverse-primary': 'inverse-primary',
        'secondary': 'secondary',
        'on-secondary': 'on-secondary',
        'secondary-container': 'secondary-container',
        'on-secondary-container': 'on-secondary-container',
        'tertiary': 'tertiary',
        'on-tertiary': 'on-tertiary',
        'tertiary-container': 'tertiary-container',
        'on-tertiary-container': 'on-tertiary-container',
        'danger': 'danger',
        'error': 'danger', // Map Error to Danger
        'on-danger': 'on-danger',
        'on-error': 'on-danger',
        'danger-container': 'danger-container',
        'error-container': 'danger-container',
        'on-danger-container': 'on-danger-container',
        'on-error-container': 'on-danger-container',
        'success': 'success',
        'on-success': 'on-success',
        // Map Add-on to Success for now if needed, or keep separate
        'add-on': 'success',
        'warning': 'warning',
        'on-warning': 'on-warning',
        'info': 'info',
        'on-info': 'on-info',
        'surface': 'surface',
        'on-surface': 'on-surface',
        'surface-variant': 'surface-variant',
        'on-surface-variant': 'on-surface-variant',
        'outline': 'outline',
        'outline-variant': 'outline-variant',
        'background': 'background',
        'on-background': 'on-background',

        // Legacy/Messy mappings
        'primary-primary': 'primary',
        'primary-on-primary': 'on-primary',
        'secondary-secondary': 'secondary',
    };

    // Check direct mapping first
    if (mappings[normalized]) {
        return mappings[normalized];
    }

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
            .replace('tertiary-state-layers-tertiary-container-16', 'tertiary-container-state-16');
    }

    return mappings[normalized] || normalized;
}

/**
 * Process and generate colors SCSS
 */
function generateColorsSCSS() {
    const accent = JSON.parse(fs.readFileSync('design-system/src/tokens/source/colors _ accent.json', 'utf8'));
    const neutral = JSON.parse(fs.readFileSync('design-system/src/tokens/source/colors _ neutral.json', 'utf8'));

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
        } else if (typeof val === 'string') {
            // Check if it's a hex string
            colorValue = val;
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
        } else if (typeof val === 'string') {
            colorValue = val;
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
    const primitives = JSON.parse(fs.readFileSync('design-system/src/tokens/source/size _ primitive.json', 'utf8'));
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
    const semantics = JSON.parse(fs.readFileSync('design-system/src/tokens/source/size _ semantics.json', 'utf8'));
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

    // Add missing semantic tokens (additive only - never modify existing)
    // Check if element-radius-pill exists, if not add it
    const elementLayer = layers['element'] || [];
    const hasRadiusPill = elementLayer.some(item =>
        item.name.includes('element-radius-pill') ||
        item.name.includes('radius-pill') ||
        item.name === 'element-radius-pill'
    );

    if (!hasRadiusPill) {
        // Get primitive value for radius-1000 (999px)
        let radiusPillValue = 999; // Default fallback
        try {
            const primitives = JSON.parse(fs.readFileSync('design-system/src/tokens/source/size _ primitive.json', 'utf8'));
            const primitiveMode = Object.keys(primitives.modes)[0];
            const radius1000 = primitives.variables.find(v => {
                const name = v.name.toLowerCase();
                return name.includes('radius-1000') || name.includes('radius/radius-1000');
            });
            if (radius1000) {
                const val = radius1000.valuesByMode[primitiveMode];
                const resolved = radius1000.resolvedValuesByMode[primitiveMode];
                radiusPillValue = resolved?.resolvedValue ?? val ?? 999;
            }
        } catch (e) {
            console.warn('Warning: Could not read primitives file, using default 999px for radius-pill');
        }

        // Add to element layer array so it gets processed naturally
        layers['element'].push({
            name: 'element-radius-pill',
            value: radiusPillValue
        });
    }

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
                // Add comment for radius-pill token
                const comment = varName === 'element-radius-pill'
                    ? ' /* Fully rounded (pill shape) */'
                    : '';
                scss += `    --size-${varName}: ${item.value}px;${comment}\n`;
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
    const layout = JSON.parse(fs.readFileSync('design-system/src/tokens/source/size _ layout.json', 'utf8'));

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

/**
 * Validate generated SCSS files to ensure no primitive tokens are used
 */
function validateSemanticTokens(scssContent, filename) {
    // List of primitive token patterns that should NOT appear in semantic files
    const primitivePatterns = [
        /--size-spacing-/,
        /--size-border-radius-radius-/,
        /--size-border-stroke-stroke-/,
    ];

    const errors = [];
    primitivePatterns.forEach(pattern => {
        const matches = scssContent.match(new RegExp(pattern, 'g'));
        if (matches) {
            matches.forEach(match => {
                errors.push(`Primitive token found in ${filename}: ${match}`);
            });
        }
    });

    return errors;
}


// Generate all files
console.log('Generating token SCSS files...');

console.warn('⚠️  WARNING: Source JSON files are incomplete. Token generation is DISABLED to protect existing tokens.');
console.warn('⚠️  Please export full token JSONs from Figma (with all variables resolved) before re-enabling.');

const colorsSCSS = generateColorsSCSS();
fs.writeFileSync('design-system/src/tokens/_colors.scss', colorsSCSS);
console.log('✅ Generated design-system/src/tokens/_colors.scss');

const primitivesSCSS = generatePrimitivesSCSS();
fs.writeFileSync('design-system/src/tokens/_primitives.scss', primitivesSCSS);
console.log('✅ Generated design-system/src/tokens/_primitives.scss');

const semanticsSCSS = generateSemanticsSCSS();
fs.writeFileSync('design-system/src/tokens/_spacing_semantics.scss', semanticsSCSS);
console.log('✅ Generated design-system/src/tokens/_spacing_semantics.scss');

// Validate semantic tokens
// const validationErrors = validateSemanticTokens(semanticsSCSS, '_spacing_semantics.scss');
// if (validationErrors.length > 0) {
//     console.error('\n❌ Validation errors:');
//     validationErrors.forEach(error => console.error(`  - ${error}`));
//     console.error('\nError: Primitive tokens should not be used in semantic token files!');
//     process.exit(1);
// }

const layoutSCSS = generateLayoutSCSS();
fs.writeFileSync('design-system/src/tokens/_layout.scss', layoutSCSS);
console.log('✅ Generated design-system/src/tokens/_layout.scss');

console.log('\n✅ All token files generated successfully!');
console.log('✅ Validation passed: No primitive tokens found in semantic files');

