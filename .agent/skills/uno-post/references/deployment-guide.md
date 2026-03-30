<!-- Load for: helping a designer deploy a prototype to Netlify -->

# Deployment Guide

If the prototype has no `deploymentUrl`, offer to help deploy:

1. Verify the prototype builds:
   ```bash
   cd playground/{project}
   npx vite build
   ```
2. Guide the designer to deploy via one of:
   - **Netlify CLI**: `npx netlify deploy --prod --dir dist`
   - **Netlify UI**: Drag-and-drop the `dist/` folder at app.netlify.com
3. Wait for the designer to provide the resulting URL.
4. Record it as `deploymentUrl`.

Do **not** auto-deploy. Only provide guidance and wait for the URL.
