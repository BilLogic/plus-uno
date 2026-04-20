import { useState, useCallback } from 'react';
import type { SuggestedPrompt } from '../types';

const DEFAULT_PROMPTS: SuggestedPrompt[] = [
  { title: "What's the weather", description: 'in San Francisco?' },
  { title: 'Explain React hooks', description: 'like useState and useEffect' },
];

/**
 * Floating chat bubble: suggested prompts + input + paperclip + send.
 * Fixed above bottom of page; onSubmit switches to Research Chat view.
 */
export function FloatingChatBubble({
  onEnterChat,
  prompts = DEFAULT_PROMPTS,
  className = '',
}: {
  onEnterChat: (input: string) => void;
  prompts?: SuggestedPrompt[];
  className?: string;
}): React.ReactElement {
  const [input, setInput] = useState('');

  const handleSubmit = useCallback(() => {
    onEnterChat(input.trim() || 'Send a message...');
    setInput('');
  }, [input, onEnterChat]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handlePromptClick = useCallback(
    (prompt: SuggestedPrompt) => {
      onEnterChat(`${prompt.title} ${prompt.description}`.trim());
    },
    [onEnterChat]
  );

  return (
    <div
      className={className}
      style={{
        position: 'fixed',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 560,
        padding: '0 var(--size-element-pad-x-lg, 16px)',
        zIndex: 1000,
      }}
    >
      {/* Suggested prompts */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--size-element-gap-sm, 8px)',
          marginBottom: 'var(--size-element-gap-sm, 8px)',
          flexWrap: 'wrap',
        }}
      >
        {prompts.map((prompt, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handlePromptClick(prompt)}
            style={{
              padding: 'var(--size-element-pad-y-md, 6px) var(--size-element-pad-x-lg, 16px)',
              background: 'var(--chat-surface, #e5e7eb)',
              border: '1px solid var(--chat-outline, #d1d5db)',
              borderRadius: 'var(--size-border-radius-radius-300, 12px)',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'var(--font-family-body)',
              color: 'var(--chat-on-surface, #111827)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 'var(--font-size-body2, 14px)' }}>
              {prompt.title}
            </div>
            <div style={{ fontSize: 'var(--font-size-body2, 14px)', color: 'var(--chat-on-surface-muted, #6b7280)' }}>
              {prompt.description}
            </div>
          </button>
        ))}
      </div>

      {/* Input + paperclip + send */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 'var(--size-element-gap-sm, 8px)',
          padding: 'var(--size-element-pad-y-sm, 4px) var(--size-element-pad-x-md, 10px)',
          background: 'var(--chat-surface, #e5e7eb)',
          border: '1px solid var(--chat-outline, #d1d5db)',
          borderRadius: 'var(--size-border-radius-radius-300, 12px)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
        }}
      >
        <PaperclipIcon />
        <input
          type="text"
          placeholder="Send a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Message input"
          style={{
            flex: 1,
            padding: 'var(--size-element-pad-y-md, 6px) 0',
            fontFamily: 'var(--font-family-body)',
            fontSize: 'var(--font-size-body2, 14px)',
            color: 'var(--chat-on-surface, #f9fafb)',
            background: 'transparent',
            border: 'none',
            outline: 'none',
          }}
        />
        <button
          type="button"
          onClick={handleSubmit}
          aria-label="Send message"
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'var(--color-primary, #0472a8)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <ArrowUpIcon />
        </button>
      </div>
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
      stroke="var(--chat-on-surface-muted, #9ca3af)"
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

function ArrowUpIcon(): React.ReactElement {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}
