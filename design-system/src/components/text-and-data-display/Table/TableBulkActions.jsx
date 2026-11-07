import React from 'react';
import PropTypes from 'prop-types';
import { SectionToolbar } from '@/patterns/PatternSection/PatternSection';
import Button from '@/components/forms-and-inputs/Button';
import IconButton from '@/components/forms-and-inputs/IconButton';
import DropdownMenu from '@/components/forms-and-inputs/DropdownMenu';
import { ButtonItem } from '@/components/navigation/MenuGroup';

/** How many bulk actions show as buttons before the rest move to the overflow menu. */
const VISIBLE_ACTIONS = 3;

/**
 * `_Table bulk actions`. The bulk bar that replaces a Section header's
 * toolbar while a Dynamic table has rows selected: "N selected", announced
 * politely, up to three actions with an overflow menu for the rest, and
 * Clear selection. It is the selected state of the Section toolbar, so it
 * goes in `PatternSection`'s `toolbar` slot, never inside the table.
 */
const TableBulkActions = ({ count, actions = [], onClear, className = '', ...props }) => {
    const shown = actions.slice(0, VISIBLE_ACTIONS);
    const overflow = actions.slice(VISIBLE_ACTIONS);
    return (
        <SectionToolbar
            state="selected"
            selection={`${count} selected`}
            bulkActions={(
                <>
                    {shown.map((action) => (
                        <Button
                            key={action.label}
                            text={action.label}
                            appearance="subtle"
                            spacing="compact"
                            onClick={action.onClick}
                        />
                    ))}
                    {overflow.length > 0 && (
                        <DropdownMenu
                            trigger={<IconButton icon="ellipsis" label="More actions" spacing="compact" appearance="subtle" />}
                            placement="bottom-end"
                        >
                            {overflow.map((action) => (
                                <ButtonItem key={action.label} onClick={action.onClick}>{action.label}</ButtonItem>
                            ))}
                        </DropdownMenu>
                    )}
                </>
            )}
            onClear={onClear}
            clearLabel="Clear selection"
            className={['plus-table-bulk-actions', className].filter(Boolean).join(' ')}
            {...props}
        />
    );
};

TableBulkActions.propTypes = {
    /** How many rows are selected; read as "N selected". */
    count: PropTypes.number.isRequired,
    /** One `{ label, onClick }` per action. The first three show; the rest go in the overflow menu. */
    actions: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string.isRequired,
        onClick: PropTypes.func,
    })),
    /** Clears the selection. */
    onClear: PropTypes.func,
    className: PropTypes.string,
};

export default TableBulkActions;
