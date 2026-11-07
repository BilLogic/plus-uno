import React from 'react';
import { Button, ButtonItem, DropdownMenu, Section } from '@/components';

/**
 * A button that opens a list of choices, one of them marked selected.
 * `items` are `{ text, selected, disabled, header, onClick }`; a `header`
 * item titles the group of items after it.
 */
const OptionMenu = ({ buttonText, items }) => {
    const groups = [];
    items.forEach((item) => {
        if (item.header || groups.length === 0) groups.push({ title: item.header ? item.text : null, rows: [] });
        if (!item.header) groups[groups.length - 1].rows.push(item);
    });

    const rows = (list) => list.map((item) => (
        <ButtonItem
            key={item.text}
            isSelected={item.selected}
            isDisabled={item.disabled}
            onClick={item.onClick}
        >
            {item.text}
        </ButtonItem>
    ));

    return (
        <DropdownMenu
            trigger={<Button text={buttonText} iconAfter={<i className="fa-solid fa-chevron-down" aria-hidden="true" />} />}
        >
            {groups.map((g, i) => (g.title
                // eslint-disable-next-line react/no-array-index-key
                ? <Section key={i} title={g.title} hasSeparator={i > 0}>{rows(g.rows)}</Section>
                : <React.Fragment key={g.title ?? 'plain'}>{rows(g.rows)}</React.Fragment>))}
        </DropdownMenu>
    );
};

export default OptionMenu;
