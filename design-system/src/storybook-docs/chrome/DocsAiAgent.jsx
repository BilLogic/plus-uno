import React, { useCallback, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { AiIcon, IconButton } from '@/components';
import { AiChat, useAiChat } from '@/patterns';
import DocsFab from './DocsFab';
import { createAgentResponder } from './docsAgent';
import { interceptDocsLinks, navigateInPlace } from './docsNavigate';
import { answerDocsQuery, buildDocsEntries, parseComponentNames } from './docsSearch';
import './DocsAiAgent.scss';

/** The pages the docs list: Storybook's index.json beside the preview, plus the generated component index's names. */
export const loadDocsEntries = async () => {
    const [index, markdown] = await Promise.all([
        fetch(new URL('./index.json', window.location.href)).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        import('../../../agent-views/components/index.md?raw').then((m) => m.default).catch(() => ''),
    ]);
    return buildDocsEntries(index, parseComponentNames(markdown));
};

/** A docs page's address from the preview frame: Storybook's root is where `iframe.html` lives. */
export const docsHref = (id, type) => (
    new URL(`./?path=/${type === 'docs' ? 'docs' : 'story'}/${id}`, window.location.href).href
);

/** The floating button's AI chat action: opens chat in the popup. */
const AgentAction = () => {
    const { dispatch } = useAiChat();
    return (
        <DocsFab aiAgent={(
            <IconButton
                shape="circle"
                className="plus-docs-fab__button"
                icon={<AiIcon name="ask" size={24} />}
                label="AI chat"
                tooltip="AI chat"
                onClick={() => dispatch({ type: 'open' })}
            />
        )}
        />
    );
};

/**
 * The Storybook docs' floating button and the AI agent it opens: `AiChat`
 * in its `storybook` variant, answered by the docs-agent Netlify function
 * (Gemini on Vertex, credentials server-side) and, when that errors or is
 * rate limited, by a search of the docs themselves. The chat's own button is left out; the AI chat
 * action in the floating button is the way in.
 *
 * The chat sits over the docs: Move to Panel docks it at the right edge.
 * Its links to docs pages, and the pages it is asked to open, switch pages
 * in place (`docsNavigate`), so the conversation stays open.
 */
const DocsAiAgent = ({ loadEntries = loadDocsEntries, hrefFor = docsHref, fetchFn, navigate = navigateInPlace }) => {
    const loaded = useRef(null);
    const pages = useCallback(async () => {
        loaded.current ??= loadEntries();
        try {
            return await loaded.current;
        } catch (error) {
            loaded.current = null; // a failed load is tried again on the next question
            throw error;
        }
    }, [loadEntries]);
    const search = useCallback(async (text) => answerDocsQuery(text, await pages(), { href: hrefFor }), [pages, hrefFor]);
    const respond = useMemo(
        () => createAgentResponder({ fetchFn, search, pages, href: hrefFor, navigate }),
        [fetchFn, search, pages, hrefFor, navigate],
    );
    // A docs link in the chat switches pages in place, so the conversation stays open.
    const onClickCapture = useMemo(() => interceptDocsLinks(navigate), [navigate]);

    return (
        // The click is the links' own (Enter on a link fires it too); the container only reroutes it.
        <div className="plus-docs-ai" onClickCapture={onClickCapture}>
            <AiChat
                variant="storybook"
                launcher={false}
                linkTarget="_top"
                title="AI chat"
                placeholder="Ask about the design system"
                emptyText="Ask where a component, token or pattern lives, how to use it, or to open a page."
                panelStorageKey="plus-frame-panel-storybook"
                respond={respond}
                starters={[
                    { id: 'button', label: 'When do I use Button or Link?', text: 'When do I use Button or Link?' },
                    { id: 'spacing', label: 'Which spacing tokens go between fields?', text: 'Which spacing tokens go between fields?' },
                    { id: 'open', label: 'Take me to Color', text: 'Take me to Color' },
                ]}
            >
                <AgentAction />
            </AiChat>
        </div>
    );
};

DocsAiAgent.propTypes = {
    /** Resolves the entries the agent searches; the default reads the site's index.json. */
    loadEntries: PropTypes.func,
    /** `(id, type) => href` for a docs page. */
    hrefFor: PropTypes.func,
    /** The fetch the agent's function call goes through; the default is the browser's. */
    fetchFn: PropTypes.func,
    /** Opens a docs address in place, true when it did; the default asks Storybook's manager over its channel. */
    navigate: PropTypes.func,
};

export default DocsAiAgent;
