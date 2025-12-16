/**
 * @fileoverview Home Organism - Main Index file
 * Higher-level components for the home page and dashboard.
 */

import { createPageLayout } from '../Universal/Pages/PageLayout.js';
import { createSection } from '../../components/Section/index.js';
import { createCard } from '../../components/Card/index.js';
import { createTable } from '../../components/Table/index.js';
import { createButton } from '../../components/Button/index.js';

/**
 * Creates the Home page
 * @returns {HTMLElement} The complete Home page element
 */
export function createHome() {
    // --- Configuration ---

    // TopBar Config (formerly Navbar)
    const topBarConfig = {
        brand: {
            name: 'PLUS',
            logo: 'assets/logo.svg' // Placeholder
        },
        items: [
            { text: 'Dashboard', active: true },
            { text: 'My Team' },
            { text: 'Reports' }
        ],
        user: {
            name: 'User Name',
            avatar: 'assets/avatar.png' // Placeholder
        }
    };

    // Sidebar Config
    const sidebarConfig = {
        user: 'tutor', // Default user type for Home
        onTabClick: (tab) => console.log(`Tab clicked: ${tab}`),
        onHomeClick: () => console.log('Home clicked')
    };

    // --- Content Creation ---
    const homeContent = document.createElement('div');
    homeContent.style.display = 'flex';
    homeContent.style.flexDirection = 'column';
    homeContent.style.gap = '24px';
    homeContent.style.width = '100%';

    // Skill Overview Section
    const skillsData = [
        { name: 'UX Design', level: 'Expert', progress: '100%', status: 'Completed' },
        { name: 'React Development', level: 'Intermediate', progress: '65%', status: 'In Progress' },
        { name: 'Design Systems', level: 'Advanced', progress: '80%', status: 'In Progress' },
        { name: 'Accessibility', level: 'Beginner', progress: '20%', status: 'Started' }
    ];

    const skillsTable = createTable({
        headers: ['Skill Name', 'Level', 'Progress', 'Status', 'Action'],
        rows: skillsData.map(skill => [
            skill.name,
            skill.level,
            {
                content: `<div style="width: 100%; background-color: #e0e0e0; height: 8px; border-radius: 4px;">
                            <div style="width: ${skill.progress}; background-color: var(--accent-colors-primary-primary, #0472a8); height: 100%; border-radius: 4px;"></div>
                          </div>`,
                styles: { minWidth: '150px' }
            },
            skill.status,
            createButton({
                btnText: 'View',
                btnSize: 'sm',
                btnStyle: 'secondary'
            })
        ]),
        hover: true,
        striped: false
    });

    // Add a header/controls area above the table
    const sectionHeader = document.createElement('div');
    sectionHeader.style.display = 'flex';
    sectionHeader.style.justifyContent = 'space-between';
    sectionHeader.style.alignItems = 'center';
    sectionHeader.style.marginBottom = '16px';

    const title = document.createElement('h3');
    title.textContent = 'My Skills';
    title.style.margin = '0';
    sectionHeader.appendChild(title);

    const addSkillBtn = createButton({
        btnText: 'Add Skill',
        icon: 'plus',
        btnStyle: 'primary'
    });
    sectionHeader.appendChild(addSkillBtn);

    // Combine header and table
    const sectionContent = document.createElement('div');
    sectionContent.appendChild(sectionHeader);
    sectionContent.appendChild(skillsTable);

    const finalSkillSection = createSection({
        content: sectionContent,
        background: 'surface',
        padding: 'lg',
        styles: {
            backgroundColor: 'white',
            borderRadius: 'var(--element-radius-lg, 12px)'
        }
    });

    homeContent.appendChild(finalSkillSection);

    // Recommended Learning Section (Cards)
    const learningSectionTitle = document.createElement('h3');
    learningSectionTitle.textContent = 'Recommended Learning';
    learningSectionTitle.style.marginBottom = '16px';
    homeContent.appendChild(learningSectionTitle);

    const cardsContainer = document.createElement('div');
    cardsContainer.style.display = 'grid';
    cardsContainer.style.gridTemplateColumns = 'repeat(auto-fill, minmax(300px, 1fr))';
    cardsContainer.style.gap = '24px';

    const learningItems = [
        { title: 'Advanced React Patterns', subtitle: 'Frontend Development', image: 'https://via.placeholder.com/300x150' },
        { title: 'Figma for Developers', subtitle: 'Design', image: 'https://via.placeholder.com/300x150' },
        { title: 'Web Accessibility 101', subtitle: 'General Web', image: 'https://via.placeholder.com/300x150' }
    ];

    learningItems.forEach(item => {
        const card = createCard({
            title: item.title,
            subtitle: item.subtitle,
            image: item.image,
            body: 'Learn the latest techniques and best practices.',
            actionButton: {
                text: 'Start Learning',
                onClick: () => console.log(`Clicked ${item.title}`)
            }
        });
        cardsContainer.appendChild(card);
    });

    homeContent.appendChild(cardsContainer);

    // --- Page Layout Composition ---
    return createPageLayout({
        content: homeContent,
        sidebarConfig: sidebarConfig,
        topBarConfig: topBarConfig,
        id: 'home-page'
    });
}
