const fs = require('fs');
const path = require('path');

const SRC_DIR = path.resolve(__dirname, '../src');

function getAllFiles(dir, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getAllFiles(filePath, fileList);
        } else {
            if (/\.(jsx|js|scss|css)$/.test(file)) {
                fileList.push(filePath);
            }
        }
    });
    return fileList;
}

const files = getAllFiles(SRC_DIR);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Fix relative imports to components
    // matches ../../../components/ or ../components/ etc.
    if (content.match(/from\s+['"](\.\.\/)+components\//)) {
        content = content.replace(/from\s+['"](\.\.\/)+components\//g, "from '@/components/");
        changed = true;
    }

    // Fix relative imports to specs (pages)
    if (content.match(/from\s+['"](\.\.\/)+pages\//)) {
        content = content.replace(/from\s+['"](\.\.\/)+pages\//g, "from '@/specs/");
        changed = true;
    }

    if (content.match(/from\s+['"](\.\.\/)+specs\//)) {
        content = content.replace(/from\s+['"](\.\.\/)+specs\//g, "from '@/specs/");
        changed = true;
    }

    // Fix sibling component imports (e.g. from './Badge' -> from '@/components/Badge')
    // This assumes capitalized imports are components
    if (content.match(/from\s+['"]\.\/([A-Z][A-Za-z0-9]+)['"]/)) {
        content = content.replace(/from\s+['"]\.\/([A-Z][A-Za-z0-9]+)['"]/g, "from '@/components/$1'");
        changed = true;
    }

    // Fix constants import
    if (content.match(/from\s+['"]\.\/constants['"]/)) {
        content = content.replace(/from\s+['"]\.\/constants['"]/g, "from '@/components/constants'");
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content);
        console.log(`Fixed imports in ${file}`);
    }
});
