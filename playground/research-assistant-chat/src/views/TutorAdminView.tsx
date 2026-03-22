import React from 'react';
import { FloatingChatBubble } from '../components/FloatingChatBubble';
/** Tutor Training Progress page from design system – matches the spec exactly. */
import TutorTrainingProgressPage from '@plus-ds/specs/Admin/Tutor Admin/Pages/TutorTrainingProgressPage/TutorTrainingProgressPage.jsx';

/**
 * Tutor Admin starting view: design system TutorTrainingProgressPage (sidebar, tabs,
 * overview cards, training details table) with FloatingChatBubble at bottom.
 */
export function TutorAdminView({
  onEnterChat,
  className = '',
}: {
  onEnterChat: (input: string) => void;
  className?: string;
}): React.ReactElement {
  return (
    <div
      className={className}
      style={{
        minHeight: '100vh',
        position: 'relative',
        paddingBottom: 180,
      }}
    >
      <TutorTrainingProgressPage />
      <FloatingChatBubble onEnterChat={onEnterChat} />
    </div>
  );
}
