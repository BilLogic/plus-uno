/**
 * The component docs page's tab strip — Examples · Code · Usage · Changelog,
 * rendered INSIDE the page, below the title (ADR-025).
 *
 * WHY THIS IS NOT A STORYBOOK ADDON. It was, until #168's `types.TAB`
 * registrations were retired. Storybook's preview toolbar
 * (`section.sb-bar[data-testid="sb-preview-toolbar"]`) lives in the MANAGER
 * document; `<Title />` renders inside the preview iframe. Two documents, so no
 * CSS and no `previewTabs` config can place that toolbar below the title. The
 * order the design asks for — title, then tabs, then content — is only
 * reachable from in here.
 *
 * Two things came free with the move, both consequences of the toolbar being
 * manager chrome:
 *
 *   - Storybook filters TOOLS by their `match` and never tabs, so every entry in
 *     the sidebar got all four — a Colors foundation page offered a Usage tab
 *     because there was no mechanism to withhold one. A tab now exists only
 *     where its content does.
 *   - The manager is a browser bundle with no repo access, so Code and Usage
 *     could only ever be links out to GitHub. In the preview that constraint is
 *     gone, which is why Code renders a real props table.
 *
 * THE URL. The addon tabs put the active tab in the MANAGER's query string —
 * `?path=/docs/components-actions-button--docs&tab=plus-usage`, with Examples
 * being the ABSENCE of the param. Measured, not assumed. Those URLs have been
 * shared, so this reads and writes that same param in that same window, and
 * `TABS` keeps the same `plus-*` ids. A `tab` value matching no registered addon
 * is passed through by Storybook and simply deselects its toolbar tabs, so old
 * links keep working after the retirement rather than erroring.
 */
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArgTypes, useOf } from '@storybook/addon-docs/blocks';

import { CHANGELOG_ADOPTED, TABS, normaliseChangelog } from './lib/component-tabs-contract.js';

/**
 * The window whose query string holds the tab — the manager's, normally.
 *
 * Both documents are served from one origin, so reaching `window.parent` is
 * allowed. The try/catch is for the case that is not a Storybook at all: opening
 * `iframe.html` directly, or an embed on another origin, where the docs page is
 * still expected to work and simply owns its own URL.
 */
function tabWindow() {
  try {
    if (window.parent && window.parent !== window && typeof window.parent.location.search === 'string') {
      return window.parent;
    }
  } catch {
    // Cross-origin parent: fall through and use our own window.
  }
  return window;
}

/** @returns {string | null} The `tab` query value, or null when absent or unreadable. */
function readTabParam(win) {
  try {
    return new URLSearchParams(win.location.search).get('tab');
  } catch {
    return null;
  }
}

/**
 * `replaceState`, not `pushState`: switching tabs is not a navigation, and
 * stacking history entries would make Back walk the tabs instead of leaving the
 * page. Failing to write the URL must never break the page, hence the catch.
 */
function writeTabParam(win, id) {
  try {
    // Edited as TEXT, not through `URLSearchParams`. Storybook writes
    // `?path=/docs/components-actions-button--docs` with the slashes unencoded;
    // a round-trip through `URL` re-encodes them to `%2F`, and while the page
    // still loads, the link a reader copies stops matching the one Storybook
    // produced. Every parameter that is not `tab` keeps its exact bytes.
    const pairs = win.location.search
      .replace(/^\?/, '')
      .split('&')
      .filter((pair) => pair && !/^tab=/.test(pair));
    if (id) pairs.push(`tab=${id}`);
    const query = pairs.length ? `?${pairs.join('&')}` : '';
    win.history.replaceState(null, '', `${win.location.pathname}${query}${win.location.hash}`);
  } catch {
    // A read-only or cross-origin location: the tab still switches, it just
    // cannot be linked to.
  }
}

/**
 * A tab whose content is authored in MDX. Only `examples` and `usage` are ever
 * authored — Code and Changelog are derived, so a page never declares them.
 *
 * This component renders nothing itself; `DocsTabs` reads its props off the
 * element and renders the active one. That is what makes tab membership
 * explicit and greppable, which
 * `design-system/tests/component-tabs-contract.test.js` then holds to.
 */
export function DocsTab({ children }) {
  return <>{children}</>;
}

/**
 * The Code tab. Generated, never authored.
 *
 * `ArgTypes` derives the props table from the story meta, so it cannot drift
 * from the component the way a hand-written table does. The full source is
 * deliberately NOT inlined: it would put every component file into the docs
 * bundle to duplicate something GitHub already renders better, with history.
 */
function CodeTabPanel({ of }) {
  return (
    <div className="sb-ds-doc-section">
      <h2>Props</h2>
      <ArgTypes of={of} />
    </div>
  );
}

/** The Changelog tab. Entries come from the story meta, newest first. */
function ChangelogTabPanel({ entries }) {
  return (
    <div className="sb-ds-doc-section">
      <h2>Changelog</h2>
      <dl className="sb-ds-changelog">
        {entries.map((entry) => (
          <React.Fragment key={`${entry.date}-${entry.summary}`}>
            <dt>
              <time dateTime={entry.date}>{entry.date}</time>
              {entry.kind ? <span className="sb-ds-changelog__kind">{entry.kind}</span> : null}
            </dt>
            <dd>{entry.summary}</dd>
          </React.Fragment>
        ))}
      </dl>
      <p className="sb-ds-changelog__adopted">
        Component changelogs start {CHANGELOG_ADOPTED}. Nothing before it is recorded, because
        nothing produced a component changelog before it.
      </p>
    </div>
  );
}

/**
 * The tab strip and the active panel.
 *
 * @param {object} props
 * @param {unknown} [props.of] The story meta, as `<DocsTabs of={ButtonStories}>`.
 *   Supplies both the props table and the changelog entries.
 * @param {string} [props.examplesTitle] Renames the FIRST tab only. Atlassian's
 *   own token page reads "All tokens" where Button reads "Examples"; Code, Usage
 *   and Changelog mean the same thing on every page and are not renameable.
 * @param {React.ReactNode} props.children One `<DocsTab tab="examples">` and, when
 *   the page has usage content, one `<DocsTab tab="usage">`.
 */
export function DocsTabs({ of, examplesTitle, children }) {
  const authored = useMemo(() => {
    const found = {};
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.props?.tab) found[child.props.tab] = child;
    });
    return found;
  }, [children]);

  const resolved = useOf(of || 'meta');
  const entries = useMemo(
    () => normaliseChangelog(resolved?.preparedMeta?.parameters?.changelog ?? resolved?.parameters?.changelog),
    [resolved],
  );

  /**
   * Whether there is a props table to show at all.
   *
   * `ArgTypes` renders "This story has no controls" rather than nothing when a
   * meta has none, and a tab whose whole content is that sentence is the empty
   * tab this component exists to avoid. Measured: the Design tokens page — which
   * is a page, not a component — produced exactly that, while Button produced 13
   * rows. Rows excluded from the table (`table.disable`) do not count, because
   * they are not rendered either.
   */
  const argCount = useMemo(() => {
    const argTypes = resolved?.preparedMeta?.argTypes ?? resolved?.argTypes ?? {};
    return Object.values(argTypes).filter((arg) => !arg?.table?.disable).length;
  }, [resolved]);

  /**
   * Which tabs exist on THIS page. A tab with nothing to show is not rendered
   * empty, it is absent — 30 of the 48 component pages have no usage content,
   * and no component has declared a changelog entry yet, so an always-present
   * Changelog would put a permanently empty tab on every page to prove a
   * mechanism exists.
   */
  const present = useMemo(
    () =>
      TABS.filter(({ key }) => {
        if (key === 'examples') return true;
        if (key === 'code') return argCount > 0;
        if (key === 'changelog') return entries.length > 0;
        return Boolean(authored[key]);
      }).map((tab) => (tab.key === 'examples' && examplesTitle ? { ...tab, title: examplesTitle } : tab)),
    [argCount, authored, entries.length, examplesTitle],
  );

  const win = useMemo(() => tabWindow(), []);
  const keyForId = useCallback(
    (id) => present.find((tab) => tab.id === id)?.key ?? 'examples',
    [present],
  );
  const [active, setActive] = useState(() => keyForId(readTabParam(win)));

  // The URL can change without us: Back/Forward, or the sidebar moving to
  // another component while a tab is open.
  useEffect(() => {
    const sync = () => setActive(keyForId(readTabParam(win)));
    win.addEventListener('popstate', sync);
    return () => win.removeEventListener('popstate', sync);
  }, [keyForId, win]);

  // A page whose usage content is removed should not keep showing a Usage tab
  // because the URL still names one.
  useEffect(() => {
    if (!present.some((tab) => tab.key === active)) setActive('examples');
  }, [active, present]);

  const select = useCallback(
    (tab) => {
      setActive(tab.key);
      writeTabParam(win, tab.id);
    },
    [win],
  );

  const baseId = useId();
  const tabRefs = useRef({});

  /** Left/Right move between tabs, Home/End to the ends — WAI-ARIA tabs pattern. */
  const onKeyDown = (event) => {
    const index = present.findIndex((tab) => tab.key === active);
    const last = present.length - 1;
    let next = null;
    if (event.key === 'ArrowRight') next = index === last ? 0 : index + 1;
    else if (event.key === 'ArrowLeft') next = index === 0 ? last : index - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = last;
    if (next === null) return;
    event.preventDefault();
    select(present[next]);
    tabRefs.current[present[next].key]?.focus();
  };

  if (present.length <= 1) return <>{authored.examples ?? null}</>;

  const activeTab = present.find((tab) => tab.key === active) ?? present[0];

  return (
    <div className="sb-ds-docs-tabs">
      <div className="sb-ds-docs-tabs__strip" role="tablist" onKeyDown={onKeyDown}>
        {present.map((tab) => {
          const selected = tab.key === activeTab.key;
          return (
            <button
              type="button"
              key={tab.key}
              id={`${baseId}-tab-${tab.key}`}
              ref={(el) => {
                tabRefs.current[tab.key] = el;
              }}
              role="tab"
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.key}`}
              // Roving tabindex: one stop for the whole strip, arrows move within it.
              tabIndex={selected ? 0 : -1}
              className={`sb-ds-docs-tabs__tab${selected ? ' sb-ds-docs-tabs__tab--active' : ''}`}
              onClick={() => select(tab)}
            >
              {tab.title}
            </button>
          );
        })}
      </div>

      {/*
        Only the active panel is rendered. Keeping the others behind `display:
        none` would put three tabs' worth of headings in one document — breaking
        the outline, colliding ids between tabs, and filling the "On this page"
        TOC with headings the reader cannot see.
      */}
      <div
        role="tabpanel"
        id={`${baseId}-panel-${activeTab.key}`}
        aria-labelledby={`${baseId}-tab-${activeTab.key}`}
        tabIndex={0}
        className="sb-ds-docs-tabs__panel"
      >
        {activeTab.key === 'code' ? (
          <CodeTabPanel of={of} />
        ) : activeTab.key === 'changelog' ? (
          <ChangelogTabPanel entries={entries} />
        ) : (
          (authored[activeTab.key] ?? null)
        )}
      </div>
    </div>
  );
}
