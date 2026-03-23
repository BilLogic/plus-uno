/**
 * GroupModal Prototype Stories
 *
 * Demoed in-context on top of the existing Specs/Admin/Group Admin/Pages/GroupInfoPage.
 */

import React, { useMemo, useState } from 'react';
import ResponsiveFrame from '@/specs/Universal/ResponsiveFrame';
import GroupInfoPage from '@/specs/Admin/Group Admin/Pages/GroupInfoPage/GroupInfoPage';
import GroupModal from './GroupModal';

const mockSchools = [
  { id: 'school-1', name: 'School A' },
  { id: 'school-2', name: 'School B' },
  { id: 'school-3', name: 'School C' },
];

const mockTutors = [
  { id: 'tutor-1', name: 'Amelia Blue' },
  { id: 'tutor-2', name: 'Jon Doe' },
  { id: 'tutor-3', name: 'Sofia Park' },
  { id: 'tutor-4', name: 'Chris Nguyen' },
  { id: 'tutor-5', name: 'Maya Patel' },
];

const mockGroups = [
  { id: 1, name: 'Math Masters', size: 4 },
  { id: 2, name: 'Science Explorers', size: 6 },
  { id: 3, name: 'Reading Champions', size: 5 },
  { id: 4, name: 'Writing Warriors', size: 3 },
  { id: 5, name: 'History Buffs', size: 7 },
];

const mockGroupDetailsById = {
  1: { schoolId: 'school-1', tutorIds: ['tutor-1', 'tutor-3'] },
  2: { schoolId: 'school-2', tutorIds: ['tutor-2'] },
  3: { schoolId: 'school-1', tutorIds: ['tutor-4', 'tutor-5'] },
  4: { schoolId: 'school-3', tutorIds: [] },
  5: { schoolId: 'school-2', tutorIds: ['tutor-1'] },
};

const InContextDemo = () => {
  const [modalState, setModalState] = useState({
    show: false,
    mode: 'add',
    group: null,
  });

  const mergedGroups = useMemo(
    () =>
      mockGroups.map((g) => ({
        ...g,
        ...(mockGroupDetailsById[g.id] || {}),
      })),
    []
  );

  const openAdd = () => setModalState({ show: true, mode: 'add', group: null });

  const openEdit = (groupFromTable) => {
    const details = mergedGroups.find((g) => g.id === groupFromTable.id);
    setModalState({ show: true, mode: 'edit', group: details || groupFromTable });
  };

  const close = () => setModalState((prev) => ({ ...prev, show: false }));

  return (
    <>
      <GroupInfoPage
        groups={mockGroups}
        currentPage={1}
        totalPages={10}
        totalEntries={200}
        onPageChange={(page) => console.log('Page changed:', page)}
        onTabChange={(tab) => console.log('Tab changed:', tab)}
        onAddGroup={openAdd}
        onEditGroup={openEdit}
        onViewProgress={(group) => console.log('View progress:', group)}
      />

      <GroupModal
        show={modalState.show}
        mode={modalState.mode}
        group={modalState.group}
        schools={mockSchools}
        tutors={mockTutors}
        onHide={close}
        onDelete={() => console.log('Delete group')}
        onSave={(data) => console.log('Save group:', data)}
      />
    </>
  );
};

export default {
  title: 'Playground/Ashley/Group Modal',
  component: GroupModal,
  tags: ['autodocs'],
  decorators: [
    (Story, context) => (
      <ResponsiveFrame breakpoint={context.args.breakpoint || 'xl'}>
        <Story />
      </ResponsiveFrame>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `Prototype GroupModal for Group Admin → GroupInfoPage.

## Field coverage
- Group name
- School
- Tutors (multi-select)
- Size

## References
- GroupInfoPage (Figma node-id=258-263800)
- TutorModal (Figma node-id=258-262330) as modal shell reference`,
      },
    },
  },
  argTypes: {
    breakpoint: {
      control: { type: 'select' },
      options: ['md', 'lg', 'xl'],
      description: 'Responsive breakpoint',
      table: { category: 'Responsive' },
    },
  },
};

export const InContextOnGroupInfoPage = {
  args: {
    breakpoint: 'xl',
  },
  render: () => <InContextDemo />,
};

