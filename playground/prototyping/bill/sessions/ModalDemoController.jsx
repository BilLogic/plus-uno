import React, { useState, useEffect, useCallback } from 'react';
import DemoCursor from './DemoCursor';
import { modalDemoSequence, getElementCenter } from './modalDemoSequence';

const ModalDemoController = ({ isActive, onComplete }) => {
    const [cursorPosition, setCursorPosition] = useState({ x: 1200, y: 800 }); // Default off-screen or bottom-right
    const [cursorState, setCursorState] = useState('idle'); // idle, clicking, scrolling
    const [isVisible, setIsVisible] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    const executeStep = useCallback(async (step) => {
        // console.log(`Executing step: ${step.description}`);

        switch (step.type) {
            case 'wait':
                await new Promise(resolve => setTimeout(resolve, step.duration));
                break;

            case 'move':
                const targetPos = getElementCenter(step.target);
                if (targetPos) {
                    setCursorPosition(targetPos);
                    // Wait for movement to "arrive" visually (CSS transition on DemoCursor usually handles smooth, but we wait here too)
                    await new Promise(resolve => setTimeout(resolve, step.duration));
                } else {
                    console.warn(`Target not found: ${step.target}`);
                }
                break;

            case 'click':
                setCursorState('clicking');
                const element = document.querySelector(step.target);
                if (element) {
                    // React sometimes needs a native click dispatch
                    element.click();
                    // Or specific event dispatch if react onClick isn't firing, but .click() usually works for native/synthetic
                }
                await new Promise(resolve => setTimeout(resolve, step.duration));
                setCursorState('idle');
                break;

            case 'fadeOut':
                setIsVisible(false);
                await new Promise(resolve => setTimeout(resolve, step.duration));
                break;

            default:
                break;
        }
    }, []);

    useEffect(() => {
        if (!isActive) {
            setIsVisible(false);
            return;
        }

        let isCancelled = false;

        const runDemo = async () => {
            setIsVisible(true);
            setCursorPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 }); // Start center

            for (let i = 0; i < modalDemoSequence.length; i++) {
                if (isCancelled) break;
                setCurrentStepIndex(i);
                await executeStep(modalDemoSequence[i]);
            }

            if (!isCancelled && onComplete) {
                onComplete();
            }
        };

        runDemo();

        return () => {
            isCancelled = true;
        };
    }, [isActive, executeStep, onComplete]);

    if (!isVisible) return null;

    return (
        <DemoCursor
            x={cursorPosition.x}
            y={cursorPosition.y}
            state={cursorState}
        />
    );
};

export default ModalDemoController;
