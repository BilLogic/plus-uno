import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const REFLECTION_PROMPTS = [
    { title: "Reflect on student progress", description: "Review Arlene's session performance" },
    { title: "Evaluate session pacing", description: "How did the timing feel?" },
    { title: "Plan next steps", description: "What should we focus on next?" },
];

const FAB_SIZE = 56;
const DISCLOSED_MIN_WIDTH = 768;
const DISCLOSED_MAX_WIDTH = 768;
const PROMPTS_DELAY_MS = 400;
const BUBBLE_STAGGER_MS = 0.06;
const EASE_OUT_SMOOTH = [0.16, 1, 0.3, 1];
const GROW_EASE = [0.22, 0.61, 0.36, 1];

export function CompactReflectionBar({
    onExpand,
    prompts = REFLECTION_PROMPTS,
    className = '',
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showPrompts, setShowPrompts] = useState(false);

    const handleOpen = () => setIsExpanded(true);

    useEffect(() => {
        if (!isExpanded) {
            setShowPrompts(false);
            return;
        }
        const t = setTimeout(() => setShowPrompts(true), PROMPTS_DELAY_MS);
        return () => clearTimeout(t);
    }, [isExpanded]);

    return (
        <div
            className={className}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: 'var(--space-0625, 16px)',
            }}
        >
            <AnimatePresence initial={false}>
                {!isExpanded ? (
                    <motion.button
                        key="fab"
                        type="button"
                        onClick={handleOpen}
                        initial={false}
                        exit={{ opacity: 0, scale: 0.92 }}
                        transition={{ duration: 0.28, ease: EASE_OUT_SMOOTH }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            width: FAB_SIZE,
                            height: FAB_SIZE,
                            padding: 0,
                            border: 'none',
                            borderRadius: '50%',
                            background: 'var(--ds-background-brand-subtlest)',
                            color: 'var(--ds-text-brand)',
                            cursor: 'pointer',
                            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.98 }}
                        aria-label="Open Reflection Assistant"
                    >
                        <ChatFABIcon />
                    </motion.button>
                ) : (
                    <motion.div
                        key="disclosed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: EASE_OUT_SMOOTH }}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                            gap: 'var(--space-0625, 16px)',
                            minWidth: DISCLOSED_MIN_WIDTH,
                            maxWidth: DISCLOSED_MAX_WIDTH,
                            width: DISCLOSED_MAX_WIDTH,
                        }}
                    >
                        {showPrompts && (
                            <motion.div
                                initial="hidden"
                                animate="visible"
                                variants={{
                                    hidden: {},
                                    visible: {
                                        transition: {
                                            staggerChildren: BUBBLE_STAGGER_MS,
                                            delayChildren: 0.05,
                                        },
                                    },
                                }}
                                style={{
                                    display: 'flex',
                                    gap: 'var(--stack-md, 8px)',
                                    flexWrap: 'nowrap',
                                    justifyContent: 'flex-start',
                                    alignItems: 'flex-start',
                                    width: '100%',
                                }}
                            >
                                {prompts.map((prompt, i) => (
                                    <motion.div
                                        key={i}
                                        variants={{
                                            hidden: { opacity: 0, x: -10, scale: 0.97 },
                                            visible: {
                                                opacity: 1,
                                                x: 0,
                                                scale: 1,
                                                transition: {
                                                    type: 'spring',
                                                    stiffness: 320,
                                                    damping: 26,
                                                },
                                            },
                                        }}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => onExpand(prompt.title)}
                                            style={{
                                                padding:
                                                    'var(--pad-y-md, 6px) var(--pad-x-lg, 16px)',
                                                background:
                                                    'var(--ds-surface-container)',
                                                border:
                                                    '1px solid var(--ds-border)',
                                                borderRadius:
                                                    'var(--size-border-radius-radius-300, 12px)',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                fontFamily: 'var(--font-family-body)',
                                                color: 'var(--ds-text)',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontWeight: 600,
                                                    fontSize: 'var(--font-size-body2, 14px)',
                                                }}
                                            >
                                                {prompt.title}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 'var(--font-size-body2, 14px)',
                                                    color: 'var(--ds-text-subtle)',
                                                }}
                                            >
                                                {prompt.description}
                                            </div>
                                        </button>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}

                        <motion.div
                            role="button"
                            tabIndex={0}
                            onClick={() => onExpand()}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    onExpand();
                                }
                            }}
                            initial={{ width: FAB_SIZE, height: FAB_SIZE, opacity: 0.9 }}
                            animate={{ width: '100%', height: FAB_SIZE, opacity: 1 }}
                            transition={{
                                width: { duration: 0.4, ease: GROW_EASE },
                                opacity: { duration: 0.25, ease: EASE_OUT_SMOOTH },
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                gap: 'var(--stack-md, 8px)',
                                padding: '0 16px',
                                minHeight: FAB_SIZE,
                                height: FAB_SIZE,
                                background: 'var(--ds-surface)',
                                border: '1px solid var(--ds-border)',
                                borderRadius: 'var(--size-border-radius-radius-300, 12px)',
                                cursor: 'text',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                overflow: 'hidden',
                                boxSizing: 'border-box',
                            }}
                            aria-label="Open Reflection Assistant"
                        >
                            <PaperclipIcon />
                            <span
                                style={{
                                    flex: 1,
                                    fontFamily: 'var(--font-family-body)',
                                    fontSize: 'var(--font-size-body2, 14px)',
                                    color: 'var(--ds-text-subtle)',
                                }}
                            >
                                Reflect on this session...
                            </span>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function PaperclipIcon() {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--ds-icon-subtle)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            style={{ flexShrink: 0 }}
        >
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
        </svg>
    );
}

function ChatFABIcon() {
    return (
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    );
}
