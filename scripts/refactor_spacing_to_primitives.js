const fs = require('fs');
const path = require('path');

const primitivesPath = 'develop/tokens/_primitives.scss';
const semanticsPath = 'develop/tokens/_spacing_semantics.scss';

// 1. Parse Primitives
const primitivesContent = fs.readFileSync(primitivesPath, 'utf8');
const valToToken = new Map();

primitivesContent.split('\n').forEach(line => {
    const match = line.match(/^\s*(--[\w-]+):\s*([^;]+);/);
    if (match) {
        const token = match[1];
        const val = match[2].trim();
        // Store value -> token. note: duplicates? last one wins or generic preference?
        // Primitives usually distinct. 
        // 16px might be space-300 or radius-400?
        // We should distinguish by type if possible, or prioritize spacing for gaps/pads and radius for radii.

        // Actually, let's store all and decide based on target token name.
        if (!valToToken.has(val)) {
            valToToken.set(val, []);
        }
        valToToken.get(val).push(token);
    }
});

// 2. Process Semantics
let semanticsContent = fs.readFileSync(semanticsPath, 'utf8');
const lines = semanticsContent.split('\n');
const newLines = lines.map(line => {
    // Ignore lines that already have var(
    if (line.includes('var(')) return line;

    const match = line.match(/^\s*(--[\w-]+):\s*([^;]+);/);
    if (match) {
        const key = match[1];
        const val = match[2].trim();

        if (valToToken.has(val)) {
            const candidates = valToToken.get(val);
            let chosen = candidates[0];

            // Heuristic context matching
            if (key.includes('radius')) {
                const r = candidates.find(c => c.includes('radius'));
                if (r) chosen = r;
            } else if (key.includes('stroke') || key.includes('border')) {
                const s = candidates.find(c => c.includes('stroke'));
                if (s) chosen = s;
            } else {
                // assume spacing
                const s = candidates.find(c => c.includes('spacing'));
                if (s) chosen = s;
            }

            return line.replace(val, `var(${chosen})`);
        } else {
            // No match found
            console.log(`[WARN] No primitive found for ${key}: ${val}`);
            return line;
        }
    }
    return line;
});

fs.writeFileSync(semanticsPath, newLines.join('\n'));
console.log('Refactor complete.');
