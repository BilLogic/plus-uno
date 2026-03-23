/**
 * OnboardingOverviewPage Component
 * 
 * Full page layout for Onboarding Overview with featured modules carousel and all modules table.
 * Figma: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=74-121828
 */

import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { PageLayout } from '../../../../Universal/Pages';
import Button from '@/components/Button';
import OnboardingModuleCard from '../../Cards/OnboardingModuleCard/OnboardingModuleCard';
import OnboardingModulesTable from '../../Tables/OnboardingModulesTable/OnboardingModulesTable';
import SortingDropdown from '../../Elements/SortingDropdown/SortingDropdown';
import './OnboardingOverviewPage.scss';

const OnboardingOverviewPage = ({
    featuredModules = [],
    allModules = [],
    sortBy = 'Name',
    sortOrder = 'A-Z',
    onSortChange,
    onModuleClick,
    onCtaClick,
}) => {
    const carouselRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    // Default featured modules
    const defaultFeaturedModules = [
        { id: 1, title: 'Welcome to PLUS', duration: '9 mins', variant: 'thumbnail', badgeType: 'other', stage: 'not started' },
        { id: 2, title: 'Your Role at PLUS', duration: '9 mins', variant: 'thumbnail', badgeType: 'other', stage: 'not started' },
        { id: 3, title: 'Tutoring Session Overview', duration: '9 mins', variant: 'thumbnail', badgeType: 'other', stage: 'not started' },
    ];

    // Default all modules
    const defaultAllModules = [
        { id: 1, title: 'Welcome to PLUS', duration: '11mins', stage: 'not started', ctaState: 'not started' },
        { id: 2, title: 'Your role at PLUS', duration: '11mins', stage: 'not started', ctaState: 'not started' },
        { id: 3, title: 'Tutoring Session Overview', duration: '11mins', stage: 'not started', ctaState: 'not started' },
        { id: 4, title: 'Tutor Session Flow/Responsibilities', duration: '11mins', stage: 'not started', ctaState: 'not started' },
    ];

    const displayFeaturedModules = featuredModules.length > 0 ? featuredModules : defaultFeaturedModules;
    const displayAllModules = allModules.length > 0 ? allModules : defaultAllModules;

    const updateScrollButtons = () => {
        if (carouselRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
        }
    };

    const scrollCarousel = (direction) => {
        if (carouselRef.current) {
            const scrollAmount = 300;
            carouselRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
            setTimeout(updateScrollButtons, 350);
        }
    };

    const topBarConfig = {
        breadcrumbs: [
            { text: 'Home', href: '#' },
            { text: 'Onboarding' }
        ],
        user: {
            name: 'John Doe',
            counter: true,
            counterValue: 2
        }
    };

    const sidebarConfig = {
        user: 'tutor',
        activeTab: 'onboarding',
    };

    return (
        <PageLayout
            topBarConfig={topBarConfig}
            sidebarConfig={sidebarConfig}
            id="onboarding-overview-page"
        >
            <div className="onboarding-overview-page">
                {/* Featured Modules Section */}
                <section className="onboarding-overview-page__section">
                    {/* Title and Controls */}
                    <div className="onboarding-overview-page__section-header">
                        <div className="onboarding-overview-page__title-container">
                            <h4 className="h4" style={{ margin: 0 }}>Featured Modules</h4>
                        </div>
                        <div className="onboarding-overview-page__controls">
                            <Button
                                style="default"
                                fill="outline"
                                size="small"
                                leadingVisual="arrow-left"
                                onClick={() => scrollCarousel('left')}
                                disabled={!canScrollLeft}
                                className={!canScrollLeft ? 'onboarding-overview-page__btn-disabled' : ''}
                            />
                            <Button
                                style="primary"
                                fill="outline"
                                size="small"
                                leadingVisual="arrow-right"
                                onClick={() => scrollCarousel('right')}
                                disabled={!canScrollRight}
                            />
                        </div>
                    </div>

                    {/* Carousel Container */}
                    <div className="onboarding-overview-page__carousel-container">
                        <div
                            ref={carouselRef}
                            className="onboarding-overview-page__carousel"
                            onScroll={updateScrollButtons}
                        >
                            {displayFeaturedModules.map((module) => (
                                <OnboardingModuleCard
                                    key={module.id}
                                    title={module.title}
                                    duration={module.duration}
                                    variant={module.variant || 'thumbnail'}
                                    badgeType={module.badgeType || 'other'}
                                    stage={module.stage || 'not started'}
                                    onClick={() => onModuleClick && onModuleClick(module)}
                                />
                            ))}
                        </div>
                    </div>
                </section>

                {/* All Modules Section */}
                <section className="onboarding-overview-page__section">
                    {/* Control Bar */}
                    <div className="onboarding-overview-page__section-header">
                        <div className="onboarding-overview-page__title-container">
                            <h4 className="h4" style={{ margin: 0 }}>All Modules</h4>
                        </div>
                        <SortingDropdown
                            status={false}
                            sortBy={sortBy}
                            sortOrder={sortOrder}
                            onSortChange={onSortChange}
                        />
                    </div>

                    {/* Modules Table */}
                    <div className="onboarding-overview-page__table-container">
                        <OnboardingModulesTable
                            modules={displayAllModules}
                            sortable={true}
                            hover={true}
                            onModuleClick={onModuleClick}
                            onCtaClick={onCtaClick}
                        />
                    </div>
                </section>
            </div>
        </PageLayout>
    );
};

OnboardingOverviewPage.propTypes = {
    /** Featured modules for carousel */
    featuredModules: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        title: PropTypes.string,
        duration: PropTypes.string,
        variant: PropTypes.oneOf(['thumbnail', 'description']),
        badgeType: PropTypes.string,
        stage: PropTypes.string,
    })),
    /** All modules for table */
    allModules: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        title: PropTypes.string,
        duration: PropTypes.string,
        stage: PropTypes.string,
        ctaState: PropTypes.string,
    })),
    /** Current sort field */
    sortBy: PropTypes.string,
    /** Current sort order */
    sortOrder: PropTypes.string,
    /** Callback when sort changes */
    onSortChange: PropTypes.func,
    /** Callback when module is clicked */
    onModuleClick: PropTypes.func,
    /** Callback when CTA button is clicked */
    onCtaClick: PropTypes.func,
};

export default OnboardingOverviewPage;
