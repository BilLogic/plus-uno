import React from 'react';
import PropTypes from 'prop-types';
import '../kit.css';
import './Phases.css';

/**
 * Phases: a session's three stages, Before, During and After, as numbered
 * links joined by a rule. Done phases fill their number; the current one is
 * bold and carries `aria-current="step"`; a phase's time follows its label.
 *
 * Links are `a` by default; pass a router `Link` as `linkAs` (each phase then
 * takes `to`).
 */
const Phases = ({ phases, label = 'Session stage', linkAs: Link = 'a', className = '' }) => (
    <ol className={['tr-phases', className].filter(Boolean).join(' ')} aria-label={label}>
        {phases.map((phase, i) => {
            const linkProps = Link === 'a' ? { href: phase.href ?? phase.to } : { to: phase.to ?? phase.href };
            return (
                <li key={phase.id} className={`tr-phases__item tr-phases__item--${phase.state}`} data-state={phase.state}>
                    <Link className="tr-phases__link" aria-current={phase.state === 'current' ? 'step' : undefined} {...linkProps}>
                        <span className="tr-phases__n" aria-hidden="true">
                            {phase.state === 'done' ? <i className="fa-solid fa-check" /> : i + 1}
                        </span>
                        {phase.label}
                        {phase.state === 'done' ? <span className="tr-sr-only"> (done)</span> : null}
                        {phase.time ? <span className="tr-phases__time">{phase.time}</span> : null}
                    </Link>
                </li>
            );
        })}
    </ol>
);

Phases.propTypes = {
    phases: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        state: PropTypes.oneOf(['done', 'current', 'upcoming']).isRequired,
        /** "1:00 pm" */
        time: PropTypes.string,
        href: PropTypes.string,
        to: PropTypes.string,
    })).isRequired,
    label: PropTypes.string,
    /** A router `Link` */
    linkAs: PropTypes.elementType,
    className: PropTypes.string,
};

export default Phases;
