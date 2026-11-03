import React from 'react';
import PropTypes from 'prop-types';
import InternalCalendar from '../_internal/Calendar';

/**
 * Calendar — the month grid DatePicker and DateTimePicker open (Figma
 * `_Calendar`), public for a caller who wants the grid on its own rather than
 * behind a field's popup. It is the same component the pickers use.
 *
 * - **Grid:** always six weeks, 42 cells, so the panel never changes height.
 *   Days of the months either side are drawn and can't be picked.
 * - **Days:** each is a button named with its full date. `aria-pressed` marks
 *   the picked day, or both ends of a range; `data-in-range` marks the days
 *   between; `aria-current="date"` marks today.
 * - **Bounds:** days before `minDate` or after `maxDate` are disabled.
 * - **Size:** small, medium and large draw 28, 36 and 44px days.
 *
 * @param {object} props
 * @returns {JSX.Element}
 */
const Calendar = (props) => <InternalCalendar {...props} />;

Calendar.propTypes = {
    /** Any day in the month on show. */
    viewDate: PropTypes.instanceOf(Date).isRequired,
    /** `(firstOfMonth)` when Previous month or Next month is pressed. */
    onViewDateChange: PropTypes.func.isRequired,
    /** The picked day, as ISO `YYYY-MM-DD` or a Date. */
    selected: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    /** A range's first day; with `rangeEnd`, the days between are marked. */
    rangeStart: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    rangeEnd: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    minDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    maxDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    /** `(date)` when an enabled day is pressed. */
    onPick: PropTypes.func.isRequired,
    className: PropTypes.string,
};

export default Calendar;
