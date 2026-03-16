/**
 * List Figma Components
 * Fetches the specified node from Figma and lists components within it.
 * 
 * Usage:
 *   node scripts/list-figma-components.js
 */

const https = require('https');
require('dotenv').config();

const FIGMA_FILE_KEY = process.env.FIGMA_FILE_KEY;
const FIGMA_ACCESS_TOKEN = process.env.FIGMA_ACCESS_TOKEN;
// Node ID from the user provided URL: node-id=3497-19484
// Figma API expects colons instead of dashes for node IDs
const NODE_ID = '3497:19484';

if (!FIGMA_ACCESS_TOKEN || !FIGMA_FILE_KEY) {
    console.error('Error: FIGMA_ACCESS_TOKEN or FIGMA_FILE_KEY is missing in .env');
    process.exit(1);
}

const FIGMA_API_BASE = 'https://api.figma.com/v1';

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
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(new Error(`Failed to parse JSON: ${e.message}`));
                    }
                } else {
                    reject(new Error(`API request failed: ${res.statusCode} ${res.statusMessage}`));
                }
            });
        }).on('error', err => reject(err));
    });
}

function findComponents(node, components = []) {
    // Check if the node itself is a component or component set (variant container)
    if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
        components.push({
            id: node.id,
            name: node.name,
            type: node.type,
            // Include description if available (often used for documentation)
            description: node.description || ''
        });
    }

    // Recursively check children
    if (node.children) {
        node.children.forEach(child => findComponents(child, components));
    }

    return components;
}

async function main() {
    try {
        console.log(`Fetching file structure...`);
        const response = await figmaApiRequest(`/files/${FIGMA_FILE_KEY}?depth=1`);

        if (!response.document) return;

        const pages = response.document.children.filter(p =>
            !p.name.startsWith('Cover') &&
            !p.name.startsWith('━') &&
            !p.name.startsWith('–') &&
            !p.name.startsWith('-')
        );

        console.log(`Found ${pages.length} component pages to process.`);
        console.log('Generating structured report...\n');

        console.log('# Figma Component Library Report\n');

        // Process pages sequentially to avoid rate limits
        for (const page of pages) {
            // console.warn(`Processing ${page.name}...`); // Log to stderr to not pollute stdout

            // Normalize ID for API (replace dashes with colons if needed, though they usually come correct)
            // But we need to be careful about URL encoding if passed as param
            // Actually, we can fetch multiple nodes at once if we wanted, but let's do one by one for safety

            const pageData = await figmaApiRequest(`/files/${FIGMA_FILE_KEY}/nodes?ids=${page.id}`);
            const pageNode = pageData.nodes[page.id]?.document;

            if (pageNode) {
                console.log(`## ${page.name}`);
                console.log(`[Link to Page](https://www.figma.com/design/${FIGMA_FILE_KEY}?node-id=${page.id})\n`);

                const components = findComponents(pageNode);

                if (components.length === 0) {
                    console.log('*No components found on this page.*\n');
                } else {
                    // Group by Component Set (Variants) vs Single Components
                    const sets = components.filter(c => c.type === 'COMPONENT_SET');
                    const singles = components.filter(c => c.type === 'COMPONENT');

                    // Helper to check if a component is a child of a set
                    const isVariant = (c) => singles.some(s => s.parent?.id === c.id); // Wait, parent ID check is hard without parent ref
                    // Actually checking if c.parent.type === 'COMPONENT_SET' is better if we had parent info
                    // The findComponents simple recursion didn't keep parent info well enough.
                    // Let's just list them flat or try to group by name prefix?

                    // Simple listing with links
                    components.forEach(c => {
                        // Simplify name (remove slash path if redundant?)
                        // Construct Deep Link
                        const link = `https://www.figma.com/design/${FIGMA_FILE_KEY}?node-id=${c.id}`;

                        let typeLabel = c.type === 'COMPONENT_SET' ? 'Set' : 'Component';
                        // Indent variants if we can guess they belong to a set?
                        // For now, just a list is safer.
                        console.log(`- **${c.name}** ([${typeLabel}](${link}))`);
                        if (c.description) console.log(`  - ${c.description}`);
                    });
                    console.log('');
                }
            }

            // mild delay
            await new Promise(r => setTimeout(r, 200));
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

main();
