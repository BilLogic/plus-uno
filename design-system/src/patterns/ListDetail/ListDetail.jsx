import React, { useLayoutEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Button, IconButton } from '@/components';
import PatternSection from '../PatternSection';
import { FRAME_LAYOUT } from '../Frame/frameLayout';
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
 * The layout measures its own width, the Page's content, not the window. The
 * caller owns the selection: `hasSelection` says a record is open, `onBack`
 * clears it. Heavy work, such as the recording review, belongs on its own
 * page: put "Open full review" in `detailFooter`.
 */

/** Content width from which the split holds. One number, shared with the Frame's resolver. */
export const LIST_DETAIL_FLOOR = FRAME_LAYOUT.splitFloor;

/**
 * Which of the two the layout shows: both (`split`), the list alone (`list`)
 * or the detail alone (`detail`).
 * @param {{ width: number, hasSelection: boolean }} input content width and whether a record is open
 * @returns {'split' | 'list' | 'detail'}
 */
export const listDetailView = ({ width, hasSelection }) => {
    if (width >= LIST_DETAIL_FLOOR) return 'split';
    return hasSelection ? 'detail' : 'list';
};

const useOwnWidth = (ref) => {
    const [width, setWidth] = useState(() => (typeof window === 'undefined' ? LIST_DETAIL_FLOOR : window.innerWidth));
    useLayoutEffect(() => {
        const read = () => setWidth(ref.current?.getBoundingClientRect().width || window.innerWidth);
        read();
        const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(read);
        if (ref.current) ro?.observe(ref.current);
        return () => ro?.disconnect();
    }, [ref]);
    return width;
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
    const width = useOwnWidth(ref);
    const open = Boolean(detail) && hasSelection;
    const view = listDetailView({ width, hasSelection: open });
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
                    {view === 'detail' && (
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
    /** Runs the back link, shown when the detail replaces the list */
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
