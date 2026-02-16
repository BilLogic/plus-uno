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

    // Replace ../components/common/Component with @/components/Component
    if (content.match(/from\s+['"]\.*\/components\/common\/([A-Za-z0-9]+)['"]/)) {
        content = content.replace(/from\s+['"]\.*\/components\/common\/([A-Za-z0-9]+)['"]/g, "from '@/components/$1'");
        changed = true;
    }

    // Replace components/common/Component (if not captured above)
    if (content.includes('components/common/')) {
        content = content.replace(/components\/common\//g, 'components/');
        changed = true;
    }

    // Replace css/ with styles/
    if (content.match(/['"]\.*\/css\//)) {
        content = content.replace(/['"]\.*\/css\//g, "'@/styles/");
        changed = true;
    }

    // Replace pages/ with specs/
    if (content.match(/['"]\.*\/pages\//)) {
        content = content.replace(/['"]\.*\/pages\//g, "'@/specs/");
        changed = true;
    }

    // Replace stories/components/ with components/ (for stories moved to colocation, maybe self-reference fixes)
    // Legacy mapping: stories/components/Button.stories.jsx -> components/Button/Button.stories.jsx
    // But imports INSIDE files might refer to other things.

    if (changed) {
        fs.writeFileSync(file, content);
        console.log(`Updated imports in ${file}`);
    }
});
