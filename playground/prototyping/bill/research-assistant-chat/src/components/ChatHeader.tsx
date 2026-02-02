import type { ReactNode } from 'react';

/**
 * Chat header: "Research Assistant" with icon-only back button.
 * Uses PLUS tokens for typography and spacing.
 */
export function ChatHeader({
  onBack,
  className = '',
}: {
  onBack?: () => void;
  className?: string;
}): ReactNode {
  return (
    <header
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 0,
        padding: '0 0 16px 0',
        width: '100%',
        height: 'fit-content',
        borderBottom: '1px solid var(--chat-outline, #d1d5db)',
        fontFamily: 'var(--font-family-header, Lato)',
        background: 'var(--chat-bg, #f9fafb)',
      }}
    >
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to Tutors"
          style={{
            padding: 'var(--size-element-pad-y-sm, 4px) var(--size-element-pad-x-sm, 8px)',
            color: 'var(--color-primary)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <BackArrowIcon />
        </button>
      )}
      <h2
        style={{
          margin: 0,
          fontSize: 'var(--font-size-h4, 18px)',
          fontWeight: 'var(--font-weight-semibold-2, 600)',
          color: 'var(--chat-on-surface, #111827)',
        }}
      >
        Tutor Performance Insights
      </h2>
    </header>
  );
}

/**
 * Back arrow icon (chevron left).
 */
function BackArrowIcon(): ReactNode {
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
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
