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

/**
 * Dark, for a story that shows design-system components still on the legacy
 * color roles, which have no dark values: Status, Breadcrumb (the topbar's
 * trail) and UserAvatar (the topbar's account). Their rows in the color
 * migration guide (design-system/guidelines/foundations/color-migration.md)
 * read "take". axe skips those elements only, so the kit and the page are
 * still held to contrast in dark; drop a selector when its component moves to
 * the --ds- tokens.
 */
export const DARK_WITH_LEGACY = {
    ...DARK,
    parameters: {
        a11y: { context: { include: ['body'], exclude: ['.plus-status', '.breadcrumb', '.plus-user-avatar'] } },
    },
};
