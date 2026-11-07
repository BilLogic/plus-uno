import React from 'react';
import PropTypes from 'prop-types';
import './ProgressTracker.scss';
import { iconClass } from '../../../lib/icon';

export const PROGRESS_TRACKER_SPACINGS = ['comfortable', 'cozy', 'compact'];
export const PROGRESS_TRACKER_ORIENTATIONS = ['horizontal', 'vertical'];
export const PROGRESS_TRACKER_STATUSES = ['disabled', 'unvisited', 'current', 'visited'];

/**
 * @param {string} status
 * @returns {React.ReactNode}
 */
const markerFor = (status) => {
    if (status === 'visited') {
        return (
            <i
                className={`${iconClass('circle-check')} plus-progress-tracker__icon plus-progress-tracker__icon--visited`}
                aria-hidden="true"
            />
        );
    }
    return <span className="plus-progress-tracker__dot" aria-hidden="true" />;
};

/**
 * The steps of a journey, each done, current or upcoming.
 *
 * Every item renders as a link (`href`), a button (`onClick`) or plain text,
 * in that order of precedence; `disabled` items take neither. `status` alone
 * drives how a step looks — a `visited` item still needs `onClick`/`href` to
 * be reachable again.
 *
 * @param {object} props
 * @param {{ id: string, label: string, status: 'disabled'|'unvisited'|'current'|'visited', href?: string, onClick?: () => void }[]} props.items
 * @param {'comfortable'|'cozy'|'compact'} [props.spacing='cozy']
 * @param {'horizontal'|'vertical'} [props.orientation='horizontal']
 * @param {string} [props.label='Progress tracker'] - Accessible name for the step list.
 */
const ProgressTracker = ({
    items,
    spacing = 'cozy',
    orientation = 'horizontal',
    label = 'Progress tracker',
}) => (
    <nav
        aria-label={label}
        className={[
            'plus-progress-tracker',
            `plus-progress-tracker--${spacing}`,
            `plus-progress-tracker--${orientation}`,
        ].join(' ')}
    >
        <ol className="plus-progress-tracker__list">
            {items.map((item) => {
                const disabled = item.status === 'disabled';
                const isCurrent = item.status === 'current';
                const className = [
                    'plus-progress-tracker__item',
                    `plus-progress-tracker__item--${item.status}`,
                ].join(' ');
                const content = (
                    <>
                        {markerFor(item.status)}
                        <span className="plus-progress-tracker__label">{item.label}</span>
                    </>
                );

                let step;
                if (!disabled && item.href) {
                    step = (
                        <a className={className} href={item.href} aria-current={isCurrent ? 'step' : undefined}>
                            {content}
                        </a>
                    );
                } else if (!disabled && item.onClick) {
                    step = (
                        <button
                            type="button"
                            className={className}
                            onClick={item.onClick}
                            aria-current={isCurrent ? 'step' : undefined}
                        >
                            {content}
                        </button>
                    );
                } else {
                    step = (
                        <span
                            className={className}
                            aria-current={isCurrent ? 'step' : undefined}
                            aria-disabled={disabled ? 'true' : undefined}
                        >
                            {content}
                        </span>
                    );
                }

                return <li key={item.id} className="plus-progress-tracker__item-wrap">{step}</li>;
            })}
        </ol>
    </nav>
);

ProgressTracker.propTypes = {
    items: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
            status: PropTypes.oneOf(PROGRESS_TRACKER_STATUSES).isRequired,
            href: PropTypes.string,
            onClick: PropTypes.func,
        }),
    ).isRequired,
    spacing: PropTypes.oneOf(PROGRESS_TRACKER_SPACINGS),
    orientation: PropTypes.oneOf(PROGRESS_TRACKER_ORIENTATIONS),
    label: PropTypes.string,
};

export default ProgressTracker;
