import React from 'react';
import { Card } from '@/components';

/**
 * A headline number with a label.
 *
 * With `onClick` the card opens a page: chevron, primary-coloured label,
 * hover lift, and keyboard operability. Without it, the card is read-only.
 */
const StatCard = ({ value, label, caption, emphasis = false, onClick }) => {
    const interactive = Boolean(onClick);

    return (
        <Card
            paddingSize="lg"
            showBorder={false}
            className={`compliance-surface compliance-stat-card${interactive ? ' compliance-stat-card--link' : ''}`}
            onClick={onClick}
            {...(interactive && {
                role: 'button',
                tabIndex: 0,
                onKeyDown: (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onClick();
                    }
                },
            })}
        >
            <div className="compliance-stat-card__top">
                <p
                    className="h3 compliance-stat-card__value"
                    style={{ color: emphasis ? 'var(--color-danger)' : 'var(--color-on-surface)' }}
                >
                    {value}
                </p>
                {interactive && (
                    <i className="fa-solid fa-chevron-right compliance-stat-card__chevron" aria-hidden="true" />
                )}
            </div>
            <p className="body2-txt compliance-stat-card__label">{label}</p>
            {caption && <p className="body3-txt compliance-stat-card__caption">{caption}</p>}
        </Card>
    );
};

export default StatCard;
