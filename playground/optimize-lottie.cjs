
const fs = require('fs');

const inputFile = 'transition lottie file.json';
const outputFile = 'transition-transparent.json';

const rawData = fs.readFileSync(inputFile);
const lottie = JSON.parse(rawData);

// Find asset with id "0" (which we identified as the 1280x800 image)
const asset = lottie.assets.find(a => a.id === "0");

if (asset) {
    console.log(`Found asset 0. Dimensions: ${asset.w}x${asset.h}`);
    // Replace payload with empty string or modify to be transparent
    // Setting keys to empty might work, or valid transparent png base64
    // 1x1 transparent PNG base64
    const transparentData = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

    // Update asset to be transparent, matching dimensions implies scaling might happen if we shrink it,
    // but typically Lottie stretches image fill. 
    // SAFEST BET: Keep dimensions in metadata, but create a transparent image of 1280x800? 
    // OR just stripping the data might make it blank.
    // Let's try replacing with a 1px transparent png and let Lottie scale it, or just empty.

    // Attempt 1: Just remove 'p' and 'u' and 'e'
    // asset.p = "";
    // asset.u = "";
    // asset.e = 0; 

    // Attempt 2: Valid transparent image data
    asset.p = transparentData;
    asset.e = 1; // Embedded
    // Keep width/height meta as is so Lottie renderer reserves the space?
    // Actually, if we change the image, we should probably change w/h if we want it to map 1:1, 
    // but if it's "cover" fit, 1x1 might look weird.
    // Let's strip the image data entirely out to see if it just renders as nothing.
    delete asset.p;
    delete asset.u;
    delete asset.e;

    // Also check for other "frame" assets.
    // The user mentioned "a bunch of frames at the ratio of 1280 x 800". 
    // Let's iterate all assets. 
    lottie.assets.forEach(a => {
        if (a.w === 1280 && a.h === 800) {
            console.log(`Clearing asset ${a.id} (1280x800)`);
            delete a.p;
            delete a.u;
            delete a.e;
        }
    });

} else {
    console.log("Asset 0 not found");
}

fs.writeFileSync(outputFile, JSON.stringify(lottie, null, 2));
console.log(`Written to ${outputFile}`);
