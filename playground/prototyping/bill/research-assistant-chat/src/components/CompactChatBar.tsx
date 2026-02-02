import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SuggestedPrompt } from '../types';

const TUTORING_PROMPTS: SuggestedPrompt[] = [
  { title: 'Compare engagement', description: 'novice vs experienced tutors' },
  { title: 'What strategies correlate', description: 'with student breakthroughs?' },
  { title: 'Which tutors need', description: 'support with pacing?' },
];

/** FAB size (px); entry bar matches this height. */
const FAB_SIZE = 56;
/** Disclosed container width: at least 2× previous (768). */
const DISCLOSED_MIN_WIDTH = 768;
const DISCLOSED_MAX_WIDTH = 768;

/** Delay after entry bar grow-in before showing prompt bubbles (ms). */
const PROMPTS_DELAY_MS = 400;
/** Stagger between each bubble (ms). */
const BUBBLE_STAGGER_MS = 0.06;

/** Easing: smooth deceleration at end (feels natural for enter/exit). */
const EASE_OUT_SMOOTH = [0.16, 1, 0.3, 1];
/** Ease-out for width/opacity so bar “grows fully” without spring overshoot. */
const GROW_EASE = [0.22, 0.61, 0.36, 1];

/**
 * Compact chat bar: FAB when idle; on click grows into chat entry bar first,
 * then suggested prompts appear as free bubbles (left to right, dissolve-in).
 * No outer container around prompts.
 */
export function CompactChatBar({
  onExpand,
  prompts = TUTORING_PROMPTS,
  className = '',
}: {
  onExpand: () => void;
  prompts?: SuggestedPrompt[];
  className?: string;
}): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);

  /** On click: open disclosed state. */
  const handleOpen = () => setIsExpanded(true);

  /** After entry bar grows in, reveal prompt bubbles. */
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
        gap: 'var(--size-element-gap-md, 16px)',
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
              background: 'var(--color-primary-container, #d0bcff)',
              color: 'var(--color-on-primary-container, #381e72)',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            aria-label="Open Research Assistant"
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
              gap: 'var(--size-element-gap-md, 16px)',
              minWidth: DISCLOSED_MIN_WIDTH,
              maxWidth: DISCLOSED_MAX_WIDTH,
              width: DISCLOSED_MAX_WIDTH,
            }}
          >
            {/* Suggested bubbles on top of chat entry */}
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
                  gap: 'var(--size-element-gap-sm, 8px)',
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
                      onClick={onExpand}
                      style={{
                        padding:
                          'var(--size-element-pad-y-md, 6px) var(--size-element-pad-x-lg, 16px)',
                        background:
                          'var(--color-surface-container-high, #f0f2f5)',
                        border:
                          '1px solid var(--color-outline-variant, #bec8ca)',
                        borderRadius:
                          'var(--size-border-radius-radius-300, 12px)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: 'var(--font-family-body)',
                        color: 'var(--color-on-surface, #191c1e)',
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
                          color: 'var(--color-on-surface-variant)',
                        }}
                      >
                        {prompt.description}
                      </div>
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Chat entry bar: same height as FAB, grows from 56px to full width with smooth ease */}
            <motion.div
              role="button"
              tabIndex={0}
              onClick={onExpand}
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
                gap: 'var(--size-element-gap-sm, 8px)',
                padding: '0 16px',
                minHeight: FAB_SIZE,
                height: FAB_SIZE,
                background: 'var(--color-surface-container-lowest, #fff)',
                border: '1px solid var(--color-outline-variant, #bec8ca)',
                borderRadius: 'var(--size-border-radius-radius-300, 12px)',
                cursor: 'text',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                overflow: 'hidden',
                boxSizing: 'border-box',
              }}
              aria-label="Open Research Assistant"
            >
              <PaperclipIcon />
              <span
                style={{
                  flex: 1,
                  fontFamily: 'var(--font-family-body)',
                  fontSize: 'var(--font-size-body2, 14px)',
                  color: 'var(--color-on-surface-variant, #6b7280)',
                }}
              >
                Ask the Research Assistant…
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PaperclipIcon(): React.ReactElement {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--color-on-surface-variant, #6b7280)"
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

/** Icon for FAB: chat / message bubble. */
function ChatFABIcon(): React.ReactElement {
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
