import React from 'react';

/**
 * Lazy loaders that adapt Storybook story Overview exports into route pages.
 * Pre-Session Toolkit surfaces live as story compositions, not standalone page modules.
 */

/**
 * @param {() => Promise<Record<string, unknown>>} importer
 * @param {string} exportName
 * @returns {React.LazyExoticComponent<React.ComponentType>}
 */
function lazyStoryExport(importer, exportName = 'Overview') {
  return React.lazy(() =>
    importer().then((mod) => {
      const Comp = mod[exportName];
      if (!Comp) {
        throw new Error(`Missing story export "${exportName}"`);
      }
      if (typeof Comp === 'function') {
        return { default: Comp };
      }
      if (Comp && typeof Comp === 'object' && typeof Comp.render === 'function') {
        /**
         * @param {Record<string, unknown>} props
         */
        const Wrapped = (props) => Comp.render({ ...Comp.args, ...props });
        Wrapped.displayName = `Story_${exportName}`;
        return { default: Wrapped };
      }
      throw new Error(`Unsupported story export "${exportName}"`);
    }),
  );
}

/** Pre-Session Toolkit pages */
export const AllSessionsPage = lazyStoryExport(
  () => import('@/specs/Toolkit/Pre-Session/Pages/AllSessions.stories'),
);
export const MySessionsPage = lazyStoryExport(
  () => import('@/specs/Toolkit/Pre-Session/Pages/MySessions.stories'),
);
export const SignUpsPage = lazyStoryExport(
  () => import('@/specs/Toolkit/Pre-Session/Pages/SignUps.stories'),
);
export const CallOffsPage = lazyStoryExport(
  () => import('@/specs/Toolkit/Pre-Session/Pages/CallOffs.stories'),
);
export const FillInPage = lazyStoryExport(
  () => import('@/specs/Toolkit/Pre-Session/Pages/FillIn.stories'),
  'OverviewTutor',
);
export const ReflectionPage = lazyStoryExport(
  () => import('@/specs/Toolkit/Pre-Session/Pages/Reflection.stories'),
);
export const CreateNewSessionPage = lazyStoryExport(
  () => import('@/specs/Toolkit/Pre-Session/Pages/CreateNewSession.stories'),
);
export const ConfirmSessionAvailabilityPage = lazyStoryExport(
  () => import('@/specs/Toolkit/Pre-Session/Pages/ConfirmSessionAvailability.stories'),
);

/** In-Session */
export const StudentDashboardPage = lazyStoryExport(
  () => import('@/specs/Toolkit/In-Session/Pages/StudentDashboard.stories'),
);

/** Post-Session — Storybook page compositions (same pattern as Pre-Session) */
export const ReflectionFlowPage = lazyStoryExport(
  () => import('@/specs/Toolkit/Post-Session/Pages/ReflectionFlow/ReflectionFlow.stories.jsx'),
  'Default',
);
export const SessionInfoPage = lazyStoryExport(
  () => import('@/specs/Toolkit/Post-Session/Pages/SessionInfo/SessionInfo.stories.jsx'),
  'Default',
);
export const SessionReflectionPage = lazyStoryExport(
  () => import('@/specs/Toolkit/Post-Session/Pages/SessionReflection/SessionReflection.stories.jsx'),
  'Filled',
);
export const StudentReflectionPage = lazyStoryExport(
  () => import('@/specs/Toolkit/Post-Session/Pages/StudentReflection/StudentReflection.stories.jsx'),
  'Filled',
);
export const FormFeedbackPage = lazyStoryExport(
  () => import('@/specs/Toolkit/Post-Session/Pages/FormFeedback/FormFeedback.stories.jsx'),
  'Filled',
);
export const SelfReflectionPage = lazyStoryExport(
  () => import('@/specs/Toolkit/Post-Session/Pages/SelfReflection/SelfReflection.stories.jsx'),
  'Filled',
);
