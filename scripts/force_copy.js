const fs = require('fs');
const path = require('path');

const copyDir = (src, dest) => {
    try {
        console.log(`Copying ${src} to ${dest}...`);
        fs.cpSync(src, dest, { recursive: true });
        console.log(`Successfully copied ${src} to ${dest}`);
    } catch (err) {
        console.error(`Error copying ${src} to ${dest}:`, err);
        process.exit(1);
    }
};

const run = () => {
    const rootDir = path.resolve(__dirname, '..');

    const designSystemSrc = path.join(rootDir, 'design-system');
    const legacyDsDest = path.join(rootDir, 'legacy-ds');

    // Check if design-system exists
    if (fs.existsSync(designSystemSrc)) {
        copyDir(designSystemSrc, legacyDsDest);
    } else {
        console.error(`Source directory ${designSystemSrc} does not exist!`);
    }

    const srcSrc = path.join(rootDir, 'src');
    const newDsDest = path.join(rootDir, 'new-ds');

    // Check if src exists
    if (fs.existsSync(srcSrc)) {
        copyDir(srcSrc, newDsDest);
    } else {
        console.error(`Source directory ${srcSrc} does not exist!`);
    }

    console.log('Copy operations completed.');
};

run();
