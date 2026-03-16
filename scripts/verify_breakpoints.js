const fs = require('fs');

const dump = JSON.parse(fs.readFileSync('figma_node_dump.json', 'utf8'));

const breakpoints = [];

function traverse(node, path = '') {
    const currentPath = path ? `${path} / ${node.name}` : node.name;

    // Check if this node is one of the Breakpoint definition frames
    if (node.name && node.name.startsWith('Size=')) {
        // It's a breakpoint frame!
        breakpoints.push({
            name: node.name,
            width: node.absoluteBoundingBox ? node.absoluteBoundingBox.width : (node.size ? node.size.x : 'N/A'),
            path: currentPath
        });
    }

    if (node.children) {
        node.children.forEach(child => traverse(child, currentPath));
    }
}

// The dump might be an array or object depending on how it was saved.
// Check structure
if (Array.isArray(dump)) {
    dump.forEach(n => traverse(n));
} else {
    // If it's the raw response with 'nodes' key
    Object.values(dump).forEach(n => traverse(n.document));
}

console.log('Figma Breakpoint Widths:');
breakpoints.sort((a, b) => b.width - a.width).forEach(bp => {
    console.log(`${bp.name}: ${bp.width}px`);
});
