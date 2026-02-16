const fs = require('fs');
const https = require('https');
require('dotenv').config();

const FIGMA_FILE_KEY = process.env.FIGMA_FILE_KEY;
const FIGMA_ACCESS_TOKEN = process.env.FIGMA_ACCESS_TOKEN;
const FIGMA_API_BASE = 'https://api.figma.com/v1';

if (!FIGMA_FILE_KEY || !FIGMA_ACCESS_TOKEN) {
    console.error('Missing env variables');
    process.exit(1);
}

function figmaApiRequest(endpoint) {
    return new Promise((resolve, reject) => {
        const url = `${FIGMA_API_BASE}${endpoint}`;
        const options = { headers: { 'X-Figma-Token': FIGMA_ACCESS_TOKEN } };
        https.get(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) resolve(JSON.parse(data));
                else reject(new Error(`API Error ${res.statusCode}: ${data}`));
            });
        }).on('error', reject);
    });
}

async function main() {
    try {
        console.log('Fetching Variables...');
        const varResp = await figmaApiRequest(`/files/${FIGMA_FILE_KEY}/variables/local`);

        console.log('Fetching Styles...');
        const stylesResp = await figmaApiRequest(`/files/${FIGMA_FILE_KEY}/styles`);

        const output = {
            colors: [],
            layout: [],
            text: [],
            grid: []
        };

        // 1. Process Variables
        const collections = varResp.meta.variableCollections;
        const variables = varResp.meta.variables;

        if (variables) {
            variables.forEach(v => {
                const collection = collections.find(c => c.id === v.variableCollectionId);
                const colName = collection ? collection.name : 'Unknown';

                // We only care about resolved values for the default mode (usually the first one)
                // If there are multiple modes, we might need to check them all

                const modeId = collection.defaultModeId; // Use default mode
                const value = v.valuesByMode[modeId];

                let resolvedValue = value;
                if (value && value.type === 'VARIABLE_ALIAS') {
                    const aliasVar = variables.find(av => av.id === value.id);
                    if (aliasVar) {
                        resolvedValue = `Alias(${aliasVar.name})`;
                        // In a real resolver we would recurse, but for debug this is helpful to know it's an alias
                    }
                } else if (value && typeof value === 'object' && 'r' in value) {
                    // Start of RGBA conversion if needed, usually Figma returns 0-1 values
                    const toHex = (n) => Math.round(n * 255).toString(16).padStart(2, '0');
                    resolvedValue = `#${toHex(value.r)}${toHex(value.g)}${toHex(value.b)}`;
                    if (value.a !== 1) resolvedValue += toHex(value.a); // Add alpha
                }

                const entry = {
                    name: v.name,
                    collection: colName,
                    type: v.resolvedType,
                    value: resolvedValue
                };

                if (v.resolvedType === 'COLOR') output.colors.push(entry);
                else if (v.resolvedType === 'FLOAT') output.layout.push(entry);
                else output.text.push(entry); // Catch-all
            });
        }

        // 2. Process Styles (Grid usually lives here)
        if (stylesResp.meta && stylesResp.meta.styles) {
            stylesResp.meta.styles.forEach(s => {
                const entry = {
                    name: s.name,
                    type: s.styleType,
                    description: s.description
                };
                if (s.styleType === 'GRID') output.grid.push(entry);
                else if (s.styleType === 'TEXT') output.text.push(entry);
                // Note: Styles endpoint doesn't give the VALUE, only metadata. 
                // To get style values we need to fetch the file nodes where styles are used or fetch the node that *is* the style master?
                // Actually, REST API for styles is limited.
                // We might need to fetch the nodes 6:189 (Layout) and 3:36 (Colors) directly if variables don't cover it.
            });
        }

        fs.writeFileSync('figma_token_dump.json', JSON.stringify(output, null, 2));
        console.log('Dumped tokens to figma_token_dump.json');

    } catch (err) {
        console.error(err);
    }
}

main();
