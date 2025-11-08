const fs = require('fs');
const path = require('path');

/**
 * Convert RGB color values to hex
 */
function rgbToHex(r, g, b, a = 1) {
    const toHex = (n) => {
        const hex = Math.round(n * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    if (a < 1) {
        return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
    }
    return '#' + toHex(r) + toHex(g) + toHex(b);
}

/**
 * Convert Figma variable name to CSS variable name
 */
function toCssVarName(figmaName) {
    // Convert "Primary/Primary" to "primary-primary" then to CSS var format
    return figmaName
        .toLowerCase()
        .replace(/[\/_]/g, '-')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

/**
 * Process accent colors
 */
function processAccentColors(accentData) {
    const colors = {};
    const mode = Object.keys(accentData.modes)[0];
    
    accentData.variables.forEach(variable => {
        const modeValue = variable.valuesByMode[mode];
        if (!modeValue) return;
        
        let colorValue;
        if (modeValue.type === 'VARIABLE_ALIAS') {
            // Handle aliases - we'll resolve these later
            colorValue = `var(--color-${toCssVarName(variable.resolvedValuesByMode[mode].aliasName)})`;
        } else if (modeValue.r !== undefined) {
            // RGB color
            colorValue = rgbToHex(modeValue.r, modeValue.g, modeValue.b, modeValue.a);
        } else {
            return;
        }
        
        const cssName = toCssVarName(variable.name);
        colors[cssName] = colorValue;
    });
    
    return colors;
}

/**
 * Process neutral colors
 */
function processNeutralColors(neutralData) {
    const colors = {};
    const mode = Object.keys(neutralData.modes)[0];
    
    neutralData.variables.forEach(variable => {
        const modeValue = variable.valuesByMode[mode];
        if (!modeValue) return;
        
        let colorValue;
        if (modeValue.type === 'VARIABLE_ALIAS') {
            colorValue = `var(--color-${toCssVarName(variable.resolvedValuesByMode[mode].aliasName)})`;
        } else if (modeValue.r !== undefined) {
            colorValue = rgbToHex(modeValue.r, modeValue.g, modeValue.b, modeValue.a);
        } else {
            return;
        }
        
        const cssName = toCssVarName(variable.name);
        colors[cssName] = colorValue;
    });
    
    return colors;
}

/**
 * Process primitive tokens
 */
function processPrimitives(primitiveData) {
    const tokens = {};
    const mode = Object.keys(primitiveData.modes)[0];
    
    primitiveData.variables.forEach(variable => {
        const modeValue = variable.valuesByMode[mode];
        if (modeValue === undefined) return;
        
        let value;
        if (modeValue.type === 'VARIABLE_ALIAS') {
            value = `var(--size-${toCssVarName(variable.resolvedValuesByMode[mode].aliasName)})`;
        } else {
            value = modeValue;
        }
        
        const cssName = toCssVarName(variable.name);
        tokens[cssName] = value;
    });
    
    return tokens;
}

/**
 * Process semantic tokens
 */
function processSemantics(semanticData) {
    const tokens = {};
    const mode = Object.keys(semanticData.modes)[0];
    
    semanticData.variables.forEach(variable => {
        const modeValue = variable.valuesByMode[mode];
        if (!modeValue) return;
        
        let value;
        if (modeValue.type === 'VARIABLE_ALIAS') {
            // Map to primitive token
            const aliasName = variable.resolvedValuesByMode[mode].aliasName;
            const primitiveName = toCssVarName(aliasName);
            value = `var(--size-${primitiveName})`;
        } else {
            value = modeValue;
        }
        
        const cssName = toCssVarName(variable.name);
        tokens[cssName] = value;
    });
    
    return tokens;
}

/**
 * Process layout tokens
 */
function processLayout(layoutData) {
    const tokens = {};
    const modes = layoutData.modes;
    
    layoutData.variables.forEach(variable => {
        const valuesByMode = variable.valuesByMode;
        const cssName = toCssVarName(variable.name);
        
        // For breakpoint-specific values, we'll handle them separately
        if (Object.keys(valuesByMode).length > 1) {
            // Multi-mode token - store as object
            tokens[cssName] = valuesByMode;
        } else {
            // Single value
            const mode = Object.keys(valuesByMode)[0];
            const value = valuesByMode[mode];
            if (value !== undefined && value !== null) {
                if (typeof value === 'object' && value.type === 'VARIABLE_ALIAS') {
                    tokens[cssName] = `var(--size-${toCssVarName(variable.resolvedValuesByMode[mode].aliasName)})`;
                } else {
                    tokens[cssName] = value;
                }
            }
        }
    });
    
    return tokens;
}

/**
 * Generate SCSS output
 */
function generateScss(colors, tokens, outputPath) {
    let scss = `:root {\n`;
    
    // Add colors
    Object.entries(colors).forEach(([key, value]) => {
        scss += `    --color-${key}: ${value};\n`;
    });
    
    // Add tokens
    Object.entries(tokens).forEach(([key, value]) => {
        if (typeof value === 'object' && !Array.isArray(value)) {
            // Handle multi-mode tokens
            Object.entries(value).forEach(([mode, modeValue]) => {
                scss += `    --size-${key}-${mode}: ${modeValue}px;\n`;
            });
        } else {
            scss += `    --size-${key}: ${value}px;\n`;
        }
    });
    
    scss += `}\n`;
    
    fs.writeFileSync(outputPath, scss);
    console.log(`Generated ${outputPath}`);
}

// Main execution
try {
    const accentColors = JSON.parse(fs.readFileSync('new tokens/colors _ accent.json', 'utf8'));
    const neutralColors = JSON.parse(fs.readFileSync('new tokens/colors _ neutral.json', 'utf8'));
    const primitives = JSON.parse(fs.readFileSync('new tokens/size _ primitive.json', 'utf8'));
    const semantics = JSON.parse(fs.readFileSync('new tokens/size _ semantics.json', 'utf8'));
    const layout = JSON.parse(fs.readFileSync('new tokens/size _ layout.json', 'utf8'));
    
    const accentColorsMap = processAccentColors(accentColors);
    const neutralColorsMap = processNeutralColors(neutralColors);
    const primitivesMap = processPrimitives(primitives);
    const semanticsMap = processSemantics(semantics);
    const layoutMap = processLayout(layout);
    
    console.log('Processing complete:');
    console.log('  Accent colors:', Object.keys(accentColorsMap).length);
    console.log('  Neutral colors:', Object.keys(neutralColorsMap).length);
    console.log('  Primitives:', Object.keys(primitivesMap).length);
    console.log('  Semantics:', Object.keys(semanticsMap).length);
    console.log('  Layout:', Object.keys(layoutMap).length);
    
    // Write output files (we'll create the actual SCSS files manually for better control)
    console.log('\nToken processing complete. Manual SCSS file generation recommended for better formatting.');
    
} catch (error) {
    console.error('Error processing tokens:', error);
    process.exit(1);
}

