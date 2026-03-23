import React from 'react';
import { ResearchAssistantChat } from '../ResearchAssistantChat';

/**
 * Research Chat view: full chat UI (700×800) with back control.
 * onBack returns to Tutor Admin view.
 */
export function ResearchChatView({
  onBack,
  className = '',
}: {
  onBack: () => void;
  className?: string;
}): React.ReactElement {
  return (
    <div
      className={className}
      style={{
        minHeight: '100vh',
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-surface, #f9f9fc)',
      }}
    >
      <ResearchAssistantChat onBack={onBack} />
    </div>
  );
}
