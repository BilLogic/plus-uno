const fs = require('fs');

const dump = JSON.parse(fs.readFileSync('figma_node_dump.json', 'utf8'));

function rgbToHex(r, g, b, a) {
    const toHex = (n) => Math.round(n * 255).toString(16).padStart(2, '0');
    let hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    if (a !== undefined && a !== 1) {
        hex += toHex(a);
    }
    return hex;
}

function traverse(node, context = []) {
    let results = [];
    const currentPath = [...context, node.name];

    // Check for Fills (Colors)
    if (node.fills && node.fills.length > 0) {
        const solidFill = node.fills.find(f => f.type === 'SOLID' && f.visible !== false);
        if (solidFill && solidFill.color) {
            results.push({
                type: 'COLOR',
                path: currentPath.join(' / '),
                name: node.name,
                value: rgbToHex(solidFill.color.r, solidFill.color.g, solidFill.color.b, solidFill.color.a)
            });
        }
    }

    // Check for Layout Grids
    if (node.layoutGrids && node.layoutGrids.length > 0) {
        node.layoutGrids.forEach((grid, idx) => {
            results.push({
                type: 'GRID',
                path: currentPath.join(' / '),
                name: node.name + ` (Grid ${idx})`,
                details: grid
            });
        });
    }

    // Recurse
    if (node.children) {
        node.children.forEach(child => {
            results = results.concat(traverse(child, currentPath));
        });
    }
    return results;
}

const colorTokens = traverse(dump.colors.document);
const layoutTokens = traverse(dump.layout.document);

// Filter noise (unwanted frames, etc)
// We look for specific keywords often used in token definition structures
const cleanColors = colorTokens.filter(t => {
    const p = t.path.toLowerCase();
    return (p.includes('color') || p.includes('elevation') || p.includes('primitive') || p.includes('semantic'))
        && !t.name.startsWith('_');
});

console.log('--- FOUND COLOR TOKENS (Sample) ---');
cleanColors.slice(0, 50).forEach(c => console.log(`${c.value}  :  ${c.path}`));

console.log('\n--- FOUND GRID CONFIGS ---');
layoutTokens.forEach(l => console.log(JSON.stringify(l, null, 2)));

fs.writeFileSync('extracted_tokens.json', JSON.stringify({ colors: cleanColors, layout: layoutTokens }, null, 2));
