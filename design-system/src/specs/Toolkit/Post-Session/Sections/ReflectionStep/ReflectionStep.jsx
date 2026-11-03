import React from 'react';
import PropTypes from 'prop-types';
import { PatternSection } from '@/patterns';
import { useReflectionChrome } from '@/specs/Toolkit/Post-Session/reflectionChrome';
import { formatLastUpdated } from '@/specs/Toolkit/Post-Session/reflectionCopy';

/**
 * One reflection step: a Section whose title is the step's name, whose
 * description is when it was last updated, and whose side column is the step
 * menu the page supplies. On its own, outside a page, it has no side column.
 *
 * @param {object} props
 * @param {string} props.title - The step's name.
 * @param {string|Date} [props.lastUpdated] - The description under the title.
 * @param {React.ReactNode} props.children - The step's questions.
 */
const ReflectionStep = ({ title, lastUpdated, children }) => {
    const { stepMenu } = useReflectionChrome();
    return (
        <PatternSection
            title={title}
            description={typeof lastUpdated === 'string' ? lastUpdated : formatLastUpdated(lastUpdated)}
            layout={stepMenu ? 'split' : 'single'}
            side={stepMenu}
        >
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--section-stack-md)',
                    minWidth: 0,
                    width: '100%',
                }}
            >
                {children}
            </div>
        </PatternSection>
    );
};

ReflectionStep.propTypes = {
    title: PropTypes.string.isRequired,
    lastUpdated: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    children: PropTypes.node,
};

export default ReflectionStep;
