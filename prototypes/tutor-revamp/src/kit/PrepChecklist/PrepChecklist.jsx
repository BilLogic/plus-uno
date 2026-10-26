import React, { useId, useState } from 'react';
import PropTypes from 'prop-types';
import AnimatedCheckbox from '../AnimatedCheckbox';
import Disclosure from '../Disclosure';

/**
 * PrepChecklist: a session's prep, one Disclosure per item with an
 * AnimatedCheckbox before it. Ticking strikes the item through; the row's text
 * opens the reason behind it. Home and the Session tab share it, so the labels
 * match.
 *
 * `defaultOpenId` opens one item at first (the first unticked one on a board).
 * `onChange` hears the done ids after each tick.
 */
const PrepChecklist = ({ items, defaultOpenId, onChange, className = '' }) => {
    const uid = useId();
    const [done, setDone] = useState(() => new Set(items.filter((i) => i.done).map((i) => i.id)));
    const tick = (id, checked) => {
        const next = new Set(done);
        if (checked) next.add(id);
        else next.delete(id);
        setDone(next);
        onChange?.([...next]);
    };
    return (
        <div className={['tr-prep', className].filter(Boolean).join(' ')}>
            {items.map((item) => {
                const titleId = `${uid}-${item.id}`;
                return (
                    <Disclosure
                        key={item.id}
                        title={item.label}
                        titleId={titleId}
                        muted={done.has(item.id)}
                        defaultOpen={item.id === defaultOpenId}
                        leading={(
                            <AnimatedCheckbox
                                checked={done.has(item.id)}
                                onChange={(checked) => tick(item.id, checked)}
                                aria-labelledby={titleId}
                            />
                        )}
                    >
                        <p>{item.why}</p>
                    </Disclosure>
                );
            })}
        </div>
    );
};

PrepChecklist.propTypes = {
    items: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        /** Why it matters: the one line the row reveals */
        why: PropTypes.node,
        done: PropTypes.bool,
    })).isRequired,
    /** The item open at first */
    defaultOpenId: PropTypes.string,
    /** Called with the done ids after each tick */
    onChange: PropTypes.func,
    className: PropTypes.string,
};

export default PrepChecklist;
