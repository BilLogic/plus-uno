const fs = require('fs');

// Fix state layer naming in colors file
const colorsContent = fs.readFileSync('src/css/tokens/_colors.scss', 'utf8');

let fixed = colorsContent
    .replace(/--color-primary-state-layers-primary (\d+):/g, '--color-primary-state-$1:')
    .replace(/--color-primary-state-layers-primary container (\d+):/g, '--color-primary-container-state-$1:')
    .replace(/--color-secondary-state-layers-secondary (\d+):/g, '--color-secondary-state-$1:')
    .replace(/--color-secondary-state-layers-secondary container (\d+):/g, '--color-secondary-container-state-$1:')
    .replace(/--color-tertiary-state-layers-tertiary (\d+):/g, '--color-tertiary-state-$1:')
    .replace(/--color-tertiary-state-layers-tertiary container (\d+):/g, '--color-tertiary-container-state-$1:')
    .replace(/--color-danger-state-layers-danger (\d+):/g, '--color-danger-state-$1:')
    .replace(/--color-danger-state-layers-danger container (\d+):/g, '--color-danger-container-state-$1:')
    .replace(/--color-success-state-layers-success (\d+):/g, '--color-success-state-$1:')
    .replace(/--color-success-state-layers-success container (\d+):/g, '--color-success-container-state-$1:')
    .replace(/--color-warning-state-layers-warning (\d+):/g, '--color-warning-state-$1:')
    .replace(/--color-warning-state-layers-warning container (\d+):/g, '--color-warning-container-state-$1:')
    .replace(/--color-social-emotional-state-layers-social-emotional (\d+):/g, '--color-social-emotional-state-$1:')
    .replace(/--color-social-emotional-state-layers-social-emotional container (\d+):/g, '--color-social-emotional-container-state-$1:')
    .replace(/--color-mastering-content-state-layers-mastering-content (\d+):/g, '--color-mastering-content-state-$1:')
    .replace(/--color-mastering-content-state-layers-mastering-content container (\d+):/g, '--color-mastering-content-container-state-$1:')
    .replace(/--color-advocacy-state-layers-advocacy (\d+):/g, '--color-advocacy-state-$1:')
    .replace(/--color-advocacy-state-layers-advocacy container (\d+):/g, '--color-advocacy-container-state-$1:')
    .replace(/--color-relationship-state-layers-relationship (\d+):/g, '--color-relationship-state-$1:')
    .replace(/--color-relationship-state-layers-relationship container (\d+):/g, '--color-relationship-container-state-$1:')
    .replace(/--color-technology-tools-state-layers-technology-tools (\d+):/g, '--color-technology-tools-state-$1:')
    .replace(/--color-technology-tools-state-layers-technology-tools container (\d+):/g, '--color-technology-tools-container-state-$1:');

fs.writeFileSync('src/css/tokens/_colors.scss', fixed);
console.log('✅ Fixed state layer naming in colors file');

