const fs = require('fs');

function rgbToHex(r, g, b, a = 1) {
    const toHex = (n) => Math.round(n * 255).toString(16).padStart(2, '0');
    if (a < 1 && a > 0) {
        return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a.toFixed(3)})`;
    }
    return '#' + toHex(r) + toHex(g) + toHex(b);
}

// Read JSON files
const accent = JSON.parse(fs.readFileSync('new tokens/colors _ accent.json', 'utf8'));
const neutral = JSON.parse(fs.readFileSync('new tokens/colors _ neutral.json', 'utf8'));

const accentMode = Object.keys(accent.modes)[0];
const neutralMode = Object.keys(neutral.modes)[0];

// Build color map with proper M3 naming
const colorMap = {};

// Process accent colors
accent.variables.forEach(v => {
    const val = v.valuesByMode[accentMode];
    if (!val) return;
    
    let colorValue;
    if (val.type === 'VARIABLE_ALIAS') {
        const resolved = v.resolvedValuesByMode[accentMode];
        if (resolved && resolved.resolvedValue && resolved.resolvedValue.r !== undefined) {
            const r = resolved.resolvedValue.r;
            const g = resolved.resolvedValue.g;
            const b = resolved.resolvedValue.b;
            const a = resolved.resolvedValue.a || 1;
            colorValue = rgbToHex(r, g, b, a);
        } else {
            return;
        }
    } else if (val.r !== undefined) {
        colorValue = rgbToHex(val.r, val.g, val.b, val.a || 1);
    } else {
        return;
    }
    
    // Map to M3 names
    let name = v.name;
    let cssName;
    
    // Primary
    if (name === '_Primary/Primary') cssName = 'primary';
    else if (name === '_Primary/On Primary') cssName = 'on-primary';
    else if (name === '_Primary/Primary Container') cssName = 'primary-container';
    else if (name === '_Primary/On Primary Container') cssName = 'on-primary-container';
    else if (name === '_Primary/Inverse Primary') cssName = 'inverse-primary';
    else if (name === '_Primary/Primary (Text)') cssName = 'primary-text';
    // Primary state layers
    else if (name.includes('_Primary/State-layers/Primary 08')) cssName = 'primary-state-08';
    else if (name.includes('_Primary/State-layers/Primary 12')) cssName = 'primary-state-12';
    else if (name.includes('_Primary/State-layers/Primary 16')) cssName = 'primary-state-16';
    else if (name.includes('_Primary/State-layers/Primary Container 08')) cssName = 'primary-container-state-08';
    else if (name.includes('_Primary/State-layers/Primary Container 12')) cssName = 'primary-container-state-12';
    else if (name.includes('_Primary/State-layers/Primary Container 16')) cssName = 'primary-container-state-16';
    // Secondary
    else if (name === '_Secondary/Secondary') cssName = 'secondary';
    else if (name === '_Secondary/On Secondary') cssName = 'on-secondary';
    else if (name === '_Secondary/Secondary Container') cssName = 'secondary-container';
    else if (name === '_Secondary/On Secondary Container') cssName = 'on-secondary-container';
    else if (name === '_Secondary/Secondary (Text)') cssName = 'secondary-text';
    else if (name === '_Secondary/on-surface') cssName = 'secondary-on-surface';
    // Secondary state layers
    else if (name.includes('_Secondary/State-layers/Secondary 08')) cssName = 'secondary-state-08';
    else if (name.includes('_Secondary/State-layers/Secondary 12')) cssName = 'secondary-state-12';
    else if (name.includes('_Secondary/State-layers/Secondary 16')) cssName = 'secondary-state-16';
    else if (name.includes('_Secondary/State-layers/Secondary Container 08')) cssName = 'secondary-container-state-08';
    else if (name.includes('_Secondary/State-layers/Secondary Container 12')) cssName = 'secondary-container-state-12';
    else if (name.includes('_Secondary/State-layers/Secondary Container 16')) cssName = 'secondary-container-state-16';
    // Tertiary
    else if (name === '_Tertiary/Tertiary') cssName = 'tertiary';
    else if (name === '_Tertiary/On Tertiary') cssName = 'on-tertiary';
    else if (name === '_Tertiary/Tertiary Container') cssName = 'tertiary-container';
    else if (name === '_Tertiary/On Tertiary Container') cssName = 'on-tertiary-container';
    else if (name === '_Tertiary/Tertiary (Text)') cssName = 'tertiary-text';
    else if (name === '_Tertiary/on-surface') cssName = 'tertiary-on-surface';
    // Tertiary state layers
    else if (name.includes('_Tertiary/State-layers/Tertiary 08')) cssName = 'tertiary-state-08';
    else if (name.includes('_Tertiary/State-layers/Tertiary 12')) cssName = 'tertiary-state-12';
    else if (name.includes('_Tertiary/State-layers/Tertiary 16')) cssName = 'tertiary-state-16';
    else if (name.includes('_Tertiary/State-layers/Tertiary Container 08')) cssName = 'tertiary-container-state-08';
    else if (name.includes('_Tertiary/State-layers/Tertiary Container 12')) cssName = 'tertiary-container-state-12';
    else if (name.includes('_Tertiary/State-layers/Tertiary Container 16')) cssName = 'tertiary-container-state-16';
    // Danger
    else if (name === '_Danger/Danger') cssName = 'danger';
    else if (name === '_Danger/On Danger') cssName = 'on-danger';
    else if (name === '_Danger/Danger Container') cssName = 'danger-container';
    else if (name === '_Danger/On Danger Container') cssName = 'on-danger-container';
    else if (name === '_Danger/Danger (Text)') cssName = 'danger-text';
    // Danger state layers
    else if (name.includes('_Danger/State-layers/Danger 08')) cssName = 'danger-state-08';
    else if (name.includes('_Danger/State-layers/Danger 12')) cssName = 'danger-state-12';
    else if (name.includes('_Danger/State-layers/Danger 16')) cssName = 'danger-state-16';
    else if (name.includes('_Danger/State-layers/Danger Container 08')) cssName = 'danger-container-state-08';
    else if (name.includes('_Danger/State-layers/Danger Container 12')) cssName = 'danger-container-state-12';
    else if (name.includes('_Danger/State-layers/Danger Container 16')) cssName = 'danger-container-state-16';
    // Success
    else if (name === '_Success/Success') cssName = 'success';
    else if (name === '_Success/On Success') cssName = 'on-success';
    else if (name === '_Success/Success Container') cssName = 'success-container';
    else if (name === '_Success/On Success Container') cssName = 'on-success-container';
    else if (name === '_Success/Success (Text)') cssName = 'success-text';
    // Success state layers
    else if (name.includes('_Success/State-layers/Success 08')) cssName = 'success-state-08';
    else if (name.includes('_Success/State-layers/Success 12')) cssName = 'success-state-12';
    else if (name.includes('_Success/State-layers/Success 16')) cssName = 'success-state-16';
    else if (name.includes('_Success/State-layers/Success Container 08')) cssName = 'success-container-state-08';
    else if (name.includes('_Success/State-layers/Success Container 12')) cssName = 'success-container-state-12';
    else if (name.includes('_Success/State-layers/Success Container 16')) cssName = 'success-container-state-16';
    // Warning
    else if (name === '_Warning/Warning') cssName = 'warning';
    else if (name === '_Warning/On Warning') cssName = 'on-warning';
    else if (name === '_Warning/Warning Container') cssName = 'warning-container';
    else if (name === '_Warning/On Warning Container') cssName = 'on-warning-container';
    else if (name === '_Warning/Warning (Text)') cssName = 'warning-text';
    // Warning state layers
    else if (name.includes('_Warning/State-layers/Warning 08')) cssName = 'warning-state-08';
    else if (name.includes('_Warning/State-layers/Warning 12')) cssName = 'warning-state-12';
    else if (name.includes('_Warning/State-layers/Warning 16')) cssName = 'warning-state-16';
    else if (name.includes('_Warning/State-layers/Warning Container 08')) cssName = 'warning-container-state-08';
    else if (name.includes('_Warning/State-layers/Warning Container 12')) cssName = 'warning-container-state-12';
    else if (name.includes('_Warning/State-layers/Warning Container 16')) cssName = 'warning-container-state-16';
    // Info (aliases to Tertiary)
    else if (name === '_Info/Info') cssName = 'info';
    else if (name === '_Info/On Info') cssName = 'on-info';
    else if (name === '_Info/Info Container') cssName = 'info-container';
    else if (name === '_Info/On Info Container') cssName = 'on-info-container';
    else if (name === '_Info/Info (Text)') cssName = 'info-text';
    // Info state layers
    else if (name.includes('_Info/State-layers/Info 08')) cssName = 'info-state-08';
    else if (name.includes('_Info/State-layers/Info 12')) cssName = 'info-state-12';
    else if (name.includes('_Info/State-layers/Info 16')) cssName = 'info-state-16';
    else if (name.includes('_Info/State-layers/Info Container 08')) cssName = 'info-container-state-08';
    else if (name.includes('_Info/State-layers/Info Container 12')) cssName = 'info-container-state-12';
    else if (name.includes('_Info/State-layers/Info Container 16')) cssName = 'info-container-state-16';
    // SMART colors
    else if (name === '_Social-Emotional/Social-Emotional') cssName = 'social-emotional';
    else if (name === '_Social-Emotional/On Social-Emotional') cssName = 'on-social-emotional';
    else if (name === '_Social-Emotional/Social-Emotional Container') cssName = 'social-emotional-container';
    else if (name === '_Social-Emotional/On Social-Emotional Container') cssName = 'on-social-emotional-container';
    else if (name === '_Social-Emotional/Social-Emotional (Text)') cssName = 'social-emotional-text';
    // Social-Emotional state layers
    else if (name.includes('_Social-Emotional/State-layers/Social-Emotional 08')) cssName = 'social-emotional-state-08';
    else if (name.includes('_Social-Emotional/State-layers/Social-Emotional 12')) cssName = 'social-emotional-state-12';
    else if (name.includes('_Social-Emotional/State-layers/Social-Emotional 16')) cssName = 'social-emotional-state-16';
    else if (name.includes('_Social-Emotional/State-layers/Social-Emotional Container 08')) cssName = 'social-emotional-container-state-08';
    else if (name.includes('_Social-Emotional/State-layers/Social-Emotional Container 12')) cssName = 'social-emotional-container-state-12';
    else if (name.includes('_Social-Emotional/State-layers/Social-Emotional Container 16')) cssName = 'social-emotional-container-state-16';
    // Mastering Content
    else if (name === '_Mastering-Content/Mastering-Content') cssName = 'mastering-content';
    else if (name === '_Mastering-Content/On Mastering-Content') cssName = 'on-mastering-content';
    else if (name === '_Mastering-Content/Mastering-Content Container') cssName = 'mastering-content-container';
    else if (name === '_Mastering-Content/On Mastering-Content Container') cssName = 'on-mastering-content-container';
    else if (name === '_Mastering-Content/Mastering-Content (Text)') cssName = 'mastering-content-text';
    // Mastering Content state layers
    else if (name.includes('_Mastering-Content/State-layers/Mastering-Content 08')) cssName = 'mastering-content-state-08';
    else if (name.includes('_Mastering-Content/State-layers/Mastering-Content 12')) cssName = 'mastering-content-state-12';
    else if (name.includes('_Mastering-Content/State-layers/Mastering-Content 16')) cssName = 'mastering-content-state-16';
    else if (name.includes('_Mastering-Content/State-layers/Mastering-Content Container 08')) cssName = 'mastering-content-container-state-08';
    else if (name.includes('_Mastering-Content/State-layers/Mastering-Content Container 12')) cssName = 'mastering-content-container-state-12';
    else if (name.includes('_Mastering-Content/State-layers/Mastering-Content Container 16')) cssName = 'mastering-content-container-state-16';
    // Advocacy
    else if (name === '_Advocacy/Advocacy') cssName = 'advocacy';
    else if (name === '_Advocacy/On Advocacy') cssName = 'on-advocacy';
    else if (name === '_Advocacy/Advocacy Container') cssName = 'advocacy-container';
    else if (name === '_Advocacy/On Advocacy Container') cssName = 'on-advocacy-container';
    else if (name === '_Advocacy/Advocacy (Text)') cssName = 'advocacy-text';
    else if (name === '_Advocacy/on-surface') cssName = 'advocacy-on-surface';
    // Advocacy state layers
    else if (name.includes('_Advocacy/State-layers/Advocacy 08')) cssName = 'advocacy-state-08';
    else if (name.includes('_Advocacy/State-layers/Advocacy 12')) cssName = 'advocacy-state-12';
    else if (name.includes('_Advocacy/State-layers/Advocacy 16')) cssName = 'advocacy-state-16';
    else if (name.includes('_Advocacy/State-layers/Advocacy Container 08')) cssName = 'advocacy-container-state-08';
    else if (name.includes('_Advocacy/State-layers/Advocacy Container 12')) cssName = 'advocacy-container-state-12';
    else if (name.includes('_Advocacy/State-layers/Advocacy Container 16')) cssName = 'advocacy-container-state-16';
    // Relationship
    else if (name === '_Relationship/Relationship') cssName = 'relationship';
    else if (name === '_Relationship/On Relationship') cssName = 'on-relationship';
    else if (name === '_Relationship/Relationship Container') cssName = 'relationship-container';
    else if (name === '_Relationship/On Relationship Container') cssName = 'on-relationship-container';
    else if (name === '_Relationship/Relationship (Text)') cssName = 'relationship-text';
    // Relationship state layers
    else if (name.includes('_Relationship/State-layers/Relationship 08')) cssName = 'relationship-state-08';
    else if (name.includes('_Relationship/State-layers/Relationship 12')) cssName = 'relationship-state-12';
    else if (name.includes('_Relationship/State-layers/Relationship 16')) cssName = 'relationship-state-16';
    else if (name.includes('_Relationship/State-layers/Relationship Container 08')) cssName = 'relationship-container-state-08';
    else if (name.includes('_Relationship/State-layers/Relationship Container 12')) cssName = 'relationship-container-state-12';
    else if (name.includes('_Relationship/State-layers/Relationship Container 16')) cssName = 'relationship-container-state-16';
    // Technology Tools
    else if (name === '_Technology-Tools/Technology-Tools') cssName = 'technology-tools';
    else if (name === '_Technology-Tools/On Technology-Tools') cssName = 'on-technology-tools';
    else if (name === '_Technology-Tools/Technology-Tools Container') cssName = 'technology-tools-container';
    else if (name === '_Technology-Tools/On Technology-Tools Container') cssName = 'on-technology-tools-container';
    else if (name === '_Technology-Tools/Technology-Tools (Text)') cssName = 'technology-tools-text';
    // Technology Tools state layers
    else if (name.includes('_Technology-Tools/State-layers/Technology-Tools 08')) cssName = 'technology-tools-state-08';
    else if (name.includes('_Technology-Tools/State-layers/Technology-Tools 12')) cssName = 'technology-tools-state-12';
    else if (name.includes('_Technology-Tools/State-layers/Technology-Tools 16')) cssName = 'technology-tools-state-16';
    else if (name.includes('_Technology-Tools/State-layers/Technology-Tools Container 08')) cssName = 'technology-tools-container-state-08';
    else if (name.includes('_Technology-Tools/State-layers/Technology-Tools Container 12')) cssName = 'technology-tools-container-state-12';
    else if (name.includes('_Technology-Tools/State-layers/Technology-Tools Container 16')) cssName = 'technology-tools-container-state-16';
    else return; // Skip unmapped colors
    
    if (cssName) {
        colorMap[cssName] = colorValue;
    }
});

// Process neutral colors
neutral.variables.forEach(v => {
    const val = v.valuesByMode[neutralMode];
    if (!val) return;
    
    let colorValue;
    if (val.type === 'VARIABLE_ALIAS') {
        const resolved = v.resolvedValuesByMode[neutralMode];
        if (resolved && resolved.resolvedValue && resolved.resolvedValue.r !== undefined) {
            const r = resolved.resolvedValue.r;
            const g = resolved.resolvedValue.g;
            const b = resolved.resolvedValue.b;
            const a = resolved.resolvedValue.a || 1;
            colorValue = rgbToHex(r, g, b, a);
        } else {
            return;
        }
    } else if (val.r !== undefined) {
        colorValue = rgbToHex(val.r, val.g, val.b, val.a || 1);
    } else {
        return;
    }
    
    let name = v.name;
    let cssName;
    
    if (name === 'Neutral Colors/surface') cssName = 'surface';
    else if (name === 'Neutral Colors/on-surface') cssName = 'on-surface';
    else if (name === 'Neutral Colors/outline') cssName = 'outline';
    else if (name === 'Neutral Colors/outline-variant') cssName = 'outline-variant';
    else if (name === 'Neutral Colors/on-surface-variant') cssName = 'on-surface-variant';
    else if (name === 'Neutral Colors/Surface container/surface-container-highest') cssName = 'surface-container-highest';
    else if (name === 'Neutral Colors/Surface container/surface-container-high') cssName = 'surface-container-high';
    else if (name === 'Neutral Colors/Surface container/surface-container') cssName = 'surface-container';
    else if (name === 'Neutral Colors/Surface container/surface-container-low') cssName = 'surface-container-low';
    else if (name === 'Neutral Colors/Surface container/surface-container-lowest') cssName = 'surface-container-lowest';
    else if (name === 'Neutral Colors/Alternative/surface-dim') cssName = 'surface-dim';
    else if (name === 'Neutral Colors/Alternative/surface-bright') cssName = 'surface-bright';
    else if (name === 'Neutral Colors/Alternative/surface-variant') cssName = 'surface-variant';
    else if (name === 'Neutral Colors/Alternative/scrim') cssName = 'scrim';
    else if (name === 'Neutral Colors/Alternative/inverse-surface') cssName = 'inverse-surface';
    else if (name === 'Neutral Colors/Alternative/inverse-on-surface') cssName = 'inverse-on-surface';
    else if (name === 'Neutral Colors/Surface container/on-surface') cssName = 'on-surface'; // Duplicate, but keep for consistency
    else return;
    
    if (cssName) {
        colorMap[cssName] = colorValue;
    }
});

// Generate SCSS
let scss = `/**
 * Material Design 3 Color Tokens
 * Generated from Figma design system
 * Follows M3 color role guidance: https://m3.material.io/styles/color/roles
 */

:root {
    /* ============================================
       ACCENT COLORS - Material Design 3 Roles
       ============================================ */
    
    /* Primary Colors */\n`;

// Output in organized groups
const groups = [
    { label: 'Primary Colors', keys: ['primary', 'on-primary', 'primary-container', 'on-primary-container', 'inverse-primary'] },
    { label: 'Primary State Layers', keys: Object.keys(colorMap).filter(k => k.startsWith('primary-state') || k.startsWith('primary-container-state')) },
    { label: 'Secondary Colors', keys: ['secondary', 'on-secondary', 'secondary-container', 'on-secondary-container'] },
    { label: 'Secondary State Layers', keys: Object.keys(colorMap).filter(k => k.startsWith('secondary-state') || k.startsWith('secondary-container-state')) },
    { label: 'Tertiary Colors', keys: ['tertiary', 'on-tertiary', 'tertiary-container', 'on-tertiary-container'] },
    { label: 'Tertiary State Layers', keys: Object.keys(colorMap).filter(k => k.startsWith('tertiary-state') || k.startsWith('tertiary-container-state')) },
    { label: 'Danger Colors', keys: ['danger', 'on-danger', 'danger-container', 'on-danger-container'] },
    { label: 'Danger State Layers', keys: Object.keys(colorMap).filter(k => k.startsWith('danger-state') || k.startsWith('danger-container-state')) },
    { label: 'Success Colors', keys: ['success', 'on-success', 'success-container', 'on-success-container'] },
    { label: 'Success State Layers', keys: Object.keys(colorMap).filter(k => k.startsWith('success-state') || k.startsWith('success-container-state')) },
    { label: 'Warning Colors', keys: ['warning', 'on-warning', 'warning-container', 'on-warning-container'] },
    { label: 'Warning State Layers', keys: Object.keys(colorMap).filter(k => k.startsWith('warning-state') || k.startsWith('warning-container-state')) },
    { label: 'Info Colors', keys: ['info', 'on-info', 'info-container', 'on-info-container'] },
    { label: 'Info State Layers', keys: Object.keys(colorMap).filter(k => k.startsWith('info-state') || k.startsWith('info-container-state')) },
    { label: 'Social-Emotional Colors', keys: ['social-emotional', 'on-social-emotional', 'social-emotional-container', 'on-social-emotional-container'] },
    { label: 'Social-Emotional State Layers', keys: Object.keys(colorMap).filter(k => k.startsWith('social-emotional-state') || k.startsWith('social-emotional-container-state')) },
    { label: 'Mastering Content Colors', keys: ['mastering-content', 'on-mastering-content', 'mastering-content-container', 'on-mastering-content-container'] },
    { label: 'Mastering Content State Layers', keys: Object.keys(colorMap).filter(k => k.startsWith('mastering-content-state') || k.startsWith('mastering-content-container-state')) },
    { label: 'Advocacy Colors', keys: ['advocacy', 'on-advocacy', 'advocacy-container', 'on-advocacy-container'] },
    { label: 'Advocacy State Layers', keys: Object.keys(colorMap).filter(k => k.startsWith('advocacy-state') || k.startsWith('advocacy-container-state')) },
    { label: 'Relationship Colors', keys: ['relationship', 'on-relationship', 'relationship-container', 'on-relationship-container'] },
    { label: 'Relationship State Layers', keys: Object.keys(colorMap).filter(k => k.startsWith('relationship-state') || k.startsWith('relationship-container-state')) },
    { label: 'Technology Tools Colors', keys: ['technology-tools', 'on-technology-tools', 'technology-tools-container', 'on-technology-tools-container'] },
    { label: 'Technology Tools State Layers', keys: Object.keys(colorMap).filter(k => k.startsWith('technology-tools-state') || k.startsWith('technology-tools-container-state')) },
];

groups.forEach(group => {
    const existingKeys = group.keys.filter(k => colorMap[k]);
    if (existingKeys.length > 0) {
        scss += `\n    /* ${group.label} */\n`;
        existingKeys.forEach(key => {
            scss += `    --color-${key}: ${colorMap[key]};\n`;
        });
    }
});

// Neutral colors
scss += `\n    /* ============================================
       NEUTRAL COLORS - Material Design 3
       ============================================ */
    
    /* Surface Colors */\n`;

const neutralGroups = [
    { label: 'Surface', keys: ['surface', 'on-surface'] },
    { label: 'Surface Variant', keys: ['surface-variant', 'on-surface-variant'] },
    { label: 'Outline', keys: ['outline', 'outline-variant'] },
    { label: 'Surface Containers', keys: ['surface-container-lowest', 'surface-container-low', 'surface-container', 'surface-container-high', 'surface-container-highest'] },
    { label: 'Alternative Surfaces', keys: ['surface-dim', 'surface-bright', 'scrim', 'inverse-surface', 'inverse-on-surface'] },
];

neutralGroups.forEach(group => {
    const existingKeys = group.keys.filter(k => colorMap[k]);
    if (existingKeys.length > 0) {
        scss += `\n    /* ${group.label} */\n`;
        existingKeys.forEach(key => {
            scss += `    --color-${key}: ${colorMap[key]};\n`;
        });
    }
});

scss += `}\n`;

fs.writeFileSync('src/css/tokens/_colors.scss', scss);
console.log('✅ Regenerated colors SCSS file with all M3 color roles');
console.log(`   Total colors: ${Object.keys(colorMap).length}`);

