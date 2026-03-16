import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { linkTo } from '@storybook/addon-links';
import './StorybookAIAgent.scss';
import { extractStoryIndex, findBestMatch } from './SmartNavigation';

/* ─── Inline SVG Icons ─── */
/* Logo icon: exact SVG from Figma (PLUS AI Prototyping Tool) */
const Icons = {
    Sparkles: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 29" fill="none" style={{ width: '100%', height: '100%' }}>
            <path
                d="M12.5784 2.3592C12.632 2.06289 12.7841 1.79528 13.0086 1.60269C13.233 1.41011 13.5155 1.30469 13.8072 1.30469C14.0989 1.30469 14.3814 1.41011 14.6058 1.60269C14.8302 1.79528 14.9824 2.06289 15.0359 2.3592L16.3497 9.53828C16.443 10.0487 16.683 10.5182 17.0385 10.8855C17.3939 11.2527 17.8482 11.5008 18.3422 11.5972L25.2897 12.9547C25.5764 13.0101 25.8354 13.1673 26.0218 13.3992C26.2081 13.6311 26.3102 13.923 26.3102 14.2244C26.3102 14.5259 26.2081 14.8178 26.0218 15.0497C25.8354 15.2816 25.5764 15.4388 25.2897 15.4942L18.3422 16.8517C17.8482 16.9481 17.3939 17.1962 17.0385 17.5634C16.683 17.9307 16.443 18.4002 16.3497 18.9106L15.0359 26.0897C14.9824 26.386 14.8302 26.6536 14.6058 26.8462C14.3814 27.0388 14.0989 27.1442 13.8072 27.1442C13.5155 27.1442 13.233 27.0388 13.0086 26.8462C12.7841 26.6536 12.632 26.386 12.5784 26.0897L11.2647 18.9106C11.1714 18.4002 10.9313 17.9307 10.5759 17.5634C10.2205 17.1962 9.76612 16.9481 9.27218 16.8517L2.32469 15.4942C2.03795 15.4388 1.77896 15.2816 1.59259 15.0497C1.40622 14.8178 1.3042 14.5259 1.3042 14.2244C1.3042 13.923 1.40622 13.6311 1.59259 13.3992C1.77896 13.1673 2.03795 13.0101 2.32469 12.9547L9.27218 11.5972C9.76612 11.5008 10.2205 11.2527 10.5759 10.8855C10.9313 10.5182 11.1714 10.0487 11.2647 9.53828L12.5784 2.3592Z"
                stroke="currentColor"
                strokeWidth="2.60823"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    ),
    Close: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
    Minimize: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    ),
    Send: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
    ),
    // Quick‐action icons
    Analyze: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    ),
    Explain: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
    ),
    Navigate: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="3 11 22 2 13 21 11 13 3 11" />
        </svg>
    ),
    Skills: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="5" /><path d="M3 21v-2a7 7 0 0 1 7-7h4a7 7 0 0 1 7 7v2" />
        </svg>
    ),
    /* FAB when panel is closed: star + badge lines + dot */
    FabClosed: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 31" fill="none" style={{ width: '100%', height: '100%' }}>
            <path d="M13.7713 3.63654C13.8249 3.34024 13.977 3.07262 14.2014 2.88004C14.4258 2.68745 14.7083 2.58203 15.0001 2.58203C15.2918 2.58203 15.5743 2.68745 15.7987 2.88004C16.0231 3.07262 16.1752 3.34024 16.2288 3.63654L17.5425 10.8156C17.6359 11.326 17.8759 11.7955 18.2313 12.1628C18.5868 12.5301 19.0411 12.7781 19.535 12.8745L26.4825 14.2321C26.7693 14.2874 27.0283 14.4447 27.2146 14.6765C27.401 14.9084 27.503 15.2004 27.503 15.5018C27.503 15.8032 27.401 16.0952 27.2146 16.327C27.0283 16.5589 26.7693 16.7162 26.4825 16.7715L19.535 18.129C19.0411 18.2255 18.5868 18.4735 18.2313 18.8408C17.8759 19.2081 17.6359 19.6776 17.5425 20.188L16.2288 27.367C16.1752 27.6633 16.0231 27.931 15.7987 28.1235C15.5743 28.3161 15.2918 28.4215 15.0001 28.4215C14.7083 28.4215 14.4258 28.3161 14.2014 28.1235C13.977 27.931 13.8249 27.6633 13.7713 27.367L12.4576 20.188C12.3642 19.6776 12.1242 19.2081 11.7688 18.8408C11.4133 18.4735 10.959 18.2255 10.4651 18.129L3.51756 16.7715C3.23082 16.7162 2.97183 16.5589 2.78546 16.327C2.59909 16.0952 2.49707 15.8032 2.49707 15.5018C2.49707 15.2004 2.59909 14.9084 2.78546 14.6765C2.97183 14.4447 3.23082 14.2874 3.51756 14.2321L10.4651 12.8745C10.959 12.7781 11.4133 12.5301 11.7688 12.1628C12.1242 11.7955 12.3642 11.326 12.4576 10.8156L13.7713 3.63654Z" stroke="currentColor" strokeWidth="2.60823" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M25 2.58203V7.7487" stroke="currentColor" strokeWidth="2.60823" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M27.5 5.16797H22.5" stroke="currentColor" strokeWidth="2.60823" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 28.4167C6.38071 28.4167 7.49999 27.2601 7.49999 25.8333C7.49999 24.4066 6.38071 23.25 5 23.25C3.61929 23.25 2.5 24.4066 2.5 25.8333C2.5 27.2601 3.61929 28.4167 5 28.4167Z" stroke="currentColor" strokeWidth="2.60823" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    /* FAB when panel is open: chevron up */
    FabOpen: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" fill="none" style={{ width: '100%', height: '100%' }}>
            <path d="M7.5 11.25L15 18.75L22.5 11.25" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    /* Avatar A for Ashley */
    Avatar: () => (
        <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '100%', height: '100%' }}>
            <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fontSize="15" fontWeight="bold" fill="var(--color-primary-text)">A</text>
        </svg>
    ),
};

/* ─── Logo Container Component ─── */
/* Figma 177-41531: multi-blob gradient background (6 blurred shapes) */
const LogoBgFigma = ({ id }) => {
    const f0 = `${id}-f0`;
    const f1 = `${id}-f1`;
    const f2 = `${id}-f2`;
    const f3 = `${id}-f3`;
    const f4 = `${id}-f4`;
    const f5 = `${id}-f5`;
    const filterBlur = (
        <>
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feGaussianBlur stdDeviation="19.2" result="effect1_foregroundBlur_177_41531" />
        </>
    );
    return (
        <svg className="sb-ai-agent__logo-bg" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
            <g filter={`url(#${f0})`}>
                <path d="M49.5538 36.9968C59.1224 46.5652 59.1224 62.079 49.5538 71.6475C39.9853 81.2161 24.4715 81.2161 14.903 71.6475C5.3344 62.079 5.3344 46.5652 14.903 36.9968C24.4715 27.4282 39.9853 27.4282 49.5538 36.9968Z" fill="#FFDEA0" />
            </g>
            <g filter={`url(#${f1})`}>
                <path d="M49.5538 36.9968C59.1224 46.5652 59.1224 62.079 49.5538 71.6475C39.9853 81.2161 24.4715 81.2161 14.903 71.6475C5.3344 62.079 5.3344 46.5652 14.903 36.9968C24.4715 27.4282 39.9853 27.4282 49.5538 36.9968Z" fill="#FFE17A" />
            </g>
            <g filter={`url(#${f2})`}>
                <path d="M31.1452 -13.1547C42.6472 -1.65267 42.6472 16.9958 31.1452 28.4978C19.6432 39.9998 0.994739 39.9998 -10.5073 28.4978C-22.0093 16.9958 -22.0093 -1.65269 -10.5073 -13.1547C0.994739 -24.6568 19.6432 -24.6568 31.1452 -13.1547Z" fill="#FFE17A" />
            </g>
            <g filter={`url(#${f3})`}>
                <path d="M79.2166 76.03C89.9725 65.2741 89.9725 47.8353 79.2166 37.0793C68.4606 26.3234 51.0218 26.3234 40.2659 37.0793C29.5099 47.8353 29.5099 65.2741 40.2659 76.03C51.0218 86.786 68.4606 86.786 79.2166 76.03Z" fill="#B3F1BF" />
            </g>
            <g filter={`url(#${f4})`}>
                <path d="M36.6739 28.5701C49.6059 41.5021 49.6059 62.469 36.6739 75.401C23.742 88.3331 2.77499 88.3331 -10.157 75.401C-23.089 62.469 -23.089 41.5021 -10.157 28.5701C2.77499 15.6381 23.742 15.6381 36.6739 28.5701Z" fill="#FFD9E4" />
            </g>
            <g filter={`url(#${f5})`}>
                <path d="M79.9752 22.6619C91.7259 10.9112 91.6755 -8.19088 79.8626 -20.0038C68.0497 -31.8167 48.9476 -31.8671 37.1969 -20.1164C25.4462 -8.36568 25.4967 10.7364 37.3096 22.5493C49.1224 34.3622 68.2245 34.4126 79.9752 22.6619Z" fill="#84CFFF" />
            </g>
            <defs>
                <filter id={f0} x="-30.6734" y="-8.57969" width="125.803" height="125.804" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    {filterBlur}
                </filter>
                <filter id={f1} x="-30.6734" y="-8.57969" width="125.803" height="125.804" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    {filterBlur}
                </filter>
                <filter id={f2} x="-57.5338" y="-60.1813" width="135.706" height="135.706" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    {filterBlur}
                </filter>
                <filter id={f3} x="-6.20127" y="-9.38828" width="131.885" height="131.886" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    {filterBlur}
                </filter>
                <filter id={f4} x="-58.256" y="-19.5289" width="143.029" height="143.03" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    {filterBlur}
                </filter>
                <filter id={f5} x="-9.98301" y="-67.2984" width="137.138" height="137.14" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    {filterBlur}
                </filter>
            </defs>
        </svg>
    );
};

const LogoContainer = ({ size = 'default', className = '', variant = 'default' }) => {
    const id = React.useId().replace(/:/g, '');
    const sizeMap = {
        default: { width: 31.9, height: 31.9 },
        large: { width: 64, height: 64 }
    };
    const { width, height } = sizeMap[size];
    const IconComponent = variant === 'fab-open' ? Icons.FabOpen : Icons.FabClosed;
    return (
        <div className={`sb-ai-agent__logo-container ${className}`} style={{ width: `${width}px`, height: `${height}px` }}>
            <LogoBgFigma id={id} />
            <div className="sb-ai-agent__logo-icon">
                <IconComponent />
            </div>
        </div>
    );
};

/* ─── Quick action definitions ─── */
const QUICK_ACTIONS = [
    { id: 'usage', label: 'Component Usage Guide', aliases: ['usage guide', 'component usage guide'], Icon: Icons.Analyze, color: 'var(--color-primary-text)', bg: 'var(--color-primary-container)' },
    { id: 'explain', label: 'Explain This Screen', aliases: ['explain this screen', 'explain the screen', 'explain screen'], Icon: Icons.Explain, color: 'var(--color-mastering-content-text)', bg: 'var(--color-mastering-content-container)' },
    { id: 'find', label: 'Smart Navigation', aliases: ['smart navigation'], Icon: Icons.Navigate, color: 'var(--color-warning-text)', bg: 'var(--color-warning-container)' },
    { id: 'skills', label: 'Agent Modes', aliases: ['agent modes'], Icon: Icons.Skills, color: 'var(--color-advocacy-text)', bg: 'var(--color-advocacy-container)' },
];

/* Levenshtein distance for typo-tolerant keyword match (max length ~20). */
function levenshtein(a, b) {
    const an = a.length;
    const bn = b.length;
    if (an === 0) return bn;
    if (bn === 0) return an;
    let prev = Array.from({ length: bn + 1 }, (_, i) => i);
    for (let i = 1; i <= an; i++) {
        const curr = [i];
        for (let j = 1; j <= bn; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
        }
        prev = curr;
    }
    return prev[bn];
}

/** Match typed text to a quick action by label/aliases; tolerates minor typos. Returns action id or null. */
function matchQuickActionByKeyword(text) {
    const raw = (text || '').trim();
    if (!raw) return null;
    const user = raw.toLowerCase().replace(/\s+/g, ' ').trim();
    const userWords = user.split(/\s+/).filter(Boolean);

    for (const action of QUICK_ACTIONS) {
        const label = action.label.toLowerCase();
        const labelWords = label.split(/\s+/).filter(Boolean);
        const aliases = (action.aliases || []).map(a => a.toLowerCase());

        /* Exact match (full label or user text equals label) */
        if (user === label) return action.id;
        if (label.includes(user) && user.length >= 6) return action.id;
        if (user.includes(label)) return action.id;

        /* Alias match: "usage guide", "explain screen", "explain the screen", etc. */
        for (const alias of aliases) {
            if (user === alias) return action.id;
            if (alias.includes(user) && user.length >= 5) return action.id;
            if (user.includes(alias)) return action.id;
            /* Typo-tolerant alias: same word count, each alias word matches a distinct user word (exact or edit distance ≤2) */
            const aliasWords = alias.split(/\s+/).filter(Boolean);
            if (aliasWords.length === userWords.length && aliasWords.length >= 1) {
                const usedIdx = new Set();
                const allMatch = aliasWords.every(aw => {
                    const i = userWords.findIndex((uw, idx) => {
                        if (usedIdx.has(idx)) return false;
                        if (aw === uw) return true;
                        if (Math.abs(aw.length - uw.length) > 2) return false;
                        return levenshtein(aw, uw) <= 2;
                    });
                    if (i === -1) return false;
                    usedIdx.add(i);
                    return true;
                });
                if (allMatch) return action.id;
            }
        }

        /* Typo-tolerant: every significant label word has a matching user word (exact or 1–2 char edit) */
        const significantLabelWords = labelWords.filter(w => w.length > 2);
        if (significantLabelWords.length === 0) continue;
        const allMatch = significantLabelWords.every(lw => {
            return userWords.some(uw => {
                if (lw === uw) return true;
                if (Math.abs(lw.length - uw.length) > 2) return false;
                return levenshtein(lw, uw) <= 2;
            });
        });
        if (allMatch && userWords.length >= 1) return action.id;
    }
    return null;
}

/* ─── Usage Guide: when to use which component ─── */
const USAGE_GUIDE = [
    {
        queries: ['modal vs cards', 'cards vs modal', 'when do i use modal vs cards', 'when to use modal vs cards', 'modal or cards'],
        label: 'Modal vs Cards',
        answer: (
            <div>
                <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>Modal vs Cards</p>
                <p style={{ marginBottom: 6 }}><strong>Use Modal when:</strong> You need an overlay that blocks the rest of the page — the user must complete or dismiss something (confirmations, forms, important decisions). Content is a focused task or dialog.</p>
                <p style={{ marginBottom: 0 }}><strong>Use Card when:</strong> You're grouping content in the page layout (no overlay). Cards are for sections, product tiles, profile blocks, or any chunk of related content that stays in the flow of the page.</p>
            </div>
        )
    },
    {
        queries: ['modal vs popover', 'popover vs modal', 'when to use modal', 'when to use popover', 'modal or popover', 'when do i use modal', 'when should i use popover'],
        label: 'Modal vs Popover',
        answer: (
            <div>
                <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>Modal vs Popover</p>
                <p style={{ marginBottom: 6 }}><strong>Use Modal when:</strong> The user must complete or dismiss something before continuing (confirmations, forms, important decisions). Content is long or complex. You need a strong focus block.</p>
                <p style={{ marginBottom: 0 }}><strong>Use Popover when:</strong> Content is short and quick (a few options, small form). The user should keep context of the page. It’s optional or secondary (menus, filters, date pickers).</p>
            </div>
        )
    },
    {
        queries: ['when to use badge', 'when do i use badge', 'when should i use a badge', 'badge usage'],
        label: 'Badge',
        answer: (
            <div>
                <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>When to use Badge</p>
                <p style={{ marginBottom: 0 }}>Use <strong>Badge</strong> for status labels, counts, or small tags (e.g. “New”, “Success”, “3”). Use for inline status or categorization, not for primary actions — use <strong>Button</strong> for actions.</p>
            </div>
        )
    },
    {
        queries: ['dropdown vs listgroup', 'listgroup vs dropdown', 'when to use dropdown', 'when to use listgroup'],
        label: 'Dropdown vs ListGroup',
        answer: (
            <div>
                <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>Dropdown vs ListGroup</p>
                <p style={{ marginBottom: 6 }}><strong>Use Dropdown</strong> for action menus or selection that collapses (e.g. “More” menu, single/multi select that opens on click).</p>
                <p style={{ marginBottom: 0 }}><strong>Use ListGroup</strong> for a visible list of items or options (e.g. navigation list, always-visible options). No collapse — list is part of the layout.</p>
            </div>
        )
    }
];

/* ─── Component Guide: structured per-component (Purpose, When to use, When not, Variants, A11y) ─── */
const COMPONENT_GUIDE = {
    Modal: {
        purpose: 'Display content in a focused overlay that blocks interaction with the rest of the page.',
        whenToUse: ['Confirmations (e.g. delete, discard)', 'Forms that must be completed or dismissed', 'Important information that requires acknowledgment'],
        whenNotToUse: ['Optional or secondary content (use Popover)', 'Always-visible content (use Card or inline layout)'],
        variants: ['Default', 'Scrollable', 'Sizes: sm, lg, xl'],
        accessibility: 'Focus is trapped inside the modal. Ensure a visible focus ring and Escape to close. Use aria-modal and role="dialog".'
    },
    Card: {
        purpose: 'Container for related content and actions within the page layout.',
        whenToUse: ['Product listings and previews', 'Dashboard widgets', 'Grouping related content'],
        whenNotToUse: ['Blocking overlays or dialogs (use Modal)', 'Short contextual hints (use Tooltip or Popover)'],
        variants: ['Elevation levels', 'Interactive (hover effects)'],
        accessibility: 'If the card is interactive, use a focusable element and clear focus styles. Avoid nesting many interactive elements without clear structure.'
    },
    Badge: {
        purpose: 'Display status, counts, or small labels.',
        whenToUse: ['Notification counts', 'Status indicators (success, warning)', 'Category or type labels'],
        whenNotToUse: ['Primary actions (use Button)', 'Long text (use inline text or Alert)'],
        variants: ['Text badge', 'Counter badge', 'Dismissible badge', 'Styles: primary, success, danger, warning, info'],
        accessibility: 'Ensure sufficient contrast. For counts, consider screen reader text (e.g. "3 notifications").'
    },
    Button: {
        purpose: 'Trigger actions and submit forms.',
        whenToUse: ['Primary and secondary actions', 'Form submit/cancel', 'Navigation (as link-style button)'],
        whenNotToUse: ['Status or count (use Badge)', 'Navigation hierarchy (use Breadcrumb or NavTabs)'],
        variants: ['primary, secondary, tertiary, ghost, danger', 'Sizes: small, medium, large', 'With leading/trailing icon'],
        accessibility: 'Use a single focusable control. Ensure visible focus ring. For icon-only buttons, provide aria-label.'
    },
    Dropdown: {
        purpose: 'Display a menu of actions or options that opens on trigger.',
        whenToUse: ['Action menus (e.g. "More" menu)', 'Single or multi-select that collapses after choice'],
        whenNotToUse: ['Always-visible lists (use ListGroup)', 'Simple links (use links or NavTabs)'],
        variants: ['Click or hover trigger', 'With icons and dividers'],
        accessibility: 'Keyboard: Enter/Space to open, Arrow keys to move, Enter to select. Use aria-expanded and aria-haspopup.'
    },
    ListGroup: {
        purpose: 'Display lists of related content items in the layout.',
        whenToUse: ['Navigation lists', 'Always-visible options', 'Lists that are part of the page flow'],
        whenNotToUse: ['Collapsible menus (use Dropdown)', 'Single selection from many (consider Dropdown or Select)'],
        variants: ['Flush (no borders)', 'Horizontal layout', 'Items with active state'],
        accessibility: 'Use list semantics (ul/li or role="list"). For selectable items, support arrow keys and Enter.'
    },
    Pagination: {
        purpose: 'Navigate through pages of content.',
        whenToUse: ['Tables or lists split across pages', 'Search results', 'Any paged content'],
        whenNotToUse: ['Single-page content', 'Infinite scroll (no pagination component)'],
        variants: ['Numbered pages', 'Prev/Next only', 'With page size selector'],
        accessibility: 'Current page should be indicated (aria-current). Provide labels for prev/next (e.g. "Previous page").'
    },
    Alert: {
        purpose: 'Display contextual feedback messages for user actions.',
        whenToUse: ['Form validation messages', 'Success/error/info notifications', 'Banner-style system messages'],
        whenNotToUse: ['Blocking confirmations (use Modal)', 'Brief hints on hover (use Tooltip)'],
        variants: ['primary, secondary, success, danger, warning, info', 'Dismissible'],
        accessibility: 'Use role="alert" for critical messages. Ensure color is not the only indicator (use icon or text).'
    },
    Accordion: {
        purpose: 'Organize content into collapsible sections.',
        whenToUse: ['FAQs', 'Settings panels', 'Grouped information that does not need to be visible at once'],
        whenNotToUse: ['Single expandable block (use Collapse)', 'Navigation (use NavTabs or Breadcrumb)'],
        variants: ['Single or multiple sections open', 'Flush style'],
        accessibility: 'Use heading + expanded/collapsed state. Arrow keys to move between headers; Enter/Space to toggle.'
    },
    Tooltip: {
        purpose: 'Display brief hint text on hover or focus.',
        whenToUse: ['Icon buttons (clarify action)', 'Truncated text', 'Short contextual help'],
        whenNotToUse: ['Long content (use Popover)', 'Critical information (use Alert or inline text)'],
        variants: ['Placement: top, bottom, left, right'],
        accessibility: 'Trigger must be focusable. Tooltip should appear on focus for keyboard users. Avoid hover-only tooltips for critical info.'
    },
    Popover: {
        purpose: 'Display contextual information in a floating container.',
        whenToUse: ['Short forms or options (filters, date picker)', 'Additional details without leaving the page'],
        whenNotToUse: ['Blocking dialogs (use Modal)', 'Single-line hints (use Tooltip)'],
        variants: ['With title', 'Placement options'],
        accessibility: 'Focus moves to popover when open. Escape to close. Ensure focus is not trapped if popover is non-modal.'
    },
    Progress: {
        purpose: 'Display progress toward completion.',
        whenToUse: ['Upload/download progress', 'Multi-step flows', 'Loading or processing state'],
        whenNotToUse: ['Indeterminate loading (use Spinner)', 'Single status (use Badge)'],
        variants: ['Percentage label', 'Color variant'],
        accessibility: 'Use role="progressbar", aria-valuenow, aria-valuemin, aria-valuemax. Provide accessible label.'
    },
    Spinner: {
        purpose: 'Loading indicator for async operations.',
        whenToUse: ['Button or inline loading state', 'Page or section loading'],
        whenNotToUse: ['Determinate progress (use Progress)', 'Content that appears quickly (avoid unnecessary spinner)'],
        variants: ['border, grow, rotating', 'Size: sm or default'],
        accessibility: 'Use aria-busy or aria-live. Prefer "Loading..." text with spinner for screen readers.'
    }
};

function renderSingleComponentGuide(entry, guide) {
    const label = entry.label;
    const g = guide || COMPONENT_GUIDE[label];
    if (!g) {
        return <p><strong>{label}</strong> is in Storybook. Use the Component Usage Guide for when to use it.</p>;
    }
    const list = (arr) => (Array.isArray(arr) ? arr : [arr]).filter(Boolean).map((item, i) => <li key={i}>{item}</li>);
    return (
        <div style={{ fontSize: 13 }}>
            <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{label}</p>
            <p style={{ marginBottom: 4, fontWeight: 600 }}>Purpose</p>
            <p style={{ marginBottom: 8 }}>{g.purpose}</p>
            <p style={{ marginBottom: 4, fontWeight: 600 }}>When to use</p>
            <ul style={{ margin: '0 0 8px 0', paddingLeft: 20 }}>{list(g.whenToUse)}</ul>
            <p style={{ marginBottom: 4, fontWeight: 600 }}>When not to use</p>
            <ul style={{ margin: '0 0 8px 0', paddingLeft: 20 }}>{list(g.whenNotToUse)}</ul>
            {g.variants && g.variants.length > 0 && (
                <>
                    <p style={{ marginBottom: 4, fontWeight: 600 }}>Variants</p>
                    <ul style={{ margin: '0 0 8px 0', paddingLeft: 20 }}>{list(g.variants)}</ul>
                </>
            )}
            <p style={{ marginBottom: 4, fontWeight: 600 }}>Accessibility notes</p>
            <p style={{ marginBottom: 0 }}>{g.accessibility}</p>
        </div>
    );
}

function renderComparisonGuide(entryA, entryB) {
    const gA = COMPONENT_GUIDE[entryA.label];
    const gB = COMPONENT_GUIDE[entryB.label];
    const purpose = (e, g) => g ? g.purpose : `${e.label} is in Storybook.`;
    return (
        <div style={{ fontSize: 13 }}>
            <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>{entryA.label} vs {entryB.label}</p>
            <p style={{ marginBottom: 4, fontWeight: 600 }}>{entryA.label}</p>
            <p style={{ marginBottom: 8 }}>{purpose(entryA, gA)}</p>
            <p style={{ marginBottom: 4, fontWeight: 600 }}>{entryB.label}</p>
            <p style={{ marginBottom: 0 }}>{purpose(entryB, gB)}</p>
        </div>
    );
}

function getCurrentStoryId() {
    try {
        if (typeof window === 'undefined') return null;
        const sel = window.__STORYBOOK_PREVIEW__?.selectionStore?.selection;
        if (sel?.storyId) return sel.storyId;
        const q = window.location.search || '';
        const m = q.match(/[?&]path=(?:[^&]*\/story\/)?([^&]+)/);
        if (m) return m[1];
    } catch (_) { }
    return null;
}



function hasUsageIntent(text) {
    const t = text.toLowerCase().trim();
    return /\b(when to use|when do i use|when should i use|which component|vs\.?| or |usage|which to use)\b/i.test(t) ||
        /^.+\s+vs\s+.+$/i.test(t);
}

function scoreUsageMatch(query, entry) {
    const q = normalizeForMatch(query);
    let best = 0;
    for (const term of entry.queries) {
        const t = normalizeForMatch(term);
        if (t === q || q === t) return 100;
        if (q.includes(t) || t.includes(q)) best = Math.max(best, 85);
        const qWords = q.split(/\s+/).filter(Boolean);
        const tWords = t.split(/\s+/).filter(Boolean);
        const matchCount = qWords.filter(w => t.includes(w) || tWords.some(tw => tw.includes(w) || w.includes(tw))).length;
        if (matchCount >= 2) best = Math.max(best, 70);
        if (matchCount >= 1) best = Math.max(best, 50);
    }
    return best;
}

function matchUsageGuide(text) {
    const q = text.toLowerCase().trim().replace(/\s+/g, ' ');
    if (!q || q.length < 3) return null;
    const withScores = USAGE_GUIDE.map(entry => ({ entry, score: scoreUsageMatch(q, entry) })).filter(x => x.score > 0);
    if (withScores.length === 0) return null;
    withScores.sort((a, b) => b.score - a.score);
    return withScores[0].entry;
}

/* ─── Smart Navigation: index (storyId, storyName, category, search terms + synonyms) ─── */


/**
 * Parse user message for component-guide intent. Returns { type: 'single' | 'comparison' | 'context', tokens: string[] } or null.
 */
function parseComponentGuideQuery(text) {
    const t = text.trim();
    if (!t) return null;
    const lower = t.toLowerCase();

    /* "What does this do?" / "Explain this" → context */
    if (/\b(what does this do|explain this|what is this)\b/i.test(lower)) return { type: 'context', tokens: [] };

    /* Helper to clean up a token: strip leading articles + trailing punctuation */
    const cleanToken = (s) => s
        .replace(/^(a |an |the )/i, '')
        .replace(/[?!"'".]+$/, '')
        .trim();

    /* "X vs Y" or "X or Y" */
    const vsMatch = t.match(/\s+vs\.?\s+/i) || t.match(/\s+or\s+/i);
    if (vsMatch) {
        const [left, right] = t.split(vsMatch[0]).map(s => cleanToken(s)).filter(Boolean);
        if (left && right) return { type: 'comparison', tokens: [left, right] };
    }

    /* "difference between X and Y" */
    const diffMatch = lower.match(/difference between (.+?) and (.+)/);
    if (diffMatch) {
        const a = cleanToken(diffMatch[1]);
        const b = cleanToken(diffMatch[2]);
        if (a && b) return { type: 'comparison', tokens: [a, b] };
    }

    /* Single: "what does Modal do?", "Explain Badge", "What is Pagination?", "when should i use Dropdown?" */
    const singleStem = cleanToken(
        lower
            .replace(/^(what does|explain|what is|when should i use|when to use|when do i use)\s+/i, '')
            .replace(/\s+(do|mean)\s*[?.]?$/i, '')
    );
    if (singleStem && singleStem !== 'this') return { type: 'single', tokens: [singleStem] };

    /* "when do i use X vs Y" already handled above; "when to use X" */
    const whenMatch = lower.match(/when (?:to|do i|should i) use\s+(.+)/);
    if (whenMatch) {
        const rest = cleanToken(whenMatch[1]);
        if (rest.includes(' vs ') || rest.includes(' or ')) {
            const parts = rest.split(/\s+vs\.?\s+|\s+or\s+/).map(s => cleanToken(s)).filter(Boolean);
            if (parts.length >= 2) return { type: 'comparison', tokens: parts };
        }
        if (rest) return { type: 'single', tokens: [rest] };
    }

    return null;
}

function hasComponentGuideIntent(text) {
    const t = text.toLowerCase().trim();
    return /\b(what does|explain|what is|when should i use|when to use|when do i use|difference between)\b/i.test(t) ||
        /\s+vs\.?\s+/.test(t) ||
        /\bwhat does this do\b/i.test(t) ||
        /\bexplain this\b/i.test(t);
}

function hasNavigationIntent(text) {
    const t = text.toLowerCase().trim();
    return /\b(where|open|go to|show|find|take me to|navigate to)\b/i.test(t);
}

function hasShortcutIntent(text) {
    const t = text.toLowerCase().trim();
    return /^shortcuts?$/.test(t) || /^keyboard shortcuts?$/.test(t) || /what shortcuts do you have/.test(t);
}

function extractSearchQuery(text) {
    let q = text.toLowerCase().trim()
        .replace(/\b(where are the|where is the|where's the|open|go to|show me|show|find|take me to|take me)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
    if (!q) q = text.toLowerCase().trim();
    return q;
}

function normalizeForMatch(str) {
    return str.toLowerCase().replace(/\s+/g, ' ').trim();
}



/* Keyboard shortcuts help block — clean, scannable; Mac (⌘) and Windows (Ctrl). */
const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
const MOD = isMac ? '⌘' : 'Ctrl';
const ShortcutsHelpContent = () => (
    <div className="sb-ai-agent__shortcuts-block">
        <div className="sb-ai-agent__shortcuts-title">Keyboard Shortcuts</div>
        <table className="sb-ai-agent__shortcuts-table">
            <tbody>
                <tr><td className="sb-ai-agent__shortcuts-key">{MOD} + /</td><td>Toggle/Close AI Agent</td></tr>
                <tr><td className="sb-ai-agent__shortcuts-key">{MOD} + Shift + /</td><td>Hide AI (Focus Mode)</td></tr>
            </tbody>
        </table>
    </div>
);

/* Intro only when user clicks Smart Navigation button — no "activated", seamless. */
const SmartNavIntroMessage = () => (
    <div className="sb-ai-agent__smart-nav-intro">
        <p style={{ marginBottom: 12 }}>Search for any component, page, variant, or token — I'll take you there instantly.</p>
        <p style={{ marginBottom: 6, fontSize: 13 }}>Examples:</p>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>
            <li>“Where are the cards?”</li>
            <li>“Open destructive modal”</li>
            <li>“Go to Training Progress page”</li>
            <li>“Show spacing tokens”</li>
            <li>“Buttons”</li>
        </ul>
    </div>
);

/* Intro when user clicks Usage Guide — example usage questions. */
const UsageGuideIntroMessage = () => (
    <div className="sb-ai-agent__smart-nav-intro">
        <p style={{ marginBottom: 12 }}>Not sure which component to pick? Ask in your own words and I'll suggest the right one.</p>
        <p style={{ marginBottom: 6, fontSize: 13 }}>Examples:</p>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>
            <li>"When do I use Modal vs Cards?"</li>
            <li>"When should I use a Badge?"</li>
        </ul>
    </div>
);

/* Fallback message with quick action buttons repeated so user can pick without scrolling */
const FallbackWithQuickActions = ({ text, onQuickAction }) => (
    <div>
        <p style={{ marginBottom: 12 }}>I couldn&apos;t understand your request: &quot;<em>{text}</em>&quot;. Try rephrasing or use one of the quick actions below.</p>
        <div className="sb-ai-agent__quick-actions">
            {QUICK_ACTIONS.map(a => (
                <button key={a.id} type="button" className="sb-ai-agent__quick-btn" onClick={() => onQuickAction(a.id)}>
                    <div className="sb-ai-agent__quick-icon" style={{ background: a.bg }}>
                        <span style={{ color: a.color }}>
                            <a.Icon />
                        </span>
                    </div>
                    <span className="sb-ai-agent__quick-label">{a.label}</span>
                </button>
            ))}
        </div>
    </div>
);

/* Multi-match list: click or keyboard to select */
const NavMatchList = ({ matches, selectedIndex, onSelect }) => (
    <div className="sb-ai-agent__nav-matches">
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {matches.map((entry, i) => (
                <li key={`${entry.storyId}-${i}`}>
                    <button
                        type="button"
                        className={`sb-ai-agent__nav-match-btn ${i === selectedIndex ? 'sb-ai-agent__nav-match-btn--selected' : ''}`}
                        onClick={() => onSelect(entry)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onSelect(entry); } }}
                    >
                        <span style={{ fontWeight: 600 }}>{entry.label}</span>
                        <span style={{ fontSize: 12, color: 'var(--color-on-surface-variant)' }}> ({entry.category})</span>
                    </button>
                </li>
            ))}
        </ul>
        <p style={{ fontSize: 12, color: 'var(--color-on-surface-variant)', marginTop: 8 }}>Click or use ↑↓ + Enter to open.</p>
    </div>
);

/* ─── Helper: build response JSX ─── */
const buildResponse = (actionId, pageContext) => {
    switch (actionId) {
        case 'explain':
            return (
                <div>
                    <p style={{ fontWeight: 600, marginBottom: 8 }}>🧩 What's on this screen</p>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                        <li><strong>NavTabs</strong> — horizontal tab navigation (4 tabs)</li>
                        <li><strong>ButtonGroup</strong> — toggle "By Tutor / By Lesson"</li>
                        <li><strong>OverviewCard</strong> — stat cards with donut charts</li>
                        <li><strong>ExportSearchFilterBar</strong> — search + filter + export row</li>
                        <li><strong>TutorsTrainingProgressTable</strong> — data table with avatar, badges</li>
                        <li><strong>Pagination</strong> — icon‑style pagination</li>
                    </ul>
                </div>
            );

        case 'find':
            return (
                <div>
                    <p>Smart navigation: type where to go, e.g. <strong>open buttons</strong>, <strong>show modal</strong>, <strong>go to training progress</strong>.</p>
                </div>
            );

        case 'skills':
            return (
                <div>
                    <p style={{ fontWeight: 600, marginBottom: 8 }}>🎯 The 6 Main Modes</p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        <li style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ background: 'var(--color-primary-container)', color: 'var(--color-on-primary-container)', borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600, minWidth: 24, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>1</span>
                            📚 <strong>Learning</strong> — Understand what exists and how it works
                        </li>
                        <li style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ background: 'var(--color-warning-container)', color: 'var(--color-on-warning-container)', borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600, minWidth: 24, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>2</span>
                            🔧 <strong>Maintaining</strong> — Update the design system itself
                        </li>
                        <li style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ background: 'var(--color-relationship-container)', color: 'var(--color-on-relationship-container)', borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600, minWidth: 24, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>3</span>
                            💡 <strong>Consulting</strong> — Early structure-first concepting
                        </li>
                        <li style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ background: 'var(--color-advocacy-container)', color: 'var(--color-on-advocacy-container)', borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600, minWidth: 24, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>4</span>
                            🔄 <strong>Iteration</strong> — Explore 3-5 distinct options
                        </li>
                        <li style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ background: 'var(--color-technology-tools-container)', color: 'var(--color-on-technology-tools-container)', borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600, minWidth: 24, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>5</span>
                            🎨 <strong>Prototyping</strong> — High-fidelity exploratory prototypes
                        </li>
                        <li style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ background: 'var(--color-secondary-container)', color: 'var(--color-on-secondary-container)', borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600, minWidth: 24, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>6</span>
                            🏗️ <strong>Finalization</strong> — Production-ready code
                        </li>
                    </ul>
                </div>
            );

        default:
            return <p>I'm a demo agent. Try one of the quick actions or ask about a component!</p>;
    }
};

/* ─── Main Component ─── */
/** States: open (panel visible), minimized (panel closed, FAB visible), hidden (nothing visible; ⌘+/ restores to minimized) */
const CLOSE_PANEL_AFTER_NAV = true; // optional: minimize panel after navigating

const PANEL_MIN_WIDTH = 320;
const PANEL_MAX_WIDTH = 1555;
const PANEL_MIN_HEIGHT = 480;
const PANEL_MAX_HEIGHT = 822;
const PANEL_DEFAULT_WIDTH = 528.7;
const PANEL_DEFAULT_HEIGHT = 560;

const StorybookAIAgent = ({ pageContext = 'Tutor Training Progress Page', userName = 'Ashley' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isHidden, setIsHidden] = useState(false);
    const [aiMode, setAiMode] = useState(() => localStorage.getItem('PLUS_AI_MODE') || null);
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('PLUS_AI_API_KEY') || '');
    const [tempKey, setTempKey] = useState(apiKey);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [navMatches, setNavMatches] = useState([]);
    const [selectedNavIndex, setSelectedNavIndex] = useState(0);
    const [panelSize, setPanelSize] = useState({ width: PANEL_DEFAULT_WIDTH, height: PANEL_DEFAULT_HEIGHT });
    const [storyIndex, setStoryIndex] = useState([]);

    /* Refs */
    const inputRef = useRef(null);
    const bodyRef = useRef(null);
    const resizeStartRef = useRef(null);

    /* Initialize Smart Navigation Index */
    useEffect(() => {
        // Allow Storybook to initialize
        const timer = setTimeout(async () => {
            const idx = await extractStoryIndex();
            setStoryIndex(idx);
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    /* Auto‑scroll */
    useEffect(() => {
        if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }, [messages, isTyping]);

    /* Keyboard shortcuts: ⌘+/ toggle panel, ⌘+Shift+/ hide. */
    useEffect(() => {
        const handler = (e) => {
            const mod = e.metaKey || e.ctrlKey;
            if (!mod || e.key !== '/') return;
            if (e.shiftKey) {
                e.preventDefault();
                setIsHidden(true);
                setIsOpen(false);
                return;
            }
            e.preventDefault();
            if (isHidden) {
                setIsHidden(false);
                setIsOpen(false);
            } else {
                setIsOpen(p => !p);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isHidden]);

    /* Resize panel from top-left handle */
    const handleResizeStart = (e) => {
        e.preventDefault();
        const startX = e.clientX;
        const startY = e.clientY;
        resizeStartRef.current = { startX, startY, width: panelSize.width, height: panelSize.height };
        const onMove = (e2) => {
            if (!resizeStartRef.current) return;
            const dx = resizeStartRef.current.startX - e2.clientX;
            const dy = resizeStartRef.current.startY - e2.clientY;
            const newWidth = Math.min(PANEL_MAX_WIDTH, Math.max(PANEL_MIN_WIDTH, resizeStartRef.current.width + dx));
            const newHeight = Math.min(PANEL_MAX_HEIGHT, Math.max(PANEL_MIN_HEIGHT, resizeStartRef.current.height + dy));
            setPanelSize({ width: newWidth, height: newHeight });
        };
        const onUp = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            resizeStartRef.current = null;
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    };

    /* Arrow keys + Enter when multiple nav matches are shown */
    useEffect(() => {
        if (navMatches.length === 0) return;
        const handler = (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedNavIndex(i => (i + 1) % navMatches.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedNavIndex(i => (i - 1 + navMatches.length) % navMatches.length);
            } else if (e.key === 'Enter') {
                const entry = navMatches[selectedNavIndex];
                if (entry) {
                    e.preventDefault();
                    linkTo(entry.storyId, entry.storyName)();
                    setNavMatches([]);
                    if (CLOSE_PANEL_AFTER_NAV) setIsOpen(false);
                }
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [navMatches, selectedNavIndex]);

    /* Typing simulation */
    const respond = (content) => {
        setIsTyping(true);
        setTimeout(() => { setIsTyping(false); setMessages(p => [...p, { role: 'bot', content }]); }, 900);
    };

    /* Match free‑text to an action (for non-navigation queries) */
    const matchAction = (text) => {
        const t = text.toLowerCase();
        if (t.includes('explain')) return 'explain';
        if (t.includes('skill')) return 'skills';
        return null;
    };

    const navigateToEntry = (entry) => {
        linkTo(entry.storyId, entry.storyName)();
        setNavMatches([]);
        if (CLOSE_PANEL_AFTER_NAV) setIsOpen(false);
    };

    /* ── GPT API call ── */
    const fetchAIResponse = async (feature, userInput, context) => {
        setIsTyping(true);
        try {
            const response = await fetch('http://localhost:3001/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ feature, userInput, context, apiKey: aiMode === 'full' ? apiKey : null })
            });
            const data = await response.json();
            setIsTyping(false);

            if (data.error) {
                setMessages(p => [...p, { role: 'bot', content: <p style={{ color: 'var(--color-error)' }}>{data.error}</p> }]);
                return;
            }

            if (data.intent === 'navigate') {
                // GPT extracted a navigation target — run local fuzzy match
                if (data.target) {
                    const matches = findBestMatch(data.target, storyIndex).map(m => m.entry);
                    if (matches.length === 1) {
                        navigateToEntry(matches[0]);
                        setMessages(p => [...p, { role: 'bot', content: <p>Found <strong>{matches[0].label}</strong> in {matches[0].category}. Opening it now…</p> }]);
                    } else if (matches.length > 1) {
                        const limit = 5;
                        setNavMatches(matches.slice(0, limit));
                        setSelectedNavIndex(0);
                        const msg = matches.length > limit
                            ? `I found ${matches.length} matches. Here are the top ${limit}:`
                            : `I found ${matches.length} matches:`;
                        setMessages(p => [...p, { role: 'bot', content: { type: 'nav-picker', text: msg } }]);
                    } else {
                        setMessages(p => [...p, { role: 'bot', content: <p>Nothing found for "{data.target}". Try a different keyword.</p> }]);
                    }
                } else {
                    setMessages(p => [...p, { role: 'bot', content: <p>I'm not sure what you want to navigate to. Try something like "go to button" or "show modal".</p> }]);
                }
            } else if (data.intent === 'component_usage') {
                setMessages(p => [...p, {
                    role: 'bot', content: (
                        <div style={{ fontSize: 13 }}>
                            <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{Array.isArray(data.components) ? data.components.join(' vs ') : 'Component Guide'}</p>
                            <p style={{ marginBottom: 4, fontWeight: 600 }}>Purpose</p>
                            <p style={{ marginBottom: 8 }}>{data.purpose}</p>
                            <p style={{ marginBottom: 4, fontWeight: 600 }}>When to use</p>
                            <ul style={{ margin: '0 0 8px 0', paddingLeft: 20 }}>
                                {Array.isArray(data.when_to_use) && data.when_to_use.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                            <p style={{ marginBottom: 4, fontWeight: 600 }}>When not to use</p>
                            <ul style={{ margin: '0 0 8px 0', paddingLeft: 20 }}>
                                {Array.isArray(data.when_not_to_use) && data.when_not_to_use.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                            {Array.isArray(data.variants) && data.variants.length > 0 && (
                                <>
                                    <p style={{ marginBottom: 4, fontWeight: 600 }}>Variants</p>
                                    <ul style={{ margin: '0 0 8px 0', paddingLeft: 20 }}>
                                        {data.variants.map((item, i) => <li key={i}>{item}</li>)}
                                    </ul>
                                </>
                            )}
                            {data.tip && (
                                <p style={{ marginTop: 8, padding: '6px 10px', background: 'var(--color-primary-container)', borderRadius: 6, fontSize: 12 }}>
                                    💡 <strong>Tip:</strong> {data.tip}
                                </p>
                            )}
                        </div>
                    )
                }]);

            } else if (data.intent === 'screen_explain') {
                setMessages(p => [...p, {
                    role: 'bot', content: (
                        <div>
                            <p style={{ fontWeight: 600, marginBottom: 8 }}>🧩 {data.screen_name || 'Screen Analysis'}</p>
                            <p style={{ marginBottom: 8 }}>{data.purpose}</p>
                            <p style={{ fontWeight: 600, marginBottom: 4 }}>Structure:</p>
                            <ul style={{ margin: 0, paddingLeft: 20 }}>
                                {Array.isArray(data.structure) && data.structure.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                            <p style={{ fontWeight: 600, marginTop: 8, marginBottom: 4 }}>Components Used:</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {Array.isArray(data.components_used) && data.components_used.map((comp, i) => (
                                    <span key={i} style={{ background: 'var(--color-secondary-container)', color: 'var(--color-on-secondary-container)', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>
                                        {comp}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )
                }]);
            } else {
                // Fallback: show raw text if any
                const msg = data.message || data.answer || JSON.stringify(data);
                setMessages(p => [...p, { role: 'bot', content: <p>{msg}</p> }]);
            }
        } catch (error) {
            setIsTyping(false);
            if (feature === 'screen_explain') {
                setMessages(p => [...p, {
                    role: 'bot', content: (
                        <div>
                            <p style={{ fontWeight: 600, marginBottom: 8 }}>🧩 What's on this screen (Local Analysis)</p>
                            <p style={{ marginBottom: 8, fontSize: 13, color: 'var(--color-on-surface-variant)' }}><em>Note: AI server is offline, showing local component analysis.</em></p>
                            <ul style={{ margin: 0, paddingLeft: 20 }}>
                                <li><strong>NavTabs</strong> — horizontal tab navigation (4 tabs)</li>
                                <li><strong>ButtonGroup</strong> — toggle "By Tutor / By Lesson"</li>
                                <li><strong>OverviewCard</strong> — stat cards with donut charts</li>
                                <li><strong>ExportSearchFilterBar</strong> — search + filter + export row</li>
                                <li><strong>TutorsTrainingProgressTable</strong> — data table with avatar, badges</li>
                                <li><strong>Pagination</strong> — icon‑style pagination</li>
                            </ul>
                        </div>
                    )
                }]);
            } else if (feature === 'component_usage') {
                // Try local usage guide as offline fallback
                const localEntry = matchUsageGuide(context?.query || userInput);
                if (localEntry) {
                    setMessages(p => [...p, { role: 'bot', content: localEntry.answer }]);
                } else {
                    setMessages(p => [...p, {
                        role: 'bot', content: (
                            <p style={{ color: 'var(--color-error)' }}>
                                ⚠️ AI server offline. Start the backend with <code>node server/server.js</code> to answer any component question.
                            </p>
                        )
                    }]);
                }
            } else {
                setMessages(p => [...p, { role: 'bot', content: <p style={{ color: 'var(--color-error)' }}>⚠️ AI server offline. Make sure the backend is running on port 3001.</p> }]);
            }
        }
    };

    /* Smart Navigation: Local Fuzzy matching */
    const runSmartNavigation = (text) => {
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            const target = extractSearchQuery(text);
            const matches = findBestMatch(target, storyIndex).map(m => m.entry);

            if (matches.length === 0) {
                setMessages(p => [...p, { role: 'bot', content: <p>Nothing found for "{target}". Try a different keyword.</p> }]);
            } else if (matches.length === 1) {
                navigateToEntry(matches[0]);
                setMessages(p => [...p, { role: 'bot', content: <p>Found <strong>{matches[0].label}</strong> in {matches[0].category}. Opening it now…</p> }]);
            } else {
                const limit = 5;
                setNavMatches(matches.slice(0, limit));
                setSelectedNavIndex(0);
                const msg = matches.length > limit
                    ? `I found ${matches.length} matches. Here are the top ${limit}:`
                    : `I found ${matches.length} matches:`;
                setMessages(p => [...p, { role: 'bot', content: { type: 'nav-picker', text: msg } }]);
            }
        }, 600);
    };

    /* Handlers */
    const handleQuickAction = (actionId) => {
        const action = QUICK_ACTIONS.find(a => a.id === actionId);
        if (actionId === 'find') {
            setNavMatches([]);
            setMessages(p => [...p, { role: 'user', content: action.label }, { role: 'bot', content: <SmartNavIntroMessage /> }]);
            setTimeout(() => inputRef.current?.focus(), 0);
        } else if (actionId === 'usage') {
            setNavMatches([]);
            setMessages(p => [...p, { role: 'user', content: action.label }, { role: 'bot', content: <UsageGuideIntroMessage /> }]);
            setTimeout(() => inputRef.current?.focus(), 0);
        } else if (actionId === 'explain') {
            setMessages(p => [...p, { role: 'user', content: action.label }]);
            if (aiMode === 'local') {
                // local fallback explicitly
                fetchAIResponse('screen_explain_local', 'Explain this screen', null);
            } else {
                const storyId = getCurrentStoryId();
                fetchAIResponse('screen_explain', 'Explain this screen', { storyId, pageContext });
            }
        } else {
            setMessages(p => [...p, { role: 'user', content: action.label }]);
            respond(buildResponse(actionId, pageContext));
        }
    };

    const handleSend = () => {
        const text = inputValue.trim();
        if (!text) return;
        setMessages(p => [...p, { role: 'user', content: text }]);
        setInputValue('');
        setNavMatches([]);

        /* Helper: Find first component match */
        const findComp = (t) => findBestMatch(t, storyIndex).find(m => m.entry.category === 'Component' || m.entry.category === 'Docs')?.entry;

        if (hasShortcutIntent(text)) {
            setMessages(p => [...p, { role: 'bot', content: <ShortcutsHelpContent /> }]);
            return;
        }

        if (hasNavigationIntent(text)) {
            runSmartNavigation(text);
            return;
        }

        if (aiMode === 'local') {
            // Check usage match locally, or fallback
            const usageEntry = matchUsageGuide(text);
            if (usageEntry) {
                respond(usageEntry.answer);
            } else {
                respond(<p style={{ color: 'var(--color-error)' }}>⚠️ Large Language Model features are disabled in Local Mode. Turn on Mode 1 to chat with AI.</p>);
            }
            return;
        }

        /* Component Guide & Usage Intent: route ALL questions through ChatGPT API */
        if (hasComponentGuideIntent(text) || hasUsageIntent(text)) {
            const parsed = parseComponentGuideQuery(text);

            // "Explain this" / "What does this do" → use current story context
            if (parsed?.type === 'context') {
                const storyId = getCurrentStoryId();
                fetchAIResponse('screen_explain', 'Explain this screen / component', { storyId, pageContext });
                return;
            }

            // Build a clean query for GPT
            const componentQuery = parsed?.tokens?.join(' vs ') || text;

            // Check local USAGE_GUIDE first for instant known comparisons
            const usageEntry = matchUsageGuide(text);
            if (usageEntry && !(parsed?.type === 'single')) {
                respond(usageEntry.answer);
                return;
            }

            // Ask ChatGPT — works for ANY component name
            fetchAIResponse('component_usage', text, {
                query: componentQuery,
                parsed,
                pageContext,
                designSystem: 'PLUS ONE Design System (React Bootstrap)'
            });
            return;
        }


        /* Typed quick-action keyword */
        const quickActionId = matchQuickActionByKeyword(text);
        if (quickActionId) {
            handleQuickAction(quickActionId);
            return;
        }

        const matched = matchAction(text);
        if (matched) {
            respond(buildResponse(matched, pageContext));
        } else {
            // Smart Nav Fallback: if text strongly matches a story, navigate!
            const matches = findBestMatch(text, storyIndex);
            if (matches.length > 0 && matches[0].score >= 90) {
                runSmartNavigation(text);
            } else {
                respond(<FallbackWithQuickActions text={text} onQuickAction={handleQuickAction} />);
            }
        }
    };

    if (isHidden) {
        return <div className="sb-ai-agent" aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', visibility: 'hidden', overflow: 'hidden', width: 0, height: 0 }} />;
    }

    return (
        <div className="sb-ai-agent">
            {/* ── Main Floating Interface Container ── */}
            <div className="sb-ai-agent__container">
                {/* Assistant Panel */}
                <div
                    className={`sb-ai-agent__panel ${isOpen ? 'sb-ai-agent__panel--open' : ''}`}
                    style={{ width: panelSize.width, height: panelSize.height }}
                >
                    {/* Resize handle: top-left corner */}
                    <div
                        className="sb-ai-agent__resize-handle"
                        onMouseDown={handleResizeStart}
                        title="Drag to resize"
                        role="presentation"
                    />
                    {/* Header */}
                    <div className="sb-ai-agent__header">
                        <div className="sb-ai-agent__header-container">
                            <LogoContainer size="default" />
                            <div className="sb-ai-agent__header-text">
                                <h3 className="sb-ai-agent__header-name">Hi, {userName}</h3>
                                <span className="sb-ai-agent__header-sub">WELCOME BACK</span>
                            </div>
                        </div>
                        <div className="sb-ai-agent__header-actions">
                            <button className="sb-ai-agent__header-btn" onClick={() => setIsOpen(false)} title="Minimize">
                                <Icons.Minimize />
                            </button>
                            <button className="sb-ai-agent__header-btn" onClick={() => setIsOpen(false)} title="Close">
                                <Icons.Close />
                            </button>
                        </div>
                    </div>

                    {/* Main - Scrollable Body */}
                    <div className="sb-ai-agent__body" ref={bodyRef}>
                        {!aiMode ? (
                            <div className="sb-ai-agent__setup" style={{ padding: 24, paddingBottom: 0 }}>
                                <LogoContainer size="default" className="sb-ai-agent__logo-container--message" />
                                <h4 style={{ marginTop: 16, marginBottom: 8, color: 'var(--color-on-surface)' }}>Welcome to the Agent</h4>
                                <p style={{ fontSize: 13, marginBottom: 16, color: 'var(--color-on-surface-variant)' }}>
                                    Bill suggested a two-mode approach to protect your ChatGPT API key.
                                </p>
                                
                                <div style={{ background: 'var(--color-surface-container-high)', padding: 16, borderRadius: 12, marginBottom: 16 }}>
                                    <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: 'var(--color-on-surface)' }}>Mode 1: Full AI Functionality</p>
                                    <input 
                                        type="password" 
                                        placeholder="sk-..." 
                                        value={tempKey} 
                                        onChange={e => setTempKey(e.target.value)} 
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-outline)', marginBottom: 12, outline: 'none' }}
                                    />
                                    <button 
                                        disabled={!tempKey.trim()}
                                        onClick={() => {
                                            localStorage.setItem('PLUS_AI_API_KEY', tempKey.trim());
                                            localStorage.setItem('PLUS_AI_MODE', 'full');
                                            setApiKey(tempKey.trim());
                                            setAiMode('full');
                                        }}
                                        style={{ background: 'var(--color-primary)', color: 'white', padding: '10px 16px', borderRadius: 8, border: 'none', fontWeight: 600, width: '100%', cursor: tempKey.trim() ? 'pointer' : 'not-allowed', opacity: tempKey.trim() ? 1 : 0.5 }}
                                    >Save Key & Start Mode 1</button>
                                </div>
                                
                                <div style={{ background: 'var(--color-surface-container)', padding: 16, borderRadius: 12 }}>
                                    <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: 'var(--color-on-surface)' }}>Mode 2: Local Processing</p>
                                    <p style={{ fontSize: 12, color: 'var(--color-on-surface-variant)', marginBottom: 12, lineHeight: 1.4 }}>
                                        Hide or disable the remote LLM AI features to prevent excessive API usage.
                                    </p>
                                    <button 
                                        onClick={() => {
                                            localStorage.setItem('PLUS_AI_MODE', 'local');
                                            setAiMode('local');
                                        }}
                                        style={{ background: 'transparent', color: 'var(--color-primary)', padding: '10px 16px', borderRadius: 8, border: '1px solid var(--color-primary)', fontWeight: 600, width: '100%', cursor: 'pointer' }}
                                    >Continue in Mode 2 (No API Key)</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Welcome Message */}
                                <div className="sb-ai-agent__welcome-msg">
                                    <LogoContainer size="default" className="sb-ai-agent__logo-container--message" />
                                    <div className="sb-ai-agent__bubble sb-ai-agent__bubble--bot">
                                        Welcome to PLUS ONE Agent. How can I assist you today?
                                    </div>
                                </div>
                                <p className="sb-ai-agent__tip">
                                    Tip: Type &quot;Shortcuts&quot; To See All Available Keyboard Shortcuts.
                                </p>

                                {/* Quick Actions */}
                                <div className="sb-ai-agent__quick-actions">
                                    {QUICK_ACTIONS.map(a => (
                                        <button key={a.id} className="sb-ai-agent__quick-btn" onClick={() => handleQuickAction(a.id)}>
                                            <div className="sb-ai-agent__quick-icon" style={{ background: a.bg }}>
                                                <span style={{ color: a.color }}>
                                                    <a.Icon />
                                                </span>
                                            </div>
                                            <span className="sb-ai-agent__quick-label">{a.label}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Message List */}
                                <div className="sb-ai-agent__message-list">
                                    {messages.map((m, i) => (
                                        <div key={i} className={`sb-ai-agent__msg sb-ai-agent__msg--${m.role}`}>
                                            {m.role === 'bot' && (
                                                <LogoContainer size="default" className="sb-ai-agent__logo-container--message" />
                                            )}
                                            <div className={`sb-ai-agent__bubble sb-ai-agent__bubble--${m.role}`}>
                                                {typeof m.content === 'string' ? m.content : m.content?.type === 'nav-picker' ? (
                                                    <>
                                                        <p style={{ marginBottom: navMatches.length ? 8 : 0 }}>{m.content.text}</p>
                                                        {navMatches.length > 0 && (
                                                            <NavMatchList
                                                                matches={navMatches}
                                                                selectedIndex={selectedNavIndex}
                                                                onSelect={navigateToEntry}
                                                            />
                                                        )}
                                                    </>
                                                ) : m.content}
                                            </div>
                                            {m.role === 'user' && (
                                                <div className="sb-ai-agent__user-avatar">A</div>
                                            )}
                                        </div>
                                    ))}

                                    {/* Typing indicator (Bot Message Loading) */}
                                    {isTyping && (
                                        <div className="sb-ai-agent__msg sb-ai-agent__msg--bot">
                                            <LogoContainer size="default" className="sb-ai-agent__logo-container--message" />
                                            <div className="sb-ai-agent__typing">
                                                <span /><span /><span />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer / Input */}
                    {aiMode && (
                        <div className="sb-ai-agent__footer">
                            <div className="sb-ai-agent__input-container">
                                <div className="sb-ai-agent__input-wrapper">
                                    <input
                                        ref={inputRef}
                                        className="sb-ai-agent__input"
                                        type="text"
                                        placeholder={aiMode === 'local' ? "Chat disabled (Local Mode)" : "Ask me anything..."}
                                        value={inputValue}
                                        onChange={e => setInputValue(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                                    />
                                    <button className="sb-ai-agent__send" onClick={handleSend} title="Send">
                                        <Icons.Send />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Floating Trigger Button */}
                <div className="sb-ai-agent__fab-wrapper">
                    <button className="sb-ai-agent__fab" onClick={() => setIsOpen(o => !o)} title="Toggle AI Agent (⌘+/) · ⌘+Shift+/ to hide">
                        <LogoContainer size="large" variant={isOpen ? 'fab-open' : 'fab-closed'} />
                    </button>
                </div>
            </div>
        </div>
    );
};

StorybookAIAgent.propTypes = {
    /** Current page context string shown in analysis */
    pageContext: PropTypes.string,
    /** User name displayed in the header greeting */
    userName: PropTypes.string,
};

export default StorybookAIAgent;
