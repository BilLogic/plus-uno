import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const componentsDir = path.join(__dirname, 'design-system/src/components');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        if (file === 'node_modules') return;
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(filePath));
        } else if (file.endsWith('.stories.jsx')) {
            results.push(filePath);
        }
    });
    return results;
}

const files = walk(componentsDir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Pattern to remove the leading <h6 className="h6"...>Title</h6> right after <section> (or spaces after it)
    // Actually, it's safer to just remove ALL <h6 className="h6"> if they match the function name or if they are the first child of <section>.
    // Let's use a regex to find: <section>\s*<h6 className="h6"[^>]*>([^<]+)</h6>
    
    content = content.replace(/(<section>\s*)<h6 className="h6"[^>]*>([^<]+)<\/h6>(\s*<p className="(?:plus-body-2|body2-txt)"[^>]*>)/g, (match, p1, p2, p3) => {
        // Just remove the h6, keep the section and the paragraph.
        return p1 + p3.trimStart();
    });

    // Also handle cases where there's no `<p>` immediately following, but maybe a `<div>`
    content = content.replace(/(<section>\s*)<h6 className="h6"[^>]*>([^<]+)<\/h6>(\s*<div)/g, (match, p1, p2, p3) => {
        return p1 + p3.trimStart();
    });
    
    // Specially handle ButtonGroup to upgrade the span/p to h6
    if (file.endsWith('ButtonGroup.stories.jsx')) {
        // Upgrade specific pseudo-headers
        content = content.replace(/<span className="plus-body-3" style=\{\{ color: 'var\(--color-neutral-text\)' \}\}>/g, '<h6 className="h6" style={{ marginBottom: \'16px\' }}>');
        // Close the tag
        content = content.replace(/(<h6 className="h6" style=\{\{ marginBottom: '16px' \}\}>.*?)<\/span>/gs, '$1</h6>');
        
        // Upgrade p tags in Styles & Fills
        content = content.replace(/<p className="plus-body-2" style=\{\{ marginBottom: '12px', color: 'var\(--color-neutral-text\)' \}\}>([^<]+)<\/p>/g, '<h6 className="h6" style={{ marginBottom: \'16px\' }}>$1</h6>');
        
        // Upgrade span tags in Layouts/Counts with specific widths
        content = content.replace(/<span className="plus-body-3" style=\{\{ color: 'var\(--color-neutral-text\)', minWidth: '80px' \}\}>/g, '<h6 className="h6" style={{ minWidth: \'80px\' }}>');
    }

    fs.writeFileSync(file, content, 'utf8');
});

console.log("Done processing " + files.length + " files.");
