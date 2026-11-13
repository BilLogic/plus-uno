import React, { useEffect, useMemo, useRef, useState } from 'react';
import { animate } from 'motion';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import {
    Accordion,
    BarChart,
    Button,
    ButtonItem,
    Calendar,
    Checkbox,
    DonutChart,
    DropdownMenu,
    Icon,
    IconButton,
    LineChart,
    Link,
    Modal,
    Popup,
    Range,
    Section,
    Tabs,
    Tag,
    TextField,
    Toggle,
    Tooltip,
    chartPalette,
} from '@/components';
import { FREE_SOLID_ICONS } from '@/lib/icon-free.generated.js';
import { FREE_REGULAR_ICONS } from '@/lib/icon-regular.generated.js';
import { SPEEDS, SPEED_LABELS, springFor } from '@/storybook-docs/illustrations/motion.jsx';
import { DragReorder } from '@/storybook-docs/illustrations/motion-drag.jsx';
import { DragPastLimit } from '@/storybook-docs/illustrations/motion-playground.jsx';

/**
 * The live gallery that opens each Libraries page: the PLUS components a
 * library sits under, mounted and usable, grouped by category. A tile is the
 * real component on the sunken ground with a hairline edge; under it, the
 * component's name linked to its docs and chips saying what to try. Every
 * tile names the PLUS component, never the library part under it.
 */

const docsHref = (id) => `?path=/docs/${id}--docs`;

/** The gallery: groups of tiles, under the page's landing. */
export const LibraryGallery = ({ label, children }) => (
    <div data-library-gallery={label} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-stack-lg)' }}>
        {children}
    </div>
);

/** One category of tiles, under a small heading. */
export const GalleryGroup = ({ title, children }) => (
    <section data-gallery-group={title} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-lg)' }}>
        <h3 style={{ margin: 0, font: 'var(--heading-xxsmall)', color: 'var(--ds-text-subtle)' }}>{title}</h3>
        <ul
            style={{
                margin: 0,
                padding: 0,
                listStyle: 'none',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, var(--card-min-width-md)), 1fr))',
                gap: 'var(--grid-gutter)',
            }}
        >
            {children}
        </ul>
    </section>
);

/**
 * One live example. `docsId` is the Storybook docs id the name links to;
 * `cues` are what to try. `bare` drops the stage's own padding and centering
 * for a demo that draws its own ground.
 */
export const GalleryTile = ({ name, docsId, cues = [], bare = false, children }) => (
    <li data-gallery-tile={name} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)', minWidth: 0 }}>
        <div
            data-gallery-stage
            style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: bare ? 'stretch' : 'center',
                justifyContent: 'center',
                gap: 'var(--stack-md)',
                minHeight: 'calc(var(--item-height-md) * 6)',
                boxSizing: 'border-box',
                padding: bare ? 0 : 'var(--card-pad-default)',
                borderRadius: 'var(--card-radius)',
                background: 'var(--ds-surface-sunken)',
                boxShadow: 'inset 0 0 0 var(--border-default) var(--ds-border)',
                color: 'var(--ds-text)',
                font: 'var(--body-default)',
                overflow: 'hidden',
            }}
        >
            {children}
        </div>
        <Link href={docsHref(docsId)}>{name}</Link>
        {cues.length > 0 && (
            <ul aria-label={`Try on ${name}`} style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: 'var(--stack-sm)' }}>
                {cues.map((cue) => (
                    <li key={cue}>
                        <Tag text={cue} />
                    </li>
                ))}
            </ul>
        )}
    </li>
);

/* ================================================================ Base UI */

const ModalTile = () => {
    const [show, setShow] = useState(false);
    return (
        <>
            <Button appearance="primary" onClick={() => setShow(true)}>
                Reschedule session
            </Button>
            <Modal
                show={show}
                onClose={() => setShow(false)}
                title="Reschedule session"
                body="Move Thursday's session with Maya to next week. She gets a message with the new time."
                primaryButton={{ text: 'Reschedule', onClick: () => setShow(false) }}
                secondaryButton={{ text: 'Cancel', onClick: () => setShow(false) }}
            />
        </>
    );
};

const DATE_LABEL = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const PopupTile = () => {
    const [date, setDate] = useState(() => new Date(2026, 10, 13));
    const [view, setView] = useState(date);
    const [show, setShow] = useState(false);
    return (
        <Popup
            label="Choose a session date"
            placement="bottom-start"
            show={show}
            onToggle={setShow}
            trigger={
                <Button iconAfter="calendar" aria-label={`Session date, ${DATE_LABEL.format(date)}`}>
                    {DATE_LABEL.format(date)}
                </Button>
            }
        >
            <Calendar
                viewDate={view}
                onViewDateChange={setView}
                selected={date}
                onPick={(next) => {
                    setDate(next);
                    setShow(false);
                }}
            />
        </Popup>
    );
};

const DropdownMenuTile = () => {
    const [last, setLast] = useState('Nothing picked yet');
    const pick = (what) => () => setLast(what);
    return (
        <>
            <DropdownMenu trigger={<IconButton icon="ellipsis" label="Session actions" />} placement="bottom-end">
                <Section>
                    <ButtonItem elemBefore={<Icon name="pen" />} onClick={pick('Edit')}>
                        Edit
                    </ButtonItem>
                    <ButtonItem elemBefore={<Icon name="copy" />} onClick={pick('Duplicate')}>
                        Duplicate
                    </ButtonItem>
                    <ButtonItem elemBefore={<Icon name="share-from-square" />} onClick={pick('Share')}>
                        Share
                    </ButtonItem>
                </Section>
                <Section hasSeparator>
                    <ButtonItem elemBefore={<Icon name="trash" color="danger" />} onClick={pick('Delete')}>
                        <span style={{ color: 'var(--ds-text-danger)' }}>Delete</span>
                    </ButtonItem>
                </Section>
            </DropdownMenu>
            <span data-menu-last aria-live="polite" style={{ font: 'var(--body-small)', color: 'var(--ds-text-subtle)' }}>
                {last}
            </span>
        </>
    );
};

const TooltipTile = () => (
    <Tooltip text="Edit session">
        <IconButton icon="pen" label="Edit session" isTooltipDisabled />
    </Tooltip>
);

const stackStyle = { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--stack-lg)' };

const ToggleTile = () => (
    <div style={stackStyle}>
        <Toggle label="Session reminders" defaultChecked />
        <Toggle label="Weekly digest" />
        <Toggle label="Sounds" />
    </div>
);

const CheckboxTile = () => (
    <div style={stackStyle}>
        <Checkbox label="Fractions" defaultChecked />
        <Checkbox label="Ratios" />
        <Checkbox label="Equations" defaultChecked />
    </div>
);

const RangeTile = () => {
    const [minutes, setMinutes] = useState(45);
    return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
            <Range label="Session length" min={15} max={90} step={15} value={minutes} onChange={(v) => setMinutes(v)} />
            <span data-range-value style={{ font: 'var(--body-small)', color: 'var(--ds-text-subtle)' }}>
                {minutes} minutes
            </span>
        </div>
    );
};

const TabsTile = () => (
    <div style={{ width: '100%', alignSelf: 'stretch' }}>
        <Tabs defaultActiveKey="overview">
            <Tabs.Tab eventKey="overview">Overview</Tabs.Tab>
            <Tabs.Tab eventKey="sessions">Sessions</Tabs.Tab>
            <Tabs.Tab eventKey="notes">Notes</Tabs.Tab>
            <Tabs.Panel eventKey="overview">Twelve students, three sessions this week.</Tabs.Panel>
            <Tabs.Panel eventKey="sessions">Thursday at 4:00 with Maya.</Tabs.Panel>
            <Tabs.Panel eventKey="notes">Maya is ready for ratios.</Tabs.Panel>
        </Tabs>
    </div>
);

const ACCORDION_ITEMS = [
    { eventKey: 'goals', header: 'Goals', body: 'Finish the fractions unit by Friday.' },
    { eventKey: 'progress', header: 'Progress', body: 'Four of six lessons done.' },
    { eventKey: 'notes', header: 'Notes', body: 'Prefers worked examples first.' },
];

const AccordionTile = () => (
    <div style={{ width: '100%', alignSelf: 'stretch' }}>
        <Accordion items={ACCORDION_ITEMS} defaultActiveKey="goals" />
    </div>
);

/** Base UI: the behavior under every interactive component, shown by its PLUS names. */
export const BaseUiGallery = () => (
    <LibraryGallery label="Base UI">
        <GalleryGroup title="Overlays">
            <GalleryTile name="Modal" docsId="components-messaging-modal-dialog" cues={['click', 'Esc', 'focus trap']}>
                <ModalTile />
            </GalleryTile>
            <GalleryTile name="Popup" docsId="components-overlays-and-layering-popup" cues={['click', 'outside click', 'Esc']}>
                <PopupTile />
            </GalleryTile>
            <GalleryTile name="Dropdown menu" docsId="components-forms-and-inputs-dropdown-menu" cues={['click', 'arrows', 'Enter', 'Esc']}>
                <DropdownMenuTile />
            </GalleryTile>
            <GalleryTile name="Tooltip" docsId="components-overlays-and-layering-tooltip" cues={['hover', 'focus']}>
                <TooltipTile />
            </GalleryTile>
        </GalleryGroup>
        <GalleryGroup title="Selection">
            <GalleryTile name="Toggle" docsId="components-forms-and-inputs-toggle" cues={['click', 'Space']}>
                <ToggleTile />
            </GalleryTile>
            <GalleryTile name="Checkbox" docsId="components-forms-and-inputs-checkbox" cues={['click', 'Space']}>
                <CheckboxTile />
            </GalleryTile>
            <GalleryTile name="Range" docsId="components-forms-and-inputs-range" cues={['drag', 'arrows']}>
                <RangeTile />
            </GalleryTile>
        </GalleryGroup>
        <GalleryGroup title="Disclosure and navigation">
            <GalleryTile name="Tabs" docsId="components-navigation-tabs" cues={['click', 'arrows']}>
                <TabsTile />
            </GalleryTile>
            <GalleryTile name="Accordion" docsId="components-layout-and-structure-accordion" cues={['click', 'Enter']}>
                <AccordionTile />
            </GalleryTile>
        </GalleryGroup>
    </LibraryGallery>
);

/* ================================================================= Motion */

const moverStyle = {
    width: 'var(--item-height-md)',
    height: 'var(--item-height-md)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--ds-background-brand-bold)',
};

/** At ½× a spring takes twice as long: stiffness ÷ 4 and damping ÷ 2 keep its shape. */
const slowed = (config, speed) => ({ ...config, stiffness: config.stiffness * speed * speed, damping: config.damping * speed });

/**
 * A block that springs from start to rest on `spatial.default`, with Replay
 * and a speed control. Under reduced motion it lands with an
 * `appearance.fast` fade in place of the travel.
 */
export const SpringToRest = () => {
    const reduced = useReducedMotion();
    const track = useRef(null);
    const block = useRef(null);
    const [speedIndex, setSpeedIndex] = useState(0);
    const [phase, setPhase] = useState('rest');
    const controls = useRef(null);

    const play = () => {
        const el = block.current;
        const lane = track.current;
        if (!el || !lane) return;
        controls.current?.stop();
        const distance = lane.clientWidth - el.offsetWidth;
        const speed = SPEEDS[speedIndex];
        setPhase('moving');
        if (reduced) {
            el.style.transform = `translateX(${distance}px)`;
            controls.current = animate(el, { opacity: [0, 1] }, slowed(springFor('appearance.fast'), speed));
        } else {
            controls.current = animate(el, { x: [0, distance] }, slowed(springFor('spatial.default', 'expressive'), speed));
        }
        controls.current.finished.then(() => setPhase('rest'));
    };

    useEffect(() => {
        play();
        return () => controls.current?.stop();
        // Plays once on mount; Replay plays it again.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div data-spring-demo data-phase={phase} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--stack-lg)' }}>
            <div ref={track} style={{ position: 'relative', boxShadow: 'inset 0 calc(var(--border-default) * -1) 0 var(--ds-border)', paddingBlockEnd: 'var(--stack-sm)' }}>
                <div ref={block} data-spring-block style={moverStyle} />
            </div>
            <div style={{ display: 'flex', gap: 'var(--stack-md)' }}>
                <Button iconBefore="rotate-right" onClick={play}>
                    Replay
                </Button>
                <Button
                    appearance="subtle"
                    onClick={() => setSpeedIndex((i) => (i + 1) % 2)}
                    aria-label={`Playback speed: ${SPEED_LABELS[speedIndex]}`}
                >
                    {SPEED_LABELS[speedIndex]}
                </Button>
            </div>
        </div>
    );
};

const SEED_ROWS = ['Maya · Fractions', 'Leo · Ratios', 'Ana · Equations'];
const NEXT_ROWS = ['Sam · Geometry', 'Ivy · Decimals', 'Noah · Percents', 'Zoe · Graphs'];

/**
 * Rows that enter and leave: Add springs a row in on `spatial.default`, and
 * each row's Remove fades it out on `appearance.fast` while the rest close up.
 */
export const EnterAndExit = () => {
    const reduced = useReducedMotion();
    const [rows, setRows] = useState(SEED_ROWS);
    const spare = useMemo(() => [...NEXT_ROWS, ...SEED_ROWS].filter((r) => !rows.includes(r)), [rows]);
    const enter = reduced ? springFor('appearance.fast') : springFor('spatial.default');
    return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--stack-md)' }}>
            <ul data-presence-list style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                <AnimatePresence initial={false}>
                    {rows.map((row) => (
                        <motion.li
                            key={row}
                            layout={!reduced}
                            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, transition: springFor('appearance.fast') }}
                            transition={enter}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 'var(--stack-md)',
                                paddingInline: 'var(--pad-x-md)',
                                minHeight: 'var(--item-height-md)',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--ds-surface-raised)',
                                boxShadow: 'var(--ds-shadow-raised)',
                                font: 'var(--body-default)',
                            }}
                        >
                            {row}
                            <IconButton
                                icon="xmark"
                                appearance="subtle"
                                spacing="compact"
                                label={`Remove ${row}`}
                                onClick={() => setRows((rs) => rs.filter((r) => r !== row))}
                            />
                        </motion.li>
                    ))}
                </AnimatePresence>
            </ul>
            <div>
                <Button iconBefore="plus" isDisabled={!spare.length} onClick={() => setRows((rs) => [...rs, spare[0]])}>
                    Add row
                </Button>
            </div>
        </div>
    );
};

/** Motion: the springs every move reads, played by hand. */
export const MotionGallery = () => (
    <LibraryGallery label="Motion">
        <GalleryGroup title="Springs">
            <GalleryTile name="Spring to rest" docsId="foundations-motion-physics" cues={['replay', '½× speed']}>
                <SpringToRest />
            </GalleryTile>
        </GalleryGroup>
        <GalleryGroup title="Layout">
            <GalleryTile name="Reorder" docsId="foundations-motion-transitions" cues={['drag', 'Space', 'arrows']}>
                <div style={{ width: '100%' }}>
                    <DragReorder />
                </div>
            </GalleryTile>
            <GalleryTile name="Enter and exit" docsId="foundations-motion-choreography" cues={['add', 'remove']}>
                <EnterAndExit />
            </GalleryTile>
        </GalleryGroup>
        <GalleryGroup title="Gesture">
            <GalleryTile name="Drag with resistance" docsId="foundations-motion-playground" cues={['drag past the limit', 'arrows']} bare>
                <DragPastLimit />
            </GalleryTile>
        </GalleryGroup>
    </LibraryGallery>
);

/* ============================================================= Highcharts */

const MONTHS = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];

const chartBox = { width: '100%', alignSelf: 'stretch' };

/** Highcharts: the chart components, each with its own tooltip and legend. */
export const HighchartsGallery = () => (
    <LibraryGallery label="Highcharts">
        <GalleryGroup title="Chart types">
            <GalleryTile name="Bar chart" docsId="data-visualizations-comparison-bar-chart" cues={['hover', 'legend toggle']}>
                <div style={chartBox}>
                    <BarChart
                        categories={['Fractions', 'Ratios', 'Equations', 'Graphs']}
                        series={[
                            { name: 'Sessions held', data: [14, 11, 9, 6] },
                            { name: 'Sessions planned', data: [16, 12, 12, 8] },
                        ]}
                        yAxisLabel="Sessions"
                        showLegend
                        height={240}
                    />
                </div>
            </GalleryTile>
            <GalleryTile name="Line chart" docsId="data-visualizations-temporal-line-chart" cues={['hover', 'legend toggle']}>
                <div style={chartBox}>
                    <LineChart
                        data={[
                            { name: 'Attendance', data: [82, 85, 84, 88, 91, 93], categories: MONTHS },
                            { name: 'Goal', data: [85, 85, 85, 90, 90, 90], categories: MONTHS },
                        ]}
                        yAxisLabel="Percent"
                        height={240}
                    />
                </div>
            </GalleryTile>
            <GalleryTile name="Donut chart" docsId="data-visualizations-part-to-whole-donut-chart" cues={['hover']}>
                <DonutChart
                    size={200}
                    value="62%"
                    label="On track"
                    segments={[
                        { value: 62, color: chartPalette.CATEGORICAL[0], label: 'On track' },
                        { value: 25, color: chartPalette.CATEGORICAL[1], label: 'Needs a check-in' },
                        { value: 13, color: chartPalette.CATEGORICAL[2], label: 'Behind' },
                    ]}
                />
            </GalleryTile>
        </GalleryGroup>
    </LibraryGallery>
);

/* =========================================================== Font Awesome */

/** Every Free name outside the brands, the set Icon draws from, in order. */
export const FREE_ICON_NAMES = [...new Set([...FREE_SOLID_ICONS, ...FREE_REGULAR_ICONS])].sort();
const SHOWN = 40;

/** Filters the names by a typed query, every word anywhere in the name. */
export const filterIcons = (query, names = FREE_ICON_NAMES) => {
    const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    return words.length ? names.filter((n) => words.every((w) => n.includes(w))) : names;
};

/** Type to filter the Free set; the first matches draw through Icon. */
export const IconSearch = () => {
    const [query, setQuery] = useState('calendar');
    const matches = filterIcons(query);
    return (
        <div style={{ width: '100%', alignSelf: 'stretch', display: 'flex', flexDirection: 'column', gap: 'var(--stack-lg)' }}>
            <TextField
                label="Search the Free icons"
                isLabelHidden
                placeholder="Search icons"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                elemBeforeInput={<Icon name="magnifying-glass" />}
            />
            <span data-icon-count aria-live="polite" style={{ font: 'var(--body-small)', color: 'var(--ds-text-subtle)' }}>
                {matches.length} of {FREE_ICON_NAMES.length} icons
            </span>
            <ul
                data-icon-results
                style={{
                    margin: 0,
                    padding: 0,
                    listStyle: 'none',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(var(--item-height-md), 1fr))',
                    gap: 'var(--stack-md)',
                }}
            >
                {matches.slice(0, SHOWN).map((name) => (
                    <li key={name} style={{ display: 'flex', justifyContent: 'center' }}>
                        <Tooltip text={name}>
                            <span tabIndex={0} data-icon-name={name} style={{ display: 'inline-flex', padding: 'var(--stack-sm)', borderRadius: 'var(--radius-sm)' }}>
                                <Icon name={name} size={24} label={name} />
                            </span>
                        </Tooltip>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const SIZES = [
    { size: 12, token: '--icon-sm' },
    { size: 16, token: '--icon-md' },
    { size: 24, token: '--icon-lg' },
];

/** The three icon sizes side by side on one baseline. */
export const IconSizes = () => (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--section-stack-md)' }}>
        {SIZES.map(({ size, token }) => (
            <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--stack-md)' }}>
                <span style={{ display: 'flex', alignItems: 'flex-end', height: 'var(--icon-lg)' }}>
                    <Icon name="bell" size={size} />
                </span>
                <span style={{ font: 'var(--body-small)', color: 'var(--ds-text-subtle)' }}>
                    {size} · <code>{token}</code>
                </span>
            </div>
        ))}
    </div>
);

/** Font Awesome: the Free set, searched and sized through Icon. */
export const FontAwesomeGallery = () => (
    <LibraryGallery label="Font Awesome">
        <GalleryGroup title="Icons">
            <GalleryTile name="Icon" docsId="components-images-and-icons-icon" cues={['type to filter', 'hover for the name']}>
                <IconSearch />
            </GalleryTile>
            <GalleryTile name="Icon sizes" docsId="foundations-visual-iconography" cues={['12', '16', '24']}>
                <IconSizes />
            </GalleryTile>
        </GalleryGroup>
    </LibraryGallery>
);
