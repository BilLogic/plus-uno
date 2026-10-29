import React from 'react';
import StatCard from './StatCard';
import { CONDUCT, THIS_WEEK, TOTAL_TUTORS, WEEKS } from './data';

/**
 * Four cards: the two a supervisor acts on come first and open their own
 * page; the coverage numbers follow as read-only context.
 */
const StatRow = ({ onOpenImmediate, onOpenRepeat }) => (
    <div className="compliance-stat-row">
        <StatCard
            value={THIS_WEEK.needsImmediateReview}
            label="Need immediate review"
            caption={`Communication & Conduct · ${CONDUCT.highSeverityThisWeek} high severity`}
            emphasis
            onClick={onOpenImmediate}
        />
        <StatCard
            value={THIS_WEEK.tutorsPastPatternThreshold}
            label="Tutors repeating the same mistake"
            caption={`Flagged for it in ${THIS_WEEK.patternThreshold}% or more of their sessions`}
            onClick={onOpenRepeat}
        />
        <StatCard
            value={`${THIS_WEEK.sessionsReviewed} / ${THIS_WEEK.sessionsTotal}`}
            label={`Sessions reviewed in ${WEEKS.length} weeks`}
            caption={`${THIS_WEEK.sessionsTotal - THIS_WEEK.sessionsReviewed} not yet processed`}
        />
        <StatCard
            value={`${THIS_WEEK.tutorsFlagged} of ${TOTAL_TUTORS}`}
            label="Tutors with at least one flag"
        />
    </div>
);

export default StatRow;
