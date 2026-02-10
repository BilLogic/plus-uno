/**
 * Training Progress inner content – same structure as TutorTrainingProgressPage.
 * Rendered inside PageLayout content slot for animation/chat integration.
 */
import React, { useState } from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore – plus-ds JSX components
import Button from '@/components/Button/Button';
// @ts-ignore
import ButtonGroup from '@/components/ButtonGroup/ButtonGroup';
// @ts-ignore
import Pagination from '@/components/Pagination/Pagination';
// @ts-ignore
import OverviewCard from '@/specs/Universal/Cards/OverviewCard/OverviewCard';
// @ts-ignore
import TutorsTrainingProgressTable from '@/specs/Admin/Tutor Admin/Tables/TutorsTrainingProgressTable/TutorsTrainingProgressTable';
// @ts-ignore
import ExportSearchFilterBar from '@/specs/Admin/Tutor Admin/Elements/ExportSearchFilterBar/ExportSearchFilterBar';
import '@/specs/Admin/Tutor Admin/Pages/TutorTrainingProgressPage/TutorTrainingProgressPage.scss';

const DEFAULT_TUTORS = [
  { id: 1, tutorName: 'Ben Green', email: 'dummy@gmail.com', completion: '8/18', accuracy: '30%', badgeClaimed: 'Yes', timeSpent: 328 },
  { id: 2, tutorName: 'Albert Flores', email: 'albert@gmail.com', completion: '18/18', accuracy: '95%', badgeClaimed: 'Yes', timeSpent: 520 },
  { id: 3, tutorName: 'Brooklyn Simmons', email: 'brooklyn@gmail.com', completion: '5/18', accuracy: '60%', badgeClaimed: 'No', timeSpent: 120 },
  { id: 4, tutorName: 'Cody Fisher', email: 'cody@gmail.com', completion: '12/18', accuracy: '80%', badgeClaimed: 'No', timeSpent: 340 },
  { id: 5, tutorName: 'Darlene Robertson', email: 'darlene@gmail.com', completion: '18/18', accuracy: '100%', badgeClaimed: 'Yes', timeSpent: 600 },
  { id: 6, tutorName: 'Esther Howard', email: 'esther@gmail.com', completion: '2/18', accuracy: '10%', badgeClaimed: 'N/A', timeSpent: 45 },
  { id: 7, tutorName: 'Guy Hawkins', email: 'guy@gmail.com', completion: '15/18', accuracy: '88%', badgeClaimed: 'No', timeSpent: 410 },
  { id: 8, tutorName: 'Jacob Jones', email: 'jacob@gmail.com', completion: '10/18', accuracy: '75%', badgeClaimed: 'No', timeSpent: 280 },
  { id: 9, tutorName: 'Jane Cooper', email: 'jane@gmail.com', completion: '18/18', accuracy: '92%', badgeClaimed: 'Yes', timeSpent: 550 },
  { id: 10, tutorName: 'Jenny Wilson', email: 'jenny@gmail.com', completion: '6/18', accuracy: '50%', badgeClaimed: 'No', timeSpent: 180 },
];

export function TrainingProgressContent(): React.ReactElement {
  const [currentViewMode, setCurrentViewMode] = useState('By Tutor');
  const currentPage = 1;
  const totalPages = 20;
  const totalEntries = 200;
  const entriesStart = 1;
  const entriesEnd = 10;

  return (
    <>
      <div className="reveal-section">
        <section className="tutor-training-progress-page__overview-section" aria-labelledby="training-progress-overview-title">
          <header className="tutor-training-progress-page__overview-header">
            <h2 id="training-progress-overview-title" className="h4" style={{ color: 'var(--color-on-surface)' }}>Training Progress Overview</h2>
            <ButtonGroup size="medium" style="primary" fill="tonal" className="tutor-training-progress-page__toggle">
              <Button text="By Tutor" active={currentViewMode === 'By Tutor'} onClick={() => setCurrentViewMode('By Tutor')} />
              <Button text="By Lesson" active={currentViewMode === 'By Lesson'} onClick={() => setCurrentViewMode('By Lesson')} />
            </ButtonGroup>
          </header>
          <div className="tutor-training-progress-page__overview-cards">
            <OverviewCard
              type="advocacy"
              title="Tutor Need"
              subtitle="Advocacy"
              description="is where tutors had received least training."
              smartData={{ socio: 0.8, mastering: 0.6, advocacy: 0.2, relationships: 0.9, technology: 0.7 }}
              animateIntro
              introDelay={90}
            />
            <OverviewCard
              type="avg-completion"
              title="Avg Completion Rate"
              chartValue={20}
              chartColor="#f5d061"
              subtitle="20%"
              description="of total lessons have been completed"
              animateIntro
              introDelay={230}
            />
            <OverviewCard
              type="completion"
              title="Tutor Badge Completions"
              chartValue={20}
              chartColor="#f5d061"
              subtitle="20%"
              description="of eligible tutors have finished"
              animateIntro
              introDelay={370}
            />
            <OverviewCard
              type="completion"
              title="Onboarding Completion"
              chartValue={20}
              chartColor="#f5d061"
              subtitle="20%"
              description="of tutors had finished"
              animateIntro
              introDelay={510}
            />
          </div>
        </section>
      </div>

      <div className="reveal-section">
        <div className="tutor-training-progress-page__details-section">
          <div className="tutor-training-progress-page__details-header">
            <h2 className="h4" style={{ color: 'var(--color-on-surface)' }}>Training Progress Details</h2>
          </div>
          <ExportSearchFilterBar searchPlaceholder="Search" onSearch={() => { }} onExport={() => { }} filters={[{ key: 'group', label: 'All Groups' }, { key: 'date', label: 'All Dates' }, { key: 'status', label: 'All Status' }]} />
          <TutorsTrainingProgressTable tutors={DEFAULT_TUTORS} onRowClick={() => { }} />
          <div className="tutor-training-progress-page__pagination">
            <div className="body2-txt" style={{ fontWeight: 300, color: 'var(--color-on-surface)' }}>
              Showing {entriesStart} to {entriesEnd} of {totalEntries} entries
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={() => { }} type="icon" size="small" />
          </div>
        </div>
      </div>
    </>
  );
}
