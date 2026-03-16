/**
 * OnboardingModulesTable Component
 * 
 * Table showing onboarding modules with columns: Module, Duration, Progress, Actions.
 * Matches Figma design: https://www.figma.com/design/W0qzhXWxFsMwSJzkdV2yal/Design-System---Web-App-Specs?node-id=74-121873
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Table } from 'react-bootstrap';
import StatusIndicators from '../../Elements/StatusIndicators/StatusIndicators';
import CtaButtons from '../../Elements/CtaButtons/CtaButtons';
import './OnboardingModulesTable.scss';

const OnboardingModulesTable = ({
    modules = [],
    sortable = true,
    hover = true,
    onModuleClick,
    onCtaClick,
    className = '',
    ...props
}) => {
    const headers = [
        { text: 'Module', span: 3, sortable, active: true },
        { text: 'Duration', sortable },
        { text: 'Progress', sortable },
        { text: 'Actions', sortable: false, left: true },
    ];

    const defaultModules = [
        {
            id: 1,
            title: 'Module Title',
            duration: '11mins',
            stage: 'not started',
            ctaState: 'not started',
            imageUrl: null,
        },
        {
            id: 2,
            title: 'Module Title',
            duration: '11mins',
            stage: 'in progress',
            ctaState: 'in progress',
            imageUrl: null,
        },
        {
            id: 3,
            title: 'Module Title',
            duration: '11mins',
            stage: 'completed',
            ctaState: 'completed',
            imageUrl: null,
        },
    ];

    const displayModules = modules.length > 0 ? modules : defaultModules;

    return (
        <div className={`onboarding-modules-table-wrapper ${className}`} {...props}>
            <Table className="onboarding-modules-table">
                <thead>
                    <tr className="onboarding-modules-table__header">
                        {headers.map((header, index) => (
                            <th 
                                key={index} 
                                colSpan={header.span || 1}
                                className={`onboarding-modules-table__header-cell ${(index === 0 || header.left) ? 'onboarding-modules-table__header-cell--left' : ''}`}
                                style={(index === 0 || header.left) ? { textAlign: 'left' } : {}}
                            >
                                <div className="onboarding-modules-table__header-content">
                                    <span 
                                        className="body3-txt"
                                        style={{ 
                                            color: header.active 
                                                ? 'var(--color-secondary-text)' 
                                                : 'var(--color-on-surface)',
                                            fontWeight: 400
                                        }}
                                    >
                                        {header.text}
                                    </span>
                                    {header.sortable && (
                                        <i 
                                            className="fas fa-arrow-up"
                                            style={{ 
                                                fontSize: '10px',
                                                color: header.active 
                                                    ? 'var(--color-secondary)' 
                                                    : 'var(--color-outline-variant)',
                                                lineHeight: '2'
                                            }}
                                        />
                                    )}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {displayModules.map((module, rowIndex) => (
                        <tr 
                            key={module.id || rowIndex}
                            className={`onboarding-modules-table__row ${hover ? 'onboarding-modules-table__row--hover' : ''}`}
                            onClick={() => onModuleClick && onModuleClick(module)}
                            style={{ cursor: onModuleClick ? 'pointer' : 'default' }}
                        >
                            {/* Module column - spans 3 columns */}
                            <td colSpan={3} className="onboarding-modules-table__cell onboarding-modules-table__cell--module">
                                <div className="onboarding-modules-table__module-content">
                                    {/* Thumbnail image */}
                                    <div className="onboarding-modules-table__thumbnail">
                                        <div className="onboarding-modules-table__thumbnail-bg" />
                                        {module.imageUrl && (
                                            <img
                                                src={module.imageUrl}
                                                alt=""
                                                className="onboarding-modules-table__thumbnail-img"
                                            />
                                        )}
                                    </div>
                                    {/* Title */}
                                    <p className="onboarding-modules-table__title body3-txt">
                                        {module.title}
                                    </p>
                                </div>
                            </td>

                            {/* Duration column */}
                            <td className="onboarding-modules-table__cell onboarding-modules-table__cell--center">
                                <div className="onboarding-modules-table__cell-center-wrap">
                                    <span className="body3-txt" style={{ color: 'var(--color-on-surface-variant)' }}>
                                        {module.duration}
                                    </span>
                                </div>
                            </td>

                            {/* Progress column */}
                            <td className="onboarding-modules-table__cell onboarding-modules-table__cell--center">
                                <div className="onboarding-modules-table__cell-center-wrap">
                                    <StatusIndicators stage={module.stage} size="small" />
                                </div>
                            </td>

                            {/* Actions column */}
                            <td className="onboarding-modules-table__cell onboarding-modules-table__cell--actions" style={{ textAlign: 'left' }}>
                                <div className="onboarding-modules-table__cell-actions-wrap" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', width: '100%' }}>
                                    <CtaButtons 
                                        state={module.ctaState} 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onCtaClick && onCtaClick(module);
                                        }}
                                    />
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};

OnboardingModulesTable.propTypes = {
    /** Array of module objects */
    modules: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        title: PropTypes.string,
        duration: PropTypes.string,
        stage: PropTypes.oneOf(['not started', 'in progress', 'completed']),
        ctaState: PropTypes.oneOf(['not started', 'in progress', 'completed']),
        imageUrl: PropTypes.string,
    })),
    /** Enable sortable columns */
    sortable: PropTypes.bool,
    /** Enable row hover effects */
    hover: PropTypes.bool,
    /** Callback when module row is clicked */
    onModuleClick: PropTypes.func,
    /** Callback when CTA button is clicked */
    onCtaClick: PropTypes.func,
    /** Additional CSS classes */
    className: PropTypes.string,
};

export default OnboardingModulesTable;
