/**
 * Sync Figma Design Tokens
 * Fetches design tokens from Figma API and saves them in the format expected by generate-all-tokens.js
 * 
 * Usage:
 *   node scripts/sync-figma-tokens.js
 * 
 * Environment Variables:
 *   FIGMA_FILE_KEY - Figma design system file key
 *   FIGMA_ACCESS_TOKEN - Figma API access token
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const FIGMA_FILE_KEY = process.env.FIGMA_FILE_KEY;
const FIGMA_ACCESS_TOKEN = process.env.FIGMA_ACCESS_TOKEN;

if (!FIGMA_FILE_KEY || !FIGMA_ACCESS_TOKEN) {
    console.error('Error: FIGMA_FILE_KEY and FIGMA_ACCESS_TOKEN must be set in .env file');
    console.error('See .env.example for required variables');
    process.exit(1);
}

const FIGMA_API_BASE = 'https://api.figma.com/v1';

/**
 * Make HTTP request to Figma API
 */
function figmaApiRequest(endpoint) {
    return new Promise((resolve, reject) => {
        const url = `${FIGMA_API_BASE}${endpoint}`;
        const options = {
            headers: {
                'X-Figma-Token': FIGMA_ACCESS_TOKEN
            }
        };

        https.get(url, options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(new Error(`Failed to parse JSON: ${e.message}`));
                    }
                } else if (res.statusCode === 429) {
                    // Rate limit - retry after delay
                    const retryAfter = parseInt(res.headers['retry-after'] || '60', 10);
                    console.log(`Rate limited. Retrying after ${retryAfter} seconds...`);
                    setTimeout(() => {
                        figmaApiRequest(endpoint).then(resolve).catch(reject);
                    }, retryAfter * 1000);
                } else {
                    reject(new Error(`API request failed: ${res.statusCode} ${res.statusMessage}\n${data}`));
                }
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

/**
 * Fetch variables from Figma
 */
async function fetchFigmaVariables() {
    console.log('Fetching variables from Figma...');
    
    try {
        const response = await figmaApiRequest(`/files/${FIGMA_FILE_KEY}/variables/local`);
        return response;
    } catch (error) {
        console.error('Error fetching variables:', error.message);
        throw error;
    }
}

/**
 * Fetch variable collections from Figma
 */
async function fetchVariableCollections() {
    console.log('Fetching variable collections from Figma...');
    
    try {
        const response = await figmaApiRequest(`/files/${FIGMA_FILE_KEY}/variable-collections`);
        return response;
    } catch (error) {
        console.error('Error fetching variable collections:', error.message);
        throw error;
    }
}

/**
 * Transform Figma API response to match existing JSON structure
 */
function transformToExistingFormat(variables, collections) {
    // Group variables by collection
    const collectionsMap = {};
    if (collections && collections.meta && collections.meta.variableCollections) {
        collections.meta.variableCollections.forEach(col => {
            collectionsMap[col.id] = col;
        });
    }

    // Organize variables by collection
    const organized = {
        'colors _ accent': { variables: [], modes: {} },
        'colors _ neutral': { variables: [], modes: {} },
        'size _ primitive': { variables: [], modes: {} },
        'size _ semantics': { variables: [], modes: {} },
        'size _ layout': { variables: [], modes: {} }
    };

    // Process each variable
    if (variables && variables.meta && variables.meta.variables) {
        variables.meta.variables.forEach(variable => {
            const collectionId = variable.variableCollectionId;
            const collection = collectionsMap[collectionId];
            
            if (!collection) return;

            const collectionName = collection.name.toLowerCase();
            let targetFile = null;

            // Map collection names to file names
            if (collectionName.includes('color') && (collectionName.includes('accent') || collectionName.includes('primary') || collectionName.includes('secondary'))) {
                targetFile = 'colors _ accent';
            } else if (collectionName.includes('color') && (collectionName.includes('neutral') || collectionName.includes('surface'))) {
                targetFile = 'colors _ neutral';
            } else if (collectionName.includes('primitive') || collectionName.includes('base')) {
                targetFile = 'size _ primitive';
            } else if (collectionName.includes('semantic') || collectionName.includes('element') || collectionName.includes('card') || collectionName.includes('section')) {
                targetFile = 'size _ semantics';
            } else if (collectionName.includes('layout') || collectionName.includes('breakpoint')) {
                targetFile = 'size _ layout';
            }

            if (targetFile && organized[targetFile]) {
                // Transform variable to match existing format
                const transformedVar = {
                    id: variable.id,
                    name: variable.name,
                    variableCollectionId: variable.variableCollectionId,
                    resolvedType: variable.resolvedType,
                    valuesByMode: {},
                    resolvedValuesByMode: {}
                };

                // Process each mode
                if (collection.modes) {
                    collection.modes.forEach(mode => {
                        const modeId = mode.modeId;
                        const value = variable.valuesByMode ? variable.valuesByMode[modeId] : undefined;

                        if (value !== undefined) {
                            transformedVar.valuesByMode[modeId] = value;
                            
                            // Resolve value if it's an alias
                            if (value && value.type === 'VARIABLE_ALIAS') {
                                // Find the referenced variable
                                const refVar = variables.meta.variables.find(v => v.id === value.id);
                                if (refVar) {
                                    const refValue = refVar.valuesByMode ? refVar.valuesByMode[modeId] : undefined;
                                    if (refValue && refValue.type !== 'VARIABLE_ALIAS') {
                                        transformedVar.resolvedValuesByMode[modeId] = refValue;
                                    } else {
                                        transformedVar.resolvedValuesByMode[modeId] = { aliasName: refVar.name };
                                    }
                                }
                            } else {
                                transformedVar.resolvedValuesByMode[modeId] = value;
                            }
                        }
                    });

                    // Store modes from collection (only once per file)
                    if (Object.keys(organized[targetFile].modes).length === 0) {
                        collection.modes.forEach(mode => {
                            organized[targetFile].modes[mode.modeId] = mode.name;
                        });
                    }
                }

                organized[targetFile].variables.push(transformedVar);
            }
        });
    }

    return organized;
}

/**
 * Save tokens to JSON files
 */
function saveTokenFiles(organized) {
    const tokensDir = path.join(process.cwd(), 'new tokens');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(tokensDir)) {
        fs.mkdirSync(tokensDir, { recursive: true });
    }

    Object.entries(organized).forEach(([filename, data]) => {
        const filePath = path.join(tokensDir, `${filename}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`✅ Saved ${filename}.json`);
    });
}

/**
 * Main sync function
 */
async function syncTokens() {
    try {
        console.log('Starting Figma token sync...');
        console.log(`File Key: ${FIGMA_FILE_KEY.substring(0, 8)}...`);

        // Fetch data from Figma
        const [variables, collections] = await Promise.all([
            fetchFigmaVariables(),
            fetchVariableCollections()
        ]);

        // Transform to existing format
        const organized = transformToExistingFormat(variables, collections);

        // Save to files
        saveTokenFiles(organized);

        console.log('\n✅ Token sync completed successfully!');
        console.log('Run "npm run generate:tokens" to generate SCSS files from synced tokens.');
        
    } catch (error) {
        console.error('\n❌ Token sync failed:', error.message);
        process.exit(1);
    }
}

// Run sync
syncTokens();

