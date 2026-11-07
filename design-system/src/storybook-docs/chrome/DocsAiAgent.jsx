import React, { useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { AiIcon, IconButton } from '@/components';
import { AiChat, useAiChat } from '@/patterns';
import DocsFab from './DocsFab';
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

/** The floating button's AI agent action: opens chat in the popup. */
const AgentAction = () => {
    const { dispatch } = useAiChat();
    return (
        <DocsFab aiAgent={(
            <IconButton
                shape="circle"
                appearance="primary"
                className="plus-docs-fab__button"
                icon={<AiIcon name="ask" size={24} />}
                label="AI agent"
                tooltip="AI agent"
                onClick={() => dispatch({ type: 'open' })}
            />
        )}
        />
    );
};

/**
 * The Storybook docs' floating button and the AI agent it opens: `AiChat`
 * in its `storybook` variant, answered by a search of the docs themselves
 * (no model and no key). The chat's own button is left out; the AI agent
 * action in the floating button is the way in.
 *
 * The chat sits over the docs: Move to Panel docks it at the right edge.
 */
const DocsAiAgent = ({ loadEntries = loadDocsEntries, hrefFor = docsHref }) => {
    const loaded = useRef(null);
    const respond = useCallback(async (text) => {
        loaded.current ??= loadEntries();
        try {
            return answerDocsQuery(text, await loaded.current, { href: hrefFor });
        } catch (error) {
            loaded.current = null; // a failed load is tried again on the next question
            throw error;
        }
    }, [loadEntries, hrefFor]);

    return (
        <div className="plus-docs-ai">
            <AiChat
                variant="storybook"
                launcher={false}
                linkTarget="_top"
                title="AI agent"
                panelStorageKey="plus-frame-panel-storybook"
                respond={respond}
                starters={[{ id: 'button', label: 'Where is Button?', text: 'Where is Button?' }]}
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
};

export default DocsAiAgent;
