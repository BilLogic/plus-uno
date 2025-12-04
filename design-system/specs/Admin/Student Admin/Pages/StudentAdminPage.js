/**
 * @fileoverview StudentAdminPage component for Student Admin specs
 * Full page layout for Student Admin with overview statistics and student details table
 */

import { createPageLayout } from '../../../Universal/Pages/PageLayout.js';
import { createStudentAdminContainer } from '../Sections/StudentAdminContainer.js';
import { createStudentsTable } from '../Tables/StudentsTable.js';
import { createStudentsModal } from '../Modals/StudentsModal.js';
import { createFilters } from '../../Tutor Admin/Elements/Filters.js';

/**
 * Creates the Student Admin Page component
 * @param {Object} options - Page configuration
 * @param {boolean} [options.showModal=false] - Whether to show the student modal with scrim
 * @param {string} [options.modalType="Info"] - Modal tab type: "Info" or "Sessions"
 * @returns {HTMLElement} The Student Admin Page element
 */
export function createStudentAdminPage({ showModal = false, modalType = "Info" } = {}) {
    // --- Configuration ---
    const topBarConfig = {
        mode: 'expanded',
        breadcrumbItems: [
            { text: 'Home', href: '#' },
            { text: 'Student Admin' }
        ],
        userName: 'John Doe',
        userFirstChar: 'J',
        counterValue: 2
    };

    const sidebarConfig = {
        user: 'supervisor', // Assuming Supervisor view for Student Admin
        onTabClick: (tab) => console.log(`Tab clicked: ${tab}`),
        onHomeClick: () => console.log('Home clicked')
    };

    // --- Content Creation ---
    // Note: We are NOT creating a wrapper with surface color here, 
    // because PageLayout provides the surface container.
    // We just create the content that goes INSIDE the surface.

    const content = document.createElement('div');
    content.style.display = 'flex';
    content.style.flexDirection = 'column';
    content.style.gap = 'var(--size-surface-gap-md)';
    content.style.width = '100%';

    // Student Overview Section
    const overviewSection = document.createElement('div');
    overviewSection.style.display = 'flex';
    overviewSection.style.flexDirection = 'column';
    overviewSection.style.gap = 'var(--size-section-gap-sm)';
    overviewSection.style.width = '100%';

    const overviewHeader = document.createElement('div');
    overviewHeader.style.display = 'flex';
    overviewHeader.style.flexWrap = 'wrap';
    overviewHeader.style.gap = 'var(--size-section-gap-md)';
    overviewHeader.style.alignItems = 'center';
    overviewHeader.style.justifyContent = 'space-between';
    overviewHeader.style.width = '100%';

    const overviewTitle = document.createElement('div');
    overviewTitle.className = 'h4-txt';
    overviewTitle.style.color = 'var(--color-on-surface)';
    overviewTitle.textContent = 'Student Overview';
    overviewHeader.appendChild(overviewTitle);

    // Filters - use createFilters component (same as Tutor Admin)
    const filters = createFilters({
        schoolFilter: 'All Schools',
        tutorFilter: 'All Tutors', // Not used in Student Admin but required by component
        startDate: '11/01/12',
        endDate: '12/20/12'
    });
    overviewHeader.appendChild(filters);

    overviewSection.appendChild(overviewHeader);

    // Student Admin Container wrapper with horizontal scroll
    const cardsWrapper = document.createElement('div');
    cardsWrapper.style.width = '100%';
    cardsWrapper.style.overflowX = 'auto';
    cardsWrapper.style.overflowY = 'hidden';

    // Student Admin Container (data cards)
    const studentAdminContainer = createStudentAdminContainer();
    cardsWrapper.appendChild(studentAdminContainer);
    overviewSection.appendChild(cardsWrapper);

    content.appendChild(overviewSection);

    // Student Details Section - using single table component with title
    const sampleData = [
        { student: "Jose Dolus", school: "Langley", teacher: "Jose Mura", latestStatus: "Needs to set goals", action: "View goals" },
        { student: "Chris Hudson", school: "Langley", teacher: "Ruth Perez", latestStatus: "Needs to set goals", action: "View goals" },
        { student: "Irene White", school: "Langley", teacher: "Ruth Perez", latestStatus: "Needs to set goals", action: "View goals" },
        { student: "Jacqueline Traine", school: "Langley", teacher: "Erin Hunter", latestStatus: "Needs to set goals", action: "View goals" },
        { student: "Jerome Brown", school: "Langley", teacher: "Katie Strong", latestStatus: "Needs to set goals", action: "View goals" },
        { student: "Jose Darrell", school: "Langley", teacher: "Tisha Bryan", latestStatus: "Needs to set goals", action: "View goals" },
        { student: "Joy Jones", school: "Langley", teacher: "Aaron Zhang", latestStatus: "Needs to set goals", action: "View goals" },
        { student: "Ksenia Gato", school: "Langley", teacher: "Ruth Perez", latestStatus: "Needs to set goals", action: "View goals" },
        { student: "Lesley Mora", school: "Langley", teacher: "Tisha Bryan", latestStatus: "Needs to set goals", action: "View goals" },
        { student: "Manny Jones", school: "Langley", teacher: "Tisha Bryan", latestStatus: "Needs to set goals", action: "View goals" }
    ];

    const studentsTable = createStudentsTable({
        title: "Student Details",
        data: sampleData,
        pagination: {
            currentPage: 1,
            totalPages: 20,
            text: "Showing 1 to 10 of 200 entries",
            onPageChange: (page) => console.log(`Page changed to ${page}`)
        },
        onAddStudent: () => console.log("Add Student clicked")
    });

    content.appendChild(studentsTable);

    // --- Page Layout Composition ---
    const layout = createPageLayout({
        content: content,
        sidebarConfig: sidebarConfig,
        topBarConfig: topBarConfig,
        id: 'student-admin-page'
    });

    // Scrim and Modal - only show if explicitly requested
    if (showModal) {
        const scrim = document.createElement('div');
        scrim.style.position = 'fixed';
        scrim.style.top = '0';
        scrim.style.left = '0';
        scrim.style.width = '100%';
        scrim.style.height = '100%';
        scrim.style.backgroundColor = 'var(--color-scrim)';
        scrim.style.display = 'flex';
        scrim.style.alignItems = 'center';
        scrim.style.justifyContent = 'center';
        scrim.style.zIndex = '1000';

        const modal = createStudentsModal({ type: modalType });
        scrim.appendChild(modal);
        layout.appendChild(scrim);
    }

    return layout;
}

