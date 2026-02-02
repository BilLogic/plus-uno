import React from 'react';
import { motion } from 'framer-motion';

/**
 * DemoCursor – Reused from home-redesign.
 * Renders a cursor that can move, click, and scroll.
 * 
 * Props:
 * @param {number} x - Current X position
 * @param {number} y - Current Y position
 * @param {'idle' | 'clicking' | 'scrolling'} state - Visual state of the cursor
 */
const DemoCursor = ({ x, y, state = 'idle' }) => {

    const renderCursor = () => {
        switch (state) {
            case 'clicking':
                return (
                    <svg viewBox="0 0 48 48" width="24" height="36" style={{ overflow: 'visible' }}>
                        {/* Click ripple effect */}
                        <motion.circle
                            cx="12" cy="12" r="20" fill="rgba(59, 130, 246, 0.3)"
                            initial={{ scale: 0, opacity: 1 }}
                            animate={{ scale: 1.5, opacity: 0 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                        />
                        {/* Pointer */}
                        <path d="M0,0 L0,24 L8,18 L12,28 L16,26 L12,16 L20,16 Z" fill="white" stroke="#3b82f6" strokeWidth="1.5" />
                    </svg>
                );
            case 'scrolling':
                return (
                    <svg viewBox="0 0 24 24" width="24" height="24">
                        <circle cx="12" cy="12" r="11" fill="rgba(255,255,255,0.8)" stroke="#3b82f6" strokeWidth="2" />
                        <motion.path
                            d="M12,6 L12,18 M9,15 L12,18 L15,15"
                            stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            initial={{ y: -2 }}
                            animate={{ y: 2 }}
                            transition={{ repeat: Infinity, duration: 0.8, repeatType: "reverse" }}
                        />
                    </svg>
                );
            default: // idle
                return (
                    <svg viewBox="0 0 24 36" width="24" height="36" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}>
                        {/* Standard pointer */}
                        <path d="M0,0 L0,24 L8,18 L12,28 L16,26 L12,16 L20,16 Z" fill="white" stroke="black" strokeWidth="1.5" />
                    </svg>
                );
        }
    };

    return (
        <motion.div
            className="demo-cursor"
            animate={{ x, y }}
            transition={{
                type: "spring",
                damping: 25,
                stiffness: 180,
                mass: 0.8
            }}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                zIndex: 9999,
                pointerEvents: 'none'
            }}
        >
            {renderCursor()}
        </motion.div>
    );
};

export default DemoCursor;
