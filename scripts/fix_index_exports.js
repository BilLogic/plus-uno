const fs = require('fs');
const path = require('path');

const COMPONENTS_DIR = path.resolve(__dirname, '../src/components');

function processComponents() {
    if (!fs.existsSync(COMPONENTS_DIR)) return;
    const files = fs.readdirSync(COMPONENTS_DIR);

    files.forEach(folder => {
        const folderPath = path.join(COMPONENTS_DIR, folder);
        if (!fs.statSync(folderPath).isDirectory()) return;

        // Assume component name matches folder name
        const componentName = folder;
        const componentFile = path.join(folderPath, `${componentName}.jsx`);

        if (fs.existsSync(componentFile)) {
            const indexPath = path.join(folderPath, 'index.js');
            const content = `export * from './${componentName}';\nexport { default } from './${componentName}';\n`;
            fs.writeFileSync(indexPath, content);
            console.log(`Fixed index.js for ${componentName}`);
        }
    });
}

processComponents();
