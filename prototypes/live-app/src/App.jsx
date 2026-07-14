import React, { Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LiveAppNav, { LiveAppPageFallback } from './LiveAppNav';
import { LiveAppShellProvider } from './LiveAppShellContext';
import {
  AllSessionsPage,
  MySessionsPage,
  SignUpsPage,
  CallOffsPage,
  FillInPage,
  ReflectionPage,
  CreateNewSessionPage,
  ConfirmSessionAvailabilityPage,
  StudentDashboardPage,
  SessionReflectionPage,
  StudentReflectionPage,
  FormFeedbackPage,
  SelfReflectionPage,
} from './toolkitPages';
import './LiveAppNav.scss';

/**
 * Lazy Specs page components — documented product surfaces from Storybook.
 */
const TutorHomePageSkillsOverview = React.lazy(() =>
  import('@/specs/Home/Pages/TutorHomePageSkillsOverview'),
);
const TutorHomePageSkillsProgress = React.lazy(() =>
  import('@/specs/Home/Pages/TutorHomePageSkillsProgress'),
);
const LessonsOverviewPage = React.lazy(() =>
  import('@/specs/Training/Lessons/Pages/LessonsOverviewPage/LessonsOverviewPage'),
);
const LessonsDetailPage = React.lazy(() =>
  import('@/specs/Training/Lessons/Pages/LessonsDetailPage/LessonsDetailPage'),
);
const OnboardingOverviewPage = React.lazy(() =>
  import('@/specs/Training/Onboarding/Pages/OnboardingOverviewPage/OnboardingOverviewPage'),
);
const OnboardingInnerPage = React.lazy(() =>
  import('@/specs/Training/Onboarding/Pages/OnboardingInnerPage/OnboardingInnerPage'),
);
const PostSessionPage = React.lazy(() =>
  import('@/specs/Toolkit/Post-Session/Pages/PostSessionPage/PostSessionPage'),
);
const TutorTrainingProgressPage = React.lazy(() =>
  import('@/specs/Admin/Tutor/Pages/TutorTrainingProgressPage/TutorTrainingProgressPage'),
);
const TutorPerformancePage = React.lazy(() =>
  import('@/specs/Admin/Tutor/Pages/TutorPerformancePage/TutorPerformancePage'),
);
const TutorStatusWarningsPage = React.lazy(() =>
  import('@/specs/Admin/Tutor/Pages/TutorStatusWarningsPage/TutorStatusWarningsPage'),
);
const TutorToolUsagePage = React.lazy(() =>
  import('@/specs/Admin/Tutor/Pages/TutorToolUsagePage/TutorToolUsagePage'),
);
const SessionAdminPage = React.lazy(() =>
  import('@/specs/Admin/Session/Pages/SessionAdminPage/SessionAdminPage'),
);
const StudentAdminPage = React.lazy(() =>
  import('@/specs/Admin/Student/Pages/StudentAdminPage/StudentAdminPage'),
);
const GroupInfoPage = React.lazy(() =>
  import('@/specs/Admin/Group/Pages/GroupInfoPage/GroupInfoPage'),
);
const GroupTrainingProgressPage = React.lazy(() =>
  import('@/specs/Admin/Group/Pages/GroupTrainingProgressPage/GroupTrainingProgressPage'),
);
const TutorProfilePage = React.lazy(() =>
  import('@/specs/Profile/Pages/TutorProfilePage/TutorProfilePage'),
);
const SignInPortal = React.lazy(() =>
  import('@/specs/Login/Pages/SignInPortal/SignInPortal'),
);

/**
 * Layout shell: shell context + collapsible section nav + page outlet.
 *
 * @returns {JSX.Element}
 */
function LiveAppLayout() {
  return (
    <LiveAppShellProvider>
      <div className="live-app-shell">
        <LiveAppNav />
        <div className="live-app-shell__page">
          <Suspense fallback={<LiveAppPageFallback />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
    </LiveAppShellProvider>
  );
}

/**
 * Shared route elements for root SPA and standalone live-app entry.
 *
 * @returns {JSX.Element}
 */
function LiveAppRouteElements() {
  return (
    <>
      <Route path="/home" element={<TutorHomePageSkillsOverview />} />
      <Route path="/home/skills-progress" element={<TutorHomePageSkillsProgress />} />

      <Route path="/training/lessons" element={<LessonsOverviewPage />} />
      <Route path="/training/lessons/detail" element={<LessonsDetailPage />} />
      <Route path="/training/onboarding" element={<OnboardingOverviewPage />} />
      <Route path="/training/onboarding/inner" element={<OnboardingInnerPage />} />

      <Route path="/toolkit/sessions" element={<AllSessionsPage />} />
      <Route path="/toolkit/my-sessions" element={<MySessionsPage />} />
      <Route path="/toolkit/sign-ups" element={<SignUpsPage />} />
      <Route path="/toolkit/call-offs" element={<CallOffsPage />} />
      <Route path="/toolkit/fill-ins" element={<FillInPage />} />
      <Route path="/toolkit/reflection" element={<ReflectionPage />} />
      <Route path="/toolkit/create-session" element={<CreateNewSessionPage />} />
      <Route path="/toolkit/confirm-availability" element={<ConfirmSessionAvailabilityPage />} />
      <Route path="/toolkit/in-session" element={<StudentDashboardPage />} />
      <Route path="/toolkit/post-session" element={<PostSessionPage />} />
      <Route path="/toolkit/session-reflection" element={<SessionReflectionPage />} />
      <Route path="/toolkit/student-reflection" element={<StudentReflectionPage />} />
      <Route path="/toolkit/form-feedback" element={<FormFeedbackPage />} />
      <Route path="/toolkit/self-reflection" element={<SelfReflectionPage />} />

      <Route path="/admin/tutors/training" element={<TutorTrainingProgressPage />} />
      <Route path="/admin/tutors/performance" element={<TutorPerformancePage />} />
      <Route path="/admin/tutors/warnings" element={<TutorStatusWarningsPage />} />
      <Route path="/admin/tutors/tool-usage" element={<TutorToolUsagePage />} />
      <Route path="/admin/sessions" element={<SessionAdminPage />} />
      <Route path="/admin/students" element={<StudentAdminPage />} />
      <Route path="/admin/groups" element={<GroupInfoPage />} />
      <Route path="/admin/groups/training" element={<GroupTrainingProgressPage />} />

      <Route path="/profile" element={<TutorProfilePage />} />
      <Route path="/login" element={<SignInPortal />} />
    </>
  );
}

/**
 * Route tree for the Storybook-spec live app (root SPA).
 *
 * @returns {JSX.Element}
 */
export function LiveAppRoutes() {
  return (
    <Route element={<LiveAppLayout />}>
      {LiveAppRouteElements()}
    </Route>
  );
}

/**
 * Standalone entry used by `npm run dev:live-app` (own BrowserRouter).
 *
 * @returns {JSX.Element}
 */
export default function LiveApp() {
  return (
    <LiveAppShellProvider>
      <div className="live-app-shell">
        <LiveAppNav />
        <div className="live-app-shell__page">
          <Suspense fallback={<LiveAppPageFallback />}>
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              {LiveAppRouteElements()}
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </LiveAppShellProvider>
  );
}
