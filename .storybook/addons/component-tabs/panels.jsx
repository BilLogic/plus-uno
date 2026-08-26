/**
 * The three authored tabs — Code · Usage · Changelog (#168).
 *
 * Each one is a router, not a second copy of the docs. The manager runs in the
 * browser with no access to the repo's files, so a tab that tried to restate
 * props, guidance or history would be restating them from memory. Instead each
 * tab names the file that holds the thing, links it on GitHub, and says plainly
 * when the thing is not written yet.
 *
 * The one exception is Changelog, whose entries a component declares in its own
 * story meta and which therefore reach the manager as parameters.
 */
import React from 'react';
import { EmptyTabContent, Link } from 'storybook/internal/components';
import { useParameter, useStorybookApi, useStorybookState } from 'storybook/manager-api';
import { styled } from 'storybook/theming';

import { CHANGELOG_ADOPTED, componentIdentity, normaliseChangelog } from './contract.js';

const REPO = 'https://github.com/BilLogic/plus-uno';

/** GitHub serves files under /blob and folders under /tree; a path with no extension is a folder. */
const githubUrl = (path) => `${REPO}/${/\.[a-z0-9]+$/i.test(path) ? 'blob' : 'tree'}/main/${path}`;

/**
 * Storybook drops tab content into a centred grid cell with `align-items:
 * center`. A plain `width: 100%` resolves against a grid area the panel is
 * itself sizing, so it changes nothing; `minWidth` and `alignSelf` are what
 * actually make the panel fill the canvas instead of floating in the middle of it.
 */
const Wrapper = styled.div(({ theme }) => ({
  alignSelf: 'stretch',
  background: theme.background.content,
  color: theme.color.defaultText,
  fontSize: theme.typography.size.s2,
  minWidth: '100%',
  overflow: 'auto',
  padding: '24px 28px 40px',
}));

const Heading = styled.h2(({ theme }) => ({
  fontSize: theme.typography.size.s3,
  fontWeight: theme.typography.weight.bold,
  margin: '0 0 4px',
}));

const Lede = styled.p(({ theme }) => ({
  color: theme.textMutedColor,
  lineHeight: 1.6,
  margin: '0 0 20px',
  maxWidth: '62ch',
}));

const Rows = styled.dl({
  display: 'grid',
  gap: '6px 20px',
  gridTemplateColumns: 'max-content minmax(0, 1fr)',
  margin: '0 0 20px',
});

const Term = styled.dt(({ theme }) => ({
  color: theme.textMutedColor,
  margin: 0,
  whiteSpace: 'nowrap',
}));

const Detail = styled.dd({
  margin: 0,
  minWidth: 0,
  overflowWrap: 'anywhere',
});

const Snippet = styled.pre(({ theme }) => ({
  background: theme.background.hoverable,
  border: `1px solid ${theme.appBorderColor}`,
  borderRadius: theme.appBorderRadius,
  fontFamily: theme.typography.fonts.mono,
  fontSize: theme.typography.size.s1,
  margin: '0 0 20px',
  overflowX: 'auto',
  padding: '10px 12px',
}));

const Entry = styled.li(({ theme }) => ({
  borderTop: `1px solid ${theme.appBorderColor}`,
  display: 'grid',
  gap: '2px 16px',
  gridTemplateColumns: 'max-content minmax(0, 1fr)',
  padding: '10px 0',
}));

const When = styled.span(({ theme }) => ({
  color: theme.textMutedColor,
  fontFamily: theme.typography.fonts.mono,
  fontSize: theme.typography.size.s1,
}));

const Entries = styled.ol({ listStyle: 'none', margin: 0, padding: 0 });

/**
 * A repo path, rendered as the link a human can actually follow. `cancel` is
 * Storybook's `Link` calling `preventDefault` by default — off, or the anchor
 * looks like a link and does nothing.
 */
const FileLink = ({ path }) => (
  <Link cancel={false} href={githubUrl(path)} target="_blank" rel="noreferrer">
    <code>{path}</code>
  </Link>
);

/** The entry the manager currently has selected, story or docs alike. */
function useCurrentEntry() {
  const api = useStorybookApi();
  const { storyId, refId } = useStorybookState();
  return api.getData(storyId, refId);
}

/**
 * Wraps a tab body so every tab answers the not-a-component case identically.
 * Foundations, patterns and specs pages share the toolbar with components —
 * Storybook's tab bar is global — so saying so is better than rendering a
 * component-shaped panel about something that is not a component.
 */
const ForComponent = ({ tab, children }) => {
  const entry = useCurrentEntry();
  const component = componentIdentity(entry);

  if (!component) {
    return (
      <Wrapper>
        <EmptyTabContent
          title={`${tab} is for components`}
          description={
            <>
              {entry?.title ? <code>{entry.title}</code> : 'This page'} is not a component under{' '}
              <code>design-system/src/components/</code>. Its documentation is the page itself.
            </>
          }
        />
      </Wrapper>
    );
  }

  return <Wrapper>{children(component, entry)}</Wrapper>;
};

/**
 * Code — where the component is implemented and where its generated facts live.
 *
 * Props, variants, defaults and tokens are deliberately NOT repeated here. They
 * are generated into one flat `index.md` per component, and that file is what an
 * agent reads. Copying it into a tab would create a second corpus to keep in
 * sync — the failure the generated docs were built to end.
 */
export const CodePanel = () => (
  <ForComponent tab="Code">
    {(component) => (
      <>
        <Heading>{component.name}</Heading>
        <Lede>Where this component is implemented, and where its generated facts live.</Lede>

        <Snippet>{`import { ${component.name} } from '@/components';`}</Snippet>

        <Rows>
          <Term>Source</Term>
          <Detail>
            <FileLink path={component.source} />
          </Detail>
          <Term>This page</Term>
          <Detail>
            <FileLink path={component.entryFile} />
          </Detail>
          <Term>Generated facts</Term>
          <Detail>
            <FileLink path={component.generatedDoc} />
          </Detail>
          <Term>Group index</Term>
          <Detail>
            <FileLink path={component.groupIndex} />
          </Detail>
        </Rows>

        <Lede>
          Props, variants, defaults and tokens touched are derived from the source into that one
          generated file by <code>npm run generate:component-docs</code>. It is not split across
          these tabs: the tabs are for humans, the file is what an agent reads.
        </Lede>
      </>
    )}
  </ForComponent>
);

/**
 * Usage — the authored half: when to use, when not, correct/incorrect pairs,
 * accessibility. Whether a given component has any of it is counted in the
 * group index, which is the only place that count is true.
 */
export const UsagePanel = () => (
  <ForComponent tab="Usage">
    {(component) => (
      <>
        <Heading>Using {component.name}</Heading>
        <Lede>
          When to use it, when not to, the correct/incorrect pairs and the accessibility notes are
          authored on the component&rsquo;s own docs page — the <strong>Examples</strong> tab — and
          counted per group. Components are documented as they are found to need it, so a component
          may have none of this yet; the group index says which.
        </Lede>

        <Rows>
          <Term>This page</Term>
          <Detail>
            <FileLink path={component.entryFile} />
          </Detail>
          <Term>Coverage</Term>
          <Detail>
            <FileLink path={component.groupIndex} />
          </Detail>
          <Term>System guidance</Term>
          <Detail>
            <FileLink path="design-system/guidelines/components/overview.md" />
          </Detail>
        </Rows>
      </>
    )}
  </ForComponent>
);

/**
 * Changelog — what changed about this component, from the day the convention
 * was adopted. Nothing is backfilled; see `changelog.md` in the guidelines for
 * why, and for what happens if entries stop being written.
 */
export const ChangelogPanel = () => {
  const declared = useParameter('changelog', undefined);
  const entries = normaliseChangelog(declared);

  return (
    <ForComponent tab="Changelog">
      {(component) =>
        entries.length ? (
          <>
            <Heading>{component.name}</Heading>
            <Lede>Declared in this component&rsquo;s story meta, newest first.</Lede>
            <Entries>
              {entries.map((entry) => (
                <Entry key={`${entry.date}-${entry.summary}`}>
                  <When>{entry.date}</When>
                  <span>
                    {entry.kind ? <strong>{entry.kind}</strong> : null}
                    {entry.kind ? ' — ' : null}
                    {entry.summary}
                  </span>
                </Entry>
              ))}
            </Entries>
          </>
        ) : (
          <EmptyTabContent
            title="No entries yet"
            description={
              <>
                Component changelogs start on {CHANGELOG_ADOPTED} and are never backfilled — nothing
                in this repo recorded per-component history before that date, so an invented history
                would be worse than an empty one.
              </>
            }
            footer={
              <>
                Record a change as <code>parameters.changelog</code> in the story meta under{' '}
                <FileLink path={component.dir} />. The convention is{' '}
                <FileLink path="design-system/guidelines/components/changelog.md" />.
              </>
            }
          />
        )
      }
    </ForComponent>
  );
};
