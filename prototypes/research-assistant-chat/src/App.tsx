import React from 'react';
import { TutorAdminWithChatView } from './views/TutorAdminWithChatView';

/**
 * App root: Tutor Admin with integrated Research Assistant.
 * Content lives inside PageLayout's plus-page-content-wrapper. On click of the
 * compact chat text bar, training content dissolves out and full chat grows in.
 */
export default function App(): React.ReactElement {
  return <TutorAdminWithChatView />;
}
