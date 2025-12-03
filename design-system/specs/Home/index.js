/**
 * @fileoverview Home Organism - Main Index file
 * Higher-level components for the home page and dashboard.
 */

import { createNavbar } from '../../components/Navbar/index.js';
import { createNavigation } from '../../components/Navigation/index.js';
import { createSection } from '../../components/Section/index.js';
import { createCard } from '../../components/Card/index.js';
import { createTable } from '../../components/Table/index.js';
import { createButton } from '../../components/Button/index.js';

/**
 * Creates the Home page
 * @returns {HTMLElement} The complete Home page element
 */
export function createHome() {
    const homeContainer = document.createElement('div');
    homeContainer.classList.add('plus-home-page');
    homeContainer.style.display = 'flex';
    homeContainer.style.flexDirection = 'column';
    homeContainer.style.minHeight = '100vh';
    homeContainer.style.backgroundColor = 'var(--neutral-colors-surface-container-surface-container, #edeef0)';

    // 1. Navbar
    const navbar = createNavbar({
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
    });
    homeContainer.appendChild(navbar);

    // Main Content Area (Sidebar + Content)
    const mainArea = document.createElement('div');
    mainArea.style.display = 'flex';
    mainArea.style.flex = '1';

    // 2. Sidebar (Navigation)
    const sidebar = createNavigation({
        items: [
            { text: 'Home', icon: 'home', active: true },
            { text: 'Skills', icon: 'star' },
            { text: 'Learning', icon: 'book' },
            { text: 'Settings', icon: 'cog' }
        ],
        orientation: 'vertical',
        classes: ['plus-home-sidebar']
    });
    sidebar.style.width = '250px';
    sidebar.style.flexShrink = '0';
    sidebar.style.backgroundColor = 'white';
    sidebar.style.borderRight = '1px solid var(--neutral-colors-outline-outline-variant, #c2c7cf)';
    mainArea.appendChild(sidebar);

    // 3. Content Section
    const contentContainer = document.createElement('div');
    contentContainer.style.flex = '1';
    contentContainer.style.padding = '24px';
    contentContainer.style.display = 'flex';
    contentContainer.style.flexDirection = 'column';
    contentContainer.style.gap = '24px';

    // Skill Overview Section
    const skillOverviewSection = createSection({
        title: 'Skill Overview',
        background: 'surface',
        padding: 'lg',
        classes: ['plus-home-skill-overview'],
        styles: {
            backgroundColor: 'white',
            borderRadius: 'var(--element-radius-lg, 12px)',
            boxShadow: 'var(--elevation-1, 0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30))'
        }
    });

    // Create the content for the skill overview (Table/List)
    // Based on the design description "Skill Overview", it looks like a list of skills with status.
    // I'll use the Table component for this as it's a structured list.

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

    // Replace the default content wrapper of the section with our custom content
    // Note: createSection appends content if provided. Here we are building it manually.
    // Let's re-create the section with content.

    const finalSkillSection = createSection({
        content: sectionContent,
        background: 'surface',
        padding: 'lg',
        styles: {
            backgroundColor: 'white',
            borderRadius: 'var(--element-radius-lg, 12px)'
        }
    });

    contentContainer.appendChild(finalSkillSection);

    // Add another section for "Recommended Learning" (Cards)
    const learningSectionTitle = document.createElement('h3');
    learningSectionTitle.textContent = 'Recommended Learning';
    learningSectionTitle.style.marginBottom = '16px';
    contentContainer.appendChild(learningSectionTitle);

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

    contentContainer.appendChild(cardsContainer);

    mainArea.appendChild(contentContainer);
    homeContainer.appendChild(mainArea);

    return homeContainer;
}
