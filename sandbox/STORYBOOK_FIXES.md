# Storybook Fixes Applied

## Issues Fixed

### 1. MDX File Error
**Problem**: Storybook was trying to index `Introduction.stories.mdx` but couldn't process it.

**Solution**: Removed MDX from the stories pattern in `main.js`. Changed from:
```javascript
stories: ['../stories/**/*.stories.@(js|jsx|ts|tsx|mdx)']
```
to:
```javascript
stories: ['../stories/**/*.stories.@(js|jsx|ts|tsx)']
```

### 2. Import Path Resolution Errors
**Problem**: Vite couldn't resolve imports like `../../../src/js/components/plus_smart_components.js` because:
- The component files were reorganized (no longer in `general_interface.js` or `plus_smart_components.js`)
- Paths were relative and Vite had trouble resolving them from the sandbox directory

**Solution**: 
1. Updated all imports to use the centralized `index.js` file which exports `PlusInterface` and `PlusSmartComponents` for backward compatibility
2. Configured Vite alias `@` to map to the `src` directory
3. Updated all story imports to use the alias: `@/js/components/index.js` instead of relative paths
4. Set Vite root directory to project root for proper path resolution

### 3. Vite Configuration
**Changes made to `sandbox/.storybook/main.js`**:
- Added path alias `@` that maps to `src` directory
- Set Vite root to project root: `config.root = rootDir`
- Ensured proper file extension resolution
- Configured static directories for CSS and assets

## Files Updated

### Story Files (All imports updated to use `@` alias):
- `sandbox/stories/atoms/StatusIndicator.stories.js`
- `sandbox/stories/molecules/Button.stories.js`
- `sandbox/stories/molecules/Checkbox.stories.js`
- `sandbox/stories/molecules/Alert.stories.js`
- `sandbox/stories/molecules/StatusTag.stories.js`
- `sandbox/stories/molecules/CompetencyPill.stories.js`

### Configuration Files:
- `sandbox/.storybook/main.js` - Updated Vite configuration for proper path resolution

## Testing

After these fixes:
1. Storybook should start without errors
2. All component imports should resolve correctly
3. Stories should render properly in the browser
4. No more MDX indexing errors

## Next Steps

If you still encounter import errors:
1. Make sure Storybook is restarted after configuration changes
2. Clear browser cache and reload
3. Check that `src/js/components/index.js` exports `PlusInterface` and `PlusSmartComponents`
4. Verify the alias is working by checking Vite's resolve configuration

