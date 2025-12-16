const https = require('https');
require('dotenv').config();

const FIGMA_FILE_KEY = process.env.FIGMA_FILE_KEY;
const FIGMA_ACCESS_TOKEN = process.env.FIGMA_ACCESS_TOKEN;
const FIGMA_API_BASE = 'https://api.figma.com/v1';

// Node IDs from previous report
const COLOR_PAGE_ID = '3:36'; // Colors & Elevations
const LAYOUT_PAGE_ID = '6:189'; // Layout & Grid

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
        console.log('Fetching Colors & Elevations Node...');
        // Depth 2 to see immediate children (frames/groups)
        const colorResp = await figmaApiRequest(`/files/${FIGMA_FILE_KEY}/nodes?ids=${COLOR_PAGE_ID}&depth=2`);

        console.log('Fetching Layout & Grid Node...');
        const layoutResp = await figmaApiRequest(`/files/${FIGMA_FILE_KEY}/nodes?ids=${LAYOUT_PAGE_ID}&depth=2`);

        const dump = {
            colors: colorResp.nodes[COLOR_PAGE_ID],
            layout: layoutResp.nodes[LAYOUT_PAGE_ID]
        };

        fs.writeFileSync('figma_node_dump.json', JSON.stringify(dump, null, 2));
        console.log('Dumped nodes to figma_node_dump.json');

    } catch (err) {
        console.error(err);
    }
}

const fs = require('fs');
main();
