# Image Assets Directory

This directory contains all static image assets for the PLUS Design System, organized by category.

## Directory Structure

- `auth-providers/` - Authentication provider images (Clever, Google, etc.)
- `icons/` - Custom icon images (if not using Font Awesome)

**Note**: Logo images are handled by the Logo component (`packages/plus-ds/src/assets/Logo/`), which uses inline SVG. For logo usage, use `<Logo />` from `@/assets/Logo` instead of static image files.

## Image Format Guidelines

- **SVG**: Use for logos, icons, and simple graphics (scalable, small file size)
- **PNG**: Use for complex images, photos, or images requiring transparency
- **JPG**: Use for photos without transparency needs

## Usage

All images should be referenced using relative paths from the component or template location:

```javascript
// From playground/templates/login/
const cleverImage = "../../../packages/plus-ds/src/assets/images/auth-providers/clever-image.png";
```

## Special Cases

- **Clever Image**: Uses PNG file from `auth-providers/clever-image.png`

## Adding New Images

1. Place images in the appropriate category directory
2. Use descriptive, kebab-case filenames (e.g., `clever-image.png`, `google-icon.svg`)
3. Update this README if adding a new category
4. Document any special usage requirements

