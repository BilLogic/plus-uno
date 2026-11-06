/**
 * @fileoverview Home Organism - Main Index file
 * Higher-level components for the home page and dashboard.
 */

import { createPageLayout } from '../Universal/Pages/PageLayout.js';
import { createSection } from '@/components/_internal/Section/index.js';
import { createTable } from '@/components/_internal/Table/index.js';
import { iconClass } from '../../lib/icon';

// Export Home Cards
export * from './Cards';

/** A plain DOM card for the sections this module builds without React. */
const createCard = ({ title, subtitle, image, body, actionButton } = {}) => {
    const card = document.createElement('div');
    card.className = 'plus-pattern-card plus-pattern-card-pad-md plus-pattern-card-gap-md';
    if (image) {
        const img = document.createElement('img');
        img.className = 'plus-pattern-card-image';
        img.src = image;
        img.alt = '';
        card.appendChild(img);
    }
    const inner = document.createElement('div');
    inner.className = 'plus-pattern-card-inner';
    const content = document.createElement('div');
    content.className = 'plus-pattern-card-content';
    const heading = document.createElement('div');
    heading.className = 'plus-pattern-card-heading';
    const titleEl = document.createElement('h3');
    titleEl.className = 'plus-pattern-card-title';
    titleEl.textContent = title;
    heading.appendChild(titleEl);
    if (subtitle) {
        const subtitleEl = document.createElement('p');
        subtitleEl.className = 'plus-pattern-card-description';
        subtitleEl.textContent = subtitle;
        heading.appendChild(subtitleEl);
    }
    content.appendChild(heading);
    if (body) {
        const bodyEl = document.createElement('div');
        bodyEl.className = 'plus-pattern-card-body';
        bodyEl.textContent = body;
        content.appendChild(bodyEl);
    }
    inner.appendChild(content);
    if (actionButton) {
        const footer = document.createElement('div');
        footer.className = 'plus-pattern-card-footer';
        footer.appendChild(createButton({ btnText: actionButton.text }));
        if (actionButton.onClick) {
            footer.lastChild.addEventListener('click', actionButton.onClick);
        }
        inner.appendChild(footer);
    }
    card.appendChild(inner);
    return card;
};

/** A plain DOM button for the sections this module builds without React. */
const createButton = ({ btnText = 'Button', icon } = {}) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn';
    if (icon) {
        const glyph = document.createElement('i');
        glyph.className = iconClass(icon);
        glyph.setAttribute('aria-hidden', 'true');
        button.appendChild(glyph);
    }
    button.append(btnText);
    return button;
};

/**
 * Creates the Home page
 * @returns {HTMLElement} The complete Home page element
 */
export function createHome() {
    // --- Configuration ---

    // TopBar Config
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
                btnText: 'View'
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
        icon: 'plus'
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
            borderRadius: 'var(--size-border-radius-radius-300)'
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
