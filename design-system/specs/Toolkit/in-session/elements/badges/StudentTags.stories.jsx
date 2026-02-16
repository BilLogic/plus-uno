import React from 'react';
import Badge from '../../../../../../packages/plus-ds/src/components/Badge/Badge';

export default {
    title: 'Specs/Toolkit/In-Session/Elements/Badges/Student Tags',
    component: Badge,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: `
# Student Tags (PLUS Tags)

Pill-shaped badges used to label students with contextual tags across different categories.

## Categories
- **Goal**: Goal met, Goal Not Met
- **Engagement**: Driven, Unengaged
- **Content**: Accomplished, Developing
- **Misc**: Overflow indicator (...)

## Signals
Each tag has a **signal** indicated by a leading icon:
- **Positive** (green): \`fa-circle-check\` — indicates a favorable status
- **Negative** (red): \`fa-triangle-exclamation\` — indicates attention needed
- **Hidden** (misc): No icon, just text

## Design Tokens
- **Background**: \`--color-warning-state-08\` (tonal warning surface)
- **Text**: \`--color-secondary-text\` (secondary text color)
- **Icon positive**: \`--color-success\`
- **Icon negative**: \`--color-danger\`
- **Padding**: \`--size-element-pad-x-sm\` (8px horizontal)
- **Gap**: \`--size-element-gap-sm\` (8px between icon and text)
- **Border radius**: \`--size-element-radius-full\` (pill shape / 999px)
- **Typography**: body3-txt (Merriweather Sans Regular, 12px, line-height 1.667)
                `
            }
        }
    },
};

/**
 * Positive signal icon (green circle-check)
 */
const positiveIcon = (
    <i
        className="fa-solid fa-circle-check"
        style={{ color: 'var(--color-success)', fontSize: '10px' }}
    />
);

/**
 * Negative signal icon (red triangle-exclamation)
 */
const negativeIcon = (
    <i
        className="fa-solid fa-triangle-exclamation"
        style={{ color: 'var(--color-danger)', fontSize: '10px' }}
    />
);

// ─── Goal Category ───────────────────────────────────────────────

/**
 * Goal Met
 * Positive signal with green check icon
 */
export const GoalMet = {
    args: {
        text: 'Goal met',
        style: 'warning',
        size: 'b3',
        leadingVisual: positiveIcon,
        className: 'fw-normal',
    },
};

/**
 * Goal Not Met
 * Negative signal with red triangle icon
 */
export const GoalNotMet = {
    args: {
        text: 'Goal Not Met',
        style: 'warning',
        size: 'b3',
        leadingVisual: negativeIcon,
        className: 'fw-normal',
    },
};

// ─── Engagement Category ─────────────────────────────────────────

/**
 * Driven
 * Positive signal with green check icon
 */
export const Driven = {
    args: {
        text: 'Driven',
        style: 'warning',
        size: 'b3',
        leadingVisual: positiveIcon,
        className: 'fw-normal',
    },
};

/**
 * Unengaged
 * Negative signal with red triangle icon
 */
export const Unengaged = {
    args: {
        text: 'unengaged',
        style: 'warning',
        size: 'b3',
        leadingVisual: negativeIcon,
        className: 'fw-normal',
    },
};

// ─── Content Category ────────────────────────────────────────────

/**
 * Accomplished
 * Positive signal with green check icon
 */
export const Accomplished = {
    args: {
        text: 'Accomplished',
        style: 'warning',
        size: 'b3',
        leadingVisual: positiveIcon,
        className: 'fw-normal',
    },
};

/**
 * Developing
 * Negative signal with red triangle icon
 */
export const Developing = {
    args: {
        text: 'developing',
        style: 'warning',
        size: 'b3',
        leadingVisual: negativeIcon,
        className: 'fw-normal',
    },
};

// ─── Misc Category ───────────────────────────────────────────────

/**
 * Overflow Indicator
 * Shows "..." for additional tags, with tooltip on hover
 */
export const Overflow = {
    args: {
        text: '...',
        style: 'warning',
        size: 'b3',
        className: 'fw-normal',
    },
};

// ─── All Variations ──────────────────────────────────────────────

/**
 * All Variations
 * Shows all student tag badges organized by category
 */
export const AllVariations = () => (
    <div
        className="d-flex flex-column gap-4"
        style={{
            padding: 'var(--size-section-gap-lg)',
            backgroundColor: 'var(--color-surface-variant)',
            minHeight: '100vh'
        }}
    >
        <div>
            <h5 className="text-muted mb-2">Student Tags (PLUS Tags)</h5>
            <p className="text-muted small mb-0">
                Pill-shaped badges with signal icons used to label students across goal, engagement, and content categories.
            </p>
        </div>

        <div className="d-flex flex-wrap align-items-start" style={{ gap: 'var(--size-section-gap-lg)' }}>
            {/* Goal Category */}
            <div className="d-flex flex-column gap-3">
                <h6 className="text-muted small text-uppercase fw-bold m-0" style={{ letterSpacing: '0.5px', fontSize: '11px' }}>
                    Goal
                </h6>
                <div className="d-flex flex-column gap-2">
                    <div className="d-flex flex-column gap-1">
                        <span className="small text-muted">Positive</span>
                        <Badge text="Goal met" style="warning" size="b3" leadingVisual={positiveIcon} className="fw-normal" />
                    </div>
                    <div className="d-flex flex-column gap-1">
                        <span className="small text-muted">Negative</span>
                        <Badge text="Goal Not Met" style="warning" size="b3" leadingVisual={negativeIcon} className="fw-normal" />
                    </div>
                </div>
            </div>

            {/* Engagement Category */}
            <div className="d-flex flex-column gap-3">
                <h6 className="text-muted small text-uppercase fw-bold m-0" style={{ letterSpacing: '0.5px', fontSize: '11px' }}>
                    Engagement
                </h6>
                <div className="d-flex flex-column gap-2">
                    <div className="d-flex flex-column gap-1">
                        <span className="small text-muted">Positive</span>
                        <Badge text="Driven" style="warning" size="b3" leadingVisual={positiveIcon} className="fw-normal" />
                    </div>
                    <div className="d-flex flex-column gap-1">
                        <span className="small text-muted">Negative</span>
                        <Badge text="unengaged" style="warning" size="b3" leadingVisual={negativeIcon} className="fw-normal" />
                    </div>
                </div>
            </div>

            {/* Content Category */}
            <div className="d-flex flex-column gap-3">
                <h6 className="text-muted small text-uppercase fw-bold m-0" style={{ letterSpacing: '0.5px', fontSize: '11px' }}>
                    Content
                </h6>
                <div className="d-flex flex-column gap-2">
                    <div className="d-flex flex-column gap-1">
                        <span className="small text-muted">Positive</span>
                        <Badge text="Accomplished" style="warning" size="b3" leadingVisual={positiveIcon} className="fw-normal" />
                    </div>
                    <div className="d-flex flex-column gap-1">
                        <span className="small text-muted">Negative</span>
                        <Badge text="developing" style="warning" size="b3" leadingVisual={negativeIcon} className="fw-normal" />
                    </div>
                </div>
            </div>

            {/* Misc Category */}
            <div className="d-flex flex-column gap-3">
                <h6 className="text-muted small text-uppercase fw-bold m-0" style={{ letterSpacing: '0.5px', fontSize: '11px' }}>
                    Misc
                </h6>
                <div className="d-flex flex-column gap-2">
                    <div className="d-flex flex-column gap-1">
                        <span className="small text-muted">Overflow</span>
                        <Badge text="..." style="warning" size="b3" className="fw-normal" />
                    </div>
                </div>
            </div>
        </div>

        {/* Inline Layout Example */}
        <div className="d-flex flex-column gap-3">
            <h6 className="text-muted small text-uppercase fw-bold m-0" style={{ letterSpacing: '0.5px', fontSize: '11px' }}>
                Inline Layout (as shown in Figma)
            </h6>
            <div className="d-flex flex-wrap" style={{ gap: 'var(--size-element-gap-sm)' }}>
                <Badge text="Goal met" style="warning" size="b3" leadingVisual={positiveIcon} className="fw-normal" />
                <Badge text="Goal Not Met" style="warning" size="b3" leadingVisual={negativeIcon} className="fw-normal" />
            </div>
            <div className="d-flex flex-wrap" style={{ gap: 'var(--size-element-gap-sm)' }}>
                <Badge text="Driven" style="warning" size="b3" leadingVisual={positiveIcon} className="fw-normal" />
                <Badge text="unengaged" style="warning" size="b3" leadingVisual={negativeIcon} className="fw-normal" />
            </div>
            <div className="d-flex flex-wrap" style={{ gap: 'var(--size-element-gap-sm)' }}>
                <Badge text="Accomplished" style="warning" size="b3" leadingVisual={positiveIcon} className="fw-normal" />
                <Badge text="developing" style="warning" size="b3" leadingVisual={negativeIcon} className="fw-normal" />
                <Badge text="..." style="warning" size="b3" className="fw-normal" />
            </div>
        </div>
    </div>
);
