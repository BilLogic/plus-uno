# Playground

This directory is for designer-specific prototyping and experimentation. Each designer can create their own directory to work on prototypes without affecting the main codebase.

## Creating Your Playground

### Option 1: Manual Creation

1. Create a directory with your name (e.g., `playground/victor/` or `playground/bill/`)
2. Create a `README.md` in your directory to document your work
3. Start prototyping!

### Option 2: Using Git User Name (Auto-generated)

Your playground directory name can be based on your git user name or you can choose a custom name.

## Structure

```
playground/
├── README.md                    # This file
├── templates/                   # Curated templates organized by product pillar
│   ├── admin/
│   ├── home/
│   ├── login/
│   ├── profile/
│   ├── toolkit/
│   ├── training/
│   └── universal/
└── {your-name}/                 # Your playground directory
    ├── README.md               # Your notes and documentation
    └── {prototype-name}/       # Individual prototypes
        ├── index.html
        ├── styles.css (if needed)
        ├── script.js (if needed)
        └── README.md
```

## Best Practices

1. **Organize by feature**: Create subdirectories for different prototypes
2. **Document your work**: Include README.md files explaining your prototypes
3. **Use templates**: Start from templates in `templates/` when appropriate
4. **Follow design system**: Always use PLUS design tokens and components
5. **Keep it clean**: Remove experimental code that didn't work out

## When to Use Playground vs Templates

- **Playground**: Use for experimentation, one-off prototypes, and personal exploration
- **Templates**: Use for reusable, curated templates that demonstrate complete page implementations based on specs documentation

## Moving to Templates

If your prototype becomes a useful template for others:

1. Clean up the code
2. Add comprehensive documentation
3. Move it to `templates/{product-pillar}/`
4. Update the templates README

## Git Integration

By default, playground directories are ignored by git (see `.gitignore`). If you want to commit your playground work:

1. Remove the ignore pattern for your specific directory, OR
2. Use `git add -f playground/{your-name}/` to force add

## See Also

- **Templates**: `templates/` - Curated templates based on specs documentation
- **Design System**: `../design-system/` - Component library and tokens
- **Specs Documentation**: `../design-system/specs/` - Complete page documentation for each product pillar
- **Documentation**: `../develop/` - Technical documentation
- **Guidelines**: `../develop/standards.md` - Coding standards and best practices
- **Token Reference**: `../design-system/styles/` - Complete token reference
