/**
 * Light and dark for the kit's stories: each part has a Light story and a Dark
 * story, the Dark one pinning the Color mode toolbar global.
 */
export const DARK = { globals: { plusColorMode: 'dark' } };
export const LIGHT = { globals: { plusColorMode: 'light' } };

/** A padded surface the part sits on, so dark mode paints a ground. */
export const onSurface = (Story) => (
    <div style={{ padding: 'var(--space-300)', background: 'var(--ds-surface-raised)', color: 'var(--ds-text)' }}>
        <Story />
    </div>
);

