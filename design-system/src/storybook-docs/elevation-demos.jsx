import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Button, Toggle } from '@/components';
import { Page, PatternCard } from '@/patterns';
import { DocsTable } from '@/storybook-docs/ds-docs-layout.jsx';
import { C, RefTable } from '@/storybook-docs/foundation-blocks.jsx';
import { usePageContrast } from '@/storybook-docs/lib/use-page-contrast.js';
import { settleMsOf, springBack } from '@/lib/damping';
import { SPRINGS } from '@/tokens/ladder/springs.generated.js';
import { Illustration } from '@/storybook-docs/illustrations/Illustration.jsx';
import { Backdrop, Card, Frame as FrameShape, Modal as ModalShape, Page as PageShape, PageHeader, Popup as PopupShape, Sidebar as SidebarShape, SkeletonBar, Tooltip as TooltipShape } from '@/storybook-docs/illustrations/primitives.jsx';
import { composeShadow, groundDarkness, ink, parseShadow, shadowReach, slotted } from '@/storybook-docs/lib/shadow-anatomy';

/**
 * The live blocks of Foundations/Elevation. Every value a block shows is read
 * from the page as it resolves the tokens now (in the block's own color mode
 * and the toolbar's contrast), so nothing here restates a number by hand.
 * Motion runs on the spring tokens' appearance family (`--ds-motion-appearance-*`,
 * read here from `tokens/ladder/springs.generated.js`) through the repo's
 * spring helper (`lib/damping`), and lands at once under reduced motion.
 */

/* ------------------------------------------------------------------ data */

/** The six levels, lowest first. The one home for each level's tokens and job. */
export const LEVELS = [
    { id: 'sunken', name: 'Sunken', surface: '--ds-surface-sunken', shadow: null, use: 'The frame behind the work, and a subtle Section.' },
    { id: 'default', name: 'Default', surface: '--ds-surface', shadow: null, use: 'The page, and everything that flows in it.' },
    { id: 'raised', name: 'Raised', surface: '--ds-surface-raised', shadow: '--ds-shadow-raised', use: 'One object the person can act on: a Card.' },
    { id: 'overlay', name: 'Overlay', surface: '--ds-surface-overlay', shadow: '--ds-shadow-overlay', use: 'A layer that floats while the page stays usable.' },
    { id: 'blocking', name: 'Blocking', surface: '--ds-surface-overlay', shadow: '--ds-shadow-blocking', use: 'The Modal, on its Backdrop. Nothing else.' },
    { id: 'overflow', name: 'Overflow', surface: null, shadow: '--ds-shadow-overflow', use: 'A shadow only, where content scrolls under a part that stays put.' },
];

/** The three levels whose shadow fills the edge, key and ambient slots. */
export const SLOTTED_LEVELS = LEVELS.filter((l) => ['raised', 'overlay', 'blocking'].includes(l.id));

const SLOT_WHY = {
    edge: 'The border. A one-pixel ring that turns into a 3:1 line under increased contrast.',
    key: 'Contact. A short, dark shadow where the surface meets the ground.',
    ambient: 'Height. The wider and softer it is, the higher the surface reads.',
};

/** Rows of the behavior table, each landing on one level. */
export const BEHAVIORS = [
    { id: 'holds', behavior: 'Holds the work', level: 'sunken', layer: null, uses: 'Frame topbar, docked Sidebar' },
    { id: 'flow', behavior: 'In the flow', level: 'default', layer: null, uses: 'Page, Section (sunken for a subtle one), Table, docked AI panel' },
    { id: 'marks', behavior: 'Marks one object', level: 'raised', layer: null, uses: 'Card, Carousel slide, Range thumb' },
    { id: 'stays', behavior: 'Stays put while content scrolls', level: 'overflow', layer: '--layer-card', uses: 'Sticky table header and column, with a border first' },
    { id: 'floats', behavior: 'Floats, page usable', level: 'overlay', layer: ['--layer-navigation', '--layer-popup', '--layer-flag', '--layer-spotlight'], uses: 'Floating Sidebar, floating Panel, Popup types (Popup, DropdownMenu, a Select list), Inline edit, Flag, Spotlight, a dragged Card' },
    { id: 'blocks', behavior: 'Blocks the page', level: 'blocking', layer: '--layer-modal', uses: 'Modal only, on the Backdrop (--layer-blanket)' },
    { id: 'replaces', behavior: 'Replaces the page', level: 'default', layer: '--layer-dialog', uses: 'Frame · focused, AiChat full screen' },
    { id: 'labels', behavior: 'Labels a control', level: null, layer: '--layer-tooltip', uses: 'Tooltip, with no shadow' },
];

/** The z stack, bottom to top. */
export const LAYERS = [
    { token: '--layer-card', who: 'Sticky headers and columns' },
    { token: '--layer-navigation', who: 'The floating Sidebar and Panel' },
    { token: '--layer-dialog', who: 'A page that replaces the page: Frame · focused, AiChat full screen' },
    { token: '--layer-popup', who: 'Popups, menus, a Select list' },
    { token: '--layer-blanket', who: 'The Backdrop' },
    { token: '--layer-modal', who: 'The Modal, above its Backdrop' },
    { token: '--layer-flag', who: 'Flags, above a Modal' },
    { token: '--layer-spotlight', who: 'Onboarding spotlights' },
    { token: '--layer-tooltip', who: 'Tooltips, above everything' },
];

/* ----------------------------------------------------------------- hooks */

const REDUCED = '(prefers-reduced-motion: reduce)';

/** The reader's motion preference, followed live. */
export const useReducedMotion = () => {
    const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(REDUCED).matches);
    useEffect(() => {
        const query = window.matchMedia?.(REDUCED);
        if (!query) return undefined;
        const on = () => setReduced(query.matches);
        query.addEventListener('change', on);
        return () => query.removeEventListener('change', on);
    }, []);
    return reduced;
};

/**
 * A number that springs to `target` on an appearance spring token
 * (`appearance.default` is `--ds-motion-appearance-default`), from wherever it
 * is, so a second press mid-flight turns it around. Under reduced motion it
 * lands at once.
 */
export const useSpring = (target, token = 'appearance.default') => {
    const settleMs = settleMsOf(SPRINGS[token].productive);
    const reduced = useReducedMotion();
    const [value, setValue] = useState(target);
    const current = useRef(target);
    useEffect(() => {
        const from = current.current;
        if (from === target) return undefined;
        const delta = from - target;
        return springBack(1, {
            reducedMotion: reduced,
            settleMs,
            onUpdate: (v) => {
                current.current = target + delta * v;
                setValue(current.current);
            },
        });
    }, [target, reduced, settleMs]);
    return value;
};

const ATTRS = ['data-color-mode', 'data-contrast-mode'];

/**
 * Custom properties as `ref`'s element resolves them, read again when the page
 * or the element changes color or contrast mode.
 */
export const useVarsOn = (ref, names) => {
    const key = names.join('|');
    const [values, setValues] = useState({});
    const read = useCallback(() => {
        const el = ref.current;
        if (!el) return;
        const style = getComputedStyle(el);
        setValues(Object.fromEntries(names.map((n) => [n, style.getPropertyValue(n).trim()])));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);
    useLayoutEffect(() => {
        read();
        const observer = new MutationObserver(read);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ATTRS });
        if (ref.current) observer.observe(ref.current, { attributes: true, attributeFilter: ATTRS });
        return () => observer.disconnect();
    }, [read, ref]);
    return values;
};

/** The page's color mode now, `light` or `dark`, for a block's starting mode. */
const pageMode = () => {
    if (typeof document === 'undefined') return 'light';
    const attr = document.documentElement.getAttribute('data-color-mode');
    if (attr === 'dark') return 'dark';
    if (attr === 'auto' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
};

/** A hidden element in one color mode, for reading what the tokens resolve to there. */
const Probe = React.forwardRef(({ mode }, ref) => {
    const contrast = usePageContrast();
    return <span ref={ref} data-color-mode={mode} {...(contrast ? { 'data-contrast-mode': contrast } : {})} hidden />;
});
Probe.displayName = 'Probe';

/** The same names, resolved in light and in dark. */
const useModeVars = (names) => {
    const light = useRef(null);
    const dark = useRef(null);
    const values = { light: useVarsOn(light, names), dark: useVarsOn(dark, names) };
    const probes = (
        <>
            <Probe ref={light} mode="light" />
            <Probe ref={dark} mode="dark" />
        </>
    );
    return [values, probes];
};

/* ------------------------------------------------------------ primitives */

const row = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--inline-md)' };
const stack = { display: 'flex', flexDirection: 'column', gap: 'var(--stack-lg)' };
const label = { font: 'var(--heading-xxsmall)', color: 'var(--ds-text-subtle)' };
const small = { font: 'var(--body-small)', color: 'var(--ds-text-subtle)' };
const codeText = { font: 'var(--code)', color: 'var(--ds-text)', wordBreak: 'break-word' };
/** A value that never breaks mid-value: a narrow table scrolls in its own container instead. */
const valueText = { ...codeText, whiteSpace: 'nowrap', wordBreak: 'normal' };
const well = {
    position: 'relative',
    padding: 'var(--card-pad-spacious)',
    borderRadius: 'var(--card-radius)',
    background: 'var(--ds-surface-sunken)',
    color: 'var(--ds-text)',
    font: 'var(--body-default)',
};

/** A row of pressed-state Buttons that picks one value. */
const Choice = ({ name, options, value, onChange }) => (
    <div role="group" aria-label={name} style={row}>
        {options.map((o) => (
            <Button key={o.id} text={o.label} spacing="compact" isSelected={value === o.id} onClick={() => onChange(o.id)} />
        ))}
    </div>
);

const MODE_OPTIONS = [{ id: 'light', label: 'Light' }, { id: 'dark', label: 'Dark' }];
const levelOf = (id) => LEVELS.find((l) => l.id === id);
const px = (n) => `${Math.round(n * 10) / 10}`;
const alphaPct = (a) => `${Math.round(a * 1000) / 10}%`;

/* ------------------------------------------------------------ layer diagram */

/** The stage every plate draws on, in kit units (one unit is 2px of product UI). */
const STAGE = { w: 296, h: 228 };
const LABEL_W = 300;
/** Each plate is this size; every plate above sits one step up and to the right of the one below. */
const PLATE = { w: 176, h: 72, dx: 20, dy: 26 };
const plateAt = (i) => ({ x: i * PLATE.dx, y: STAGE.h - PLATE.h - i * PLATE.dy });

/**
 * The plates of the stack, bottom to top, each drawn front-on from the
 * illustration kit with no words: the lesson holds without them, so the names,
 * `--layer-*` values and shadows sit in the annotation beside each plate.
 */
const PLATES = [
    { id: 'frame', title: 'Frame', level: 'sunken', layer: null, draw: ({ x, y }) => <><FrameShape x={x} y={y} w={PLATE.w} h={PLATE.h} /><SidebarShape x={x} y={y + 8} w={36} h={PLATE.h - 8} /></> },
    {
        id: 'page', title: 'Page', level: 'default', layer: null,
        draw: ({ x, y }) => (
            <>
                <PageShape x={x} y={y} w={PLATE.w} h={PLATE.h} />
                <PageHeader x={x + 8} y={y + 8} w={PLATE.w - 16} />
                {[0, 1].map((i) => <SkeletonBar key={i} x={x + 8} y={y + 34 + i * 10} w={120 - i * 40} />)}
            </>
        ),
    },
    { id: 'card', title: 'Card', level: 'raised', layer: null, draw: ({ x, y }) => <Card x={x + 24} y={y + 8} w={128} h={PLATE.h - 16} /> },
    { id: 'popup', title: 'Popup', level: 'overlay', layer: '--layer-popup', draw: ({ x, y }) => <PopupShape x={x + 24} y={y + 8} w={128} h={PLATE.h - 16} /> },
    { id: 'backdrop', title: 'Backdrop', level: 'blocking', layer: '--layer-blanket', draw: ({ x, y }) => <Backdrop x={x} y={y} w={PLATE.w} h={PLATE.h} /> },
    { id: 'modal', title: 'Modal', level: 'blocking', layer: '--layer-modal', draw: ({ x, y }) => <ModalShape x={x + 24} y={y + 8} w={128} h={PLATE.h - 16} accent /> },
    { id: 'tooltip', title: 'Tooltip', level: null, layer: '--layer-tooltip', draw: ({ x, y }) => <TooltipShape x={x + 60} y={y + 28} w={56} /> },
];

const badge = {
    display: 'grid',
    placeItems: 'center',
    width: 'var(--image-xs)',
    height: 'var(--image-xs)',
    borderRadius: 'var(--radius-full)',
    background: 'var(--ds-background-brand-bold)',
    color: 'var(--ds-text-inverse)',
    font: 'var(--heading-xsmall)',
};

/** Where a plate's visible strip is centered, as a share of the stage height. */
const stripCenter = (i) => ((plateAt(i).y + PLATE.h - PLATE.dy / 2) / STAGE.h) * 100;

/**
 * One screen taken apart into its layers, drawn flat: the Frame, the Page, a
 * Card, a Popup, the Backdrop, the Modal and a Tooltip, each one step up and
 * to the right of the layer below it. Each plate is annotated with its name, its
 * `--layer-*` token and its shadow.
 */
export const ExplodedStack = () => {
    const stage = useRef(null);
    const layers = useVarsOn(stage, LAYERS.map((l) => l.token));
    const left = (STAGE.w / (STAGE.w + LABEL_W)) * 100;

    return (
        <div ref={stage} data-docs-stage style={well} data-testid="exploded-stack">
            <div style={{ position: 'relative', aspectRatio: `${STAGE.w + LABEL_W} / ${STAGE.h}` }}>
                <div style={{ position: 'absolute', insetBlock: 0, insetInlineStart: 0, width: `${left}%` }}>
                    <Illustration viewBox={`0 0 ${STAGE.w} ${STAGE.h}`} capped={false} title="One screen drawn as seven layers, each one step above the one below">
                        {PLATES.map((plate, i) => (
                            <g key={plate.id} data-plate={plate.id}>{plate.draw(plateAt(i))}</g>
                        ))}
                    </Illustration>
                    {PLATES.map((plate, i) => (
                        <span
                            key={plate.id}
                            aria-hidden="true"
                            style={{ ...badge, position: 'absolute', insetInlineStart: `calc(${((plateAt(i).x + 12) / STAGE.w) * 100}% - var(--image-xs) / 2)`, insetBlockStart: `calc(${stripCenter(i)}% - var(--image-xs) / 2)` }}
                        >
                            {i + 1}
                        </span>
                    ))}
                </div>
                <ol data-testid="stack-legend" aria-label="Layers, top first" style={{ margin: 0, padding: 0, listStyle: 'none', position: 'absolute', insetBlock: 0, insetInlineEnd: 0, width: `${100 - left}%` }}>
                    {PLATES.map((plate, i) => (
                        <li
                            key={plate.id}
                            data-legend={plate.id}
                            style={{ position: 'absolute', insetInlineStart: 0, insetInlineEnd: 0, insetBlockStart: `${stripCenter(i)}%`, transform: 'translateY(-50%)', display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 'var(--inline-sm)', font: 'var(--body-small)', color: 'var(--ds-text)' }}
                        >
                            <strong>{plate.title}</strong>
                            <code style={{ ...codeText, color: 'var(--ds-text-subtle)' }}>{plate.layer ? `${plate.layer} ${layers[plate.layer] ?? ''}` : 'no layer'}</code>
                            <span style={{ color: 'var(--ds-text-subtle)' }}>{shadowNote(plate)}</span>
                        </li>
                    ))}
                </ol>
            </div>
        </div>
    );
};

/** The annotation's shadow cell: the level's shadow token, or none. */
const shadowNote = (plate) => {
    if (plate.id === 'backdrop') return 'blanket fill';
    const level = plate.level ? levelOf(plate.level) : null;
    return level?.shadow ? level.shadow.replace('--ds-shadow-', '') + ' shadow' : 'no shadow';
};

/* ------------------------------------------------------------ level tiles */

/** One tile per level: its surface with its shadow, on the ground it sits on. */
export const LevelTiles = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, calc(var(--image-xl) * 2)), 1fr))', gap: 'var(--grid-gutter)' }}>
        {LEVELS.map((l) => {
            const onBackdrop = l.id === 'blocking';
            return (
                <div
                    key={l.id}
                    data-level={l.id}
                    style={{
                        padding: 'var(--card-pad-compact)',
                        borderRadius: 'var(--card-radius)',
                        background: onBackdrop ? 'linear-gradient(var(--ds-blanket), var(--ds-blanket)), var(--ds-surface)' : l.id === 'sunken' ? 'var(--ds-surface)' : 'var(--ds-surface-sunken)',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--card-stack-sm)',
                            minHeight: 'var(--image-xl)',
                            padding: 'var(--card-pad-compact)',
                            borderRadius: 'var(--card-radius)',
                            background: l.surface ? `var(${l.surface})` : 'var(--ds-surface)',
                            boxShadow: l.shadow ? `var(${l.shadow})` : 'none',
                            color: 'var(--ds-text)',
                        }}
                    >
                        <strong style={{ font: 'var(--heading-xsmall)' }}>{l.name}</strong>
                        <span style={{ font: 'var(--body-small)' }}>{l.use}</span>
                        <code style={{ ...codeText, color: 'var(--ds-text-subtle)' }}>{l.surface ?? 'no surface'}</code>
                        <code style={{ ...codeText, color: 'var(--ds-text-subtle)' }}>{l.shadow ?? 'no shadow'}</code>
                    </div>
                </div>
            );
        })}
    </div>
);

/* ---------------------------------------------------- behavior and path */

const QUESTIONS = {
    where: {
        ask: 'Where does it sit?',
        answers: [
            { label: 'Under the work', to: 'holds' },
            { label: 'In the page', to: 'inPage' },
            { label: 'Over the page', to: 'over' },
            { label: 'Beside a control, naming it', to: 'labels' },
        ],
    },
    inPage: {
        ask: 'In the page, what does it do?',
        answers: [
            { label: 'Flows with the rest', to: 'flow' },
            { label: 'Stands for one object', to: 'marks' },
            { label: 'Stays put while content scrolls', to: 'stays' },
        ],
    },
    over: {
        ask: 'Can the person keep using the page?',
        answers: [
            { label: 'Yes', to: 'floats' },
            { label: 'No', to: 'covered' },
        ],
    },
    covered: {
        ask: 'Does the page stay in view behind it?',
        answers: [
            { label: 'Yes, dimmed', to: 'blocks' },
            { label: 'No, it takes the whole screen', to: 'replaces' },
        ],
    },
};

/** Three or four questions that land on one row of the behavior table, highlighted below. */
export const BehaviorGuide = () => {
    const [path, setPath] = useState(['where']);
    const last = path[path.length - 1];
    const landed = BEHAVIORS.find((b) => b.id === last);
    const choose = (depth, to) => setPath([...path.slice(0, depth + 1), to]);

    return (
        <div style={stack} data-testid="behavior-guide">
            <div data-docs-stage style={{ ...well, ...stack }}>
                {path.filter((step) => QUESTIONS[step]).map((step, depth) => {
                    const q = QUESTIONS[step];
                    const picked = path[depth + 1];
                    return (
                        <div key={step} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                            <span style={label}>{q.ask}</span>
                            <div role="group" aria-label={q.ask} style={row}>
                                {q.answers.map((a) => (
                                    <Button key={a.to} text={a.label} spacing="compact" isSelected={picked === a.to} onClick={() => choose(depth, a.to)} />
                                ))}
                            </div>
                        </div>
                    );
                })}
                <div aria-live="polite" style={small}>
                    {landed ? <>Lands on <strong style={{ color: 'var(--ds-text)' }}>{landed.behavior}</strong>, highlighted below.</> : 'Pick an answer.'}
                    {path.length > 1 && (
                        <>
                            {' '}
                            <Button text="Start over" appearance="subtle" spacing="compact" onClick={() => setPath(['where'])} />
                        </>
                    )}
                </div>
            </div>
            <DocsTable>
                <thead>
                    <tr>
                        {['Behavior', 'Level', 'Shadow', 'Layer', 'Templates and components'].map((h) => <th key={h} scope="col">{h}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {BEHAVIORS.map((b) => {
                        const level = b.level ? levelOf(b.level) : null;
                        const current = landed?.id === b.id;
                        return (
                            <tr
                                key={b.id}
                                data-behavior={b.id}
                                aria-current={current ? 'true' : undefined}
                                style={current ? { background: 'var(--ds-background-selected)', color: 'var(--ds-text-selected)' } : undefined}
                            >
                                <th scope="row" style={{ font: 'var(--heading-xsmall)' }}>{b.behavior}</th>
                                <td>{level ? level.name : 'none'}</td>
                                <td>{level?.shadow ? <code style={{ ...codeText, whiteSpace: 'nowrap' }}>{level.shadow}</code> : 'none'}</td>
                                <td>
                                    {b.layer
                                        ? [b.layer].flat().map((t) => <code key={t} style={{ ...codeText, display: 'block', whiteSpace: 'nowrap' }}>{t}</code>)
                                        : 'none'}
                                </td>
                                <td>{b.uses}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </DocsTable>
        </div>
    );
};

/* -------------------------------------------------------- shadow anatomy */

const SlotValues = ({ layer }) => (
    <span style={{ ...row, gap: 'var(--inline-sm)', font: 'var(--code)', color: 'var(--ds-text)' }}>
        <span>offset {px(layer.x)} {px(layer.y)}</span>
        <span>blur {px(layer.blur)}</span>
        <span>spread {px(layer.spread)}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--inline-sm)' }}>
            <span
                aria-hidden="true"
                style={{
                    display: 'inline-block',
                    width: 'var(--image-xxs)',
                    height: 'var(--image-xxs)',
                    borderRadius: 'var(--radius-sm)',
                    // docs-literal: the swatch shows an ink read from a --ds-shadow-* token.
                    background: `rgb(${layer.color.r} ${layer.color.g} ${layer.color.b})`,
                    boxShadow: 'inset 0 0 0 var(--border-default) var(--ds-border)',
                }}
            />
            ink {alphaPct(layer.color.a)}
        </span>
    </span>
);

/**
 * Pick a level, switch each slot of its shadow on or off on a real surface,
 * and read each slot's offset, blur, spread and ink from the live token.
 */
export const ShadowComposer = () => {
    const [levelId, setLevelId] = useState('blocking');
    const [mode, setMode] = useState(pageMode);
    const [enabled, setEnabled] = useState({ edge: true, key: true, ambient: true });
    const contrast = usePageContrast();
    const ground = useRef(null);
    const level = levelOf(levelId);
    const values = useVarsOn(ground, SLOTTED_LEVELS.map((l) => l.shadow));
    const layers = useMemo(() => slotted(parseShadow(values[level.shadow])), [values, level.shadow]);
    const composed = composeShadow(layers, enabled);
    const onCount = layers.filter((l) => enabled[l.slot] !== false).length;

    return (
        <div style={stack} data-testid="shadow-composer">
            <div style={{ ...row, justifyContent: 'space-between' }}>
                <Choice name="Level" options={SLOTTED_LEVELS.map((l) => ({ id: l.id, label: l.name }))} value={levelId} onChange={setLevelId} />
                <Choice name="Color mode" options={MODE_OPTIONS} value={mode} onChange={setMode} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, var(--card-min-width-md)), 1fr))', gap: 'var(--grid-gutter)', alignItems: 'start' }}>
                <div
                    ref={ground}
                    data-color-mode={mode}
                    {...(contrast ? { 'data-contrast-mode': contrast } : {})}
                    data-docs-stage style={{ ...well, display: 'grid', placeItems: 'center', minHeight: 'calc(var(--image-xl) * 3.5)', background: levelId === 'blocking' ? 'linear-gradient(var(--ds-blanket), var(--ds-blanket)), var(--ds-surface)' : 'var(--ds-surface)' }}
                >
                    <div
                        data-testid="composer-surface"
                        data-layers={onCount}
                        style={{
                            width: '60%',
                            minHeight: 'var(--image-xl)',
                            display: 'grid',
                            placeItems: 'center',
                            borderRadius: 'var(--card-radius)',
                            background: `var(${level.surface})`,
                            boxShadow: composed,
                            color: 'var(--ds-text)',
                            font: 'var(--heading-xsmall)',
                        }}
                    >
                        {level.name}
                    </div>
                </div>
                <div style={stack}>
                    {layers.map((l) => (
                        <div key={l.slot} data-slot={l.slot} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                            <Toggle
                                label={l.slot[0].toUpperCase() + l.slot.slice(1)}
                                isChecked={enabled[l.slot] !== false}
                                onChange={() => setEnabled((e) => ({ ...e, [l.slot]: e[l.slot] === false }))}
                            />
                            <SlotValues layer={l} />
                            <span style={small}>{SLOT_WHY[l.slot]}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const CHART_TONES = {
    raised: 'var(--ds-chart-blue-bold)',
    overlay: 'var(--ds-chart-blue-bolder)',
    blocking: 'var(--ds-chart-blue-boldest)',
};

/**
 * How dark the ground is at each px below a surface's bottom edge, per level,
 * computed from the shadow tokens as the page resolves them.
 */
export const CrossSection = () => {
    const [mode, setMode] = useState(pageMode);
    const contrast = usePageContrast();
    const ref = useRef(null);
    const values = useVarsOn(ref, SLOTTED_LEVELS.map((l) => l.shadow));
    const series = SLOTTED_LEVELS.map((l) => {
        const layers = parseShadow(values[l.shadow]);
        return { level: l, layers, reach: shadowReach(layers) };
    });
    const span = Math.max(8, ...series.map((s) => s.reach));
    const samples = (layers) => Array.from({ length: 81 }, (_, i) => {
        const d = (i / 80) * span;
        return [d, groundDarkness(layers, d)];
    });
    const peak = Math.max(0.01, ...series.flatMap((s) => samples(s.layers).filter(([d]) => d >= 1).map(([, v]) => v)));
    const W = 760;
    const H = 260;
    const L = 44;
    const B = 32;
    const x = (d) => L + (d / span) * (W - L - 8);
    const y = (v) => H - B - (Math.min(v, peak) / peak) * (H - B - 12);

    return (
        <div style={stack} data-testid="cross-section">
            <div style={{ ...row, justifyContent: 'space-between' }}>
                <ul aria-label="Levels" style={{ ...row, margin: 0, padding: 0, listStyle: 'none' }}>
                    {series.map((s) => (
                        <li key={s.level.id} style={{ ...row, gap: 'var(--inline-sm)', font: 'var(--body-default)', color: 'var(--ds-text)' }}>
                            <span aria-hidden="true" style={{ width: 'var(--image-xs)', height: 'calc(var(--border-default) * 2)', background: CHART_TONES[s.level.id] }} />
                            {s.level.name} <span style={small}>reaches {Math.round(s.reach)}</span>
                        </li>
                    ))}
                </ul>
                <Choice name="Color mode" options={MODE_OPTIONS} value={mode} onChange={setMode} />
            </div>
            <div ref={ref} data-color-mode={mode} {...(contrast ? { 'data-contrast-mode': contrast } : {})} data-docs-stage style={well}>
                <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby="elevation-cross-title" style={{ display: 'block', width: '100%', height: 'auto', overflow: 'visible' }}>
                    <title id="elevation-cross-title">
                        {`Darkness of the ground below the edge. ${series.map((s) => `${s.level.name} reaches ${Math.round(s.reach)} px`).join(', ')}.`}
                    </title>
                    <line x1={L} y1={H - B} x2={W - 8} y2={H - B} stroke="var(--ds-border)" />
                    <line x1={L} y1={12} x2={L} y2={H - B} stroke="var(--ds-border)" />
                    {[0, 0.5, 1].map((t) => (
                        <text key={t} x={L - 6} y={y(t * peak) + 4} textAnchor="end" fill="var(--ds-text-subtle)" style={{ font: 'var(--body-small)' }}>
                            {`${Math.round(t * peak * 100)}%`}
                        </text>
                    ))}
                    {[0, 0.25, 0.5, 0.75, 1].map((t) => (
                        <text key={t} x={x(t * span)} y={H - B + 16} textAnchor="middle" fill="var(--ds-text-subtle)" style={{ font: 'var(--body-small)' }}>
                            {Math.round(t * span)}
                        </text>
                    ))}
                    <text x={W - 8} y={H - 2} textAnchor="end" fill="var(--ds-text-subtle)" style={{ font: 'var(--body-small)' }}>px below the edge</text>
                    {series.map((s) => {
                        const pts = samples(s.layers).filter(([d]) => d >= 1);
                        return (
                            <g key={s.level.id} data-series={s.level.id}>
                                <polyline fill="none" stroke={CHART_TONES[s.level.id]} strokeWidth="2" strokeLinejoin="round" points={pts.map(([d, v]) => `${x(d)},${y(v)}`).join(' ')} />
                                <line x1={x(s.reach)} y1={H - B} x2={x(s.reach)} y2={H - B - 6} stroke={CHART_TONES[s.level.id]} strokeWidth="2" />
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};

const slotCell = (layer) => (layer ? `${px(layer.x)} ${px(layer.y)} · ${px(layer.blur)} · ${px(layer.spread)} · ${alphaPct(layer.color.a)}` : 'none');

/** Every slot of every shadow, in light and dark, read from the computed tokens. */
export const ShadowSlotTable = () => {
    const [values, probes] = useModeVars(SLOTTED_LEVELS.map((l) => l.shadow));
    return (
        <div data-testid="shadow-slot-table" data-docs-stage style={{ overflowX: 'auto' }}>
            {probes}
            <DocsTable>
                <thead>
                    <tr>
                        {['Shadow', 'Slot', 'Light: x y · blur · spread · ink', 'Dark'].map((h) => <th key={h} scope="col">{h}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {SLOTTED_LEVELS.flatMap((l) => {
                        const light = slotted(parseShadow(values.light[l.shadow]));
                        const dark = slotted(parseShadow(values.dark[l.shadow]));
                        return ['edge', 'key', 'ambient'].map((slot, i) => (
                            <tr key={`${l.id}-${slot}`} data-row={`${l.id}-${slot}`}>
                                {i === 0 && <th scope="rowgroup" rowSpan={3}><C>{l.shadow}</C></th>}
                                <td>{slot}</td>
                                <td style={valueText}>{slotCell(light.find((x) => x.slot === slot))}</td>
                                <td style={valueText}>{slotCell(dark.find((x) => x.slot === slot))}</td>
                            </tr>
                        ));
                    })}
                </tbody>
            </DocsTable>
        </div>
    );
};

/* -------------------------------------------------------- surface ladder */

const toHex = (rgb) => {
    const m = (rgb || '').match(/\d+(\.\d+)?/g);
    if (!m) return '';
    return `#${m.slice(0, 3).map((n) => Math.round(Number(n)).toString(16).padStart(2, '0')).join('')}`;
};

const lightness = (rgb) => {
    const m = (rgb || '').match(/\d+(\.\d+)?/g);
    if (!m) return 0;
    const lin = m.slice(0, 3).map((n) => {
        const c = Number(n) / 255;
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    const Y = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
    return Math.round((Y <= 0.008856 ? Y * 903.3 : 116 * Math.cbrt(Y) - 16));
};

const LADDER = ['sunken', 'default', 'raised', 'overlay'].map(levelOf);

/** One mode's surfaces, lowest to highest, with the color the page resolves and its lightness. */
const LadderPane = ({ mode }) => {
    const refs = useRef({});
    const contrast = usePageContrast();
    const [colors, setColors] = useState({});
    useLayoutEffect(() => {
        const read = () => setColors(Object.fromEntries(LADDER.map((l) => [l.id, getComputedStyle(refs.current[l.id]).backgroundColor])));
        read();
        const observer = new MutationObserver(read);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ATTRS });
        return () => observer.disconnect();
    }, [contrast]);
    return (
        <div data-color-mode={mode} {...(contrast ? { 'data-contrast-mode': contrast } : {})} data-docs-stage style={{ ...well, ...stack }} data-ladder={mode}>
            <span style={label}>{mode === 'light' ? 'Light' : 'Dark'}</span>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${LADDER.length}, minmax(0, 1fr))`, alignItems: 'end', gap: 'var(--inline-md)' }}>
                {LADDER.map((l, i) => (
                    <div key={l.id} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                        <div
                            ref={(el) => { refs.current[l.id] = el; }}
                            data-step={l.id}
                            style={{
                                height: `calc(var(--image-md) + ${i} * var(--image-xs))`,
                                borderRadius: 'var(--radius-md)',
                                background: `var(${l.surface})`,
                                boxShadow: l.shadow ? `var(${l.shadow})` : 'inset 0 0 0 var(--border-default) var(--ds-border)',
                            }}
                        />
                        <strong style={{ font: 'var(--heading-xsmall)', color: 'var(--ds-text)' }}>{l.name}</strong>
                        <code style={{ ...codeText, color: 'var(--ds-text-subtle)' }}>{toHex(colors[l.id])}</code>
                        <span style={small} data-lightness={lightness(colors[l.id])}>L {lightness(colors[l.id])}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

/** The surface ladder in light and dark: in dark, each step up is lighter. */
export const SurfaceLadder = () => (
    <div data-testid="surface-ladder" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, var(--card-min-width-md)), 1fr))', gap: 'var(--grid-gutter)' }}>
        <LadderPane mode="light" />
        <LadderPane mode="dark" />
    </div>
);

/* ------------------------------------------------------------ layer stack */

/** The z stack as a table, highest first: each `--layer-*` token, its z-index and what sits there. */
export const LayerStack = () => {
    const ref = useRef(null);
    const values = useVarsOn(ref, LAYERS.map((l) => l.token));
    return (
        <div ref={ref} data-testid="layer-stack">
            <RefTable
                head={['Token', 'z-index', 'What sits there']}
                rows={[...LAYERS].reverse().map((l) => [
                    <span key="t" data-layer={l.token}><C>{l.token}</C></span>,
                    <strong key="v">{values[l.token]}</strong>,
                    l.who,
                ])}
            />
        </div>
    );
};

/* ------------------------------------------------------------- motion */

const lerp = (a, b, t) => a + (b - a) * t;
const lerpLayers = (from, to, t) =>
    from.map((f, i) => {
        const g = to[i] ?? { ...f, color: { ...f.color, a: 0 } };
        return {
            ...f,
            x: lerp(f.x, g.x, t),
            y: lerp(f.y, g.y, t),
            blur: lerp(f.blur, g.blur, t),
            spread: lerp(f.spread, g.spread, t),
            color: { r: Math.round(lerp(f.color.r, g.color.r, t)), g: Math.round(lerp(f.color.g, g.color.g, t)), b: Math.round(lerp(f.color.b, g.color.b, t)), a: lerp(f.color.a, g.color.a, t) },
        };
    });

/** A clickable Card that lifts from raised to overlay on a spring, shadow and fill together. */
export const LiftDemo = () => {
    const [lifted, setLifted] = useState(false);
    const t = useSpring(lifted ? 1 : 0);
    const ref = useRef(null);
    const values = useVarsOn(ref, ['--ds-shadow-raised', '--ds-shadow-overlay']);
    const from = parseShadow(values['--ds-shadow-raised']);
    const to = parseShadow(values['--ds-shadow-overlay']);
    const shadow = from.length ? composeShadow(slotted(lerpLayers(from, to, t))) : 'var(--ds-shadow-raised)';
    return (
        <div ref={ref} data-docs-stage style={{ ...well, display: 'grid', placeItems: 'center' }} data-testid="lift-demo" data-lifted={lifted}>
            <div style={{ width: 'min(100%, var(--card-min-width-md))' }}>
                <PatternCard
                    title="Session with Ana"
                    description={lifted ? 'Lifted: the overlay shadow' : 'At rest: the raised shadow'}
                    role="button"
                    tabIndex={0}
                    aria-pressed={lifted}
                    onClick={() => setLifted((v) => !v)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLifted((v) => !v); } }}
                    // docs-literal: the fill springs from raised to overlay, a mix of the two tokens.
                    style={{ boxShadow: shadow, background: `color-mix(in srgb, var(--ds-surface-overlay) ${Math.round(t * 100)}%, var(--ds-surface-raised))`, transition: 'none' }}
                />
            </div>
        </div>
    );
};

/** A Popup opening with a clip: the clip's resting edge sits past the shadow's reach, drawn dashed. */
export const ClipDemo = () => {
    const [open, setOpen] = useState(true);
    const t = useSpring(open ? 1 : 0);
    const ref = useRef(null);
    const values = useVarsOn(ref, ['--ds-shadow-overlay']);
    const reach = shadowReach(parseShadow(values['--ds-shadow-overlay']));
    const reachLen = `${reach}px`;
    return (
        <div ref={ref} data-docs-stage style={{ ...well, ...stack }} data-testid="clip-demo" data-reach={reach}>
            <div style={row}>
                <Button text={open ? 'Close' : 'Open'} spacing="compact" isSelected={open} onClick={() => setOpen((o) => !o)} />
                <span style={small}>Clip edge sits {reach} past the Popup, the reach of <C>--ds-shadow-overlay</C>.</span>
            </div>
            <div style={{ position: 'relative', display: 'grid', placeItems: 'start center', padding: `${reachLen} 0` }}>
                <div
                    style={{
                        position: 'relative',
                        width: 'min(100%, var(--popover-width-sm))',
                        clipPath: `inset(calc(-1 * ${reachLen}) calc(-1 * ${reachLen}) calc(${(1 - t) * 100}% - ${t} * ${reachLen}) calc(-1 * ${reachLen}))`,
                    }}
                >
                    <div className="plus-popup" style={{ position: 'relative', width: '100%' }}>
                        <div className="plus-popup-title">Session 12</div>
                        <div className="plus-popup-body">Ran 45 minutes over.</div>
                    </div>
                </div>
                <div
                    aria-hidden="true"
                    data-clip-line
                    style={{
                        position: 'absolute',
                        insetBlock: 0,
                        insetInline: `calc(50% - min(50%, var(--popover-width-sm) / 2) - ${reachLen})`,
                        border: 'var(--border-default) dashed var(--ds-border-bold)',
                        borderRadius: 'var(--radius-md)',
                        pointerEvents: 'none',
                    }}
                />
            </div>
        </div>
    );
};

/** A sticky header whose overflow shadow follows the scroll position one to one. */
export const ScrollShadowDemo = () => {
    const ref = useRef(null);
    const [scroll, setScroll] = useState(0);
    const values = useVarsOn(ref, ['--ds-shadow-overflow']);
    const full = parseShadow(values['--ds-shadow-overflow']);
    const reach = Math.max(1, shadowReach(full));
    const t = Math.min(1, scroll / reach);
    const shadow = full.length ? composeShadow(slotted(full.map((l) => ({ ...l, color: { ...l.color, a: l.color.a * t } })))) : 'none';
    return (
        <div data-docs-stage style={well} data-testid="scroll-demo" data-progress={Math.round(t * 100)}>
            <div
                ref={ref}
                data-scroller
                tabIndex={0}
                aria-label="Scrolling list of sessions"
                onScroll={(e) => setScroll(e.currentTarget.scrollTop)}
                style={{ maxHeight: 'calc(var(--image-xl) * 3)', overflowY: 'auto', borderRadius: 'var(--card-radius)', background: 'var(--ds-surface)' }}
            >
                <div data-header style={{ position: 'sticky', top: 0, zIndex: 'var(--layer-card)', padding: 'var(--pad-y-md) var(--pad-x-md)', background: 'var(--ds-surface)', font: 'var(--heading-xsmall)', boxShadow: shadow, color: 'var(--ds-text)' }}>
                    Sessions
                </div>
                {Array.from({ length: 12 }, (_, i) => (
                    <div key={i} style={{ padding: 'var(--pad-y-md) var(--pad-x-md)', font: 'var(--body-default)', color: 'var(--ds-text)' }}>
                        Session {i + 1}
                    </div>
                ))}
            </div>
            <p style={{ ...small, margin: 0, marginBlockStart: 'var(--stack-sm)' }}>Shadow at {Math.round(t * 100)}%: it reaches full strength after {reach} of scroll.</p>
        </div>
    );
};

/* --------------------------------------------------------- accessibility */

/** A Card and a Popup with increased contrast on and off: the ring becomes a 3:1 line. */
export const ContrastDemo = () => {
    const [more, setMore] = useState(false);
    const [mode, setMode] = useState(pageMode);
    return (
        <div style={stack} data-testid="contrast-demo">
            <div style={{ ...row, justifyContent: 'space-between' }}>
                <Toggle label="Increased contrast" isChecked={more} onChange={() => setMore((m) => !m)} />
                <Choice name="Color mode" options={MODE_OPTIONS} value={mode} onChange={setMode} />
            </div>
            <div
                data-color-mode={mode}
                data-contrast-mode={more ? 'more' : 'no-preference'}
                data-docs-stage style={{ ...well, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, var(--card-min-width-sm)), 1fr))', gap: 'var(--grid-gutter)', background: 'var(--ds-surface)' }}
            >
                <PatternCard title="Card" description="The raised ring." />
                <div className="plus-popup" style={{ position: 'relative', width: 'auto' }}>
                    <div className="plus-popup-title">Popup</div>
                    <div className="plus-popup-body">The overlay ring.</div>
                </div>
            </div>
        </div>
    );
};
