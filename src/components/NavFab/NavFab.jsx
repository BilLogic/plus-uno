import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Tooltip from '@/components/Tooltip';
import './NavFab.scss';

const STORYBOOK_URL = import.meta.env.VITE_STORYBOOK_URL || '/storybook';

const NAV_ITEMS = [
  {
    id: 'storybook',
    label: 'Storybook',
    icon: 'fa-solid fa-book-open',
    href: STORYBOOK_URL,
    external: STORYBOOK_URL.startsWith('http'),
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    icon: 'fa-solid fa-store',
    href: '/'
  }
];

export default function NavFab() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="nav-fab"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <motion.div
        className="nav-fab__trigger"
        role="button"
        tabIndex={0}
        aria-label="Navigation menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
        onKeyDown={(e) => {
          if (e.key === 'Escape') setIsOpen(false);
          if (e.key === 'Enter' || e.key === ' ') setIsOpen(!isOpen);
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <i className="fa-solid fa-compass" />
      </motion.div>

      <AnimatePresence>
        {isOpen && NAV_ITEMS.map((item, index) => (
              <motion.div
                key={item.id}
                className="nav-fab__item-wrapper"
                initial={{ opacity: 0, y: 10, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.85 }}
                transition={{ delay: index * 0.04, type: 'spring', stiffness: 500, damping: 28 }}
              >
                <Tooltip text={item.label} placement="left">
                  <motion.a
                    className="nav-fab__action"
                    href={item.href}
                    target={item.external ? '_blank' : undefined}
                    rel={item.external ? 'noopener noreferrer' : undefined}
                    role="menuitem"
                    aria-label={`Open ${item.label}`}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <i className={item.icon} />
                  </motion.a>
                </Tooltip>
              </motion.div>
            ))}
      </AnimatePresence>
    </div>
  );
}
