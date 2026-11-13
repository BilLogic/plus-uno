import React from 'react';
import PropTypes from 'prop-types';
import {
    Banner,
    Breadcrumb,
    Button,
    IconButton,
    PageHeader,
    Select,
    StatusTag,
    Tabs,
    Heading,
} from '@/components';
import { Frame, PatternCard, PatternSection } from '@/patterns';
import { ScaledStory } from '@/storybook-docs/lib/template-page.jsx';
import { ReflowStage } from '@/storybook-docs/lib/fit-stage.jsx';

/**
 * Page-template docs helpers: the page header assembled from its parts, a
 * Frame with no sidebar to hold it, the type card, and the anatomy figure
 * whose markers sit in the nearest gutter, each leader running level with its
 * part so none crosses another.
 */

/** The width the Page stories lay out at: wide enough that the 1232 cap shows against full width. Docs geometry, not a design value. */
export const PAGE_STAGE = 1440;

/** The width the type cards lay out at: wide enough that the content cap shows against full width. Docs geometry. */
export const TYPE_STAGE = 1920;

/** The width the scenario and state stories lay out at: no sidebar, so the page fills it. Docs geometry. */
export const SCENARIO_STAGE = 800;

/** The height of the frame box a Page story fills, so the page runs to a fixed floor. Docs geometry. */
const STAGE_HEIGHT = 360;

const row = { display: 'flex', alignItems: 'center', gap: 'var(--inline-md)', minWidth: 0 };

/**
 * The page header from its slots. `PageHeader` has no `description` or `status`
 * slot yet (both planned), so the title block holds them: the h1 with the
 * StatusTag after its text, then one description line.
 */
export const DemoPageHeader = ({ breadcrumb, title, status, description, actions, tabs }) => (
    <PageHeader
        disableTitleStyles
        breadcrumbs={breadcrumb ? <Breadcrumb label="Breadcrumb" items={breadcrumb} /> : undefined}
        title={(
            <div data-part="title-block" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--stack-sm)' }}>
                <div style={row}>
                    <Heading size="large" as="h1">{title}</Heading>
                    {status && <StatusTag appearance={status.appearance} spacing="spacious">{status.text}</StatusTag>}
                </div>
                {description && <p data-part="description" style={{ margin: 0, font: 'var(--body-default)', color: 'var(--ds-text-subtle)' }}>{description}</p>}
            </div>
        )}
        actions={actions}
        bottomBar={tabs}
    />
);

/** Page tabs: they switch the whole page. */
export const PageTabs = ({ active = 'overview' }) => (
    <Tabs defaultActiveKey={active} aria-label="Student pages">
        <Tabs.Tab eventKey="overview">Overview</Tabs.Tab>
        <Tabs.Tab eventKey="sessions">Sessions</Tabs.Tab>
        <Tabs.Tab eventKey="notes">Notes</Tabs.Tab>
    </Tabs>
);

/** Two page actions, about the page only. */
export const PageActions = () => (
    <>
        <Button text="Share" onClick={() => {}} />
        <IconButton icon="ellipsis" label="More" appearance="subtle" onClick={() => {}} />
    </>
);

/** A Section's body: three session cards. */
export const SessionCards = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 'var(--grid-gutter)' }}>
        {[['Lincoln Middle', 'Tue 4:30 PM · 6 students'], ['Roosevelt K-8', 'Wed 3:00 PM · 4 students'], ['North High', 'Thu 5:00 PM · 5 students']].map(([t, d]) => (
            <PatternCard key={t} title={t} description={d} />
        ))}
    </div>
);

/** A Section holding the cards under its own title. */
export const CardsSection = ({ title, actions, description }) => (
    <PatternSection title={title} description={description} actions={actions}>
        <SessionCards />
    </PatternSection>
);

/** The collection's view bar: one pill at the start, the labeled Primary that adds a row at the end. */
export const ViewBarWithAdd = () => (
    <div className="plus-section-view-bar" style={{ ...row, inlineSize: '100%' }}>
        <Tabs appearance="pill" defaultActiveKey="all" aria-label="Views">
            <Tabs.Tab eventKey="all">All students</Tabs.Tab>
        </Tabs>
        <div style={{ marginInlineStart: 'auto' }}>
            <Button text="Add student" iconBefore="user-plus" appearance="primary" onClick={() => {}} />
        </div>
    </div>
);

/** The view bar's views as one labeled Select at the start, the form under page tabs. */
export const ViewSelect = () => (
    <div className="plus-section-view-bar" style={{ ...row, inlineSize: '100%' }}>
        <div style={{ inlineSize: 'var(--card-min-width-sm)' }}>
            <Select
                aria-label="Status"
                spacing="compact"
                clearable={false}
                defaultValue="upcoming"
                options={[{ value: 'upcoming', label: 'Upcoming' }, { value: 'past', label: 'Past' }]}
            />
        </div>
    </div>
);

/**
 * The Frame with no sidebar at the stage width, holding a page. `full` lifts the
 * 1232 cap (`width="full"` is planned on the Frame; the story sets the cap
 * token to none on the content box).
 */
export const PageStage = ({ full = false, width = SCENARIO_STAGE, height = STAGE_HEIGHT, children }) => (
    <ReflowStage width={width}>
        {(layout) => (
            <div data-page-stage style={{ inlineSize: layout, height }}>
                <Frame style={full ? { '--content-max-width': 'none' } : undefined}>
                    {children}
                </Frame>
            </div>
        )}
    </ReflowStage>
);

PageStage.propTypes = { full: PropTypes.bool, width: PropTypes.number, height: PropTypes.number, children: PropTypes.node };

/** The banner slot, under the header. */
export const PageBanner = () => <Banner appearance="warning">Tutoring sessions move to the new calendar on Friday.</Banner>;

/** The marker's size, the gutter it sits in and the clearance between two markers in one gutter. */
const GUTTER = 'var(--control-lg)';

/** Closer than this, two markers in one gutter touch: the marker's own size, --control-sm, in px for the layout math. */
const MARKER_CLEARANCE = 24; // docs-literal

/**
 * A live story with a numbered marker on each part. Each marker sits in the
 * gutter on the part's nearer side (start, or end for a part in the right half)
 * and a hairline leader runs level with the part's middle from the marker to
 * the part's edge, so a leader crosses only blank margin. `data-leader` and
 * `data-anatomy-marker` carry each one for the story's play.
 *
 * @param {number} props.width  the stage the story lays out at
 * @param {{selector: string, label: string}[]} props.parts  in Parts-list order
 */
export const PageAnatomy = ({ width, parts, title, children }) => {
    const box = React.useRef(null);
    const [marks, setMarks] = React.useState([]);
    React.useLayoutEffect(() => {
        const root = box.current;
        if (!root) return undefined;
        const read = () => {
            const origin = root.getBoundingClientRect();
            const last = { start: -Infinity, end: -Infinity };
            setMarks(parts.map(({ selector }) => {
                const el = root.querySelector(selector);
                if (!el) return null;
                const r = el.getBoundingClientRect();
                const top = r.top - origin.top;
                const left = r.left - origin.left;
                const nearer = left + r.width / 2 > origin.width / 2 ? 'end' : 'start';
                const sides = [nearer, nearer === 'end' ? 'start' : 'end'];
                // The marker sits level with its part, in the nearer gutter; when the one before it is
                // closer than a marker's height it moves down inside its part, or to the other gutter.
                const fits = (side) => Math.max(top + r.height / 2, last[side] + MARKER_CLEARANCE) <= top + r.height;
                const side = sides.find(fits) ?? nearer;
                const center = fits(side) ? Math.max(top + r.height / 2, last[side] + MARKER_CLEARANCE) : top + r.height / 2;
                last[side] = center;
                return { top, left, width: r.width, height: r.height, center, side, boxWidth: origin.width };
            }));
        };
        read();
        if (typeof ResizeObserver === 'undefined') return undefined;
        const observer = new ResizeObserver(read);
        observer.observe(root);
        root.querySelectorAll('*').forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, [parts]);
    return (
        <figure
            role="img"
            aria-label={`${title}: ${parts.map((p, i) => `${i + 1}, ${p.label}`).join('; ')}`}
            className="not-prose"
            style={{ margin: 0, position: 'relative', paddingInline: GUTTER }}
        >
            <div ref={box} data-anatomy-figure style={{ position: 'relative' }}>
                <ScaledStory width={width}>{children}</ScaledStory>
                {marks.map((m, i) => m && (
                    <React.Fragment key={parts[i].selector}>
                        <span
                            aria-hidden="true"
                            data-anatomy-outline={i + 1}
                            style={{
                                position: 'absolute',
                                top: m.top,
                                left: m.left,
                                width: m.width,
                                height: m.height,
                                outline: 'var(--border-default) dashed var(--ds-border-brand)',
                                borderRadius: 'var(--radius-sm)',
                                pointerEvents: 'none',
                            }}
                        />
                        <span
                            aria-hidden="true"
                            data-leader={i + 1}
                            style={{
                                position: 'absolute',
                                top: m.center,
                                height: 'var(--border-default)',
                                background: 'var(--ds-border-brand)',
                                ...(m.side === 'start'
                                    ? { left: 0, width: m.left }
                                    : { left: m.left + m.width, width: m.boxWidth - m.left - m.width }),
                                pointerEvents: 'none',
                            }}
                        />
                        <span
                            aria-hidden="true"
                            data-anatomy-marker={i + 1}
                            style={{
                                position: 'absolute',
                                top: `calc(${m.center}px - var(--control-sm) / 2)`,
                                ...(m.side === 'start'
                                    ? { left: `calc(-1 * ${GUTTER})` }
                                    : { right: `calc(-1 * ${GUTTER})` }),
                                width: 'var(--control-sm)',
                                height: 'var(--control-sm)',
                                display: 'grid',
                                placeItems: 'center',
                                borderRadius: 'var(--radius-full)',
                                background: 'var(--ds-background-brand-bold)',
                                color: 'var(--ds-text-inverse)',
                                font: 'var(--body-small)',
                                fontWeight: 'var(--type-weight-semibold)',
                            }}
                        >
                            {i + 1}
                        </span>
                    </React.Fragment>
                ))}
            </div>
        </figure>
    );
};

PageAnatomy.propTypes = {
    width: PropTypes.number.isRequired,
    parts: PropTypes.arrayOf(PropTypes.shape({ selector: PropTypes.string.isRequired, label: PropTypes.string.isRequired })).isRequired,
    title: PropTypes.string.isRequired,
    children: PropTypes.node,
};

/** The record page's parts, as the anatomy figure and its play name them, in Parts-list order. */
export const ANATOMY_PARTS = [
    { selector: '.plus-page-header-breadcrumbs', label: 'Breadcrumb' },
    { selector: '[data-part="title-block"] > div', label: 'Title with its StatusTag' },
    { selector: '[data-part="description"]', label: 'Description' },
    { selector: '.plus-page-header-actions', label: 'Page actions' },
    { selector: '.plus-page-header-bottom-bar', label: 'Page tabs' },
    { selector: '.plus-banner', label: 'Banner' },
    { selector: '.plus-pattern-section', label: 'Content' },
];
