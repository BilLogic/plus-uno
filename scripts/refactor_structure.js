const fs = require('fs');
const path = require('path');

const COMPONENTS_DIR = path.resolve(__dirname, '../src/components');
// Stories might be in src/specs/Universal/Elements or src/stories/components depending on where they landed
// We will search for them.
const SEARCH_DIRS = [
    path.resolve(__dirname, '../src/specs/Universal/Elements'),
    path.resolve(__dirname, '../src/stories/components'),
    path.resolve(__dirname, '../src/components')
];

function findStory(componentName) {
    for (const dir of SEARCH_DIRS) {
        if (!fs.existsSync(dir)) continue;
        const storyName = `${componentName}.stories.jsx`;
        const fullPath = path.join(dir, storyName);
        if (fs.existsSync(fullPath)) return fullPath;

        // Also try subdirectories if needed, but for now flat search
    }
    return null;
}

function processComponents() {
    const files = fs.readdirSync(COMPONENTS_DIR);

    files.forEach(file => {
        if (!file.endsWith('.jsx')) return;

        const componentName = path.basename(file, '.jsx');
        const componentPath = path.join(COMPONENTS_DIR, file);
        const targetDir = path.join(COMPONENTS_DIR, componentName);

        // Create directory
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir);
        }

        // Move component
        const newComponentPath = path.join(targetDir, file);
        if (fs.existsSync(componentPath)) {
            fs.renameSync(componentPath, newComponentPath);
            console.log(`Moved ${componentName}.jsx to folder`);
        }

        // Find and move story
        const storyPath = findStory(componentName);
        if (storyPath) {
            const newStoryPath = path.join(targetDir, `${componentName}.stories.jsx`);
            fs.renameSync(storyPath, newStoryPath);
            console.log(`Moved ${componentName}.stories.jsx to folder`);
        } else {
            console.warn(`Story not found for ${componentName}`);
        }

        // Create index.js
        const indexPath = path.join(targetDir, 'index.js');
        const indexContent = `import ${componentName} from './${componentName}';\nexport default ${componentName};\n`;
        fs.writeFileSync(indexPath, indexContent);
        console.log(`Created index.js for ${componentName}`);
    });
}

processComponents();
