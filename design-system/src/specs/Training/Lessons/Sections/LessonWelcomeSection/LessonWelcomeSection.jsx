/**
 * LessonWelcomeSection Component
 * 
 * Welcome section with navigation tabs and actionable jumbotron content.
 * Matches Figma design: 63-178182 ("Welcome Row")
 */

import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/actions/Button';
import Badge from '@/components/status-and-loading/Badge';
import './LessonWelcomeSection.scss';

const defaultTabs = [
    { id: 'sign-up', label: 'Sign Up / Edit', selected: true },
    { id: 'session-links', label: 'Session links' },
    { id: 'reflection', label: 'Reflection' }
];

const LessonWelcomeSection = ({
    userName = 'Tutor',
    tabs = defaultTabs,
    activeTab = 'sign-up',
    title = 'Welcome back, Tutor!',
    description = 'Sign up for your next session to continue your journey.',
    primaryAction = { text: 'Sign up now', leadingVisual: 'square-plus', onClick: () => { } },
    secondaryAction = { text: 'View schedule', style: 'secondary', fill: 'filled', onClick: () => { } },
    onTabChange,
    className = '',
    style
}) => {
    const [selectedTab, setSelectedTab] = useState(activeTab);

    const tabRefs = useRef({});

    const handleTabClick = (tabId) => {
        setSelectedTab(tabId);
        if (onTabChange) {
            onTabChange(tabId);
        }
    };

    /*
     * A ROVING TABINDEX NEEDS ARROW KEYS, or it is a cage.
     *
     * `role="tab"` with `tabIndex={-1}` on the unselected tabs is what the ARIA
     * practices describe — one tab stop for the whole set — but only because
     * the arrows do the moving inside it. Without this handler the roving
     * tabindex would make two of the three tabs unreachable by keyboard, which
     * is worse than the `aria-selected` on a plain button it replaced.
     */
    const handleTabKeyDown = (event) => {
        const order = tabs.map((tab) => tab.id);
        const current = order.indexOf(selectedTab);
        const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
        let next = null;
        if (step !== undefined) next = (current + step + order.length) % order.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = order.length - 1;
        if (next === null) return;
        event.preventDefault();
        handleTabClick(order[next]);
        // Selection follows focus, so the newly selected tab is where focus goes.
        const node = tabRefs.current[order[next]];
        if (node) node.focus();
    };

    return (
        <section className={`lesson-welcome-section ${className}`} style={style}>
            <div className="lesson-welcome-section__container">
                <div className="lesson-welcome-section__tabs-container">
                    {/*
                      * `aria-selected` IS NOT ALLOWED ON A BUTTON. It belongs to
                      * roles that have a selected state — `tab`, `option`,
                      * `row` — and axe reported `aria-allowed-attr` on all six
                      * of these. The attribute was doing nothing: which tab was
                      * current was a colour and an underline, and nothing else.
                      *
                      * The fix is the role the markup already means. A `tablist`
                      * around `tab`s makes `aria-selected` legal AND meaningful,
                      * and `aria-controls` points each tab at the panel it
                      * shows, which is what a screen reader follows.
                      */}
                    <div className="lesson-welcome-section__tabs" role="tablist" aria-label="Lesson groups">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                role="tab"
                                id={`lesson-welcome-tab-${tab.id}`}
                                aria-controls="lesson-welcome-panel"
                                ref={(node) => { tabRefs.current[tab.id] = node; }}
                                onKeyDown={handleTabKeyDown}
                                className={`lesson-welcome-section__tab ${selectedTab === tab.id ? 'lesson-welcome-section__tab--selected' : ''}`}
                                onClick={() => handleTabClick(tab.id)}
                                aria-selected={selectedTab === tab.id}
                                tabIndex={selectedTab === tab.id ? 0 : -1}
                            >
                                <span className="lesson-welcome-section__tab-text">
                                    {tab.label}
                                </span>
                                {tab.count !== undefined && (
                                    <Badge
                                        size="b3"
                                        style="primary"
                                        className="lesson-welcome-section__tab-badge"
                                    >
                                        {tab.count}
                                    </Badge>
                                )}
                                {selectedTab === tab.id && (
                                    <div className="lesson-welcome-section__tab-indicator" />
                                )}
                            </button>
                        ))}
                    </div>
                    <div className="lesson-welcome-section__divider" />
                </div>

                <div
                    className="lesson-welcome-section__content"
                    id="lesson-welcome-panel"
                    role="tabpanel"
                    aria-labelledby={`lesson-welcome-tab-${selectedTab}`}
                >
                    <div className="lesson-welcome-section__text">
                        <h2 className="lesson-welcome-section__title h2">
                            {title}
                        </h2>
                        {description && (
                            <p className="lesson-welcome-section__description body1-txt">
                                {description}
                            </p>
                        )}
                    </div>

                    <div className="lesson-welcome-section__actions">
                        {primaryAction && (
                            <Button
                                text={primaryAction.text}
                                style="primary"
                                fill="filled"
                                size="medium"
                                leadingVisual={primaryAction.leadingVisual} // Support icon
                                onClick={primaryAction.onClick}
                            />
                        )}
                        {secondaryAction && (
                            <Button
                                text={secondaryAction.text}
                                style={secondaryAction.style || 'secondary'} // Default to secondary logic
                                fill={secondaryAction.fill || 'filled'} // Assume filled/tonal for secondary
                                size="medium"
                                leadingVisual={secondaryAction.leadingVisual}
                                onClick={secondaryAction.onClick}
                            />
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

LessonWelcomeSection.propTypes = {
    userName: PropTypes.string,
    tabs: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        selected: PropTypes.bool,
        count: PropTypes.number
    })),
    activeTab: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    primaryAction: PropTypes.shape({
        text: PropTypes.string,
        onClick: PropTypes.func,
        leadingVisual: PropTypes.any
    }),
    secondaryAction: PropTypes.shape({
        text: PropTypes.string,
        onClick: PropTypes.func,
        style: PropTypes.string,
        fill: PropTypes.string,
        leadingVisual: PropTypes.any
    }),
    onTabChange: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object
};

export default LessonWelcomeSection;
