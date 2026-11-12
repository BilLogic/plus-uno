import React from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/forms-and-inputs/Button';
import IconButton from '@/components/forms-and-inputs/IconButton';
import DropdownMenu from '@/components/forms-and-inputs/DropdownMenu';
import { ButtonItem } from '@/components/forms-and-inputs/_internal/MenuGroup';

/** How many bulk actions show as buttons before the rest move to the overflow menu. */
const VISIBLE_ACTIONS = 3;

/**
 * `_Table bulk actions`. What the Dynamic table's head row holds while rows
 * are selected: "N selected", then up to three actions with an overflow menu
 * for the rest, all at the start. `DynamicTable` draws it from its
 * `bulkActions`; there is no Clear, since the checkboxes clear the selection.
 * The table's own status announces the count, so this text is not read twice.
 */
const TableBulkActions = ({ count, actions = [], className = '', ...props }) => {
    const shown = actions.slice(0, VISIBLE_ACTIONS);
    const overflow = actions.slice(VISIBLE_ACTIONS);
    return (
        <div className={['plus-table-bulk-actions', className].filter(Boolean).join(' ')} {...props}>
            <span className="plus-table-bulk-actions__count">{`${count} selected`}</span>
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
        </div>
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
    className: PropTypes.string,
};

export default TableBulkActions;
