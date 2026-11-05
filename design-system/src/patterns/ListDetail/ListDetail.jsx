import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { Button, IconButton } from '@/components';
import PatternSection from '../PatternSection';
import { FRAME_LAYOUT } from '../Frame/frameLayout';
import { useSplitHolds } from '../Frame/SplitContext';
import { useOwnWidth } from '../Frame/useOwnWidth';
import './ListDetail.scss';

/**
 * List and detail: a page layout that opens a record beside its list. The
 * list takes 7 columns of the Page's grid and the detail, a Section with a
 * subtle fill, takes 5. Next and previous sit in the detail's header, so a
 * supervisor can work down a queue without going back to it.
 *
 * It holds the split from 960 of content. Below that the detail replaces the
 * list and a back link returns to it. Pass `listDetail` to the Frame so that,
 * with the Panel docked, the Sidebar collapses to keep the 960 before the
 * layout gives up the split.
 *
 * The layout follows the Frame's resolver when the Frame has `listDetail`,
 * and otherwise measures its own width, the Page's content. The
 * caller owns the selection: `hasSelection` says a record is open, `onBack`
 * clears it. Heavy work, such as the recording review, belongs on its own
 * page: put "Open full review" in `detailFooter`.
 */

/** Content width from which the split holds. One number, shared with the Frame's resolver. */
export const LIST_DETAIL_FLOOR = FRAME_LAYOUT.splitFloor;

/**
 * Which of the two the layout shows: both (`split`), the list alone (`list`)
 * or the detail alone (`detail`).
 * @param {{ splitHolds: boolean, hasSelection: boolean }} input whether the split holds (content reaches the floor) and whether a record is open
 * @returns {'split' | 'list' | 'detail'}
 */
export const listDetailView = ({ splitHolds, hasSelection }) => {
    if (splitHolds) return 'split';
    return hasSelection ? 'detail' : 'list';
};

const ListDetail = ({
    list,
    detail,
    detailTitle,
    detailDescription,
    detailFooter,
    hasSelection = Boolean(detail),
    onBack,
    backLabel = 'Back to list',
    onPrevious,
    onNext,
    previousDisabled = false,
    nextDisabled = false,
    previousLabel = 'Previous',
    nextLabel = 'Next',
    className = '',
    ...props
}) => {
    const ref = useRef(null);
    const ownWidth = useOwnWidth(ref, LIST_DETAIL_FLOOR);
    // Inside a Frame with `listDetail` the resolver decides, so the two never disagree.
    const resolved = useSplitHolds();
    const splitHolds = resolved ?? ownWidth >= LIST_DETAIL_FLOOR;
    const open = Boolean(detail) && hasSelection;
    const view = listDetailView({ splitHolds, hasSelection: open });
    const showList = view !== 'detail';
    const showDetail = open && view !== 'list';
    const stepper = (onPrevious || onNext) && (
        <>
            <IconButton icon="chevron-up" label={previousLabel} appearance="subtle" spacing="compact" isDisabled={previousDisabled} onClick={onPrevious} />
            <IconButton icon="chevron-down" label={nextLabel} appearance="subtle" spacing="compact" isDisabled={nextDisabled} onClick={onNext} />
        </>
    );

    return (
        <div
            ref={ref}
            className={['plus-list-detail', `plus-list-detail--${view}`, className].filter(Boolean).join(' ')}
            {...props}
        >
            {showList && <div className="plus-list-detail__list">{list}</div>}
            {showDetail && (
                <div className="plus-list-detail__detail">
                    {view === 'detail' && onBack && (
                        <Button
                            className="plus-list-detail__back"
                            text={backLabel}
                            appearance="subtle"
                            spacing="compact"
                            iconBefore="arrow-left"
                            onClick={onBack}
                        />
                    )}
                    <PatternSection
                        fill="subtle"
                        named
                        title={detailTitle}
                        description={detailDescription}
                        actions={stepper || undefined}
                        footer={detailFooter}
                    >
                        {detail}
                    </PatternSection>
                </div>
            )}
        </div>
    );
};

ListDetail.propTypes = {
    /** The list: usually a Section holding a table or rows. Takes 7 columns at the split */
    list: PropTypes.node,
    /** The open record's body. Leave off when nothing is open */
    detail: PropTypes.node,
    /** The detail Section's title; also the region's accessible name */
    detailTitle: PropTypes.node,
    /** Optional description under the detail title */
    detailDescription: PropTypes.node,
    /** Detail footer, such as "Open full review" */
    detailFooter: PropTypes.node,
    /** Whether a record is open. Defaults to whether `detail` is given */
    hasSelection: PropTypes.bool,
    /** Runs the back link. The link shows only when this is set and the detail replaces the list */
    onBack: PropTypes.func,
    /** The back link's label */
    backLabel: PropTypes.string,
    /** Runs the previous button; the stepper shows when either handler is set */
    onPrevious: PropTypes.func,
    /** Runs the next button */
    onNext: PropTypes.func,
    previousDisabled: PropTypes.bool,
    nextDisabled: PropTypes.bool,
    previousLabel: PropTypes.string,
    nextLabel: PropTypes.string,
    className: PropTypes.string,
};

export default ListDetail;
